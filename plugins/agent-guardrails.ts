// Agent Guardrails — Code-enforced cost & efficiency limits + daily token logging
// Implements: circuit breaker, doom loop detection, session cost guard, daily JSON logs, per-EVO cost tracking
// Philosophy: Code limits, not LLM instructions
//
// Config: <opencode-config>/guardrails.json
// Kill switch: GUARDRAILS_ENABLED=false
// Logs: private usage-log directory

import type { Plugin } from "@opencode-ai/plugin";
import {
  deterministicLangfuseId,
  telemetryMeta,
} from "../lib/langfuse-id";
import { classifyPricing, marginalCost } from "../lib/pricing-semantics";
import {
  incrementCopilotMonthly,
  incrementMinimaxWindow,
  type CopilotPerCallTelemetry,
  type MinimaxPerCallTelemetry,
} from "../lib/quota-accounting";
import {
  buildWorkflowMeta,
  extractParentAgentMeta,
} from "../lib/telemetry-context";

const fs = require("fs"),
  path = require("path"),
  crypto = require("crypto");
const OPENCODE_CONFIG_DIR = process.env.OPENCODE_CONFIG_DIR || path.join(process.cwd(), ".opencode");
const CONFIG_PATH = path.join(OPENCODE_CONFIG_DIR, "guardrails.json");
const LOG_DIR = process.env.OPENCODE_USAGE_LOG_DIR || path.join(OPENCODE_CONFIG_DIR, "usage-logs");

// Langfuse integration — sync real tokens to observability platform
const LANGFUSE_ENABLED = process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY;
const LANGFUSE_BASE_URL = process.env.LANGFUSE_BASEURL || "http://localhost:3847";
const LANGFUSE_AUTH = LANGFUSE_ENABLED
  ? Buffer.from(`${process.env.LANGFUSE_PUBLIC_KEY}:${process.env.LANGFUSE_SECRET_KEY}`).toString("base64")
  : null;

interface ProgressAwareBudget {
  enabled: boolean;
  costPerProgressUnit: number; // extra $ per progress marker
  hardCap: number; // absolute max regardless of progress
  stallThresholdUsd: number; // $ spent without progress before warning
}

interface GuardrailsConfig {
  enabled: boolean;
  maxConsecutiveErrors: number;
  warnSessionCostUsd: number;
  maxSessionCostUsd: number;
  dailyBudgetUsd: number;
  loopDetection: {
    enabled: boolean;
    windowSize?: number;
    maxRepeats?: number; // legacy compat
    defaultWindow: number;
    defaultMaxRepeats: number;
    warnAtRepeats: number;
    perTool?: Record<
      string,
      { window: number; maxRepeats: number; warnAt: number }
    >;
  };
  progressAwareBudget?: ProgressAwareBudget;
  mode?: {
    evo?: {
      failMode: "open" | "closed";
      maxSessionCostUsd?: number;
      loopMultiplier?: number;
    };
    default?: {
      failMode: "open" | "closed";
      maxSessionCostUsd?: number;
      loopMultiplier?: number;
    };
  };
}

const DEFAULT_CONFIG: GuardrailsConfig = {
  enabled: true,
  maxConsecutiveErrors: 8,
  warnSessionCostUsd: 25.0,
  maxSessionCostUsd: 100.0,
  dailyBudgetUsd: 200.0,
  loopDetection: {
    enabled: true,
    defaultWindow: 20,
    defaultMaxRepeats: 7,
    warnAtRepeats: 5,
  },
};

function loadConfig(): GuardrailsConfig {
  try {
    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    const rl = raw.loopDetection || {};
    const dl = DEFAULT_CONFIG.loopDetection;
    return {
      ...DEFAULT_CONFIG,
      ...raw,
      loopDetection: {
        enabled: rl.enabled ?? dl.enabled,
        defaultWindow: rl.defaultWindow ?? rl.windowSize ?? dl.defaultWindow,
        defaultMaxRepeats:
          rl.defaultMaxRepeats ?? rl.maxRepeats ?? dl.defaultMaxRepeats,
        warnAtRepeats: rl.warnAtRepeats ?? dl.warnAtRepeats,
        perTool: rl.perTool,
      },
    };
  } catch (_) {
    return DEFAULT_CONFIG;
  }
}

// SECTION: Shared pricing (loaded from configs/pricing.json, fallback to embedded)
type PricingEntry = { input: number; output: number };
const SHARED_PRICING_PATH = path.join(OPENCODE_CONFIG_DIR, "configs", "pricing.json");
const EMBEDDED_PRICING: Record<string, PricingEntry> = {
  "claude-opus-4-6": { input: 15.0, output: 75.0 },
  "claude-opus-4": { input: 15.0, output: 75.0 },
  "claude-sonnet-4-5": { input: 3.0, output: 15.0 },
  "claude-sonnet-4": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5": { input: 0.8, output: 4.0 },
  "claude-haiku-4": { input: 0.8, output: 4.0 },
  "gemini-3-pro-preview": { input: 1.25, output: 10.0 },
};
const EMBEDDED_FALLBACK: PricingEntry = { input: 2.0, output: 8.0 };

