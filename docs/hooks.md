# OpenCode Hooks Concept

Hooks are automated actions triggered at specific lifecycle events.

## What Are Hooks?

Hooks allow you to:
- Auto-load context when session starts
- Auto-run commands after certain actions
- Enforce standards automatically
- Inject reminders at key moments

## Superpowers Hooks (Reference)

Superpowers uses these hook types:
- `session.started` - Runs when new session begins
- `chat.message` - Runs before/after each message
- `tool.execute` - Runs before/after tool execution

## OpenCode Implementation Options

### Option 1: Instructions File (Current)

OpenCode already supports automatic context loading via `instructions` in config:

```json
{
  "instructions": ["AGENTS.md", "OpenCode.md", ".opencode/context.md"]
}
```

This is effectively a `session.started` hook - these files load at session start.

### Option 2: Custom Commands as Hooks

Create commands that act as manual hooks:

```bash
# Before starting work
/init-session

# After completing feature
/post-feature

# Before committing
/pre-commit
```

### Option 3: Shell Integration (Advanced)

Use shell aliases/functions to wrap opencode:

```bash
# ~/.zshrc or ~/.bashrc
function oc() {
  # Pre-session hook
  echo "Loading project context..."
  
  # Run opencode
  opencode "$@"
  
  # Post-session hook
  echo "Session ended. Remember to /ship if done!"
}
```

## Recommended Hooks for Your Flow

### 1. Session Start Hook (via instructions)

Create `.opencode/session-context.md`:
```markdown
# Session Context

## Current Focus
- Active EVO: [loaded from docs/evo/]
- Last /ship: [git log -1]
- Pending todos: [from TodoRead]

## Quick Reminders
- Use /fix for errors (4-phase methodology)
- Use /test before /ship
- AI proposes, human disposes
```

Add to config:
```json
{
  "instructions": ["AGENTS.md", "OpenCode.md", ".opencode/session-context.md"]
}
```

### 2. Error Detection Hook (via /fix)

The enhanced `/fix` command now acts as an error-handling hook:
- Auto-detects errors from logs
- Uses @fixer agent with 4-phase methodology
- Escalates to @debugger if needed

### 3. Pre-Commit Hook (via /ship)

Enhance `/ship` to include verification:
```markdown
## /ship Process
1. Run /test (all tests must pass)
2. Run /validate (lint, types)
3. Show diff for review
4. Commit with meaningful message
5. Push to remote
```

## Future Hook Ideas

| Hook | Trigger | Action |
|------|---------|--------|
| `on_error` | Error in output | Auto-run /fix |
| `on_test_fail` | Test failure | Show failing test context |
| `on_large_change` | >100 lines changed | Suggest code review |
| `on_security_file` | Auth/payment file edited | Run /security |

## Implementation Status

| Hook Type | Status | Implementation |
|-----------|--------|----------------|
| Session start | ✅ Exists | `instructions` config |
| Error handling | ✅ New | `/fix` command + @fixer |
| Pre-commit | ✅ Exists | `/ship` command |
| Auto-review | ⏳ Possible | Add to @code-reviewer trigger |

## Summary

**You don't need a plugin for hooks.** OpenCode's existing features provide:
- `instructions` = session start hook
- `/fix` = error handling hook  
- `/ship` = pre-commit hook
- Custom commands = any other hook

The Superpowers hooks system is more automated but adds complexity. Your current command-based approach gives you the same control with more visibility.