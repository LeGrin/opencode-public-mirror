---
name: flow-orchestrator
description: Universal intelligent orchestrator - 5-phase workflow with parallel sub-agents (Scout → Conductor → Alchemist)
auto_load: ["/flow"]
---

# Flow Orchestrator Protocol v2

**Part of S.A.G.E. (Schema-Aware Guided Evolution) Framework**

This skill defines the 5-phase workflow for orchestrated work that doesn't require full EVO treatment. Use `/flow` for smoke tests, audits, research, refactoring analysis, ops tasks, and pre-EVO discovery.

## Model Routing Principle

> Save Opus tokens. Delegate everything that doesn't need strategic reasoning.

| Model      | Role                    | When                                            |
| ---------- | ----------------------- | ----------------------------------------------- |
| **Sonnet** | Strategy + Synthesis    | Classify, route, synthesize final answer, gates |
| **Sonnet** | Tactical + File-level   | Plan, analyze files, implement, validate        |
| **Haiku**  | Tool calls + Atomic ops | Search, read, grep, web lookup, memory check    |

**Rule:** If a task is just "read X and summarize" → Haiku scout. If it's "analyze X and decide" → Sonnet alchemist. Orchestrator is always Sonnet — never Opus for coordination.

---

## Sub-Agent Architecture

```
Orchestrator (Sonnet) ─── PHASE 1: ANALYZE (inline, ~500 tokens)
    │                   Classify, route, plan scout dispatch
    │
    ├── PHASE 2: DISCOVER ──→ Dispatch scouts directly (PARALLEL)
    │       │
    │       ├── Task(flow-scout, "codebase: ...")    [Haiku] ┐
    │       ├── Task(flow-scout, "web: ...")          [Haiku] ├── PARALLEL
    │       └── Task(flow-scout, "memory: ...")       [Haiku] ┘
    │       │
    │       └── Orchestrator consolidates inline → Research Brief (~1.5K tokens)
    │
    │   [CHECKPOINT] Orchestrator presents brief, user approves scope
    │
    ├── PHASE 3: PLAN ──→ Task(flow-alchemist, MODE: plan)  [Sonnet]
    │       │
    │       └── Optional: Task(flow-alchemist, MODE: validate)  [Sonnet]
    │
    │   [CHECKPOINT] Orchestrator presents plan, user approves
    │
    ├── PHASE 4: EXECUTE ──→ Task(flow-alchemist, MODE: implement)  [Sonnet]
    │       │
    │       ├── Batch 1: steps 1-3 (parallel alchemists)
    │       ├── Batch 2: steps 4-6 (depends on batch 1)
    │       └── ...
    │
    └── PHASE 5: REPORT
        ├── Task(flow-alchemist, MODE: report)  [Sonnet]
        └── Orchestrator: present, archive choice, EVO suggestion (inline)
```

> **Dispatch note:** Use `flow-scout` (not `flow-scout-haiku`) and `flow-alchemist` (not `flow-alchemist-sonnet`). Canonical names are the dispatch targets.

**Context Budget:** ~10-15K orchestrator tokens total (vs 50K+ single-agent)

### Agent Definitions

| Agent              | Model  | Agent ID         | Role                       |
| ------------------ | ------ | ---------------- | -------------------------- |
| **flow-scout**     | Haiku  | `flow-scout`     | Read-only intelligence     |
| **flow-alchemist** | Sonnet | `flow-alchemist` | Synthesis & transformation |

> **Model defaults:** flow-scout runs on Haiku (fast, cheap). flow-alchemist runs on Sonnet. For complex synthesis, escalate to Opus tier per `docs/agent-routing.md`.

### Context Isolation Strategy

Each sub-agent gets its own 200K context window:

- Scouts get **focused 200-token prompts** → return **max 500-token summaries**
- **Orchestrator consolidates** scout findings inline into **~1.5K brief** (no conductor hop)
- Alchemists get **brief + specific task** (~800 tokens) → return structured artifact
- Orchestrator sees **only summaries and artifacts** (never raw research)

### Variant Routing

When dispatching Task() calls, use canonical agent names. Escalation variants are available if needed — see `docs/agent-routing.md`.

| Agent          | Canonical Name   | Default Model | Escalation                 |
| -------------- | ---------------- | ------------- | -------------------------- |
| flow-scout     | `flow-scout`     | Haiku         | —                          |
| flow-alchemist | `flow-alchemist` | Sonnet        | Opus for complex synthesis |

