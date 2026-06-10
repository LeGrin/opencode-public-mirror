---
description: Run all test types in parallel. Unit, integration, quality, UI.
agent: verify
---

Run all test types in parallel. Unit, integration, quality, UI - everything.

## Usage
- `/test` - Run all tests
- `/test unit` - Only unit tests
- `/test ui` - Only Playwright UI tests
- `/test quick` - Fast smoke tests only

## Process

### Full test run (/test):

Launch agents in parallel:

**Agent 1: Unit Tests**
```bash
# Python
pytest tests/unit/ -v

# Node
npm test

# Go
go test ./...
```

**Agent 2: Integration Tests**
```bash
pytest tests/integration/ -v
# or
npm run test:integration
```

**Agent 3: AI Quality Tests**
- Run quality assessment tests
- Validate LLM output quality
- Check response formatting

**Agent 4: Playwright UI Tests**
```
Two modes in parallel:
1. Visual: Screenshots + AI analysis
2. Functional: DOM interactions + validation
```

**Agent 5: Test Infra Analysis**
- NOT running tests
- Analyzing test coverage gaps
- Suggesting improvements

### Collect and Report

```markdown
## Test Results

### Unit Tests: Pass/Fail count
### Integration: Pass/Fail count
### Quality: Pass/Fail with threshold info
### UI Tests: All flows status
### Coverage: percentage (target: 80%)

## Issues to Fix
1. List any failures

## Infra Improvements
- Suggested new tests
```

### On Failures

If tests fail:
1. Show failure details
2. Consult AI Team for complex failures
3. Offer to run `/fix` automatically

Arguments: $ARGUMENTS
