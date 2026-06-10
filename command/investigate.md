---
description: Investigate a topic, codebase area, or question using research agents.
agent: investigate
---

Investigate and research a topic using codebase exploration, web search, and documentation lookup.

## Usage

```
/investigate <topic, question, or codebase area>
/investigate "how is auth middleware structured"
/investigate "what ORM patterns does this project use"
```

## Process

### Step 1: Classify the Investigation

Determine the type:

- **Codebase question** → Use Serena (symbols, patterns, references)
- **Library/framework question** → Use Context7 (resolve-library-id → query-docs)
- **General technical question** → Use Omnisearch (web_search, ai_search)
- **Mixed** → Combine sources

### Step 2: Gather Evidence

For codebase investigations:

- `get_symbols_overview` for file structure
- `find_symbol` for specific symbols
- `find_referencing_symbols` for dependency mapping
- `search_for_pattern` for code patterns

For external research (matrix: `docs/agents/omnisearch-routing.md`):

- Context7 for library docs
- Tavily/Brave for web results
- Linkup (or `exa_answer`) for synthesized answers with citations

### Step 3: Synthesize Findings

Combine all evidence into a clear answer with:

- Direct answer to the question
- Supporting evidence (file paths, code snippets, URLs)
- Related findings that may be useful

## Output Format

```markdown
## Investigation: [Topic]

### Answer

[Direct, concise answer]

### Evidence

- [Source 1]: [finding]
- [Source 2]: [finding]

### Related

- [Anything else discovered that's relevant]
```

Arguments: $ARGUMENTS