### Safety Rules

1. **No recursion:** flow-orchestrator MUST NOT call flow-orchestrator. Max depth: orchestrator → conductor → scout.
2. **Loop breaker:** If two consecutive dispatch rounds produce no new findings or no state change, STOP and return `status: blocked` to user.
3. **Circuit breaker:** If any agent fails 3x on same task, escalate: Haiku→Sonnet→Opus→Human gate.

---

## Smart Routing

Not every task needs the full pipeline. Route by complexity:

| Complexity  | Signal                              | Pipeline                                |
| ----------- | ----------------------------------- | --------------------------------------- |
| **SIMPLE**  | Single question, 1 file, quick look | Sonnet answers inline (skip all phases) |
| **MEDIUM**  | 3-5 steps, known scope              | Orchestrator → Scouts → Alchemist plan  |
| **COMPLEX** | 6+ steps, unknown scope, multi-file | Full 5-phase pipeline                   |

**Detection heuristics:**

- Prompt < 20 words + clear single action → SIMPLE
- Prompt mentions specific files/areas → MEDIUM
- Prompt is open-ended / "analyze everything" → COMPLEX

---

## PHASE 1: ANALYZE (Sonnet, inline)

**Purpose:** Classify work, plan delegation. This is the ONLY phase the orchestrator does inline.

**Steps:**

1. Parse the prompt for intent
2. Classify work type (see table below)
3. Determine complexity (SIMPLE / MEDIUM / COMPLEX)
4. If SIMPLE → answer directly, skip remaining phases
5. Plan scout dispatch questions (2-4 focused questions)
6. Determine output artifact name

**Classification Rules:**

| Keywords                                       | Type         | Scout Focus              |
| ---------------------------------------------- | ------------ | ------------------------ |
| "smoke test", "test UI", "test pages"          | `smoke-test` | Pages, flows, auth       |
| "audit", "check", "scan", "review"             | `audit`      | Files, patterns, vulns   |
| "research", "find out", "look up"              | `research`   | External docs, practices |
| "refactor", "clean up", "simplify"             | `refactor`   | Code structure, deps     |
| "analyze", "explore", "understand", "discover" | `discovery`  | Architecture, services   |
| "deploy", "release", "ship to"                 | `deploy`     | Infrastructure, configs  |
| "doctl", "kubectl", "check prod", "logs"       | `ops`        | Current state, health    |
| "try", "prototype", "experiment"               | `experiment` | Patterns, constraints    |
| "migrate", "move from", "upgrade"              | `migration`  | Deps, breaking changes   |
| "remove", "delete unused", "prune"             | `cleanup`    | Dead code, unused files  |

**Output (shown to user):**

```markdown
## ANALYZE

**Prompt:** "{user's prompt}"
**Type:** {classified_type}
**Complexity:** {SIMPLE|MEDIUM|COMPLEX}
**Output:** {artifact_name}.md

**Scout Dispatch Plan:**
| Scout | Mode | Research Question |
| ----- | -------- | ------------------------------ |
| S1 | codebase | {specific question} |
| S2 | web | {specific question} |
| S3 | memory | {specific question} |

Dispatching scouts...
```

---

## PHASE 2: DISCOVER (Direct Scout Dispatch)

**Purpose:** Gather context through parallel scouts, consolidated inline by orchestrator.

### 2a: No Artifact Provided → Full Discovery

**Orchestrator dispatches scouts directly in ONE message (true parallelism):**

```
Task(flow-scout, "MODE: codebase. SCOPE: {relevant paths}. {question about code structure/patterns}.")
Task(flow-scout, "MODE: web. SCOPE: {topic + year}. {question about best practices/docs}.")
Task(flow-scout, "MODE: memory. SCOPE: {topic keywords}. Check Serena memories for previous work/decisions.")
```

**Scout prompt rules:**

- Start with `MODE: {codebase|web|memory|docs}.`
- Follow with `SCOPE: {paths/terms}.`
- Then the specific research question
- Max 200 tokens per scout prompt
- Max 4 scouts per dispatch

**Orchestrator consolidates findings inline** after scouts return:

1. Group findings by theme (not by scout)
2. Note cross-references and contradictions
3. Flag open questions scouts couldn't answer
4. Target ~1.5K tokens for the consolidated brief

**Orchestrator presents brief to user:**

