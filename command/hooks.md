---
description: Manage SAGE enforcement hooks
agent: build
---

# /hooks - Manage SAGE Hooks

Check status, enable, or disable S.A.G.E. enforcement hooks.

## Usage

```bash
/hooks           # Show status (default)
/hooks status    # Show which hooks are active
/hooks enable    # Enable all hooks
/hooks disable   # Disable all hooks
```

---

## Commands

### /hooks status (default)

Show current hook status:

```markdown
## SAGE Hooks Status

**Environment:** SAGE_HOOKS_ENABLED={value}

| Hook               | Status            | Description           |
| ------------------ | ----------------- | --------------------- |
| sage-gate-enforcer | {active/inactive} | Blocks edits by phase |
| sage-risk-tracker  | {active/inactive} | Risk scoring          |
| sage-state-sync    | {active/inactive} | Auto state updates    |
| sage-compaction    | {active/inactive} | Context preservation  |

{If active:}
**Phase Rules Active:**

- DISCOVERY/PLANNING: Only docs, config allowed
- RED: Only test files allowed
- GREEN: All edits allowed

{If inactive:}
**To enable:** `/hooks enable` or `export SAGE_HOOKS_ENABLED=true`
```

### /hooks enable

Enable all SAGE hooks:

```bash
# Set environment variable
export SAGE_HOOKS_ENABLED=true

# Verify
echo $SAGE_HOOKS_ENABLED
```

**Output:**

```markdown
## SAGE Hooks Enabled ✓

Enforcement is now active for this terminal session.

**What's enforced:**

- DISCOVERY/PLANNING: Cannot edit code files
- RED: Can only edit test files
- GREEN: All edits allowed

**To disable:** `/hooks disable`

**Note:** This only affects the current terminal.
To persist, add to ~/.zshrc or ~/.bashrc:
export SAGE_HOOKS_ENABLED=true
```

### /hooks disable

Disable all SAGE hooks:

```bash
# Unset environment variable
unset SAGE_HOOKS_ENABLED
```

**Output:**

```markdown
## SAGE Hooks Disabled

Enforcement is now off. You can edit any file regardless of phase.

**To re-enable:** `/hooks enable`
```

---

## How Hooks Work

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOOK FLOW                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [User tries to edit file]                                       │
│           │                                                      │
│           ▼                                                      │
│  [SAGE_HOOKS_ENABLED=true?]                                      │
│           │                                                      │
│     No ───┴─── Yes                                               │
│     │          │                                                 │
│     ▼          ▼                                                 │
│  [Allow]   [Read .evo-state.yaml]                                │
│                 │                                                │
│                 ▼                                                │
│            [Get current phase]                                   │
│                 │                                                │
│     ┌───────────┴───────────┐                                    │
│     │                       │                                    │
│  [DISCOVERY/PLANNING]    [RED]                [GREEN/COMPLETE]   │
│     │                       │                        │           │
│     ▼                       ▼                        ▼           │
│  [Is doc/config?]     [Is test file?]           [Allow]          │
│     │                       │                                    │
│  No─┴─Yes               No──┴──Yes                               │
│  │     │                │       │                                │
│  ▼     ▼                ▼       ▼                                │
│ [BLOCK] [Allow]       [BLOCK]  [Allow]                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase Rules

| Phase     | Steps    | Code Files | Test Files | Docs/Config |
| --------- | -------- | ---------- | ---------- | ----------- |
| DISCOVERY | 1-10.5   | ❌ Blocked | ❌ Blocked | ✅ Allowed  |
| PLANNING  | 11-13.75 | ❌ Blocked | ❌ Blocked | ✅ Allowed  |
| RED       | 14-16    | ❌ Blocked | ✅ Allowed | ✅ Allowed  |
| GREEN     | 17-20    | ✅ Allowed | ✅ Allowed | ✅ Allowed  |
| COMPLETE  | 21-22    | ⚠️ Warns   | ⚠️ Warns   | ✅ Allowed  |

---

## Troubleshooting

### Hooks not working?

```bash
# 1. Check environment variable
echo $SAGE_HOOKS_ENABLED  # Should be "true"

# 2. Check plugins exist
ls <opencode-config>/plugins/sage-*.ts

# 3. Enable debug mode
export SAGE_DEBUG=true
# Then try editing - you'll see hook logs
```

### Want to bypass temporarily?

```bash
# Option 1: Disable hooks
/hooks disable

# Option 2: Use --force in error message
# (hooks show override instructions)
```

---

## See Also

- AGENTS.md - Full hook documentation
- `/evo next` - Advance to next phase
- `plugins/sage-gate-enforcer.ts` - Gate logic

Arguments: $ARGUMENTS
