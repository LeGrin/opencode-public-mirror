---
name: tool-lerim
description: "Canonical workflow for lerim semantic project memory — query past sessions, working memory, cross-project learnings. Load when needing historical context about a project."
---

# Tool Skill: lerim

> Load this skill when you need to recall past decisions, find how something was implemented before, or get a project's working memory summary.

## When To Use

- Starting work on a project you haven't touched recently
- "How did we implement X?" questions
- Before making an architectural decision (check if it was already decided)
- When `runtime-learnings.json` or `learnings.jsonl` may have relevant entries
- After compaction — restore context from semantic memory

## Exact Commands

```bash
# Query project memory (natural language)
<lerim-bin>/lerim ask "how did we implement auth in GIR?"
<lerim-bin>/lerim ask "what was decided about the database schema?"

# Query with project scope
<lerim-bin>/lerim query --project GIR "JWT token refresh"
<lerim-bin>/lerim query --project kingdom "payment flow"

# Get working memory summary (best for session start)
<lerim-bin>/lerim working-memory --project <name>

# List registered projects
<lerim-bin>/lerim projects

# Manual sync (auto-syncs every 30min)
<lerim-bin>/lerim sync --window 1d
<lerim-bin>/lerim sync --window 7d
```

## Registered Projects

- GIR
- kingdom
- stables_v2
- Hermes
- tenderium

## Working Memory Pattern

At session start for a known project:

```bash
# Get compressed project context (~500 tokens vs reading all files)
<lerim-bin>/lerim working-memory --project GIR
```

Output includes: recent decisions, active patterns, known issues, last session summary.

## Cross-Project Learnings

lerim indexes sessions across ALL tools (Claude Code, OpenCode, Codex).

```bash
# Find how a pattern was solved in any project
<lerim-bin>/lerim ask "how did we handle rate limiting?"

# Find decisions made in a specific tool's sessions
<lerim-bin>/lerim query --source claude-code "sonarqube setup"
```

## Failure Modes

| Error | Cause | Fix |
|-------|-------|-----|
| `Connection refused` | Server not running | `<lerim-bin>/lerim serve &` |
| `Project not found` | Not registered | `<lerim-bin>/lerim register --project <name> --path <project-path>` |
| `No results` | Not yet synced | `<lerim-bin>/lerim sync --window 30d` |
| `lerim: command not found` | PATH issue | Use full path `<lerim-bin>/lerim` |

## Safety Gates

- **lerim is read-only** — never write to it directly; it indexes sessions automatically
- **Do not use lerim results as ground truth** — verify against actual source files
- **Working memory is a summary** — always read actual code before making changes
- **Sync lag is ~30min** — very recent sessions may not appear yet

## Integration with runtime-learnings.json

lerim complements (does not replace) `runtime-learnings.json`:

| Store | Scope | Updated by | Best for |
|-------|-------|-----------|---------|
| `runtime-learnings.json` | Global, cross-project | Agents on failure | Anti-patterns, tool failures |
| `learnings.jsonl` | Per-project | Agents on insight | Project-specific patterns |
| lerim | All projects, semantic | Auto-indexed | Natural language recall |
