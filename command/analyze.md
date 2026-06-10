---
description: Deep codebase analysis using Serena for code intelligence.
agent: investigate
---

Deep analysis of codebase area using Serena for code intelligence.

## Usage
```
/analyze <feature area, file paths, or component>
```

## Process

### Step 1: Activate Serena Project
Ensure Serena is initialized for the current project:

```bash
# Check if .serena/project.yml exists
ls .serena/project.yml

# If not initialized:
cd /path/to/project
serena project create
serena project index
```

If Serena tools fail during analysis, automatically initialize:
```bash
if [[ ! -f .serena/project.yml ]]; then
    serena project create
    serena project index
fi
```

### Step 2: Read Existing Memories
Check what we already know about this area using Serena memories.

### Step 3: Explore Codebase Structure
Use Serena to understand the code:
- `get_symbols_overview` for key files
- `find_symbol` for classes, functions, types
- `find_referencing_symbols` to map dependencies
- `search_for_pattern` for specific code patterns

### Step 4: Launch Parallel Exploration
Use @explore agents for different aspects:
- FILE STRUCTURE
- SYMBOLS
- TESTS

### Step 5: Identify Patterns
Extract patterns from existing code:
- How are similar features implemented?
- What's the file organization pattern?
- What testing patterns are used?

### Step 6: Map Dependencies
- What does this code depend on?
- What depends on this code?
- What would break if we change it?

## Output Format

```markdown
## Analysis: [Area/Feature]

### Current State
[Description of how this area works]

### File Structure
[Directory tree with descriptions]

### Key Symbols
| Symbol | Type | File | Purpose |

### Dependencies
**Depends On:** ...
**Depended On By:** ...

### Existing Patterns
1. Pattern with location
2. Pattern with location

### Test Coverage
- Existing tests
- Testing pattern used

### Integration Points
Where new code should integrate
```

Arguments: $ARGUMENTS
