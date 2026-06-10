---
description: Full validation of recent changes. Tests + UI + code review + regression.
agent: verify
---

Full validation of recent changes. Tests + UI + code review + regression check.

## Usage
- `/validate` - Full validation
- `/validate quick` - Fast validation (skip UI)
- `/validate --no-review` - Skip code review

## Process

Launch 4 agents in parallel:

### Agent 1: Test Runner
```
- Run unit tests
- Run integration tests
- Report failures with context
```

### Agent 2: Playwright UI Validation
```
Visual Mode:
- Take screenshots of key flows
- AI analyzes for UX regressions
- Check responsive layouts

Functional Mode:
- Click through main user flows
- Validate form submissions
- Check error states
```

### Agent 3: Code Reviewer
```
- Review recent commits (git diff HEAD~3)
- Check for:
  - Code quality issues
  - Security basics
  - Pattern consistency
  - Missing error handling
```

### Agent 4: Regression Explorer
```
- Scan for obvious regressions
- Check imports still valid
- Verify no broken references
```

### Collect Results

```markdown
## Validation Report

### Tests: Pass/Fail
### UI: Visual and Functional status
### Code Review: Issues found
### Regressions: Status

## Action Required
- List of items to fix
```

Arguments: $ARGUMENTS
