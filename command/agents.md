---
description: Parallel sub-agent orchestration for complex tasks.
agent: orchestrate
---

Automatically parallelize tasks across specialized sub-agents.

## Usage

```
/agents <task description>
/agents "analyze and fix all type errors"
```

## Process

1. **Analyze task with Sequential Thinking:**
   - Break down into subtasks
   - Identify dependencies
   - Determine parallelizable parts

2. **Select agents and models:**
   | Task Type | Agent | Why |
   |-----------|-------|-----|
   | Research | @investigate | Fast parallel info gathering |
   | Code search | @explore | Quick codebase navigation |
   | Implementation | @implement | Standard coding |
   | Testing | @verify | Test execution |
   | Review | @verify | Quality checks |
   | Debug | @investigate | Root cause analysis |
   | Security | @security | Vulnerability scanning |
   | Coordination | @orchestrate | Complex orchestration |

3. **Spawn agents in parallel:**

   ```
   Task: "analyze and fix all type errors"

   Phase 1 (parallel):
   - Agent 1: Find all type errors
   - Agent 2: Categorize by severity
   Wait for both...

   Phase 2 (parallel):
   - Agent 3: Fix critical errors
   - Agent 4: Fix warnings
   Wait for both...

   Phase 3:
   - Agent 5: Verify fixes
   ```

4. **Collect and synthesize:**
   - Merge results
   - Report actions taken
   - List remaining issues

## Parallelization Rules

### Can parallelize:

- Independent file analysis
- Multiple search queries
- Unrelated fixes
- Research + exploration

### Must be sequential:

- Fix depends on analysis
- Test depends on implementation
- Review depends on changes

## Output Format

```markdown
## Parallel Execution Summary

### Phase 1 (parallel): Analysis

- Agent 1: Result
- Agent 2: Result

### Phase 2 (parallel): Fixes

- Agent 3: Result
- Agent 4: Result

### Phase 3: Verification

- Agent 5: Result

## Results

- Fixed: X/Y items
- Manual review needed: Z items
- Time: X seconds (vs Y sequential)
```

Arguments: $ARGUMENTS
