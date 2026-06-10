---
description: Deep research with full tool arsenal.
agent: investigate
---

Deep research with full tool arsenal — Context7, Omnisearch, Serena.

## Usage

```
/deep <topic>
/deep "best approach for telegram bot handlers"
```

## Process

1. **Parallel research (3 agents):**

   **Agent 1: Context7 - Library Docs**

   ```
   - resolve-library-id for relevant libs
   - query-docs for best practices
   - Get official recommendations
   ```

   **Agent 2: Omnisearch - Web Research**

   ```
   - Search for "{topic} best practices 2024"
   - Search for "{topic} patterns"
   - Find real-world examples
   ```

   **Agent 3: Codebase - Current Patterns**

   ```
   - Use Serena to find related code
   - Identify existing patterns
   - Map current implementation
   ```

3. **Sequential Thinking - Synthesize:**

   ```
   - Combine all findings
   - Identify conflicts
   - Form recommendation
   ```

4. **Output:**

   ```markdown
   ## Deep Research: {topic}

   ### Library Documentation

   - {findings from Context7}

   ### Web Research

   - {findings from Omnisearch}

   ### Current Codebase

   - {existing patterns}

   ### Recommendation

   {synthesized recommendation}

   ### Action Items

   - [ ] {what to do}
   ```

## When to Use

- Before major architecture decisions
- When unsure about best approach
- For library/framework comparisons
- When current approach isn't working

Arguments: $ARGUMENTS
