---
description: Fast-track fix for trivial changes (typos, config, single-file fixes).
agent: implement
---

Tier 1 protocol: understand → implement → test → commit. No EVO lifecycle, no phase gates.

## Usage

```bash
/hotfix "fix typo in README"          # Describe the fix
/hotfix --file path/to/file           # Read file, then ask what to fix
/hotfix "rename variable foo to bar"  # Rename/config changes
```

## When to Use

- Typos, spelling corrections
- Config value tweaks
- Single-line renames
- Comment fixes
- ≤1 file, ≤20 lines estimated

**Not sure?** If the fix touches 2+ files or requires new logic, use `/next` (Tier 2) instead.

## Process

### Step 1: Understand

If `$ARGUMENTS` contains `--file <path>`:
```
Read the file with Serena read_file
Ask: "What should I fix in this file?"
Wait for user response.
```

If description provided:
```
Identify: which file(s) are affected
If >1 file: warn "This may need /next (Tier 2) — touching multiple files"
Confirm scope with user before proceeding
```

### Step 2: Implement

```
Use Serena tools only:
  - replace_content for targeted text swaps
  - replace_symbol_body for function-level changes
  - read_file to verify before and after

Rules:
  - Touch ONLY the described change
  - No refactoring adjacent code
  - No "while I'm here" improvements
  - Max 20 lines changed
```

### Step 3: Run Tests

```bash
# Detect test command (in order):
# 1. Check package.json for "test" script → npm test
# 2. Check for pytest.ini / pyproject.toml → pytest
# 3. Check for Makefile with test target → make test
# 4. Default → npm test

Run the detected command.
```

**If tests pass:**
```bash
git add -A
git commit -m "fix: $DESCRIPTION

Co-Authored-By: Claude <noreply@anthropic.com>"
```
Output: `✅ Hotfix shipped: <commit-hash>`

**If tests fail:**
```
Show the failure output.
Ask: "Tests failed. Options:
  1. Revert my change (git checkout)
  2. Fix the test failure too (escalates to /next)
  3. Commit anyway (I'll fix tests separately)
What would you like to do?"
Wait for user decision. Never auto-decide.
```

## Rules

- **No EVO state changes** — hotfixes are outside the EVO lifecycle
- **No new test files** — run existing tests only
- **No schema updates** — if schema needs changing, escalate to `/evo`
- **Fail loud** — if tests fail, stop and ask; never silently skip
- **Auto-escalate warning** — if scope exceeds 1 file or 20 lines, warn before proceeding

## Output Format

```
🔧 HOTFIX: [description]
📄 File: [path]
✏️  Changed: [brief summary of what changed]
🧪 Tests: PASS (or FAIL — see below)
✅ Committed: [hash]
```

Arguments: $ARGUMENTS