```markdown
## DISCOVER

**Research Brief:**
{consolidated findings grouped by theme}

**Scope:**
{what exactly will be done}

**Risks:**
{what could go wrong}

---

**Ready to create execution plan? [Y/N]**
```

**[CHECKPOINT]** Wait for user approval.

### 2b: Artifact Provided → Gap Analysis

**Orchestrator dispatches scouts with artifact context:**

```
Task(flow-scout, "MODE: codebase. SCOPE: {relevant paths}. What changed since {artifact date}? Check {relevant paths}.")
Task(flow-scout, "MODE: memory. SCOPE: {topic keywords}. Any new decisions or work related to {topic}?")
```

**Orchestrator consolidates gap analysis inline**, then presents to user.

**[CHECKPOINT]** Present gap analysis, wait for user approval.

---

## PHASE 3: PLAN (Delegated to Alchemist)

**Purpose:** Transform research brief into execution plan.

**Orchestrator dispatches alchemist:**

```
Task(flow-alchemist, prompt="""
MODE: plan
GOAL: {user's prompt}
TYPE: {classified_type}
RESEARCH BRIEF:
{conductor's consolidated brief — ~1.5K tokens}

Create an execution plan with:
- Numbered steps with clear actions
- Files affected per step
- Dependencies between steps
- Checkpoints for verification
- Parallel opportunities (which steps can run together)
- Estimated effort
""", subagent_type="flow-alchemist")
```

**Optional validation (for COMPLEX flows only):**

```
Task(flow-alchemist, prompt="""
MODE: validate
PLAN:
{plan from previous alchemist}
RESEARCH BRIEF:
{conductor's brief}

Validate this plan against:
- Are all scout findings addressed?
- Are there missing steps?
- Are dependencies correct?
- Are there simpler alternatives?
""", subagent_type="flow-alchemist")
```

**Orchestrator presents plan to user:**

```markdown
## PLAN

{alchemist's execution plan}

{validation notes if COMPLEX}

---

**Approve this plan? [Y/N]**
```

**[CHECKPOINT]** Wait for user approval.

---

## PHASE 4: EXECUTE (Delegated to Alchemists)

**Purpose:** Run the plan using parallel alchemist batches.

**Orchestrator analyzes the plan for parallelizable step groups, then dispatches:**

### Batch Execution Pattern

```
# Batch 1: Independent steps (PARALLEL — same message)
Task(flow-alchemist, "MODE: implement. Steps 1-2: {details}. Files: {paths}.")
Task(flow-alchemist, "MODE: implement. Step 3: {details}. Files: {paths}.")

# Wait for batch 1 results...

# Batch 2: Steps depending on batch 1 (PARALLEL)
Task(flow-alchemist, "MODE: implement. Steps 4-5: {details}. Context from batch 1: {results}.")

# Wait for batch 2 results...
```

**Alchemist prompt template:**

```
Task(flow-alchemist, prompt="""
MODE: implement
STEPS: {step numbers and descriptions}
FILES: {specific file paths to modify}
CONTEXT: {results from previous batches if any}
CONSTRAINTS: {any rules from the plan}

Execute these steps. For each step return:
- Status: DONE | FAILED | SKIPPED
- Changes: what was modified
- Errors: any issues encountered
""", subagent_type="flow-alchemist")
```

**State Tracking:**

Update `.flow-state.yaml` between batches:

```yaml
current:
  phase: "EXECUTE"
progress:
  total_steps: { N }
  completed_steps: { M }
  current_batch: { batch_number }
  errors: []
```

**Progress Display (orchestrator, inline):**

```
[Progress: 5/12 steps — Batch 2/4]
✓ Batch 1: Steps 1-3 — DONE
→ Batch 2: Steps 4-5 — IN PROGRESS...
○ Batch 3: Steps 6-9 — PENDING
○ Batch 4: Steps 10-12 — PENDING
```

**Error Handling:**

On alchemist error → orchestrator presents options inline:

```markdown
## Error in Step {N}

**Error:** {error message from alchemist}

**Options:**

1. Retry this step
2. Skip and continue
3. Abort flow

[1/2/3]
```

**For Long Operations:**

Stream progress to memory every 3 batches:

```
Memory: flow_{id}_progress_{timestamp}
```

---

## PHASE 5: REPORT (Delegated + Inline)

**Purpose:** Generate output artifact, suggest next steps.

### Step 1: Delegate artifact generation

