---
description: Architecture design with multi-phase analysis.
agent: architect
---

> **S.A.G.E. Note:** For structured feature development, use `/evo start "feature"` 
> which includes comprehensive research, design, and planning phases (Steps 1-11).
> This command remains available for standalone architecture work outside EVOs.

Design architecture for a feature with multi-phase sequential analysis.

## Usage
```
/design <feature requirements>
```

## Prerequisites
Ideally run these first:
- `/research <topic>` - Gather external knowledge
- `/analyze <area>` - Understand codebase

## Process

### Step 1: Gather Context
Compile research findings, codebase patterns, constraints

### Step 2: Multi-Step Sequential Thinking

**Phase 1: Requirements Analysis**
Extract core requirements from user input

**Phase 2: Research Integration**
Apply research findings and constraints

**Phase 3: Codebase Pattern Matching**
Follow existing patterns from /analyze

**Phase 4: Option Generation**
Generate 2-3 approaches with pros/cons

**Phase 5: Criteria Evaluation**
Score options on: Simplicity, Security, Performance, Maintainability

**Phase 6: Critique (Self-Review)**
What could go wrong? Mitigations?

**Phase 7: Refinement**
Build mitigations into the design

**Phase 8: Final Recommendation**
Chosen approach with rationale

### Step 3: Draft Architecture Proposal
- High-level approach
- Key components
- Data flow
- API design
- Security considerations
- Trade-offs

### Step 4: Self-Review
- Critique your own design: what could go wrong?
- Present trade-offs to user for decision

## Output Format

```markdown
## Architecture Design: [Feature]

### Overview
[High-level description]

### Architecture Diagram
[Component relationships]

### Components
#### Component 1: [Name]
- Purpose
- Location
- Interface

### Data Flow
1. Step 1
2. Step 2

### Security Considerations
- Measure 1
- Measure 2

### Trade-offs Accepted
| Decision | Trade-off | Rationale |

### Next Steps
Ready for /plan to create implementation iterations.
```

Arguments: $ARGUMENTS
