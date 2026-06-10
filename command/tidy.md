---
description: Run automated maintenance pass — docs, artifacts, structure, deps, schema freshness, health delta
agent: sage
---

# /tidy — Project Maintenance Pass

Run `@tidy-up` to execute the 6-step maintenance checklist. Safe for scheduling (weekly).

## Usage

```bash
/tidy                  # Full maintenance pass
/tidy --dry-run        # Report what would be done, don't touch anything
/tidy --skip-deps      # Skip dependency audit (faster)
/tidy --skip-health    # Skip health delta (faster)
```

## Execution order

`@tidy-up` is dispatched directly — **skip classification gate** (tidy is a workflow, not a task type).

```
1. Document Consolidation   — archive completed EVOs, validate RULES.md stack
2. Artifact Cleanup         — auto-delete cache/tmp, report debug statements
3. Project Structure        — flag misplaced files
4. Dependencies             — npm outdated / pip list --outdated / audit (report only)
5. Schema Freshness         — re-run /schema * if >7 days stale
6. Health Delta             — run /health and flag regressions
```

## Two-level output

Report at `{cwd}/docs/tidy/report.yaml`:

- `actions_taken` — reversible auto-actions (cache cleanup, archive, schema refresh)
- `actions_proposed` — needs user approval (dep updates, structural moves, debug cleanup)
- `health_delta` — per-module score changes from previous report
- `warnings` — stale schemas, chronic hotspots, degraded modules

## Safety

- Always backs up touched files to `.backups/tidy-{timestamp}/` before regeneration.
- Never deletes source code.
- Never auto-updates dependencies.
- Never overwrites user-customized `project-manifest.yaml` entries.

## Scheduling

Recommended: weekly, Monday morning. Use the `schedule` skill:

```
schedule weekly "monday 09:00" /tidy
```

## When to run manually

- After a long sprint to reset baseline.
- Before `/init`-ing a project that feels stale.
- When `/health` warns about chronic hotspots.
- After deleting a branch with lots of experimental code.
