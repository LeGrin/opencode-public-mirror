---
description: "Run contract-verifier on current schema docs (or multiplex worktrees) to check cross-schema consistency."
agent: sage
category: validation
---

# /contracts

Invoke `contract-verifier` agent for cross-schema consistency checks.

## Usage

```
/contracts              # check all docs/schema/*.yaml for internal consistency
/contracts --pre-ship   # stricter mode; fails on any warning too
/contracts --scope-check front,back  # if multiplex is active, cross-scope check
```

## What Gets Checked

**Mode 1 (default)** — schema consistency in current cwd:
- DB × API: every API response field maps to a DB column with compatible type
- API × UI: every UI-consumed field exists in API response
- Schema × Infra: every upstream service exists in infrastructure.yaml
- Hash freshness: every schema's `x-meta.source_hashes` still holds

**Mode 2** — cross-scope (auto if multiplex active):
- Worker worktrees don't modify files outside their scope
- Shared-type files identical across workers
- Contract files (OpenAPI, shared d.ts) additive-only in workers

## Verdict

- `pass` → proceed
- `warn` → show violations to user, ask
- `fail` → block ship or multiplex merge

## See Also

- `agent/contract-verifier.md`
- `lib/schema-freshness.ts` (hash check helper)
