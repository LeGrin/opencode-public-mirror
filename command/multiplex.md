---
description: "Spawn parallel OpenCode sessions per scope (front/back/infra) for multi-track features."
agent: sage
category: management
---

# /multiplex

Dispatch `multiplex` agent to split the current task into parallel OpenCode sessions (each with its own git worktree) and coordinate them via the OpenCode HTTP API.

## Usage

```
/multiplex <feature-description>
/multiplex --scopes front,back,db  <feature>
/multiplex --contract docs/contracts/order.yaml  <feature>
```

## Prerequisites

- `OPENCODE_SERVER_PASSWORD` env var set (basic auth)
- OpenCode server running (it is by default when you run `opencode`)
- Project is a git repository
- A contract file or YAML block provided — no contract, no multiplex

## What Happens

1. Master sage + multiplex MECE-decompose your task into scopes.
2. For each scope: `git worktree add` isolates files → `POST /session` via OpenCode API → initial prompt sent async.
3. Multiplex polls each child every 30s, streams status to Hermes.
4. `contract-verifier` runs every 5 polls to catch drift.
5. On all-complete + contract-pass: topological merge (db → back → front) + root test suite + worktree cleanup.

## Stops For

- Contract violation on 2 consecutive checks → kill all, report.
- Any child idle >30 min → auto-kill.
- Total token budget >5× single-session → no new spawns, complete active.
- Master sage can `/stop-multiplex` at any time.

## Example

```
/multiplex Build login flow: JWT backend + React form with shadcn + Postgres users migration

→ multiplex splits into:
  - back  (src/api/auth/*, migrations/*)
  - front (src/components/login/*, src/hooks/useAuth.ts)
  - db    (migrations/20260416_users.sql, docs/schema/database.yaml)

→ 3 child sessions spawned, each on its own worktree
→ Hermes: "[multiplex] spawned 3 scopes, contract=docs/contracts/auth.yaml"
→ ~15 min later: all green, contract pass, merge applied, 47 tests passing.
```

## See Also

- `agent/multiplex.md` — full protocol
- `agent/contract-verifier.md` — contract checks
- `plugins/sage-multiplex.ts` — tools under the hood
