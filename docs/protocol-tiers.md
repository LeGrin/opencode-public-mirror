# Protocol Tiers — Complexity Classifier

## Tier Detection Rules

### Tier 1: HOTFIX
**Triggers:** ANY of these:
- User says `/hotfix` or `/fix`
- Change description mentions: "typo", "config", "spelling", "rename"
- Scope: ≤1 file, ≤20 lines estimated

**Steps:** 3
1. Implement the change
2. Run existing tests (don't write new ones)
3. Commit

**Gate enforcer:** No file restrictions. No phase gates.

### Tier 2: STANDARD
**Triggers:** DEFAULT for most work, OR:
- User says `/next` without `/evo` context
- Scope: 2-5 files, known patterns
- Bug fixes, small features, refactoring

**Steps:** 7
1. Investigate current code (read, understand)
2. Plan the change (brief — 2-3 sentences, not a full doc)
3. Write a failing test
4. Implement
5. Verify tests pass
6. Automated review
7. Commit

**Gate enforcer:** Light restrictions — no schema changes without escalation.

### Tier 3: FULL EVO
**Triggers:** ANY of these:
- User explicitly says `/evo`
- Scope: 6+ files
- New domain concepts
- Architecture changes
- Security changes

**Steps:** 22 (full EDD protocol, unchanged)

**Gate enforcer:** Full restrictions per phase.

## Model Profile Mapping (from GSD research)
- HOTFIX: Haiku for investigation, Sonnet for implementation
- STANDARD: Sonnet throughout
- FULL EVO: Sonnet + Opus for architecture/security gates

## Override Rules
- `/hotfix` forces Tier 1 regardless of scope
- `/evo` forces Tier 3 regardless of scope
- User can say "upgrade to full evo" mid-flow to escalate
- Auto-escalation: if a HOTFIX touches >1 file, warn user and suggest STANDARD
