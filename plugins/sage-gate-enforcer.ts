// SAGE Hook: Gate Enforcer
// Blocks file edits that violate S.A.G.E. phase rules
// HIGH RISK: Can block legitimate edits - use with caution

import type { Plugin } from "@opencode-ai/plugin";
import * as fs from "fs/promises";
import * as yaml from "yaml";

// Test file detection patterns (extended for multiple languages)
const TEST_PATTERNS = [
  // JavaScript/TypeScript
  /test[s]?\//i,
  /spec[s]?\//i,
  /\.test\.[jt]sx?$/i,
  /\.spec\.[jt]sx?$/i,
  /_test\.[jt]sx?$/i,
  /__tests__\//i,
  /\.stories\.[jt]sx?$/i,

  // Python
  /_test\.py$/i,
  /test_.*\.py$/i,
  /tests?\//i,

  // .NET / C#
  /\.Tests?\./i,
  /Tests?\//i,
  /\.Test\.cs$/i,
  /Tests\.cs$/i,

  // Go
  /_test\.go$/i,

  // Rust
  /tests?\//i,
  /#\[test\]/,

  // Java
  /Test\.java$/i,
  /Tests\.java$/i,
  /src\/test\//i,
];

// Always allowed paths (escape hatches)
const ALWAYS_ALLOWED = [
  // Documentation
  /^docs?\//i,
  /\.md$/i,
  /\.txt$/i,
  /README/i,
  /CHANGELOG/i,
  /LICENSE/i,

  // Config (but NOT .evo-state.yaml - protected separately)
  /opencode\.json$/i,
  /\.opencode\//i,

  // Data files - EXCLUDING yaml to prevent state file bypass
  /\.json$/i,
  /\.xml$/i,
  /\.toml$/i,

  // Logs
  /\.log$/i,

  // Git
  /\.git\//i,
  /\.gitignore$/i,
];

// Protected state file - can only be modified by /evo commands
const STATE_FILE_PATTERN = /\.evo-state\.yaml$/i;

// SECTION: config-untested gate (addresses ap-6 recidivism: 125 violations over 4 days)
// Sensitive config files — edits must be paired with a test edit OR acknowledged.
const SENSITIVE_CONFIG_PATTERNS = [
  /(^|\/)opencode\.json$/i,
  /(^|\/)tsconfig.*\.json$/i,
  /(^|\/)jest\.config\.[jt]s$/i,
  /(^|\/)vitest\.config\.[jt]s$/i,
  /(^|\/)package\.json$/i,          // dep/script changes are behaviour-carrying
  /(^|\/)docker-compose\.ya?ml$/i,
  /(^|\/)Dockerfile$/i,
  /(^|\/)\.env(\.[\w-]+)?$/i,
  /(^|\/)\.serena\/project\.ya?ml$/i,
  /(^|\/)framework\/commands\.json$/i,
  /(^|\/)docs\/schema\/.*\.ya?ml$/i,
  /\.github\/workflows\/.*\.ya?ml$/i,
];

function isSensitiveConfig(path: string): boolean {
  return SENSITIVE_CONFIG_PATTERNS.some((p) => p.test(path));
}

// Per-session state for config-untested gate
interface ConfigGateState {
  warned: boolean;
  testEditedAfterLastConfigEdit: boolean;
  lastConfigEditAt: number;
}
const _configGateState = new Map<string, ConfigGateState>();
function getConfigGate(sessionId: string): ConfigGateState {
  let s = _configGateState.get(sessionId);
  if (!s) {
    s = { warned: false, testEditedAfterLastConfigEdit: true, lastConfigEditAt: 0 };
    _configGateState.set(sessionId, s);
  }
  return s;
}

// Bash commands that modify files
const FILE_MODIFYING_COMMANDS = [
  /\bsed\s+-i/i, // sed in-place
  /\becho\s+.*\s*>\s*\S/i, // echo > file
  /\bcat\s+.*\s*>\s*\S/i, // cat > file
  /\bprintf\s+.*\s*>\s*\S/i, // printf > file
  /\btee\s+/i, // tee (writes to files)
  /\bpatch\s+/i, // patch
  /\bawk\s+.*-i\s+inplace/i, // awk in-place
  /\bperl\s+-[^\s]*i/i, // perl in-place
  /\btruncate\s+/i, // truncate
  /\bdd\s+/i, // dd
  />\s*\S+\.(py|js|ts|go|rs|java|cs|rb|php|c|cpp|h|hpp)$/i, // redirect to code files
];

