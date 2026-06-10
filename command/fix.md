---
description: Fix errors using 4-phase methodology. Auto-detects or accepts error input.
agent: implement
---

Fix errors using structured 4-phase approach: CAPTURE → REPRODUCE → ANALYZE → FIX.

## Usage

```bash
/fix                           # Auto-detect errors from logs
/fix "TypeError: x is undefined"   # Fix specific error
/fix test                      # Fix failing tests
/fix build                     # Fix build errors
/fix docker                    # Fix docker/container issues
/fix --deep                    # Complex issue, use @flow-orchestrator + agent review
```

## Auto-Detection Sources

When called without arguments, check in order:

```bash
# 1. Recent test failures
npm test 2>&1 | tail -50

# 2. Build errors
npm run build 2>&1 | tail -50

# 3. Docker logs (if docker-compose.yml exists)
docker-compose logs --tail=100 2>/dev/null

# 4. Local log files
tail -100 <temp-dir>/*.log *.log 2>/dev/null

# 5. Git status (uncommitted error-prone changes)
git diff --name-only
```

## 4-Phase Process

### Phase 1: CAPTURE

```
□ Full error message
□ Stack trace
□ File:line location
□ Recent changes (git log -3)
□ Environment info
```

### Phase 2: REPRODUCE

```bash
# Confirm error is reproducible
# Run 3 times, note frequency
# Test in isolation if possible
```

### Phase 3: ANALYZE

```
# Evidence-based hypothesis
# Pattern match with working code
# State confidence level
```

### Phase 4: FIX

```
# Minimal change only
# Write regression test if missing
# Verify all tests pass
# Document root cause
```

## Quick Fix Patterns

| Error Type             | Likely Cause       | Quick Check                 |
| ---------------------- | ------------------ | --------------------------- |
| `TypeError: undefined` | Missing null check | Add `?.` or guard           |
| `Module not found`     | Import path wrong  | Check relative path         |
| `Timeout exceeded`     | Missing await      | Add await, increase timeout |
| `Test flaky`           | Race condition     | Use waitFor, not sleep      |
| `Build failed`         | Type error         | Check types, run tsc        |

## Output Format

```
🔍 CAPTURED: [error summary]
🔄 REPRODUCED: [frequency]
🧠 ANALYSIS: [hypothesis with evidence]
✅ FIXED: [what changed]
🛡️ PREVENTION: [how to avoid]
```

## Escalation

Use `/fix --deep` or escalate to @flow-orchestrator when:

- Root cause unclear after Phase 3
- Multiple interconnected issues
- Need architectural analysis
- agent review consultation needed

## Examples

```bash
# Simple: Fix a test failure
/fix "Test 'should validate email' failed"

# Auto-detect: Find and fix errors
/fix

# Specific: Fix docker issues
/fix docker

# Complex: Deep analysis needed
/fix --deep "Intermittent timeout in auth flow"
```

Arguments: $ARGUMENTS
