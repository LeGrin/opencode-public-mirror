---
name: five-whys
description: "Root cause primitive — five iterations of 'why?' to surface the underlying driver, not the surface symptom. Used by architect before CRITICAL decisions, by investigate on recurring bugs."
---

# Five Whys

> Toyota's root cause technique. Ask "why?" five times in a row. By iteration 5 you're usually at the real cause, not the surface symptom. Counter-intuitively, it rarely takes exactly five — sometimes 3, sometimes 7.

## When To Use

- Before `architect` makes a CRITICAL decision — surface the real constraint, not the stated preference.
- `investigate` on a recurring bug — don't fix the symptom, fix the driver.
- `housekeeper` flagging accumulated drift — why is the drift accumulating?
- `sage` on an ambiguous user request — get to the underlying need.
- After any production incident — before the postmortem hardens into theatre.

## The Procedure

1. **State the symptom** exactly. One sentence. No interpretation.
2. **Ask "Why?"** Answer in one sentence. Do not branch.
3. **Repeat** with the new answer as the next symptom.
4. **Stop conditions** (any one):
   - You've reached a systemic cause (policy, incentive, tooling gap).
   - The answer is "that's by design / policy".
   - Further "why?" feels circular (you're looping on a tautology).
5. **Publish** the chain. Each "why" is a line.

## Output Format

```yaml
symptom: "<starting sentence>"
chain:
  - why_1: "<symptom>"
    because: "<answer>"
  - why_2: "<answer from 1>"
    because: "<answer>"
  ...
  - why_N:  "<answer from N-1>"
    because: "<answer>"
root_cause: "<final answer>"
intervention: "<what to do about the root, not the surface>"
stop_reason: systemic | by-design | tautology
```

## Examples

**Surface fix only (3 whys):**
```
Symptom: Tests are flaky on CI.
  Why? Because the DB race condition sometimes wins.
  Why? Because seed data isn't isolated per test.
  Why? Because we share a single test DB.
Root: Shared test DB design.
Intervention: Per-test DB transactions with rollback.
```

**Deeper (6 whys):**
```
Symptom: We've rewritten the auth middleware 3 times.
  Why? Each rewrite discovered a gap the last missed.
  Why? Because the requirements weren't captured before coding.
  Why? Because auth touches 8 teams with different constraints.
  Why? Because we never surfaced that stakeholder map.
  Why? Because "security" was treated as one owner, not eight.
  Why? Because the org chart treats security as a single function.
Root: Org-level misalignment with implementation reality.
Intervention: Stakeholder map + RACI BEFORE any auth work.
```

## Rules

- **One why → one answer.** If you're branching, pick the most load-bearing branch; note the others for later.
- **Avoid "because it's the best practice".** That's deflection. Why is it?
- **Avoid "because the person didn't X".** That's blame. Why did the system allow that?
- **Answers should be observable.** "Because we didn't think" is not observable; "because we skipped the design review" is.
- **Stop at systemic level.** Going further ("why does the org chart look like that?") may be valid but usually out of scope.

## Anti-Patterns

- Forcing exactly 5 whys even when you hit root at 3 (checkbox thinking)
- Asking "who?" instead of "why?" (blame, not analysis)
- Accepting the first surface fix as the root (stopping too early)
- Chain with tautologies ("Why? Because the system is slow. Why? Because it's not fast.")
- Publishing without "intervention" (analysis without action)

## Integration

- `architect` → always run five-whys before CRITICAL recommendation.
- `investigate` → when user says "we've fixed this before" — the fix was the symptom; find the root.
- `learner` → captured root causes produce the best cross-session learnings.
- `decision-journal` → ADR "Context" section should reflect the root, not the symptom.