// Extract file path from bash command (best effort)
function extractFileFromBash(command: string): string | null {
  // Try to find file paths in the command
  const codeFilePattern =
    /\b(\S+\.(py|js|ts|go|rs|java|cs|rb|php|c|cpp|h|hpp))\b/i;
  const match = command.match(codeFilePattern);
  return match ? match[1] : null;
}

function isFileModifyingBash(command: string): boolean {
  return FILE_MODIFYING_COMMANDS.some((p) => p.test(command));
}

function isTestFile(path: string): boolean {
  return TEST_PATTERNS.some((p) => p.test(path));
}

function isAlwaysAllowed(path: string): boolean {
  return ALWAYS_ALLOWED.some((p) => p.test(path));
}

function isStateFile(path: string): boolean {
  return STATE_FILE_PATTERN.test(path);
}

type Phase = "DISCOVERY" | "PLANNING" | "RED" | "GREEN" | "COMPLETE";

// Debug mode - set SAGE_DEBUG=true for verbose logging
const DEBUG = process.env.SAGE_DEBUG === "true";
const log = (msg: string) => DEBUG && console.log(msg);

// SECTION: EVO State Cache — avoids re-reading .evo-state.yaml on every tool call
const EVO_STATE_TTL = 5000; // 5 seconds
let _evoStateCache: { data: any; ts: number } | null = null;

async function getCachedEvoState(): Promise<any | null> {
  const now = Date.now();
  if (_evoStateCache && (now - _evoStateCache.ts) < EVO_STATE_TTL) {
    log(`[sage-gate] EVO state cache hit (age=${now - _evoStateCache.ts}ms)`);
    return _evoStateCache.data;
  }
  const statePath = "docs/evo/.evo-state.yaml";
  try {
    await fs.access(statePath);
    const content = await fs.readFile(statePath, "utf-8");
    const state = yaml.parse(content);
    _evoStateCache = { data: state, ts: now };
    return state;
  } catch {
    _evoStateCache = { data: null, ts: now }; // cache the miss too
    return null;
  }
}

function invalidateEvoStateCache() {
  _evoStateCache = null;
}

// SECTION: State Sync (merged from sage-state-sync)
let _modifiedFiles: string[] = [];
let _lastSyncTime = 0;
const SYNC_INTERVAL = 5000; // Sync at most every 5 seconds

