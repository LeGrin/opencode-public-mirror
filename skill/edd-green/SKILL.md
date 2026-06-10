---
name: edd-green
description: "EDD Green Phase (Steps 17-20.7) - Implementation, safety checks, design stage verification, quality delta gate"
---

# EDD Green Phase (Steps 17-20.7)

> Phase skill for `phase-green` agent. For overview: `load skill edd-overview`.

## Delegation Pattern

- Steps 17-18: **Alchemist (Sonnet) MODE: implement** — write implementation code
  - Batch independent files in parallel (e.g., separate services)
  - Sequential for dependent code (service A depends on service B)
- Step 19: Phase orchestrator inline (safety investigation if triggered)
- Step 20: **Haiku scouts** — run E2E test suites, verify all GREEN
- Step 20.5: Phase orchestrator inline (design stage verification)
- Step 20.7: **Haiku scout** — collect metrics, diff vs baseline, report delta

## Step Overview

| Step     | Name                          | Description                                        | Output                       |
| -------- | ----------------------------- | -------------------------------------------------- | ---------------------------- |
| **17**   | Implement                     | Write minimal code to make Unit tests GREEN        | Implementation code          |
| **18**   | Verify Integration            | Run integration tests, should go GREEN             | Integration tests passing    |
| **19**   | Safety Check                  | **IF TESTS GO GREEN EARLY → STOP AND VERIFY**      | Investigation (if triggered) |
| **20**   | Complete E2E                  | All E2E tests should now be GREEN                  | All tests passing            |
| **20.5** | **Design Stage Verification** | Verify ALL design stages were actually implemented | Stage verification checklist |
| **20.7** | **Quality Delta Gate**        | Proof-based check: no regressions vs baseline      | Delta report + ratchet       |

---

## Safety Check (Step 19)

**"Unexpected GREEN = Problem"**

If an integration or E2E test passes BEFORE its dependent unit tests are implemented:

1. **STOP** execution immediately
2. **WARN** user with specific details
3. **INVESTIGATE** possible causes:
   - Test is too weak (always passes)
   - Wrong assertion (testing wrong thing)
   - Implementation already exists (accidental coverage)
   - Over-mocking (not testing real behavior)
4. **REQUIRE** explicit user approval to continue
5. **DOCUMENT** finding in EVO notes

```markdown
## Unexpected GREEN Investigation

**Test:** test_user_can_login
**Expected:** FAILING (no auth service yet)
**Actual:** PASSING

**Investigation:**

- [ ] Test assertions correct?
- [ ] Mocks returning expected values?
- [ ] Implementation already exists?
- [ ] Test actually running?

**Finding:** [Document here]
**Decision:** [Continue / Rewrite test / Other]
```

---

## Step 20.5: Design Stage Verification Gate (EVO029.1)

**Purpose:** Verify ALL design stages from the EVO spec were actually implemented before marking complete. Prevents the "designed but never built" anti-pattern.

**Origin:** EVO003 retrospective — Stage 5 (Spotify API call) was designed but never implemented. 126 tests passed. Bug shipped to production for 5+ days.

**Protocol:**

1. **List all stages** from the EVO design document
2. **For each stage:** identify the code that implements it
3. **For each API call** in design: verify it exists in code
4. **For each output** in design: verify it's returned/stored

**MANDATORY OUTPUT FORMAT:**

```markdown
## Step 20.5: Design Stage Verification

### EVO{N}.{M}: {Flow Name}

| Design Stage | Code Location | API Calls | Test Coverage | Verified |
| ------------ | ------------- | --------- | ------------- | -------- |
| Stage 1: X   | file.py:L100  | GET /api  | test_x        | PASS     |
| Stage 2: Y   | file.py:L150  | POST /api | test_y        | PASS     |
| Stage 5: Z   | ???           | POST /api | ???           | MISSING  |

### Verification Summary

- Total stages: N
- Implemented: N
- Missing: 0
- Coverage: 100%
```

**Gate Decision:**

| Check           | Status   | Action                                               |
| --------------- | -------- | ---------------------------------------------------- |
| All stages pass | PASS     | Proceed to COMPLETE (Step 21)                        |
| Any stage fail  | **FAIL** | **STOP** — implement missing stage before continuing |

**If Gate FAILS:**

