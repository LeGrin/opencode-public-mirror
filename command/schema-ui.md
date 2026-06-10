---
description: Generate docs/schema/ui-map.yaml from frontend components and routes
agent: sage
---

# /schema ui — UI Map Generator

Run `@schema-ui` to map pages, components, API chains, state stores, and detect duplicates and god components. Writes `docs/schema/ui-map.yaml`.

## Usage

```bash
/schema ui                 # Generate or refresh ui-map.yaml
/schema ui --force         # Ignore freshness cache
```

## What happens

1. Reads `docs/schema/api-contracts.yaml` if present — used to cross-validate `api_chain` entries.
2. `Task(schema-ui)` is dispatched. Walks routes → components → API chains → state stores.
3. Builds `canonical_components` registry (blessed components agents reuse instead of duplicating).
4. Flags `duplicates` (>60% overlap with a canonical) and `god_components` (>50 Serena references).
5. Writes `x-validation.api_sync` for every frontend ↔ API mismatch.
6. Output path: `{cwd}/docs/schema/ui-map.yaml`.
7. Memory trace: `findings_{session}_schema-ui`.

## When to run

- After `/schema api` (needs api-contracts.yaml as input).
- After significant UI refactor or new component library introduction.
- `/health` reads `god_components` for the architecture clarity score.

## Escalation

If the project has >200 components or a component with >50 references, `@schema-ui` will ask for GPT-5.4 escalation before finalizing.