// SECTION: EVO Mode Detection (cached)
let _evoModeCache: boolean | null = null;
function detectEvoMode(): boolean {
  if (_evoModeCache !== null) return _evoModeCache;
  if (process.env.SAGE_EVO_ACTIVE === "true") {
    _evoModeCache = true;
    return true;
  }
  try {
    const fs = require("fs");
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

export const SageGateEnforcer: Plugin = async ({ client }) => {
  try {
  const _gateDisabled =
    process.env.SAGE_HOOKS_DISABLED === "true" ||
    process.env.SAGE_HOOKS_ENABLED === "false";
  const _evoActive = detectEvoMode();
  await client.app.log({
    body: {
      service: "sage-gate-enforcer",
      level: "info",
      message: `[SAGE] Gate Enforcer: ${!_gateDisabled ? `✓ ACTIVE (EVO=${_evoActive ? "fail-closed" : "inactive"}, default=fail-open)` : "✗ INACTIVE"} [env: SAGE_HOOKS_DISABLED=${process.env.SAGE_HOOKS_DISABLED || "unset"}]`,
    },
  });

  // Kill switch check (opt-out: disabled only when explicitly set)
  if (process.env.SAGE_HOOKS_DISABLED === "true" || process.env.SAGE_HOOKS_ENABLED === "false") {
    log("[sage-gate] DISABLED via SAGE_HOOKS_DISABLED=true or SAGE_HOOKS_ENABLED=false");
    return {};
  }

  log("[sage-gate] ENABLED - Registering tool.execute.before hook");

  return {
    // SECTION: State Sync — track file modifications and update .evo-state.yaml
    "tool.execute.after": async (input, _output) => {
      try {
        const tool = input.tool;
        if (tool !== "write" && tool !== "edit") return;

        const filePath = (input as any).args?.filePath;
        if (filePath && !_modifiedFiles.includes(filePath)) {
          _modifiedFiles.push(filePath);
        }

        // Rate-limit state updates
        const now = Date.now();
        if (now - _lastSyncTime < SYNC_INTERVAL) return;
        _lastSyncTime = now;

        const statePath = "docs/evo/.evo-state.yaml";
        try {
          await fs.access(statePath);
        } catch {
          return;
        }

        const content = await fs.readFile(statePath, "utf-8");
        const state = yaml.parse(content);
        if (!state?.current) return;

        state.current.last_activity = new Date().toISOString();
        state.current.files_modified_count = _modifiedFiles.length;

        const tempPath = statePath + ".tmp";
        await fs.writeFile(tempPath, yaml.stringify(state));
        await fs.rename(tempPath, statePath);
        invalidateEvoStateCache(); // bust cache after write
      } catch (error: any) {
        console.warn("[sage-gate] State sync error:", error.message);
      }
    },

    event: async ({ event }) => {
      if ((event as any).type === "session.idle") {
        try {
          if (_modifiedFiles.length > 0) {
            client.app.log({
              body: {
                service: "sage-gate",
                level: "info",
                message: `Session complete. ${_modifiedFiles.length} files modified: ${_modifiedFiles.slice(0, 5).join(", ")}${_modifiedFiles.length > 5 ? "..." : ""}`,
              },
            }).catch(() => {});
          }
          _modifiedFiles = [];
          _lastSyncTime = 0;
        } catch (error: any) {
          console.warn("[sage-gate] Idle reset error:", error.message);
        }
      }
    },

    "tool.execute.before": async (input, output) => {
      log(`[sage-gate] tool.execute.before: ${input.tool}`);
      try {
        let filePath = "";
        let isBashModify = false;

        // Check edit/write tools
        if (["edit", "write"].includes(input.tool)) {
          filePath = output.args?.filePath || "";
        }
        // Check Serena MCP tools that modify files
        else if (
          [
            "serena_replace_content",
            "serena_replace_symbol_body",
            "serena_insert_after_symbol",
            "serena_insert_before_symbol",
            "serena_create_text_file",
            "serena_rename_symbol",
          ].includes(input.tool)
        ) {
          filePath = output.args?.relative_path || output.args?.filePath || "";
          log(`[sage-gate] Serena file-modifying tool: ${input.tool}`);
        }
        // Check bash commands that modify files
        else if (input.tool === "bash") {
          const command = output.args?.command || "";
          if (isFileModifyingBash(command)) {
            isBashModify = true;
            filePath = extractFileFromBash(command) || "";
            log(
              `[sage-gate] File-modifying bash detected: ${command.substring(0, 50)}...`,
            );
          } else {
            log(`[sage-gate] Skipping non-modifying bash`);
            return;
          }
        }
        // Skip other tools
        else {
          log(`[sage-gate] Skipping tool: ${input.tool}`);
          return;
        }

        log(`[sage-gate] Checking file: ${filePath}`);

        // CRITICAL: Block state file modifications to prevent bypass
        // State file should only be modified by /evo commands (which don't go through hooks)
        if (isStateFile(filePath)) {
          log(`[sage-gate] BLOCKING: State file modification attempt`);
          throw new Error(
            `SAGE Gate: Cannot modify .evo-state.yaml directly.\n` +
              `Use /evo commands to transition between phases:\n` +
              `  /evo next     - Advance to next step\n` +
              `  /evo complete - Finalize current EVO\n` +
              `To override, disable hooks: SAGE_HOOKS_ENABLED=false`,
          );
        }

        // ── config-untested gate (ap-6 recidivism fix) ──────────────────
        // Track test edits regardless of phase — used by the config gate below.
        const sessionId = (input as any).sessionID || "_default";
        if (isTestFile(filePath)) {
          const cg = getConfigGate(sessionId);
          cg.testEditedAfterLastConfigEdit = true;
        }
        // Sensitive config edits require a prior test edit in this session OR explicit ack.
        if (isSensitiveConfig(filePath)) {
          const cg = getConfigGate(sessionId);
          const ack = process.env.SAGE_CONFIG_UNTESTED_ACK === "1";
          if (!ack && !cg.testEditedAfterLastConfigEdit) {
            if (!cg.warned) {
              // 1st offense this session → warn loudly, allow once (grace)
              cg.warned = true;
              cg.lastConfigEditAt = Date.now();
              cg.testEditedAfterLastConfigEdit = false;
              client.app.log({
                body: {
                  service: "sage-gate",
                  level: "warn",
                  message:
                    `⚠️ [CONFIG-UNTESTED] Editing ${filePath} without a test edit first. ` +
                    `This is anti-pattern ap-6 (125 violations in past 4 days). ` +
                    `Next config edit in this session WILL BE BLOCKED unless you: ` +
                    `(a) edit a test file in between, or (b) set SAGE_CONFIG_UNTESTED_ACK=1. ` +
                    `Reason: past incidents where unvalidated config crashed runtime.`,
                },
              }).catch(() => {});
            } else {
              // 2nd offense without intervening test → block
              throw new Error(
                `SAGE Gate (ap-6 config-untested): Second edit to sensitive config ` +
                `${filePath} without an intervening test edit in this session.\n` +
                `To proceed, do ONE of:\n` +
                `  1. Edit a test file (validates behaviour), then retry\n` +
                `  2. Run the consuming tool manually to validate (e.g. \`jq empty ${filePath}\`, \`docker compose config\`, \`tsc --noEmit\`)\n` +
                `  3. Set SAGE_CONFIG_UNTESTED_ACK=1 in env (session-only ack)\n` +
                `History: ap-6 has fired 125× in past 4 days — this gate is the response.`
              );
            }
          } else {
            // Test edit seen OR ack set → allow, reset counter for next round
            cg.lastConfigEditAt = Date.now();
            cg.testEditedAfterLastConfigEdit = false;
          }
        }
        // ── end config-untested gate ────────────────────────────────────

        // Always allow certain paths (escape hatches)
        if (isAlwaysAllowed(filePath)) {
          log(`[sage-gate] Always allowed (escape hatch): ${filePath}`);
          return;
        }

        // Read EVO state (cached — avoids 2 file I/O + YAML parse per call)
        const state = await getCachedEvoState();

        if (!state) {
          log(`[sage-gate] No state file, skipping gates`);
          return; // No EVO active, no gates
        }

        if (!state?.current?.phase) {
          log(`[sage-gate] No phase in state, skipping`);
          return;
        }

        const tier: string = state.current.tier || "FULL";
        log(`[sage-gate] Tier: ${tier}`);

        // HOTFIX tier: no restrictions — all tools allowed
        if (tier === "HOTFIX") {
          log(`[sage-gate] HOTFIX tier — allowing all edits`);
          return;
        }

        // STANDARD tier: light restrictions only (no phase-based gates)
        if (tier === "STANDARD") {
          // State file is already blocked above — nothing else to restrict
          log(`[sage-gate] STANDARD tier — allowing edit (light restrictions only)`);
          return;
        }

        // FULL tier: fall through to existing phase-based restrictions below
        const phase: Phase = state.current.phase;
        const step: number = state.current.step || 0;
        log(`[sage-gate] Phase: ${phase}, Step: ${step}`);

        const toolDesc = isBashModify ? "bash command modifying" : "edit";

        // Phase-specific rules (FULL tier only)
        switch (phase) {
          case "DISCOVERY":
            // No code edits during discovery (steps 1-10.5)
            throw new Error(
              `SAGE Gate: Cannot ${toolDesc} code during DISCOVERY phase (Step ${step}/22).\n` +
                `File: ${filePath}\n` +
                `Complete discovery first, then use /evo next to proceed.\n` +
                `To override, disable hooks: SAGE_HOOKS_ENABLED=false`,
            );

          case "PLANNING":
            // No code edits during planning (steps 11-13.75)
            throw new Error(
              `SAGE Gate: Cannot ${toolDesc} code during PLANNING phase (Step ${step}).\n` +
                `File: ${filePath}\n` +
                `Complete planning first, then use /evo next to start RED phase.\n` +
                `To override, disable hooks: SAGE_HOOKS_ENABLED=false`,
            );

          case "RED":
            // Only test files during RED phase (steps 14-16)
            if (!isTestFile(filePath)) {
              throw new Error(
                `SAGE Gate: RED phase (Step ${step}) - write failing tests first!\n` +
                  `File: ${filePath}\n` +
                  `This file is not detected as a test file.\n` +
                  `Test patterns: *test*, *spec*, *.test.*, *.spec.*, Tests/, etc.\n` +
                  `To override, disable hooks: SAGE_HOOKS_ENABLED=false`,
              );
            }
            log(`[sage-gate] Allowing test file edit in RED phase`);
            break;

          case "GREEN":
            // All edits allowed during GREEN (steps 17-20)
            break;

          case "COMPLETE":
            // Warn but allow during complete phase (steps 21-22)
            client.app.log({
              body: {
                service: "sage-gate",
                level: "warn",
                message: `Editing during COMPLETE phase: ${filePath}. Consider finalizing EVO first.`,
              },
            }).catch(() => {});
            break;
        }
      } catch (error: any) {
        if (error.message.includes("SAGE Gate")) {
          throw error; // Re-throw our errors
        }
        // Mode-aware error handling
        const isEvoMode = detectEvoMode();
        if (isEvoMode) {
          // fail-closed: surface the error during EVO workflows
          throw error;
        } else {
          // fail-open: log warning and continue (default behavior)
          log(`[WARN] Gate error (fail-open): ${error.message}`);
        }
      }
    },
  };
  } catch (error: any) {
    console.error(`[CRITICAL] Plugin sage-gate-enforcer failed to initialize: ${error.message}`);
    console.error(`[CRITICAL] Session will continue WITHOUT sage-gate-enforcer enforcement.`);
    return {};
  }
};
