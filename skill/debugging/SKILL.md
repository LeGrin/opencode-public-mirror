---
name: debugging
description: 4-phase debugging methodology - evidence-based error resolution
sections: [OVERVIEW, CAPTURE, REPRODUCE, ANALYZE, FIX, SAGE]
---

# Debugging Skill

<!-- SECTION:OVERVIEW -->
Systematic 4-phase approach to debugging. Based on Superpowers methodology.

**Core Principle:** NO GUESSING. Evidence first, hypothesis second.

## The 4 Phases
<!-- /SECTION:OVERVIEW -->

<!-- SECTION:CAPTURE -->
### Phase 1: CAPTURE (Gather Evidence)

**Goal:** Collect ALL relevant information before thinking about causes.

**Checklist:**
```
□ Full error message (complete, not truncated)
□ Complete stack trace
□ File and line number
□ Input that caused the error
□ Expected vs actual behavior
□ Recent code changes (git log -5 --oneline)
□ Environment (versions, OS, dependencies)
```

**Commands:**
```bash
# Get recent changes to error area
git log -5 --oneline -- path/to/file.ts

# See what changed
git diff HEAD~3 -- path/to/file.ts

# Check environment
node --version && npm --version
```

**Output Template:**
```
CAPTURED EVIDENCE:
- Error: [exact message]
- Location: [file:line]
- Stack: [relevant frames]
- Input: [what triggered it]
- Recent changes: [commits]
- Environment: [versions]
```
<!-- /SECTION:CAPTURE -->

<!-- SECTION:REPRODUCE -->
### Phase 2: REPRODUCE (Confirm Consistency)

**Goal:** Understand when and how the error occurs.

**Questions to answer:**
1. Does it fail every time? (deterministic)
2. Does it fail in isolation? (single test)
3. When did it start failing? (git bisect)
4. What conditions trigger it? (specific input)

**Commands:**
```bash
# Run failing test in isolation
npm test -- --testPathPattern="specific-test" --runInBand

# Run multiple times to check consistency
for i in {1..5}; do npm test -- --testPathPattern="test" && echo "PASS $i" || echo "FAIL $i"; done

# Find when it broke (if unclear)
git bisect start
git bisect bad HEAD
git bisect good HEAD~10
# Then run test at each bisect point
```

**Output Template:**
```
REPRODUCTION RESULTS:
- Frequency: [always/sometimes/rarely] (X/5 runs)
- Isolation: [passes/fails when run alone]
- First failure: [commit or "unknown"]
- Trigger conditions: [specific inputs/state]
```
<!-- /SECTION:REPRODUCE -->

<!-- SECTION:ANALYZE -->
### Phase 3: ANALYZE (Form Hypothesis)

**Goal:** Form evidence-based hypothesis about root cause.

**Process:**
1. Look at the evidence (not assumptions)
2. Find similar WORKING code in codebase
3. Compare working vs broken patterns
4. Form specific hypothesis

**Pattern Matching:**
```bash
# Find similar working code
grep -r "similar_function" src/

# Compare implementations
diff src/working/file.ts src/broken/file.ts
```

**Common Patterns:**
| Symptom | Likely Cause | Evidence to Check |
|---------|--------------|-------------------|
| TypeError: undefined | Missing null check | Is value sometimes null? |
| Timeout exceeded | Async race condition | Missing await? Event timing? |
| Test flaky | Non-deterministic | External state? Timing? |
| Wrong result | Logic error | Edge case not handled? |

**Hypothesis Template:**
```
HYPOTHESIS:
Based on [specific evidence], the cause is [specific cause]
because [reasoning]. This explains [observed symptoms].
Confidence: [high/medium/low]
```
<!-- /SECTION:ANALYZE -->

<!-- SECTION:FIX -->
### Phase 4: FIX (Minimal Change)

**Goal:** Apply smallest fix that addresses root cause.

**Rules:**
1. Fix root cause, not symptoms
2. Make minimal change (smallest diff)
3. Write regression test if missing
4. Verify all tests pass
5. Document for future prevention

**Process:**
```bash
# 1. Write failing test that captures the bug
# (Skip if test already exists)

# 2. Apply minimal fix

# 3. Verify fix
npm test -- --testPathPattern="fixed-test"

# 4. Run full suite
npm test

# 5. Check no regressions
git diff  # Review changes are minimal
```

**Fix Template:**
```
FIX APPLIED:
- Root cause: [what was wrong]
- Change: [what changed]
- Why it works: [explanation]
- Test: [new/existing test that verifies]
- Verification: [all tests pass]
```

## Anti-Patterns (BLOCKED)

| Anti-Pattern | Why Bad | What to Do Instead |
|--------------|---------|-------------------|
| "Let me try this..." | Guessing wastes time | Complete Phase 1-3 first |
| "It's probably..." | No evidence | State specific evidence |
| "Quick fix..." | May miss root cause | Follow all 4 phases |
| "Works on my machine" | Environment issue | Capture environment in Phase 1 |
| Fixing symptoms | Bug will return | Find root cause in Phase 3 |

## Escalation Criteria

Escalate to senior/agent review when:
- [ ] Phase 3 hypothesis unclear after 15 minutes
- [ ] Multiple interdependent failures
- [ ] Root cause is architectural
- [ ] Fix would require large changes
- [ ] Security implications

## Integration with @fixer Agent

The @fixer agent implements this skill automatically.
Use `/fix` command to trigger structured debugging.

```bash
/fix "error message"  # Uses 4-phase methodology
/fix --deep          # Escalates to @debugger + agent review
```
<!-- /SECTION:FIX -->

---

<!-- SECTION:SAGE -->
## SAGE Integration Points

### Triggers from S.A.G.E. Workflow
- **Step 17 Safety Check**: When "Unexpected GREEN" occurs, use Phase 3 ANALYZE
- **Any Step Failure**: Gate rejection triggers Phase 1 CAPTURE
- **Test Failures**: Enter debugging flow from RED or GREEN phase

### Evidence Sources in S.A.G.E.
- Error catalog from S.A.G.E. Step 5 informs Phase 3 analysis
- Service interfaces from `docs/schema.yaml` for context
- LoggedService output from `service-pattern` for debugging evidence

### "Unexpected GREEN" Protocol
When tests pass unexpectedly:
1. **Phase 1 CAPTURE**: Record test output, timestamps, state
2. **Phase 2 REPRODUCE**: Run test in isolation
3. **Phase 3 ANALYZE**: Check for stale state, test isolation issues
4. **Phase 4 FIX**: Fix test or confirm implementation is correct

### Related Skills

| Skill | When to Load | Relationship |
|-------|--------------|--------------|
| `edd-overview` | Full feature development | Parent workflow |
| `tdd-protocol` | Test writing | TDD cycle |
| `service-pattern` | Service debugging | LoggedService provides evidence |

Cross-reference: `load skill edd-overview` for error handling context
<!-- /SECTION:SAGE -->