function normalizeModelName(model: string): string {
  return model.replace(/^(anthropic|openai|google)\//, "");
}

let sharedPricingCache: {
  models: Record<string, PricingEntry>;
  fallback: PricingEntry;
} | null = null;

function loadSharedPricing(): {
  models: Record<string, PricingEntry>;
  fallback: PricingEntry;
} {
  if (sharedPricingCache) return sharedPricingCache;
  try {
    const raw = JSON.parse(fs.readFileSync(SHARED_PRICING_PATH, "utf-8"));
    if (raw.models && typeof raw.models === "object") {
      sharedPricingCache = {
        models: raw.models,
        fallback: raw.fallback || EMBEDDED_FALLBACK,
      };
      return sharedPricingCache;
    }
  } catch (_) {
    log(
      "[guardrails] Could not load configs/pricing.json — using embedded pricing",
    );
  }
  sharedPricingCache = {
    models: EMBEDDED_PRICING,
    fallback: EMBEDDED_FALLBACK,
  };
  return sharedPricingCache;
}

function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const { models, fallback } = loadSharedPricing();
  const normalized = normalizeModelName(model);
  let p = models[normalized];
  if (!p) {
    const k = Object.keys(models).find((k) => normalized.includes(k));
    p = k ? models[k] : (undefined as any);
  }
  if (!p) {
    log(
      `[guardrails] No pricing for model "${model}" — using fallback ($${fallback.input}/$${fallback.output} per 1M tokens)`,
    );
    p = fallback;
  }
  return (
    (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output
  );
}

// SECTION: Debug
const DEBUG = process.env.GUARDRAILS_DEBUG === "true";
const log = (msg: string) => DEBUG && console.log(msg);

// SECTION: EVO Mode Detection (cached)
let _evoModeCache: boolean | null = null;
function detectEvoMode(): boolean {
  if (_evoModeCache !== null) return _evoModeCache;
  if (process.env.SAGE_EVO_ACTIVE === "true") {
    _evoModeCache = true;
    return true;
  }
  try {
    const candidates = [
      ".evo-state.yaml",
      ".evo-state.json",
      "docs/evo/.evo-state.yaml",
      "docs/evo/.evo-state.json",
    ];
    _evoModeCache = candidates.some((f) => fs.existsSync(f));
  } catch {
    _evoModeCache = false;
  }
  return _evoModeCache;
}

// SECTION: Langfuse Sync — update wrapper-owned observations with real token counts
interface LangfusePricingMeta {
  agent?: string;
  parent_agent?: string;
  evo_id?: string;
  workflow_phase?: string;
  estimated_cost_usd: number;
  marginal_cost_usd: number;
  provider_class: string;
  pricing_model: string;
  premium_request_count: number;
  // Copilot quota telemetry (optional — only for copilot-subscription)
  copilot_monthly_requests?: number;
  copilot_monthly_limit?: number;
  copilot_overage_requests?: number;
  copilot_estimated_overage_cost_usd?: number;
  // MiniMax quota telemetry (optional — only for minimax-subscription)
  minimax_window_start?: string;
  minimax_window_end?: string;
  minimax_window_requests?: number;
  minimax_window_limit?: number;
  minimax_quota_remaining?: number;
}

async function syncToLangfuse(
  traceId: string,
  observationId: string | null,
  inputTokens: number,
  outputTokens: number,
  cost: number,
  model: string,
  pricingMeta?: LangfusePricingMeta,
) {
  if (!LANGFUSE_ENABLED || !LANGFUSE_AUTH) return;

  try {
    // Derive stable Langfuse-compatible UUIDs from raw OpenCode IDs.
    // langfuse-wrapper owns GENERATION creation; guardrails only updates usage/cost.
    const langfuseTraceId = deterministicLangfuseId(traceId);
    // Use deterministic fallback fields instead of random UUIDs so repeated
    // streaming updates for the same turn target the same observation.
    // Derive stable observation ID.
    // If observationId is present, use it directly (stable update target).
    // If absent, build a deterministic key from stable event fields (no Date.now()).
    // Key components: sessionId + model + token counts — all stable for a given event.
    // If even those are missing (all zeros, no model), skip Langfuse sync entirely
    // rather than emitting an unstable ID that would create duplicate observations.
    let langfuseObsId: string;
    if (observationId) {
      langfuseObsId = deterministicLangfuseId(observationId);
    } else {
      const hasStableFields = model.length > 0 && (inputTokens > 0 || outputTokens > 0);
      if (!hasStableFields) {
        // No stable fields — skip sync to avoid unstable/duplicate observations.
        // Local usage-log record is still written by the caller.
        return;
      }
      // Stable fallback key: session + model + token counts (deterministic for this event).
      const fallbackKey = `fallback:${traceId}:${model}:${inputTokens}:${outputTokens}`;
      langfuseObsId = deterministicLangfuseId(fallbackKey);
    }

    const totalTokens = inputTokens + outputTokens;
    const inputCostFraction = totalTokens > 0 ? inputTokens / totalTokens : 0.5;
    const outputCostFraction = totalTokens > 0 ? outputTokens / totalTokens : 0.5;

    const telemetryFeatures: Parameters<typeof telemetryMeta>[1] = [
      "pricing_semantics",
      "quota_accounting",
      "deterministic_ids",
      "guardrails_metadata",
    ];
    if (pricingMeta?.parent_agent) telemetryFeatures.push("delegation_metadata");
    if (pricingMeta?.evo_id || pricingMeta?.workflow_phase) telemetryFeatures.push("workflow_metadata");

    const payload = {
      id: langfuseObsId,
      traceId: langfuseTraceId,
      type: "GENERATION",
      name: "ai-response",
      model,
      usage: {
        promptTokens: inputTokens,
        completionTokens: outputTokens,
        totalTokens,
        inputCost: cost * inputCostFraction,
        outputCost: cost * outputCostFraction,
        // totalCost retains existing semantics: estimated list-price cost
        totalCost: cost,
      },
      metadata: {
        rawTraceId: traceId,
        rawObservationId: observationId,
        // Pricing semantics (telemetry-only, does not affect enforcement)
        ...(pricingMeta ?? {}),
        // Telemetry schema markers
        ...telemetryMeta("agent-guardrails", telemetryFeatures),
        // Mark when observation ID was derived from fallback (no messageID available)
        ...(observationId ? {} : { id_fallback: true }),
      },
    };

    const response = await fetch(`${LANGFUSE_BASE_URL}/api/public/ingestion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${LANGFUSE_AUTH}`,
      },
      body: JSON.stringify({
        batch: [{
          id: crypto.randomUUID(),
          type: "observation-update",
          timestamp: new Date().toISOString(),
          body: payload,
        }],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[guardrails→langfuse] sync failed: ${response.status} ${text.slice(0, 200)}`);
    }
  } catch (e) {
    // Silent fail — don't break guardrails if Langfuse is down
  }
}

// SECTION: Token Monitor — daily JSON logs (merged from token-monitor, batch 1f)
// Logs per-call records to usage-logs/{date}.json with model/agent/project breakdowns
// SECTION: Daily log types
interface CallRecord {
  timestamp: string;
  sessionId: string;
  project: string;
  agent: string;
  parent_agent?: string;  // who dispatched this agent via Task()
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  toolCalls: number;
  /** Estimated list-price cost in USD. Unchanged semantics — used for budget enforcement. */
  costUsd: number;
  /** Same as costUsd — explicit alias for clarity in telemetry consumers. */
  estimated_cost_usd: number;
  /** Marginal cost: 0 for subscription-backed providers, equals estimated for payg/unknown. */
  marginal_cost_usd: number;
  /** Provider classification for pricing semantics. */
  provider_class: string;
  /** Pricing model: subscription | payg | unknown. */
  pricing_model: string;
  /** 1 for Copilot calls (counts against monthly premium quota), else 0. */
  premium_request_count: number;
  // Copilot quota telemetry (only present for copilot-subscription calls)
  copilot_monthly_requests?: number;
  copilot_monthly_limit?: number;
  copilot_overage_requests?: number;
  copilot_estimated_overage_cost_usd?: number;
  // MiniMax quota telemetry (only present for minimax-subscription calls)
  minimax_window_start?: string;
  minimax_window_end?: string;
  minimax_window_requests?: number;
  minimax_window_limit?: number;
  minimax_quota_remaining?: number;
  evoId?: string;
  workflow_phase?: string;
}
type GroupEntry = { calls: number; tokens: number; costUsd: number };
interface DaySummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  totalCalls: number;
  totalToolCalls: number;
  byModel: Record<string, GroupEntry>;
  byAgent: Record<string, GroupEntry>;
  byProject: Record<string, GroupEntry>;
  byEvo: Record<string, GroupEntry>;
}
interface EvoTokenSummary {
  evoId: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  totalCalls: number;
  byModel: Record<string, GroupEntry>;
  byPhase: Record<string, GroupEntry>;
  sessions: string[];
  firstSeen: string;
  lastSeen: string;
}
interface DayLog {
  date: string;
  calls: CallRecord[];
  summary: DaySummary;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptySummary(): DaySummary {
  return {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCostUsd: 0,
    totalCalls: 0,
    totalToolCalls: 0,
    byModel: {},
    byAgent: {},
    byProject: {},
    byEvo: {},
  };
}

function addToGroup(
  group: Record<string, GroupEntry>,
  key: string,
  c: CallRecord,
) {
  if (!group[key]) group[key] = { calls: 0, tokens: 0, costUsd: 0 };
  group[key].calls += 1;
  group[key].tokens += c.totalTokens;
  group[key].costUsd += c.costUsd;
}

function rebuildSummary(calls: CallRecord[]): DaySummary {
  const s = emptySummary();
  for (const c of calls) {
    s.totalInputTokens += c.inputTokens;
    s.totalOutputTokens += c.outputTokens;
    s.totalTokens += c.totalTokens;
    s.totalCostUsd += c.costUsd;
    s.totalCalls += 1;
    s.totalToolCalls += c.toolCalls;
    addToGroup(s.byModel, c.model, c);
    addToGroup(s.byAgent, c.agent, c);
    addToGroup(s.byProject, c.project, c);
    if (c.evoId) addToGroup(s.byEvo, c.evoId, c);
  }
  return s;
}

function ensureLogDir() {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (_) {
    /* ok */
  }
}

function loadDayLog(): DayLog {
  const date = todayKey();
  try {
    return JSON.parse(
      fs.readFileSync(path.join(LOG_DIR, `${date}.json`), "utf-8"),
    );
  } catch (_) {
    return { date, calls: [], summary: emptySummary() };
  }
}

function saveDayLog(dayLog: DayLog) {
  ensureLogDir();
  fs.writeFileSync(
    path.join(LOG_DIR, `${dayLog.date}.json`),
    JSON.stringify(dayLog, null, 2),
  );
}

// SECTION: EVO Token Tracking — per-EVO cost aggregation
const EVO_LOG_DIR = path.join(LOG_DIR, "evo");
const EVO_STATE_CANDIDATES = [
  "docs/evo/.evo-state.yaml",
  ".evo-state.yaml",
];
let _currentEvoId: string | null = null;
let _currentEvoPhase: string | null = null;
let _evoIdCheckedAt = 0;

function readCurrentEvo(): { evoId: string | null; phase: string | null } {
  const now = Date.now();
  if (now - _evoIdCheckedAt < 30_000) return { evoId: _currentEvoId, phase: _currentEvoPhase };
  _evoIdCheckedAt = now;
  for (const candidate of EVO_STATE_CANDIDATES) {
    try {
      const raw = fs.readFileSync(candidate, "utf-8");
      const idMatch = raw.match(/^\s*evo_id:\s*["']?([^"'\n]+)/m);
      const phaseMatch = raw.match(/^\s*phase:\s*["']?([^"'\n]+)/m);
      const id = idMatch?.[1]?.trim();
      if (id && id !== "null") {
        _currentEvoId = id;
        _currentEvoPhase = phaseMatch?.[1]?.trim() || null;
        return { evoId: _currentEvoId, phase: _currentEvoPhase };
      }
    } catch (_) { /* not found, try next */ }
  }
  _currentEvoId = null;
  _currentEvoPhase = null;
  return { evoId: null, phase: null };
}

function loadEvoLog(evoId: string): EvoTokenSummary {
  try {
    return JSON.parse(fs.readFileSync(path.join(EVO_LOG_DIR, `${evoId}.json`), "utf-8"));
  } catch (_) {
    return {
      evoId,
      totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0,
      totalCostUsd: 0, totalCalls: 0,
      byModel: {}, byPhase: {}, sessions: [],
      firstSeen: new Date().toISOString(), lastSeen: new Date().toISOString(),
    };
  }
}

function saveEvoLog(summary: EvoTokenSummary) {
  try {
    fs.mkdirSync(EVO_LOG_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(EVO_LOG_DIR, `${summary.evoId}.json`),
      JSON.stringify(summary, null, 2),
    );
  } catch (_) { /* fire-and-forget */ }
}

function flushEvoRecords(records: CallRecord[], sessionId: string) {
  const evoGroups = new Map<string, { records: CallRecord[]; phase: string }>();
  for (const r of records) {
    if (!r.evoId) continue;
    if (!evoGroups.has(r.evoId)) evoGroups.set(r.evoId, { records: [], phase: "unknown" });
    evoGroups.get(r.evoId)!.records.push(r);
  }
  evoGroups.forEach((group, evoId) => {
    const summary = loadEvoLog(evoId);
    for (const r of group.records) {
      summary.totalInputTokens += r.inputTokens;
      summary.totalOutputTokens += r.outputTokens;
      summary.totalTokens += r.totalTokens;
      summary.totalCostUsd += r.costUsd;
      summary.totalCalls += 1;
      addToGroup(summary.byModel, r.model, r);
      const phase = _currentEvoPhase || "unknown";
      addToGroup(summary.byPhase, phase, r);
    }
    if (!summary.sessions.includes(sessionId)) summary.sessions.push(sessionId);
    summary.lastSeen = new Date().toISOString();
    summary.totalCostUsd = Math.round(summary.totalCostUsd * 10000) / 10000;
    saveEvoLog(summary);
    log(`[guardrails] EVO ${evoId}: $${summary.totalCostUsd.toFixed(2)} total (${summary.totalCalls} calls, ${summary.sessions.length} sessions)`);
  });
}

// SECTION: Session State
interface SessionState {
  consecutiveErrors: number;
  sessionCostUsd: number;
  toolHistory: string[];
  costWarned: boolean;
  // Progress tracking for dynamic budget
  progressMarkers: number; // count of meaningful progress events
  uniqueFilesEdited: Set<string>; // unique files written/edited
  uniqueFilesRead: Set<string>; // unique files read (not same file 5x)
  successfulTests: number; // test runs that passed
  successfulCommits: number; // git commits made
  lastProgressCost: number; // cost at last progress marker (stall detection)
  stallWarned: boolean; // whether we warned about stalling
}

function freshState(): SessionState {
  return {
    consecutiveErrors: 0,
    sessionCostUsd: 0,
    toolHistory: [],
    costWarned: false,
    progressMarkers: 0,
    uniqueFilesEdited: new Set(),
    uniqueFilesRead: new Set(),
    successfulTests: 0,
    successfulCommits: 0,
    lastProgressCost: 0,
    stallWarned: false,
  };
}

// Progress-aware budget: base + bonus per progress marker, capped
function calculateEffectiveBudget(
  state: SessionState,
  config: GuardrailsConfig,
  modeConfig: any,
): number {
  const base = modeConfig?.maxSessionCostUsd || config.maxSessionCostUsd;
  const pa = config.progressAwareBudget;
  if (!pa?.enabled) return base;
  const bonus = state.progressMarkers * pa.costPerProgressUnit;
  return Math.min(base + bonus, pa.hardCap);
}

// Stall detection: cost climbing but no new progress markers
function isStalling(state: SessionState, config: GuardrailsConfig): boolean {
  const pa = config.progressAwareBudget;
  if (!pa?.enabled) return false;
  const costSinceProgress = state.sessionCostUsd - state.lastProgressCost;
  return costSinceProgress >= pa.stallThresholdUsd;
}

// Detect progress from tool results
const TEST_PASS_PATTERNS = [
  /tests?\s+passed/i,
  /\d+\s+pass/i,
  /✓|✅/,
  /PASS\s/, // jest/vitest
  /passed/i,
  /All tests passed/i,
  /0 failed/i,
];
const TEST_FAIL_PATTERNS = [
  /FAIL\s/,
  /\d+\s+fail/i,
  /✗|❌/,
  /Error:/i,
  /AssertionError/i,
];
const GIT_COMMIT_PATTERNS = [
  /\[[\w-]+\s+[\da-f]+\]/, // [main abc1234] commit message
  /create mode/i,
];

function hashToolCall(tool: string, target: string): string {
  return crypto
    .createHash("md5")
    .update(`${tool}:${target}`)
    .digest("hex")
    .slice(0, 8);
}

// Tools that are inherently sequential/polling — each call is unique by design
const SEQUENTIAL_TOOLS = new Set([
  "get_next_answer",
  "get_answer",
  "list_questions",
  "await_brainstorm_complete",
  "get_session_summary",
  // Playwright: UI testing is inherently sequential — each snapshot/click observes new state
  "browser_snapshot",
  "browser_take_screenshot",
  "browser_click",
  "browser_navigate",
  "browser_navigate_back",
  "browser_fill_form",
  "browser_type",
  "browser_press_key",
  "browser_hover",
  "browser_select_option",
  "browser_evaluate",
  "browser_run_code",
  "browser_handle_dialog",
  "browser_file_upload",
  "browser_wait_for",
  "browser_console_messages",
  "browser_network_requests",
  "browser_tabs",
  "browser_resize",
  "browser_drag",
  "browser_close",
]);

// Bash commands that are legitimately repeated — each invocation observes new state
const SEQUENTIAL_BASH_PATTERNS = [
  /^agent-browser\s/, // UI testing: snapshots, clicks, navigations
  /^git\s+(status|diff|log)/, // read-only git checks
  /^docker\s+(logs|ps|stats)/, // container observation
  /^curl\s/, // HTTP probes (health checks, smoke tests)
  /^ls\b/, // directory listing
  /^cat\b/, // file reads
];

let sequentialCounter = 0;

function extractTarget(tool: string, args: any): string {
  if (!args) return "";
  if (SEQUENTIAL_TOOLS.has(tool)) return `${tool}:${++sequentialCounter}`;
  const a = args;
  if (tool === "bash") {
    const cmd = a.command || "";
    // Treat known-safe repeated commands as sequential (unique each call)
    if (SEQUENTIAL_BASH_PATTERNS.some((p) => p.test(cmd))) {
      return `${cmd}:${++sequentialCounter}`;
    }
    return cmd;
  }
  if (tool === "write")
    return `${a.filePath || ""}:${(a.content || "").slice(0, 120)}`;
  if (tool === "read" || tool === "read_file")
    return a.filePath || a.relative_path || "";
  if (tool === "edit")
    return `${a.filePath || ""}:${(a.oldString || "").slice(0, 120)}`;
  if (tool === "replace_content")
    return `${a.relative_path || ""}:${(a.needle || "").slice(0, 120)}`;
  if (tool === "replace_symbol_body")
    return `${a.relative_path || ""}:${a.name_path || ""}:${(a.body || "").slice(0, 80)}`;
  // Serena memory tools: key on memory_file_name only so loop detection
  // counts repeats against the SAME target file, not against full payload.
  if (
    tool === "serena_write_memory" ||
    tool === "serena_edit_memory" ||
    tool === "serena_delete_memory" ||
    tool === "serena_read_memory" ||
    tool === "mcp__serena__write_memory" ||
    tool === "mcp__serena__edit_memory" ||
    tool === "mcp__serena__delete_memory" ||
    tool === "mcp__serena__read_memory"
  )
    return `${tool}:${a.memory_file_name || ""}`;
  if (tool === "glob" || tool === "grep") return a.pattern || "";
  if (tool === "todowrite" && Array.isArray(a.todos))
    return a.todos
      .map((t: any) => `${t.status}:${(t.content || "").slice(0, 30)}`)
      .join("|");
  return JSON.stringify(args).slice(0, 200);
}

function countRepeats(history: string[], hash: string): number {
  return history.filter((h) => h === hash).length;
}

// SECTION: Plugin
export const AgentGuardrails: Plugin = async ({
  client,
  project,
  directory,
  worktree,
}) => {
  try {
    const _grEnabled = process.env.GUARDRAILS_ENABLED !== "false";
    const _grConfig = loadConfig();
    const _evoActive = detectEvoMode();
    const _modeLabel = _evoActive ? "EVO=fail-closed" : "default=fail-open";
    const _paLabel = _grConfig.progressAwareBudget?.enabled
      ? `, progressAware=ON (cap=$${_grConfig.progressAwareBudget.hardCap})`
      : "";
    await client.app.log({
      body: {
        service: "agent-guardrails",
        level: "info",
        message: `[SAGE] Agent Guardrails: ${_grEnabled ? `✓ ACTIVE (${_modeLabel}) — maxCost=$${_grConfig.maxSessionCostUsd}, maxErrors=${_grConfig.maxConsecutiveErrors}, loops=${_grConfig.loopDetection.enabled}${_paLabel}` : "✗ INACTIVE"} [env: GUARDRAILS_ENABLED=${process.env.GUARDRAILS_ENABLED || "unset"}]`,
      },
    });

    // Kill switch
    const envEnabled = process.env.GUARDRAILS_ENABLED;
    if (envEnabled === "false") {
      log("[guardrails] DISABLED via GUARDRAILS_ENABLED=false");
      return {};
    }

    const config = loadConfig();
    if (!config.enabled) {
      log("[guardrails] DISABLED via config");
      return {};
    }

    // Mode-aware overrides
    const isEvoMode = detectEvoMode();
    const modeConfig = isEvoMode ? config.mode?.evo : config.mode?.default;
    const loopMultiplier = modeConfig?.loopMultiplier ?? 1.0;

    const maxErrors =
      parseInt(process.env.GUARDRAILS_MAX_ERRORS || "") ||
      config.maxConsecutiveErrors;
    const maxCost =
      parseFloat(process.env.GUARDRAILS_MAX_COST || "") ||
      modeConfig?.maxSessionCostUsd ||
      config.maxSessionCostUsd;

    log(
      `[guardrails] ENABLED — mode=${isEvoMode ? "evo" : "default"}, maxErrors=${maxErrors}, maxCost=$${maxCost}, loop=${config.loopDetection.enabled}, loopMultiplier=${loopMultiplier}`,
    );

    // Derive project name from directory for log records
    const projectName = path.basename(worktree || directory || process.cwd());

    // Pre-warm pricing cache and ensure log dir exists
    loadSharedPricing();
    ensureLogDir();

    // Per-session state (keyed by sessionId)
    const sessions = new Map<string, SessionState>();
    // Per-session tool call counts (for log records)
    const toolCallCounts = new Map<string, number>();
    // Pending log records keyed by sessionId → messageId (deduplicates streaming updates)
    const pendingRecords = new Map<string, Map<string, CallRecord>>();

    function getState(sessionId?: string): SessionState {
      const key = sessionId || "_default";
      if (!sessions.has(key)) sessions.set(key, freshState());
      return sessions.get(key)!;
    }

    return {
      // SECTION: Doom Loop Detection + Circuit Breaker (pre-execution gate)
      "tool.execute.before": async (input, output) => {
        const tool = input.tool;
        const sessionId = (input as any).sessionID || "_default";
        const state = getState(sessionId);
        const args = output.args || {};

        // Circuit breaker: consecutive errors
        if (state.consecutiveErrors >= maxErrors) {
          throw new Error(
            `GUARDRAIL: Circuit breaker — ${state.consecutiveErrors} consecutive errors.\n` +
              `Something is fundamentally failing. Review the errors above.\n` +
              `Override: GUARDRAILS_ENABLED=false or increase maxConsecutiveErrors in guardrails.json`,
          );
        }

        // Session cost guard (progress-aware)
        const effectiveBudget = calculateEffectiveBudget(
          state,
          config,
          modeConfig,
        );
        if (state.sessionCostUsd >= effectiveBudget) {
          throw new Error(
            `GUARDRAIL: Session cost limit — $${state.sessionCostUsd.toFixed(2)} / $${effectiveBudget.toFixed(2)} max.\n` +
              `Progress markers: ${state.progressMarkers} (files: ${state.uniqueFilesEdited.size}, tests: ${state.successfulTests}, commits: ${state.successfulCommits})\n` +
              `This session has consumed significant resources. Start a new session or increase the limit.\n` +
              `Override: increase maxSessionCostUsd or progressAwareBudget.hardCap in guardrails.json`,
          );
        }

        // Stall detection: spending money but not making progress
        if (isStalling(state, config) && !state.stallWarned) {
          state.stallWarned = true;
          client.app
            .log({
              body: {
                service: "guardrails",
                level: "warn",
                message:
                  `⚠️ Stall detected: $${(state.sessionCostUsd - state.lastProgressCost).toFixed(2)} spent since last progress marker. ` +
                  `Consider: are you looping? Total progress: ${state.progressMarkers} markers, ${state.uniqueFilesEdited.size} unique files edited.`,
              },
            })
            .catch(() => {});
        }

        // Doom loop detection (per-tool thresholds with soft warnings)
        if (config.loopDetection.enabled) {
          const target = extractTarget(tool, args);
          const hash = hashToolCall(tool, target);

          const perTool = config.loopDetection.perTool?.[tool];
          const windowSize =
            perTool?.window ?? config.loopDetection.defaultWindow;
          const maxRepeats = Math.max(
            1,
            Math.round(
              (perTool?.maxRepeats ?? config.loopDetection.defaultMaxRepeats) *
                loopMultiplier,
            ),
          );
          const warnAt = Math.max(
            1,
            Math.round(
              (perTool?.warnAt ?? config.loopDetection.warnAtRepeats) *
                loopMultiplier,
            ),
          );

          state.toolHistory.push(hash);
          if (state.toolHistory.length > windowSize) state.toolHistory.shift();

          const repeats = countRepeats(state.toolHistory, hash);

          if (repeats === warnAt) {
            client.app
              .log({
                body: {
                  service: "guardrails",
                  level: "warn",
                  message: `Loop warning: "${tool}" repeated ${repeats}/${maxRepeats} times on same target (window=${windowSize})`,
                },
              })
              .catch(() => {}); // fire-and-forget — don't block tool execution for warnings
          }

          if (repeats >= maxRepeats) {
            throw new Error(
              `GUARDRAIL: Doom loop — "${tool}" called ${repeats} times on same target in last ${windowSize} calls.\n` +
                `Target: ${target.slice(0, 120)}\n` +
                `The same operation is failing repeatedly. Try a different approach.\n` +
                `Override: set loopDetection.enabled=false in guardrails.json or adjust perTool thresholds`,
            );
          }
        }

        log(
          `[guardrails] PASS tool=${tool} errors=${state.consecutiveErrors} cost=$${state.sessionCostUsd.toFixed(2)}`,
        );
      },

      // SECTION: Error tracking + tool call counting + progress tracking
      "tool.execute.after": async (input, _output) => {
        const sessionId = (input as any).sessionID || "_default";
        const state = getState(sessionId);
        const tool = input.tool;
        const args = (input as any).args || {};
        const output = _output as any;

        // Successful tool execution resets consecutive error counter
        state.consecutiveErrors = 0;
        // Count tool calls for daily log records
        toolCallCounts.set(sessionId, (toolCallCounts.get(sessionId) || 0) + 1);

        // SECTION: Progress marker tracking
        if (config.progressAwareBudget?.enabled) {
          let progressIncrement = 0;

          // Track unique file edits
          if (
            tool === "edit" ||
            tool === "write" ||
            tool === "replace_content" ||
            tool === "replace_symbol_body"
          ) {
            const filePath = args.filePath || args.relative_path || "";
            if (filePath && !state.uniqueFilesEdited.has(filePath)) {
              state.uniqueFilesEdited.add(filePath);
              progressIncrement += 1;
              log(
                `[guardrails] Progress: new file edited (${state.uniqueFilesEdited.size} unique)`,
              );
            }
          }

          // Track unique file reads (breadth of exploration)
          if (tool === "read" || tool === "read_file") {
            const filePath = args.filePath || args.relative_path || "";
            if (filePath && !state.uniqueFilesRead.has(filePath)) {
              state.uniqueFilesRead.add(filePath);
              // Every 5 unique reads = 1 progress marker (exploration)
              if (state.uniqueFilesRead.size % 5 === 0) {
                progressIncrement += 1;
                log(
                  `[guardrails] Progress: ${state.uniqueFilesRead.size} unique files read`,
                );
              }
            }
          }

          // Track bash results for test passes and git commits
          if (tool === "bash") {
            const result =
              typeof output?.output === "string"
                ? output.output
                : typeof output?.stdout === "string"
                  ? output.stdout
                  : "";
            if (result) {
              const hasTestPass = TEST_PASS_PATTERNS.some((p) =>
                p.test(result),
              );
              const hasTestFail = TEST_FAIL_PATTERNS.some((p) =>
                p.test(result),
              );
              if (hasTestPass && !hasTestFail) {
                state.successfulTests++;
                progressIncrement += 2; // tests passing = strong progress signal
                log(
                  `[guardrails] Progress: test passed (${state.successfulTests} total)`,
                );
              }
              if (GIT_COMMIT_PATTERNS.some((p) => p.test(result))) {
                state.successfulCommits++;
                progressIncrement += 3; // commits = strongest progress signal
                log(
                  `[guardrails] Progress: commit made (${state.successfulCommits} total)`,
                );
              }
            }
          }

          // Update progress state
          if (progressIncrement > 0) {
            state.progressMarkers += progressIncrement;
            state.lastProgressCost = state.sessionCostUsd;
            state.stallWarned = false; // reset stall warning on progress
            const effectiveBudget = calculateEffectiveBudget(
              state,
              config,
              modeConfig,
            );
            log(
              `[guardrails] Progress total: ${state.progressMarkers} markers, effective budget: $${effectiveBudget.toFixed(2)}`,
            );
          }
        }
      },

      // SECTION: Cost tracking, error counting, warnings, daily log flush
      event: async ({ event }) => {
        const props = (event as any).properties || {};

        // Error counter (for circuit breaker)
        if (event.type === "session.error") {
          const sessionId = props.sessionID || "_default";
          const state = getState(sessionId);
          state.consecutiveErrors++;
          log(`[guardrails] ERROR #${state.consecutiveErrors}/${maxErrors}`);
          if (state.consecutiveErrors >= maxErrors - 1) {
            client.app
              .log({
                body: {
                  service: "guardrails",
                  level: "warn",
                  message: `Error ${state.consecutiveErrors}/${maxErrors} — circuit breaker will trigger on next error`,
                },
              })
              .catch(() => {}); // fire-and-forget
          }
          return;
        }

        if (event.type === "message.updated") {
          const msg = props.info;
          if (!msg || msg.role !== "assistant") return;

          const tokens = msg.tokens;
          if (!tokens) return;

          const inputTokens = tokens.input || 0;
          const outputTokens = tokens.output || 0;
          if (inputTokens === 0 && outputTokens === 0) return;

          const sessionId = msg.sessionID || "_default";
          const model = msg.modelID || "unknown";
          const state = getState(sessionId);

          const cost = estimateCost(model, inputTokens, outputTokens);
          state.sessionCostUsd += cost;
          log(
            `[guardrails] COST +$${cost.toFixed(4)} = $${state.sessionCostUsd.toFixed(2)} (model=${model})`,
          );

          // Warn at threshold (once per session)
          if (
            !state.costWarned &&
            state.sessionCostUsd >= config.warnSessionCostUsd
          ) {
            state.costWarned = true;
            const effectiveBudget = calculateEffectiveBudget(
              state,
              config,
              modeConfig,
            );
            client.app
              .log({
                body: {
                  service: "guardrails",
                  level: "warn",
                  message: `Session cost warning: $${state.sessionCostUsd.toFixed(2)} / $${effectiveBudget.toFixed(2)} effective limit (base: $${maxCost.toFixed(2)}, progress: ${state.progressMarkers} markers)`,
                },
              })
              .catch(() => {}); // fire-and-forget
          }

          // Build pending log record (overwrite on streaming updates via messageId)
          const cacheRead = tokens.cache?.read || 0;
          const cacheWrite = tokens.cache?.write || 0;
          const totalTokens =
            inputTokens + outputTokens + cacheRead + cacheWrite;
          if (totalTokens === 0 && !msg.finish) return;
          const { evoId, phase } = readCurrentEvo();
          const agentName = msg.mode || msg.agent || "unknown";
          const parentMeta = extractParentAgentMeta(msg);
          const workflowMeta = buildWorkflowMeta(evoId, phase);
          const pricingSemantics = classifyPricing(model);
          const roundedCost = Math.round(cost * 10000) / 10000;
          const rawMessageId = typeof msg.id === "string" && msg.id.length > 0 ? msg.id : null;
          // Stable fallback key for local dedup map (not sent to Langfuse).
          // Uses model + token counts — stable for a given streaming event.
          // Date.now() removed: unstable keys cause duplicate records on streaming updates.
          const messageId = rawMessageId ?? `${sessionId}:${model}:${inputTokens}:${outputTokens}`;
          const sessionRecords = pendingRecords.get(sessionId);
          const existingRecord = sessionRecords?.get(messageId);
          const hasExistingQuota = pricingSemantics.provider_class === "copilot-subscription"
            ? existingRecord?.copilot_monthly_requests !== undefined
            : pricingSemantics.provider_class === "minimax-subscription"
              ? existingRecord?.minimax_window_requests !== undefined
              : true;
          const shouldCountQuota = !hasExistingQuota;

          // Quota accounting — telemetry-only, does not affect budget enforcement
          let copilotQuota: CopilotPerCallTelemetry | undefined;
          let minimaxQuota: MinimaxPerCallTelemetry | undefined;
          const now = new Date();
          if (shouldCountQuota && pricingSemantics.provider_class === "copilot-subscription") {
            try {
              copilotQuota = incrementCopilotMonthly(pricingSemantics.premium_request_count, now);
            } catch (_) { /* never throw from telemetry */ }
          } else if (shouldCountQuota && pricingSemantics.provider_class === "minimax-subscription") {
            try {
              minimaxQuota = incrementMinimaxWindow(1, now);
            } catch (_) { /* never throw from telemetry */ }
          } else if (existingRecord) {
            if (pricingSemantics.provider_class === "copilot-subscription") {
              copilotQuota = existingRecord.copilot_monthly_requests !== undefined ? {
                copilot_monthly_requests: existingRecord.copilot_monthly_requests,
                copilot_monthly_limit: existingRecord.copilot_monthly_limit!,
                copilot_overage_requests: existingRecord.copilot_overage_requests!,
                copilot_estimated_overage_cost_usd:
                  existingRecord.copilot_estimated_overage_cost_usd!,
              } : undefined;
            } else if (pricingSemantics.provider_class === "minimax-subscription") {
              minimaxQuota = existingRecord.minimax_window_requests !== undefined ? {
                minimax_window_start: existingRecord.minimax_window_start!,
                minimax_window_end: existingRecord.minimax_window_end!,
                minimax_window_requests: existingRecord.minimax_window_requests,
                minimax_window_limit: existingRecord.minimax_window_limit!,
                minimax_quota_remaining: existingRecord.minimax_quota_remaining!,
              } : undefined;
            }
          }

          const record: CallRecord = {
            timestamp: now.toISOString(),
            sessionId,
            project: projectName,
            agent: agentName,
            ...(parentMeta.parent_agent ? { parent_agent: parentMeta.parent_agent } : {}),
            model,
            inputTokens,
            outputTokens,
            totalTokens,
            toolCalls: 0,
            costUsd: roundedCost,
            estimated_cost_usd: roundedCost,
            marginal_cost_usd: Math.round(marginalCost(cost, pricingSemantics) * 10000) / 10000,
            provider_class: pricingSemantics.provider_class,
            pricing_model: pricingSemantics.pricing_model,
            premium_request_count: pricingSemantics.premium_request_count,
            ...(copilotQuota ?? {}),
            ...(minimaxQuota ?? {}),
            ...(evoId ? { evoId } : {}),
            ...(workflowMeta.workflow_phase ? { workflow_phase: workflowMeta.workflow_phase } : {}),
          };
          if (!pendingRecords.has(sessionId))
            pendingRecords.set(sessionId, new Map());
          pendingRecords.get(sessionId)!.set(messageId, record);

          // Sync real tokens to Langfuse (async, fire-and-forget)
          syncToLangfuse(
            sessionId,
            rawMessageId,
            inputTokens,
            outputTokens,
            cost,
            model,
            {
              estimated_cost_usd: roundedCost,
              marginal_cost_usd: record.marginal_cost_usd,
              provider_class: pricingSemantics.provider_class,
              pricing_model: pricingSemantics.pricing_model,
              premium_request_count: pricingSemantics.premium_request_count,
              agent: agentName,
              ...(parentMeta.parent_agent ? { parent_agent: parentMeta.parent_agent } : {}),
              ...workflowMeta,
              ...(copilotQuota ?? {}),
              ...(minimaxQuota ?? {}),
            },
          ).catch(() => {});

          return;
        }

        // session.idle = turn complete → flush pending log records + clean up
        if (event.type === "session.idle") {
          const sessionId = props.sessionID || "_default";
          const state = sessions.get(sessionId);
          if (state)
            log(
              `[guardrails] SESSION END — errors=${state.consecutiveErrors} cost=$${state.sessionCostUsd.toFixed(2)} tools=${state.toolHistory.length} progress=${state.progressMarkers} uniqueFiles=${state.uniqueFilesEdited.size}`,
            );

          // Flush pending log records to daily JSON file
          const recordMap = pendingRecords.get(sessionId);
          if (recordMap && recordMap.size > 0) {
            const records = Array.from(recordMap.values());
            const totalTools = toolCallCounts.get(sessionId) || 0;
            if (totalTools > 0 && records.length > 0) {
              records[records.length - 1].toolCalls = totalTools;
            }
            try {
              const dayLog = loadDayLog();
              for (const record of records) dayLog.calls.push(record);
              dayLog.summary = rebuildSummary(dayLog.calls);
              saveDayLog(dayLog);
              // Flush per-EVO aggregates
              flushEvoRecords(records, sessionId);
            } catch (_) {
              /* fire-and-forget: never crash guardrails on log write failure */
            }
          }

          // Reset per-session log state
          pendingRecords.delete(sessionId);
          toolCallCounts.delete(sessionId);
          // Don't delete sessions entry — session may continue after idle
        }
      },
    };
  } catch (error: any) {
    console.error(
      `[CRITICAL] Plugin agent-guardrails failed to initialize: ${error.message}`,
    );
    console.error(
      `[CRITICAL] Session will continue WITHOUT agent-guardrails enforcement.`,
    );
    return {};
  }
};
