---
description: Generate docs/schema/database.yaml from ORM source files
agent: sage
---

# /schema db — Database Schema Generator

Run `@schema-db` to map the current database schema from ORM source files and write `docs/schema/database.yaml`.

## Usage

```bash
/schema db                 # Generate or refresh database.yaml
/schema db --force         # Ignore freshness cache, do a full rescan
```

## What happens

1. `Task(schema-db)` is dispatched — the agent reads all ORM source files (SQLAlchemy / Prisma / Alembic / Django / GORM / Drizzle / ActiveRecord), computes hashes, and writes `docs/schema/database.yaml` with `x-meta` block.
2. Output path: `{cwd}/docs/schema/database.yaml`.
3. Memory trace: `findings_{session}_schema-db` in Serena.

## When to run

- First `/init` of a project — captures baseline schema.
- After any migration or model change — refreshes `x-meta.source_hashes` so downstream agents don't read stale data.
- `/tidy` runs this automatically when `x-meta.last_full_scan` is >7 days old.

## Dependencies

- `lib/stack-detector` for ORM detection.
- `templates/schema/database.yaml` as the starting skeleton.
- `prompts/context/schema-registry.txt` for output conventions.
