---
description: Check current flow state and progress
agent: sage
---

# /flow status - Check Flow State

Shows the current state of any active flow from `.flow-state.yaml`.

## Usage

```bash
/flow status
```

## Output

### If Flow Active:
```markdown
## Current Flow

**ID:** FLOW001
**Type:** smoke-test
**Phase:** EXECUTE (step 5/12)
**Started:** 2026-01-25 10:00

**Progress:**
✓ ANALYZE - Complete
✓ DISCOVER - Complete  
✓ PLAN - Approved
→ EXECUTE - 5/12 steps
○ REPORT - Pending

**Current Action:** Testing /settings page

**Errors:** None

---
Resume with: /flow resume
```

### If No Active Flow:
```markdown
## No Active Flow

Start a new flow with:
  /flow "<what you want to do>"

Examples:
  /flow "run smoke tests on localhost:3000"
  /flow "audit security in src/auth"
  /flow "analyze the payment system"
```

## State File

Reads from: `docs/flow/.flow-state.yaml`

Arguments: $ARGUMENTS
