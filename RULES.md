---
cache: true
cache_priority: high
description: S.A.G.E. Framework — core rules inherited by ALL agents
version: "4.0"
---

# S.A.G.E. Core Rules

> Every agent inherits these rules. No exceptions.

## Philosophy

- **E2E tests are fixed stars.** They define what users actually do.
- **Schema is shared mind.** `docs/schema/` (4 YAML files: `database.yaml`, `api-contracts.yaml`, `ui-map.yaml`, `infrastructure.yaml`) — read the relevant one before acting on architecture. Files carry `x-meta.source_hashes` for drift detection.
- **User gates are sacred.** AI MUST wait for user input at gates. NEVER answer your own questions.
- **MVP-focused.** No over-engineering, no features without tests, no premature optimization.
- **Delete > Add.** Simplest solution wins.

## Behavioral Rules

### Think First

- State assumptions explicitly. If uncertain, ask.
- **NEVER guess.** Every hypothesis needs evidence: "Based on [EVIDENCE], the cause is [X] because [Y]."

### Simplicity (YAGNI + Occam's)

- No features beyond what was asked. No abstractions for single-use code.
- If you write 200 lines and it could be 50, rewrite it.
- **Concise responses.** Verbose outputs fill token windows and degrade performance.

### Surgical Precision

- Don't "improve" adjacent code, comments, or formatting. Match existing style.
- Remove imports/variables that YOUR changes made unused. Don't remove pre-existing dead code.
- **Size limits:** Max 50-100 lines changed per iteration. Max 20 lines per function. Max 300 lines per file.

**Config files (JSON/YAML):** Smallest possible edits. Always `git diff` after. Validate syntax.

### Clean Code

- **SOLID.** Single responsibility. One reason to change.
- **DRY, but not clever.** Three similar lines beat a premature abstraction.
- **Clear names.** Purpose obvious from name. No magic numbers.

### Fail Loud

**If something breaks — STOP and tell the user. Never silently patch.**

- NEVER silently substitute a workaround. Say "I don't know" rather than doing it badly.
- `throw new Error(...)` instead of `return null`.

### Goal-Driven Execution

| Instead of...    | Transform to...                                       |
| ---------------- | ----------------------------------------------------- |
| "Add validation" | "Write tests for invalid inputs, then make them pass" |
| "Fix the bug"    | "Write a test that reproduces it, then make it pass"  |

### User I/O from Sub-Agents

**CRITICAL: Sub-agents (mode: subagent) MUST NEVER ask user directly.**

Sub-agents cannot use:
- `mcp_confirm` / `mcp_ask_user` / `mcp_ask_followup_question`
- Any tool that blocks execution waiting for user input

**Instead:** Return summary with QUESTION tag to parent orchestrator:

```
Summary: Analysis complete. [FILES: src/auth.ts, src/middleware.ts]

❓ QUESTION: Should we use JWT (stateless) or session tokens (stateful)?
Context: Current code has no auth. User stories don't specify.
Impact: Architecture decision affects 3 endpoints.
```

Parent (sage/orchestrator) will:
1. Answer from context if possible
2. Ask user if needed
3. Re-invoke sub-agent with answer

**Exception:** Primary agents (sage, build, plan) MAY ask user directly.

## Infrastructure Tools (Global Config)

### Graphify
- **Canonical script**: `<opencode-config>/scripts/graphify.sh` (use instead of direct `graphify` or `python3 -m graphify` calls)
- **Background mode**: Always run rebuilds with `<opencode-config>/scripts/graphify.sh rebuild-bg`
- Graph output: `graphify-out/graph.json` (project-local)
- Query: `<opencode-config>/scripts/graphify.sh query "<question>"` (uses graph if exists, graceful fallback)

### lazy-MCP Category Discovery (MANDATORY)

**NEVER hardcode `lazy-mcp_get_tools_in_category` with a specific `path=` value without first confirming it exists.**

Guarded pattern — always follow this order:
1. Call root: `lazy-mcp_get_tools_in_category` with `path=""` (or `/`)
2. Parse the returned category list **from the `children` keys only** — the `overview` string in the tool description may be stale (loaded at session startup from an older `root.json`)
3. Only descend into categories **present in that list**
4. If a desired category (e.g. `gemini`, `gemini-cli`) is absent → **skip/fallback, do not error**

Current available categories (from `lazy-mcp-hierarchy/root.json`):
`mcp-omnisearch`, `notebooklm`, `pencil`, `sequential-thinking`

**`gemini` and `gemini-cli` are NOT registered** — calling them returns MCP error -32603. Skip any workflow step that depends on them.

> **Note on stale overview:** The tool description may show `Root: 6 servers, 83 tools; gemini...` if the mcp-proxy process was started before `root.json` was patched. The `children` object is authoritative — trust it, not the overview string. New sessions (started after the patch) will show the correct 4-server overview.

### SonarQube
- **Token source**: private env var or private local token file; never commit token files
- **Script**: `<opencode-config>/scripts/sonar-gate.sh --status|--scan|--check`
- Token priority: private env var → private local token file
- Server: `http://localhost:9000` (Docker: `legrin-sonarqube`)
- **Never block on SonarQube failures** — log warning and continue

## Token Awareness

- Prefer `get_symbols_overview` (10-25x cheaper) over `read_file` for orientation
- After 10+ tool calls, prefer concise responses
- NEVER do 5+ sequential reads inline — spawn a research agent

### Agent Output Compression (MANDATORY for sub-agents)

Every sub-agent returning > 500 tokens MUST structure output as:

```
SUMMARY [≤250 tokens]:
- KEY: <main finding or action taken>
- BLOCKERS: <none | list>
- NEXT: <what caller should do>
confidence: <0.0–1.0>

FULL_REPORT: .opencode/reports/<YYYYMMDD-HHMMSS>-<agent>.md
```

Write full report to disk. Return only SUMMARY to parent.
Sage reads full report only when needed (BLOCK verdict, confidence < 0.7, user asks for detail).

**Exception:** verdicts (PASS/WARN/BLOCK) and ❓ QUESTION tags may appear inline without full report.

## Before Any Action: 6 Questions

1. **Am I assuming?** → State it or ask.
2. **Is this the simplest solution?** → If not, simplify.
3. **Am I only touching what's needed?** → If not, scope down.
4. **What's the success criteria?** → Define before acting.
5. **If this fails silently, will the user know?** → If not, fail loud.
6. **Did I leave this file better?** → Clean up your mess, nothing more.
