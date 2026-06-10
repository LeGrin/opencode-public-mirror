---
description: Generate all 4 schema docs in dependency order (db, infra, api, ui)
agent: sage
---

# /schema all — Full Schema Registry Refresh

Run the whole schema intelligence pipeline: database + infrastructure in parallel, then API, then UI. Writes all four files in `docs/schema/`.

## Usage

```bash
/schema all                 # Full refresh
/schema all --force         # Ignore all freshness caches
```

## Execution order

```
Parallel:  @schema-db  +  @infra-guardian
    │            │
    └────┬───────┘
         ↓
Sequential: @schema-api  (needs database.yaml)
         ↓
Sequential: @schema-ui   (needs api-contracts.yaml)
```

This is a thin wrapper around `Task(orchestrator, mode: parallel)` with the pipeline above. Sage dispatches db + infra in parallel (no shared dependencies), then waits for db before api, then api before ui.

## What gets written

| File | By | Depends on |
|------|----|-----------|
| `docs/schema/database.yaml`     | @schema-db       | ORM source only |
| `docs/schema/infrastructure.yaml` | @infra-guardian | `.ops-manifest.yaml` (optional), Docker, CI |
| `docs/schema/api-contracts.yaml` | @schema-api     | `database.yaml` |
| `docs/schema/ui-map.yaml`       | @schema-ui       | `api-contracts.yaml` |

## Side effects

- Auto-populates `project-manifest.yaml.risk_allowlist.safe_hosts` if `.ops-manifest.yaml` exists.
- Updates all `x-meta.last_full_scan` timestamps.
- Streams findings per agent to Serena memory for `/tidy` audit trail.

## When to run

- During `/init` Phase 1.5 (bootstrap).
- Weekly via `/tidy` (or manual `/schema all` if you notice drift).
- Before `/ship` if many source files changed since last run.
