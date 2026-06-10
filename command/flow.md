---
description: Universal intelligent orchestrator for non-EVO work. Analyzes prompts, discovers context, plans with approval, executes with tracking.
agent: sage
---

# /flow - Universal Work Orchestrator

> "The sage does not fight the river. The sage learns where the river flows."

## Usage

```bash
# Natural language prompt
/flow "<what you want to do>"

# With research phase (Step 3.5 Boost Discovery)
/flow "<what you want to do>" --boost

# With existing artifact (triggers gap analysis instead of discovery)
/flow <artifact.md> "<what to do with it>"
```

## Examples

```bash
# UI Testing
/flow "run smoke tests on http://localhost:3000"
/flow smoke.md "re-run and check if issues are fixed"

# Audits
/flow "audit security in the auth module"
/flow "check dependencies for vulnerabilities"

# Research & Discovery
/flow "analyze the API structure for adding OAuth"
/flow "explore how the payment system works"

# Operations
/flow "check production health via doctl"
/flow "analyze recent error logs"

# Refactoring
/flow "find dead code in src/utils"
/flow "identify duplicate code patterns"
```

## The 5-Phase Workflow (Delegated Pipeline)

### Phase 1: ANALYZE (Spark, inline)

- Parse your prompt, classify work type
- Determine complexity: SIMPLE → answer directly, MEDIUM/COMPLEX → delegate
- Plan scout dispatch questions
- Check for existing artifacts

### Phase 2: DISCOVER (Conductor → Scouts)

**Delegated to `flow-orchestrator` (Spark) which dispatches `flow-scout` (MiniMax) in parallel:**

- Scouts gather intelligence: codebase, web, memory (parallel)
- Conductor consolidates into research brief (~1.5K tokens)
- If artifact provided → gap analysis mode instead

**[CHECKPOINT]** Show findings, ask: "Ready to create plan?"

### Phase 3: PLAN (Alchemist)

**Delegated to `flow-alchemist` (MiniMax):**

- Transform research brief into execution plan
- Identify parallel step groups
- Optional validation pass for complex flows

**[CHECKPOINT]** User approves plan

### Phase 4: EXECUTE (Alchemist batches)

**Delegated to `flow-alchemist` (MiniMax) in parallel batches:**

- Independent steps run in parallel batches
- Dependent steps wait for previous batch
- Progress tracked in `.flow-state.yaml`
- Checkpoint on errors or batch boundaries

### Phase 5: REPORT (Alchemist + Orchestrator)

- Alchemist generates report artifact
- Orchestrator presents results, offers archival
- Suggests EVO creation if appropriate

## Work Type Classification

| Detected Type | Scout Focus              | Output Artifact        |
| ------------- | ------------------------ | ---------------------- |
| `smoke-test`  | Pages, flows, auth       | `smoke.md`             |
| `audit`       | Files, patterns, vulns   | `audit_{subject}.md`   |
| `research`    | External docs, practices | `research_{topic}.md`  |
| `refactor`    | Code structure, deps     | `refactor_{area}.md`   |
| `discovery`   | Architecture, services   | `discovery_{topic}.md` |
| `deploy`      | Infrastructure, configs  | `deploy_{env}.md`      |
| `ops`         | Current state, health    | `ops_{action}.md`      |
| `experiment`  | Patterns, constraints    | `experiment_{name}.md` |
| `cleanup`     | Dead code, unused files  | `cleanup_{area}.md`    |
| `migration`   | Deps, breaking changes   | `migration_{name}.md`  |

## State Tracking

Progress is tracked in `docs/flow/.flow-state.yaml`:

```yaml
current:
  id: "FLOW001"
  prompt: "run smoke tests on localhost:3000"
  type: "smoke-test"
  phase: "EXECUTE"
  started_at: "2026-01-25T10:00:00Z"

progress:
  total_steps: 12
  completed_steps: 5
  current_action: "Testing /settings page"

checkpoints:
  - phase: "DISCOVER"
    user_approved: true
  - phase: "PLAN"
    ai_verified: true
    user_approved: true
```

## Resuming Interrupted Flows

```bash
# Check current flow status
/flow status

# Resume where you left off
/flow resume
```

## Memory Integration

At the end of each flow, you choose:

```
Archive to memory?
1. No (default) - Just keep the artifact file
2. Yes - Archive as flow_{type}_{date}
```

## EVO Integration

When a flow produces substantial discovery:

```
This discovery could become an EVO.

To create EVO from this discovery:
  /evo start discovery_oauth.md "Add OAuth support"

This will skip EVO Discovery phase (Steps 1-10)
and start at Planning (Step 11).
```

## Related Commands

| Command                    | Purpose                          |
| -------------------------- | -------------------------------- |
| `/flow status`             | Check current flow state         |
| `/flow resume`             | Resume interrupted flow          |
| `/evo start`               | Full 22-step feature development |
| `/evo start <artifact.md>` | Create EVO from flow discovery   |

---

**Skill:** `load skill flow-orchestrator`

Arguments: $ARGUMENTS
