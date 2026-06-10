---
name: mece-decompose
description: "MECE decomposition primitive — break a task into Mutually Exclusive, Collectively Exhaustive subtasks. Used by sage/orchestrator before parallel dispatch."
---

# MECE Decomposition

> **Mutually Exclusive, Collectively Exhaustive.** McKinsey's decomposition rule: every real sub-piece of the problem ends up in exactly one bucket (no overlap, no gap).

## When To Use

Before you dispatch parallel agents, split work into sub-tasks, or draft a plan with >3 components. If your decomposition fails MECE, agents will either duplicate work (overlap) or miss coverage (gap).

Typical triggers:
- Sage about to split a feature across scouts
- Orchestrator in `mode: parallel` — N independent branches
- Architect laying out option tradeoffs
- Decomposer structuring a voice transcript

## The Procedure

1. **State the parent task** in one sentence. No qualifiers.
2. **Draft buckets** (3-7). Each bucket is a verb phrase.
3. **Run MECE tests**:
   - **Exhaustive check:** for every real side of the work, point at its bucket. If you can't, add a bucket.
   - **Exclusive check:** pick any bucket pair. Can work fall in both? If yes, redraw the line.
4. **Ladder rule:** all buckets are at the same level of abstraction. "Backend + Database + Frontend + Footer Copy" is wrong (Footer Copy is below the level). Either promote all or group ("Frontend: general UI + Footer Copy").
5. **Name the remainder bucket** if you have one ("Other / misc"). If the remainder bucket contains >20% of the expected work, your decomposition is bad — redo.

## Output Format

```yaml
parent: <one-sentence task>
decomposition_method: MECE
buckets:
  - id: B1
    label: <verb phrase>
    contains: [<list of concrete items>]
    owner_agent: <if applicable>
  - id: B2
    ...
exhaustive_check:
  - real_aspect: "<concrete case>"
    bucket: B1
exclusive_check:
  - pair: [B1, B2]
    overlap_risk: none | "<note>"
remainder_bucket: B_misc | null
```

## Examples

**Bad (not MECE):**
```
Task: Ship the /ship command
Buckets:
- Write code
- Fix bugs
- Deploy
```
- "Fix bugs" overlaps with "Write code".
- Missing: Tests, docs, rollback plan.

**Good (MECE):**
```
Task: Ship the /ship command
Buckets:
- Implementation (code + tests)
- Pre-ship quality gates (codex-review + sonar)
- Rollout (deploy + verify live)
- Documentation (release notes + runbook update)
```

## Integration

- `sage` Step 1 (classify) → MECE-check before route decision.
- `orchestrator` PARALLEL mode → MECE-check buckets before parallel dispatch.
- `architect` option layout → MECE-check options before presenting to user.

## Anti-Patterns

- Buckets that are just N chunks of equal size ("first third, middle third, last third") — that's slicing, not decomposing.
- Buckets tied to agents, not work ("investigate does X, implement does Y") — dispatch is later.
- Overly abstract buckets that each expand into separate decompositions ("everything related to Y") — go one level deeper.

## Self-Check Prompt

After you draft the buckets, ask yourself:
> *Is there a real side of the work that doesn't fit any bucket? Is there a real piece that fits TWO?*

If yes to either → redo.
