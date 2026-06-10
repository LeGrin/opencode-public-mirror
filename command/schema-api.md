---
description: Generate docs/schema/api-contracts.yaml from route handlers
agent: sage
---

# /schema api — API Contracts Generator

Run `@schema-api` to map the API surface and write `docs/schema/api-contracts.yaml` in OpenAPI 3.1 format with frontend-sync validation.

## Usage

```bash
/schema api                 # Generate or refresh api-contracts.yaml
/schema api --force         # Ignore freshness cache, full rescan
```

## What happens

1. Reads `docs/schema/database.yaml` (if present) to cross-reference tables.
2. `Task(schema-api)` is dispatched — the agent walks route handlers (FastAPI / NestJS / Express / Gin / Django REST), extracts request/response schemas, and writes `docs/schema/api-contracts.yaml`.
3. Writes `x-validation.frontend_sync` block with any mismatches between backend schemas and frontend type files.
4. Output path: `{cwd}/docs/schema/api-contracts.yaml`.
5. Memory trace: `findings_{session}_schema-api` in Serena.

## When to run

- After `/schema db` (needs database.yaml as input).
- After any route or schema change.
- `/ship` reads `x-validation.frontend_sync` — soft gates WARN, hard gates BLOCK on mismatch.

## Dependencies

- `docs/schema/database.yaml` (optional input)
- `templates/schema/api-contracts.yaml` (skeleton)
- `templates/schema.yaml` (full OpenAPI base)
- `prompts/context/schema-registry.txt` (output conventions)
