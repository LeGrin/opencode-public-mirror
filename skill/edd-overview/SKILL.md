---
name: edd-overview
description: "EDD Overview - Model routing, delegation hierarchy, 22-step summary. For sage/orchestrator strategic routing."
---

# EDD Protocol Overview

**Part of S.A.G.E. (Schema-Aware Guided Evolution) Framework**

> For full phase details, phase agents load their own skill: `edd-discovery`, `edd-planning`, `edd-red`, `edd-green`, `edd-complete`.

## Model Routing Principle

> Save Opus tokens. Delegate tool-heavy work to Haiku scouts. Keep Opus for strategy only.

| Model      | Role                    | EVO Usage                                              |
| ---------- | ----------------------- | ------------------------------------------------------ |
| **Opus**   | Strategy + Synthesis    | sage, main-orchestrator: route, synthesize, user gates |
| **Sonnet** | Tactical + File-level   | Phase orchestrators: plan, implement, review, validate |
| **Haiku**  | Tool calls + Atomic ops | Scouts: search, read, grep, web lookup, memory check   |

### Delegation Hierarchy

```
sage (Sonnet) → main-orchestrator (Sonnet, lean)
    │
    ├── phase-discovery (Sonnet) → scouts (Haiku) for Steps 4-10
    ├── phase-planning (Sonnet) → alchemist (Sonnet) for plan synthesis
    ├── phase-red (Sonnet) → scouts (Haiku) for data gate, alchemist for test writing
    ├── phase-green (Sonnet) → alchemist (Sonnet) for implementation
    └── phase-complete (Sonnet) → parallel review agents + alchemist for docs
```

### Parallelization Opportunities

| Phase     | Parallel Steps                                  | How                                 |
| --------- | ----------------------------------------------- | ----------------------------------- |
| DISCOVERY | Steps 5+6+7 (interfaces, comms, errors)         | 3 scouts in parallel                |
| DISCOVERY | Steps 8+9 (services + coverage)                 | 2 scouts in parallel                |
| PLANNING  | Step 13 (@architect + @verify)                  | 2 review agents in parallel         |
| RED       | Step 14.0 checks (infra + data + anti-patterns) | 3 scouts in parallel                |
| GREEN     | Independent unit tests                          | Batch alchemists for parallel files |
| COMPLETE  | Step 21 (@verify + @security + @architect)      | 3 review agents in parallel         |

## Tier System

| Tier | Steps | When to Use | Auto-Detect Signals |
|------|-------|-------------|---------------------|
| **FULL** | 22 | New systems, security, multi-service | auth/payment, >3 files, new API, DB schema |
| **FEATURE** | 12 | Typical features, single-service | 2-5 files, existing patterns, clear scope |
| **STANDARD** | 7 | Small changes, refactors, bug fixes | 1-2 files, <50 lines, well-understood |
| **HOTFIX** | — | Production emergency | Redirects to /hotfix |

### FEATURE Tier (12-Step Flow)

Bridges the gap between FULL (22 steps) and STANDARD (7 steps). Compresses discovery + planning while keeping full TDD cycle.

| Step | Name | Maps to FULL | Phase |
|------|------|-------------|-------|
| 1 | Flow + Domain | Steps 1-3 | DISCOVERY |
| 2 | Golden Reference | Step 3.5A | DISCOVERY |
| 3 | Test Cases + Gaps | Steps 4-10 | DISCOVERY |
| 4 | Flow Decomposition Gate | Step 10.5 | DISCOVERY |
| 5 | Plan + Impact | Steps 11-13.75 | PLANNING |
| 6 | E2E + Integration Tests | Steps 14-15 | RED |
| 7 | Unit Tests | Step 16 | RED |
| 8 | Implement | Steps 17-18 | GREEN |
| 9 | Safety + E2E Verify | Steps 19-20 | GREEN |
| 10 | Design Stage Verify | Step 20.5 | GREEN |
| 11 | Quality Delta Gate | NEW | GREEN |
| 12 | Review + Commit | Steps 21-22 | COMPLETE |

**Key differences from FULL:**
- Steps 1-3 (FULL) compressed into Step 1: no formal DOMAIN.md/E2E_DATA.md, inline analysis
- Steps 4-10 (FULL) compressed into Step 3: single scout batch, no separate error catalog
- Steps 11-13.75 (FULL) compressed into Step 5: plan + impact in one pass
- Steps 21-22 (FULL) compressed into Step 12: automated review, no separate docs phase
- Step 11 (Quality Delta Gate): lightweight proof-based quality check (NEW)

**What FEATURE keeps from FULL:**
- Golden reference search (Step 2)
- Flow decomposition gate with user approval (Step 4)
- Full TDD cycle: RED → GREEN with safety checks
- Design stage verification (Step 10)

## Core Principle

> "Discovery before Planning. Planning before Building. Tests before Implementation."
> "Developer sees CONCRETE flows before any code is written."

Each evolution is a complete vertical slice. Each sub-EVO should be **granular** (~50-100 lines max) and map to exactly **one E2E test**.

## CRITICAL: User Input Gates

**AI MUST wait for user input at gates. NEVER answer your own questions.**

- Use `mcp_confirm` (yes/no gates), `mcp_pick_one` (choices), `mcp_ask_text` (free input) tools (forces wait)
- After asking → STOP, do not continue
- NEVER provide example answers
- NEVER assume silence = approval

## The 22-Step Workflow

| Phase         | Steps    | Focus                                                  |
| ------------- | -------- | ------------------------------------------------------ |
| **DISCOVERY** | 1-10.5   | What are we building? Domain analysis, data validation |
| **PLANNING**  | 11-13.75 | How exactly will we build it?                          |
| **RED**       | 14-16    | Write failing tests (E2E → Integration → Unit)         |
| **GREEN**     | 17-20.7  | Make tests pass, verify design, quality gate           |
| **COMPLETE**  | 21-22    | Verify and document                                    |

## Checkpoint Gates Summary

| Transition            | Gate Type  | Requirement                                   |
| --------------------- | ---------- | --------------------------------------------- |
| Discovery → Step 10.5 | AI Team    | All agents APPROVE gap analysis + domain/data |
| Step 10.5 → Planning  | **User**   | User approves flow decomposition + scope      |
| Planning → Step 13.75 | AI Team    | Technical plan verified                       |
| Step 13.5 → 13.75     | User       | User approves technical impact                |
| Step 13.75 → Red      | **User**   | User approves UX flow + smoke.md preview      |
| **Step 14.0**         | Automatic  | Real test data verified, no mocks/generated   |
| Red → Green           | Automatic  | All tests written and RED                     |
| Step 19               | Safety     | No unexpected GREEN (or investigated)         |
| **Step 20.5**         | **Verify** | **All design stages implemented in code**     |
| **Step 20.7**         | Quality    | No regressions vs `.quality/baseline.json`    |
| Green → Complete      | AI Team    | Review APPROVED                               |
| Complete → Done       | User       | User approves completion                      |

## Per-Phase Skills

| Phase     | Skill           | Steps    | Loaded By          |
| --------- | --------------- | -------- | ------------------ |
| Overview  | `edd-overview`  | Summary  | sage, commands     |
| Discovery | `edd-discovery` | 1-10.5   | phase-discovery    |
| Planning  | `edd-planning`  | 11-13.75 | phase-planning     |
| Red       | `edd-red`       | 14-16    | phase-red          |
| Green     | `edd-green`     | 17-20.7  | phase-green        |
| Complete  | `edd-complete`  | 21-22    | phase-complete     |