```
Task(flow-alchemist, prompt="""
MODE: report
TYPE: {classified_type}
GOAL: {user's prompt}
EXECUTION RESULTS:
{summary of all batch results — what was done, what was found}

Generate a comprehensive report artifact with:
- Executive summary (2-3 sentences)
- Key findings organized by theme
- Issues found (if any) with severity
- Metrics table
- Recommendations for next steps
""", subagent_type="flow-alchemist")
```

### Step 2: Orchestrator presents (inline)

```markdown
## REPORT

**Flow Complete!**

**Output:** {artifact_name}.md

{alchemist's report}

---

**Archive to memory?**

1. No (default)
2. Yes — Save as flow*{type}*{date}

[1/2]
```

### Step 3: EVO Suggestion (orchestrator, inline)

If the flow produced substantial discovery:

````markdown
---

**This discovery is substantial enough for an EVO.**

To create EVO from this discovery:

```bash
/evo start {artifact_name}.md "{suggested feature name}"
```
````

This will:

- Skip EVO Discovery (Steps 1-10) — already done
- Start at Planning (Step 11)
- Use {artifact_name}.md as context

````

---

## State File: `.flow-state.yaml`

Location: `docs/flow/.flow-state.yaml`

```yaml
version: "2.0"

current:
  id: "FLOW001"
  prompt: "run smoke tests on localhost:3000"
  type: "smoke-test"
  complexity: "MEDIUM"
  phase: "EXECUTE"
  started_at: "2026-01-25T10:00:00Z"
  updated_at: "2026-01-25T10:15:00Z"

config:
  output: "smoke.md"
  artifact_input: null

delegation:
  conductor_task_id: "task_abc123"
  alchemist_tasks: ["task_def456", "task_ghi789"]

progress:
  total_steps: 12
  completed_steps: 5
  current_batch: 2
  total_batches: 4
  errors: []

findings:
  - "12 pages discovered"
  - "4 critical flows identified"

checkpoints:
  - phase: "DISCOVER"
    passed_at: "2026-01-25T10:05:00Z"
    user_approved: true
  - phase: "PLAN"
    user_approved: true
    passed_at: "2026-01-25T10:08:00Z"

resumable: true
resume_from: "batch_2"
````

---

## Integration Points

### Schema Awareness

Scouts check `docs/schema.yaml` during DISCOVER:

- Existing types for consistency
- Existing services and their boundaries
- Schema gaps for reporting

### Memory Protocol

**Reading (via scouts):**

- Check for related previous flows
- Look for relevant reference memories

**Writing (optional, user choice in REPORT):**

```
flow_{type}_{date}
Example: flow_smoke_2026_01_25
```

### EVO Handoff

When flow discovery is substantial:

```
/evo start {artifact}.md "{feature}"
```

Skips EVO Discovery (Steps 1-10), starts at Planning (Step 11).

---

## Quick Reference

### Phases + Delegation

| Phase       | Who Does It        | Model          | Token Cost  |
| ----------- | ------------------ | -------------- | ----------- |
| 1. ANALYZE  | Orchestrator       | Sonnet         | ~500        |
| 2. DISCOVER | Conductor + Scouts | Sonnet + Haiku | ~3K         |
| 3. PLAN     | Alchemist          | Sonnet         | ~2K         |
| 4. EXECUTE  | Alchemists (batch) | Sonnet         | ~5-10K      |
| 5. REPORT   | Alchemist + Orch.  | Sonnet         | ~2K         |
| **Total**   |                    |                | **~12-18K** |

### Checkpoints

- After DISCOVER → User approves scope
- After PLAN → User approves execution plan
- During EXECUTE → On errors or batch boundaries
- After REPORT → Archive choice, EVO suggestion

### Commands

```bash
/flow "<prompt>"                # Start new flow
/flow <artifact.md> "<prompt>"  # Gap analysis mode
/flow status                    # Check current state
/flow resume                    # Resume interrupted flow
```

---

## When to Use Flow vs EVO

| Use `/flow`             | Use `/evo`                 |
| ----------------------- | -------------------------- |
| Smoke tests, audits     | New features               |
| Research, analysis      | Code changes with tests    |
| Pre-EVO discovery       | Anything needing E2E tests |
| Ops tasks, deployments  | Permanent product changes  |
| Refactoring analysis    | Refactoring implementation |
| One-time investigations | Repeatable functionality   |

**Rule of thumb:** If it needs E2E tests → EVO. Otherwise → Flow.

---

**Load this skill:** `load skill flow-orchestrator`
