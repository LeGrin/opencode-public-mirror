---
name: edd-complete
description: "EDD Complete Phase (Steps 21-22) - AI team review, documentation, final approval + EVO templates"
---

# EDD Complete Phase (Steps 21-22)

> Phase skill for `phase-complete` agent. For overview: `load skill edd-overview`.

## Delegation Pattern

### FULL Tier (Steps 21-22)

- Step 21: **3 review agents in parallel** — @verify (quality) + @security + @architect
- Step 22: **Alchemist (Sonnet) MODE: report** — generate docs, update roadmap
- Final: Phase orchestrator inline (user approval gate)

### FEATURE Tier (Step 12 — compressed)

All FULL complete compressed into one step:

- **Automated review only** — no parallel agent team (rely on quality delta gate from Step 11)
- **Single pass**: code review + docs update + baseline commit + ROADMAP update
- **User gate**: one final approval

## Step Overview

| Step   | Name                  | Description                                                | Output          |
| ------ | --------------------- | ---------------------------------------------------------- | --------------- |
| **21** | Solution Verification | AI team review for SOLID/DRY/YAGNI, file sizes < 500 lines | Review approval |
| **22** | Documentation Update  | Update roadmaps, mark EVO complete, record lessons learned | Updated docs    |

## GATE: Final Approval

```
Before marking complete:
- All tests GREEN (E2E, Integration, Unit)
- AI team review APPROVED (FULL) or automated review (FEATURE)
- Quality delta gate PASSED (baseline ratcheted)
- Schema updated (if applicable)
- .quality/baseline.json committed (if updated)
- ROADMAP.md updated
- User explicitly approves completion
```

---

## Complete Checklist

- [ ] Step 21: AI team review approved (FULL) / automated review (FEATURE)
- [ ] Step 22: Docs updated, EVO marked complete
- [ ] Step 22: `.quality/baseline.json` committed (if ratcheted)
- [ ] **GATE:** User approval

---

## EVO Templates

### Feature EVO (EVO001_FEATURE.md)

```markdown
# EVO001: Feature Name

## Goal

One sentence describing what this achieves.

## User Flows

| Flow     | Sub-EVO  | Status  | E2E Test               |
| -------- | -------- | ------- | ---------------------- |
| Login    | EVO001.1 | pending | test_user_can_login    |
| Register | EVO001.2 | pending | test_user_can_register |

## Schema Impact

- New: ServiceName (methods)
- Update: ExistingService (new methods)

## Notes

Key decisions, learnings, follow-ups.
```

### Flow EVO (EVO001.1_FLOW.md)

```markdown
# EVO001.1: Flow Name

**Parent:** EVO001_FEATURE
**Status:** pending | in_progress | completed
**Phase:** DISCOVERY | PLANNING | RED | GREEN | COMPLETE
**Step:** 1-22

## E2E Test Definition

**Test Name:** test_user_can_login
**Scenario:** [Gherkin or plain description]

## Discovery Phase

### 1. Feature Flow

[User journey description]

### 2. Domain Expert Review

[Domain type, real artifacts analyzed, fields identified, gray areas resolved]

### 3. E2E Test Data Audit

[Real test files, sources, expected values - NO generated data]

### 4. Test Cases

- [ ] Happy path: ...
- [ ] Error case: ...
- [ ] Edge case: ...

### 5. Interfaces & Schemas

[Schema definitions]

### 6-10. [Continue through steps...]

## Planning Phase

[After Discovery gate]

## Red Phase

[After Red gate]

## Green Phase

[After Red gate]

## Verification

- [ ] AI team approved
- [ ] User approved
- [ ] All tests GREEN
- [ ] Schema updated
- [ ] Docs updated
```

### State File (.evo-state.yaml)

```yaml
version: "1.0"

current:
  evo_id: EVO001.1
  title: Login Flow
  phase: RED
  step: 14
  status: in_progress

discovery:
  feature_flow: completed
  domain_expert: completed
  e2e_data_audit: completed
  boost_discovery: skipped
  test_cases: completed
  interfaces: completed
  communication: completed
  errors: completed
  services: completed
  audit: completed
  gaps: completed
  gate_passed: true

planning:
  detailed_plan: completed
  test_strategy: completed
  ai_verification: passed
  user_confirmation: true
  gate_passed: true

tests:
  e2e:
    - name: test_user_can_login
      status: failing
      file: tests/e2e/test_auth.py:15
  integration: []
  unit: []

verification:
  ai_team_review: pending
  unexpected_green_check: null
  design_stage_verification: pending
  user_approved: false

checkpoints:
  - phase: DISCOVERY
    step: 8
    timestamp: 2026-01-22T15:45:00Z
    ai_consensus: passed
```

---

## Memory Protocol for Agents

When working on an EVO, agents must:

### 1. Read Current State

Read `.evo-state.yaml` to understand current EVO, step, phase, and what's completed.

### 2. Write to Serena Memory

Use naming convention: `findings_{evo_id}_{phase}_{agent}`

### 3. Return Minimal Summary

Write to memory, return: MEMORY name, 3-5 bullet summary, next action recommendation.

### 4. Update State (Orchestrator Only)

Only @orchestrate updates `.evo-state.yaml`. Agents report findings, orchestrator consolidates.

---

## Integration with TDD Protocol

EDD contains and extends TDD:

| TDD Step | EDD Steps | Notes                                            |
| -------- | --------- | ------------------------------------------------ |
| Red      | 14-16     | Write failing tests (expanded to 3 layers)       |
| Green    | 17-20.7   | Make tests pass, design verify, quality gate     |
| Refactor | 21        | Part of AI review                                |

EDD adds:

- Discovery phase (understanding before testing)
- Domain expertise (Steps 2-3: know your domain FIRST)
- Planning phase (strategy before coding)
- Complete phase (verification before shipping)
- Schema awareness throughout

## Related Skills

| Skill             | When to Load            | Relationship             |
| ----------------- | ----------------------- | ------------------------ |
| `tdd-protocol`    | Steps 12-18 (Red/Green) | TDD cycle within EDD     |
| `debugging`       | Step 17 or any failure  | 4-phase error resolution |
| `service-pattern` | Steps 6, 9, 15          | Service architecture     |

### Cross-Skill Integration Notes

- **tdd-protocol → edd-overview**: Test ORDER is E2E → Integration → Unit (not pyramid)
- **debugging → edd-overview**: "Unexpected GREEN" triggers Phase 3 ANALYZE
- **service-pattern → edd-overview**: Services defined in schema FIRST (Step 5)
- **domain-expert → edd-overview**: Step 2 domain analysis before test cases