1. **DO NOT** proceed to COMPLETE phase
2. **DO NOT** mark the EVO as done
3. **DO** implement the missing stage(s)
4. **DO** write tests for the missing stage(s)
5. **DO** re-run ALL tests to verify no regressions
6. **DOCUMENT** what was missed and why in EVO notes

**STOP POINT:** All design stages must be verified before proceeding to COMPLETE.

---

## Step 20.7: Quality Delta Gate (Proof-Based)

**Purpose:** Catch quality regressions before COMPLETE phase using delta comparison against a committed baseline.

**Applies to:** FULL tier (Step 20.7) and FEATURE tier (Step 11).

**Concept:** Don't enforce absolute thresholds — detect *regression* from the project's own baseline. The baseline auto-tightens as code improves (ratchet effect).

### Baseline File: `.quality/baseline.json`

```json
{
  "version": 1,
  "updated_at": "2026-04-13",
  "evo_id": "EVO005.2",
  "metrics": {
    "test_count": 47,
    "test_pass_rate": 1.0,
    "coverage_percent": 82,
    "lint_warnings": 3,
    "lint_errors": 0,
    "type_errors": 0,
    "max_function_lines": 18,
    "max_file_lines": 290
  }
}
```

### Gate Protocol

```bash
# 1. Collect current metrics
CURRENT=$(run_quality_metrics)   # test count, coverage, lint, types

# 2. Load baseline (if exists)
BASELINE=$(cat .quality/baseline.json 2>/dev/null)

# 3. Compute delta
DELTA=$(diff_metrics "$CURRENT" "$BASELINE")
```

### Delta Decision

| Delta | Action |
|-------|--------|
| `new_lint_errors > 0` | **BLOCK** — fix before proceeding |
| `new_type_errors > 0` | **BLOCK** — fix before proceeding |
| `coverage_drop > 5%` | **WARN** — show to user, ask to accept or fix |
| `test_count_drop > 0` | **WARN** — tests removed, confirm intentional |
| `max_function_lines > baseline + 5` | **WARN** — function grew too large |
| All neutral or improved | **PASS** — auto-ratchet baseline |

### Auto-Ratchet

If all metrics are equal or better:
```bash
# Update baseline (committed to repo)
cp .quality/last-run.json .quality/baseline.json
# Baseline only moves forward, never backward without explicit user override
```

### Output Format

```markdown
## Quality Delta Gate

| Metric | Baseline | Current | Delta | Status |
|--------|----------|---------|-------|--------|
| Tests | 47 | 49 | +2 | PASS |
| Coverage | 82% | 84% | +2% | PASS |
| Lint warnings | 3 | 2 | -1 | PASS |
| Lint errors | 0 | 0 | 0 | PASS |
| Type errors | 0 | 0 | 0 | PASS |

**Result:** PASS — baseline ratcheted to current.
```

### No Baseline Yet?

First EVO in a project won't have `.quality/baseline.json`:
1. Run metrics collection
2. Show results as "initial baseline"
3. Commit as first baseline — no delta check, just establishment

### Optional: SonarQube Integration

If project has SonarQube enabled (see `docs/evo/EVO062_SONARQUBE_LOCAL_GATE.md`):

```bash
# Run incremental scan (~10-30s after first cold scan)
scripts/sonar-gate.sh

# Gate uses .sonar/baseline.json (same ratchet pattern)
# SonarQube catches: maintainability index, cyclomatic complexity, code smells
# Complements lint/type checks — does NOT replace them
```

SonarQube metrics merge into the quality delta report alongside lint/type/coverage.

---

## Green Checklist

- [ ] Step 17: Unit tests GREEN
- [ ] Step 18: Integration tests GREEN
- [ ] Step 19: Safety check passed (no unexpected GREEN)
- [ ] Step 20: E2E tests GREEN
- [ ] **Step 20.5:** All design stages verified in code (stage → file:line mapping)
- [ ] **Step 20.5:** All API calls from design exist in implementation
- [ ] **Step 20.5:** All outputs from design are returned/stored
- [ ] **Step 20.7:** Quality delta gate — no regressions vs baseline
- [ ] **Step 20.7:** Baseline auto-ratcheted (if improved)
- [ ] **GATE:** Design Stage Verification passed (0 missing stages)
- [ ] **GATE:** Quality Delta Gate passed
- [ ] **GATE:** All tests GREEN
