---
name: reversibility-rate
description: "Reversibility classification — tag every action as two-way (easy undo) or one-way (irreversible / costly undo). Drives gate-strictness: one-way always requires user confirmation via Hermes."
---

# Reversibility Rating

> Bezos's "one-way door vs two-way door" heuristic. One-way doors demand deliberation; two-way doors reward speed. Reversibility is NOT the same as risk — a trivial one-way door (`git push --force` to a feature branch) still qualifies and deserves the pause.

## The Two Classes

| Class | Definition | Examples | Gate policy |
|---|---|---|---|
| **Two-way** | Undo in <1 day, no data loss | `git commit` (revert), local file edit, config change with backup, archive move | Act, log, move on |
| **One-way** | Undo hard/impossible or costly | `git push --force`, `DROP TABLE`, `rm -rf`, deploy, send customer email, public PR comment, upload to third-party | STOP. Human confirm via Hermes. |

## When To Use

Before every action with side effects beyond read/search/plan. Housekeeper, implement, cloud, and ship commands must rate before acting.

## The Procedure

1. **Describe the action** in imperative: "delete branch X", "push to main", "write to .env".
2. **Ask two questions**:
   - Can I undo within 24h?
   - Does undoing recover ALL state (data, config, notifications sent, cache served)?
3. **If BOTH yes → two-way**. Act.
4. **If EITHER no → one-way**. Escalate:
   - Low-stakes one-way (feature branch force-push) → inline confirm.
   - High-stakes one-way (prod deploy, DROP, force-push to main) → Hermes `decision` kind + wait for user.

## Action-Specific Examples

**Two-way:**
- `git commit` (reverse with `git revert`)
- Edit `.config/opencode/agent/*.md` (reverse with `git checkout`)
- Move `session-state.yaml` to archive (reverse with `git mv`)
- Dedupe learnings.jsonl (diff stored in log)

**One-way (STOP, confirm):**
- `git push --force` to any branch
- `git branch -D` (90-day reflog window, still one-way if reflog rotated)
- `DROP TABLE`, `DELETE FROM` without `WHERE`
- `rm -rf` anywhere
- `deploy`, `kubectl apply` to prod
- Sending a message to customer/channel
- Uploading to a third-party index (many don't support purge)
- Publishing a GitHub release (tag deletes don't erase mirrors)

## Output Format

```yaml
action: "<imperative sentence>"
reversibility: two-way | one-way
undo_method: "<if two-way, how to reverse>"
irreversibility_reason: "<if one-way, what can't be undone>"
gate: inline-confirm | hermes-decision | proceed
recovery_cost: trivial | moderate | severe | catastrophic
```

## Rules

- **Default to one-way if unsure.** Adding a confirm step is cheap; the opposite isn't.
- **Reversibility isn't binary in time.** A `git push` is one-way AFTER teammates pull. Tag the window explicitly.
- **Hooks are invisible:** a pre-push hook that triggers a deploy makes the push one-way.
- **Data ≠ state.** Moving a file is reversible; sending an email announcing the move is not.

## Integration

- `sage` Step 4 (risk gate): HIGH/CRITICAL risk levels usually map to one-way actions. Use this skill to disambiguate MEDIUM edge cases.
- `housekeeper`: every proposed action must be rated. Two-way → log and act. One-way → Hermes proposal.
- `cloud`: all deploys / SSH writes are one-way by default.
- `sage-manifest-gate.ts`: dangerous commands (`rm -rf`, `DROP TABLE`, `git push --force`) are hard-coded one-way, always block.

## Anti-Patterns

- Classifying "git push" as two-way because "I can push a revert" — the revert is a new commit, not an undo.
- Skipping confirm on one-way because "it's fine, I'm careful" — you are, until the one time you aren't.
- Treating "easy to rebuild" as "reversible" — the rebuild takes time, coordination, and might not be identical.
- Rating AFTER acting (post-hoc rationalization is not a gate).
