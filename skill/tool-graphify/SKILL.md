---
name: tool-graphify
description: "Canonical workflow for Graphify codebase graph — build, query, orientation. Load when exploring unfamiliar repos or before dispatching multiple reads."
---

# Tool Skill: Graphify

> Load this skill when you need to orient in a codebase, find relevant files, or understand dependency structure without reading every file.

## When To Use

- Before dispatching 2+ reads on an unfamiliar repo (>100 files)
- When asked "where is X implemented?"
- When planning a refactor and need blast radius
- When `graphify-out/graph.json` exists in the project root

## Orientation Protocol

```bash
# Step 1: Check if graph exists and is fresh (<24h)
ls -la graphify-out/graph.json 2>/dev/null || echo "no graph"

# Step 2: Query the graph
bash <opencode-config>/scripts/graphify.sh query "auth middleware"
# Returns: top matching files + high-coupling nodes

# Step 3: Use returned file list — read those first
# Do NOT cold-scan the entire repo
```

## Exact Commands

```bash
# Build graph (background — non-blocking, recommended for large repos)
<opencode-config>/scripts/graphify.sh rebuild-bg
# Logs to: .opencode/graphify-build.log

# Build graph (foreground — blocks, use for small repos)
<opencode-config>/scripts/graphify.sh rebuild

# Query graph
bash <opencode-config>/scripts/graphify.sh query "authentication"
bash <opencode-config>/scripts/graphify.sh query "session token"

# Check build progress
tail -f .opencode/graphify-build.log

# Direct binary (if PATH is set correctly)
bash <opencode-config>/scripts/graphify.sh query "database schema"
```

## Wrapper Script

Use `graphify.sh` for all Graphify calls; never call direct `graphify` or `python3 -m graphify` from agents:

```bash
# Wrapper ensures correct uv-managed Python environment
<opencode-config>/scripts/graphify.sh rebuild
<opencode-config>/scripts/graphify.sh query "keyword"
```

## Graph Staleness

- Graph auto-rebuilds on `git commit` (hook installed)
- If graph is >24h old, suggest `<opencode-config>/scripts/graphify.sh rebuild-bg` but do NOT block
- Stale graph is better than no graph — use with caveat

## Query Output Format

```
Top matches for "auth":
  src/auth/session.ts          (score: 0.94, coupling: high)
  src/middleware/jwt.ts         (score: 0.87, coupling: medium)
  src/api/routes/login.ts      (score: 0.72, coupling: low)

High-coupling nodes (changes here ripple widely):
  src/lib/db.ts                (imported by 23 files)
  src/types/index.ts           (imported by 41 files)
```

## Failure Modes

| Error | Cause | Fix |
|-------|-------|-----|
| `ModuleNotFoundError` | uv env not activated | Use `graphify.sh` |
| `graph.json not found` | Never built | Run `graphify.sh rebuild-bg` |
| `query returns nothing` | Graph stale or keyword too specific | Rebuild or try broader term |
| Build hangs | Repo too large | Use background mode |

## Safety Gates

- **Never block on graph absence** — fall back to targeted Serena reads
- **Never run foreground build on repos >10K files** — use background mode
- **Graph is read-only orientation** — never use graph data to make code changes without reading actual source
- **One graph per project root** — do not share `graphify-out/` across projects

## Cost Benefit

A single `graphify.sh query` replaces 10-20 `read_file` calls.
On a 1000-file repo: ~$0.002 vs ~$0.04 per orientation pass.
Always query before cold-reading.
