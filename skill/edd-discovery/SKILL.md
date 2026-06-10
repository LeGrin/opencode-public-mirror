---
name: edd-discovery
description: "EDD Discovery Phase (Steps 1-10.5) - Domain analysis, E2E data audit, boost discovery, flow decomposition"
---

# EDD Discovery Phase (Steps 1-10.5)

> Phase skill for `phase-discovery` agent. For overview: `load skill edd-overview`.

## Delegation Pattern

### FULL Tier (Steps 1-10.5)

- Steps 1-3: Phase orchestrator inline (needs user interaction + domain-expert)
- Steps 4-10: **Dispatch Haiku scouts** for codebase analysis, then synthesize
  - Scout batch 1 (parallel): schema reading, existing coverage, memory check
  - Scout batch 2 (parallel): interfaces, communication patterns, error catalog
  - Scout batch 3 (parallel): services identification, gap analysis
- Step 10.5: Phase orchestrator inline (user gate)

### FEATURE Tier (Compressed — Steps 1-4)

Compressed discovery fits into 4 steps with 2 scout batches instead of 3:

- Step 1 (inline): Flow + Domain + Data audit — combined, no formal DOMAIN.md/E2E_DATA.md
- Step 2 (scouts): Golden reference search (same as FULL Step 3.5A)
- Step 3 (scouts): **Single batch** — test cases + interfaces + gaps + services (all parallel)
- Step 4 (inline + user gate): Flow decomposition — same gate as FULL Step 10.5

**What FEATURE skips vs FULL:**
- No formal DOMAIN.md or E2E_DATA.md documents (inline analysis only)
- No separate error catalog (errors noted inline with gaps)
- No separate communication patterns step (noted in plan)
- No agent consensus gate (user gate only at Step 4)
- 2 scout batches instead of 3 (saves ~30% scout tokens)

## Step Overview

| Step     | Name                        | Description                                                               | Output                             |
| -------- | --------------------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| **1**    | Feature Flow Definition     | Complete user flow with prerequisites, steps, expected outputs            | Flow diagram/description           |
| **2**    | Domain Expert Review        | Analyze real artifacts, fields, **user mental model**, vocabulary mapping | `DOMAIN.md`                        |
| **3**    | E2E Test Data Audit         | Real test data, **state transitions**, component appropriateness          | `E2E_DATA.md`                      |
| **3.5**  | **Boost Discovery**         | Opt-in (`--boost`): Research solutions, benchmark FMVPs, present top 3    | `BoostReport` + user choice        |
| **4**    | Test Cases (High-Level)     | Acceptance criteria: happy path, error cases, edge cases                  | Test case list                     |
| **5**    | Interfaces & Schemas        | Data structures, types, contracts needed                                  | Schema updates                     |
| **6**    | Communication Patterns      | How components talk (REST, events, direct calls)                          | Architecture notes                 |
| **7**    | Error Identification        | What can go wrong, how to handle each error                               | Error catalog                      |
| **8**    | Services Identification     | What services/modules are needed (create vs reuse)                        | Service list                       |
| **9**    | Existing Coverage Audit     | What's already implemented with passing tests                             | Coverage report                    |
| **10**   | Gap Analysis                | What exists vs what's needed                                              | Gap list with action items         |
| **10.5** | **Flow Decomposition Gate** | Break into atomic flows, collision check, scope validation                | **Flow breakdown + User approval** |

---

## Step 2: Domain Expert Review + User Mental Model

**Purpose:** Capture domain-specific knowledge AND user expectations BEFORE defining test cases.

**Process:**

1. **Identify Domain Type** - Categorize what's being built:
   - `visual` - Something users SEE (UI, dashboard)
   - `api` - Something users CALL (REST, GraphQL)
   - `cli` - Something users RUN (commands)
   - `data` - Something being PROCESSED (parsing, extraction)

2. **Analyze Real Artifacts** - Request and examine actual:
   - Sample inputs (real documents, real API responses)
   - Identify ALL fields present (not just expected ones)
   - Document domain-specific formats

3. **Capture Gray Areas** - For each domain type, resolve:
   | Domain | Gray Areas |
   |--------|-----------|
   | `visual` | Layout, density, interactions, states |
   | `api` | Response format, pagination, auth |
   | `data` | Input formats, validation, edge cases |

4. **User Mental Model Validation:**

   **User Vocabulary Mapping:**
   | We Call It | User Calls It | Confusion Risk |
   |------------|---------------|----------------|
   | Authentication | Login/Sign In | Low |
   | Dashboard | Home, My Page | Medium |

   **User Expectations:**
   | Step | What User Expects | What We Provide | Gap |
   |------|-------------------|-----------------|-----|
   | Landing | "Login" visible | Header button | None |
   | Error | Clear message | Inline errors | None |

   **Confusion Points:**
   - Where might user get lost?
   - What terminology might confuse?
   - What features might user expect but aren't in scope?

**Output:** `DOMAIN.md` with fields, formats, preferences, AND mental model mapping.

---

## Step 3: E2E Test Data Audit + State Transitions

**Purpose:** Ensure E2E tests use REAL data, map state transitions, and verify component appropriateness.

**The Three Pillars:**
| Pillar | Requirement | Why |
|--------|-------------|-----|
| **Real Data** | Actual files/documents | Fake data hides field discovery issues |
| **Real Infrastructure** | Docker/local dev server | Mocks hide integration bugs |
| **Real Services** | Actual API calls | Stubs don't verify real behavior |

**Rules:**
| Test Level | Data | Infrastructure | Services |
|------------|------|----------------|----------|
| Unit | Mock OK | N/A | Mock OK |
| Integration | Real preferred | Mock OK | Mock OK |
| **E2E** | **MUST be real** | **MUST be real** | **MUST be real** |

**State Transitions:**

For each flow, document what changes:
| Step | Action | Before State | After State |
|------|--------|--------------|-------------|
| 1 | User opens app | No session | No session |
| 2 | User submits login | No session | Session created |
| 3 | Redirect | /login | /dashboard |

**Persistent State to Track:**

- Session/token storage
- User data in state management
- Database changes
- Cache/localStorage changes

**Component Appropriateness:**

| Flow Step   | Component Needed | Exists? | Reuse/Create |
| ----------- | ---------------- | ------- | ------------ |
| Email input | TextInput        | ?       | Reuse shared |
| Password    | PasswordInput    | ?       | Reuse shared |
| Submit      | LoadingButton    | ?       | Create new   |
| Error       | InlineError      | ?       | Reuse shared |

**Red Flags:**

```python
# BAD - Programmatically generated test data
img = Image.new('RGB', (800, 600), color='white')

# BAD - Mocked external services
@mock.patch('openai.ChatCompletion.create')

# GOOD - Real artifacts + real infrastructure
real_bill = Path("tests/fixtures/bills/real_invoice.pdf")
```

**Infrastructure Requirements:**

```bash
docker-compose up -d  # OR ./scripts/start-dev.sh
```

**Output:** `E2E_DATA.md` with test files, state transitions, component needs, AND infrastructure requirements.

**GATE: AI Team Consensus Required**

```
Before proceeding to Step 10.5:
- @architect reviews interfaces and architecture
- @investigate confirms gap analysis
- @security reviews error handling
- Domain expert review complete (Step 2)
- E2E test data validated as real (Step 3)
- All must APPROVE or provide specific feedback
```

---

## Step 3.5: Golden Reference + Boost Discovery

### Part A: Golden Reference Search (AUTO for FULL tier)

**Trigger:** Automatic for FULL tier. Manual via `/golden` for STANDARD/FEATURE.
**Purpose:** Find the best existing implementations of what we're building. Learn from production codebases before writing any code.

**Process:** Run `/golden "{feature description}"` — see `command/golden.md` for full protocol.

**Key outputs injected into subsequent steps:**
- Architecture consensus from top repos → informs Step 5 (Interfaces)
- Edge cases from production bugs → informs Step 4 (Test Cases) and Step 7 (Errors)
- Anti-patterns to avoid → informs test assertions
- Recommended patterns → informs Step 11 (Planning)

**Persistence:** Store report in Serena memory as `golden_{evo_id}_reference`.

---

### Part B: Boost Library Discovery (OPT-IN)

**Trigger:** `--boost` flag on `/evo start` or `/flow`, OR user says "boost" during discovery.
**Default:** SKIPPED. Never auto-triggered.

**Purpose:** Choose a specific library/dependency after golden reference established the approach. Prevents building from scratch when a library already solves the problem.

**When to use:**

- Multiple viable libraries exist ("Prisma vs Drizzle vs TypeORM?")
- Complex API integrations (payment, auth, ML providers)
- User is unsure what tools exist
- High-stakes choice where wrong pick = days of rework

**When to skip:**

- User already specified the tool ("Build auth with Clerk")
- Golden reference already identified the right library
- Simple CRUD, well-known patterns
- Bug fixes, refactors, trivial changes

### Sub-step 3.5A — Extract I/O Spec

Using context from Steps 1-3, extract:

```markdown
## I/O Specification

### INPUTS

| Name | Type | Example | Source | Constraints |
| ---- | ---- | ------- | ------ | ----------- |

### EXPECTED OUTPUTS

| Name | Type | Example | Quality Check |
| ---- | ---- | ------- | ------------- |

### TRANSFORMATION

{What the "black box" between input and output needs to do}

### CONSTRAINTS

- Language: {language}
- Runtime: {runtime}
- Max latency: {ms}
- Must be: {requirements list}
- Must NOT: {exclusions list}
```

### Sub-step 3.5B — USER GATE: Confirm I/O

Present the I/O spec to user. **STOP and wait for confirmation.**

### Sub-step 3.5C — Research (Omnisearch + Context7)

**Research cascade:**

**Layer 1: Omnisearch (broad discovery + targeted acquisition)**

1. `web_search(tavily)` — broad discovery: `"{problem} {language} library"`, `"{problem} open source solution"`
2. `web_search(brave)` — specific source acquisition: `site:github.com "{library}"`, `site:reddit.com "{library} vs"`, `site:npmjs.com "{library}"`
3. `ai_search(linkup)` — synthesized comparison when results conflict or lack depth

**Layer 2: Context7 (library docs)**

4. `resolve-library-id` + `query-docs` — API surface, usage patterns, gotchas for shortlisted candidates

**IMPORTANT:** Collect source URLs at every step. Every claim must trace to a URL the user can verify.

### Sub-step 3.5D — Filter & Rank

Discard artifacts that are:
| Category | Icon | Example |
|----------|------|---------|
| `constraint_violation` | prohibited | Requires GPU, wrong language |
| `unmaintained` | warning | No commits in 12+ months |
| `overengineered` | building | Enterprise suite for a single feature |
| `flaky` | crash | High crash rate, no tests |
| `too_expensive` | money | Violates cost constraints |
| `wrong_platform` | platform | Wrong language/runtime |
| `partial_no_value` | package | Too limited to be useful |
| `duplicate` | duplicate | Same as a better-ranked option |

Keep top 3-5 candidates.

### Sub-step 3.5E — Mini-FMVP (Code Snippets)

For each top candidate, write a code snippet showing:

1. How to install/import
2. How to transform the specified input to output
3. Expected latency and cost (from docs/benchmarks)

### Sub-step 3.5F — USER GATE: Present Winners, Losers & POC

**MANDATORY OUTPUT FORMAT:**

```markdown
## Boost Discovery Report

### Winners (Top 3)

| #   | Solution | Pros               | Cons               | Effort | Sources                     |
| --- | -------- | ------------------ | ------------------ | ------ | --------------------------- |
| 1   | {name}   | + {pro1}, + {pro2} | - {con1}, - {con2} | {hrs}  | [GH]({url}), [docs]({url})  |
| 2   | {name}   | + {pro1}, + {pro2} | - {con1}, - {con2} | {hrs}  | [npm]({url}), [blog]({url}) |
| 3   | {name}   | + {pro1}, + {pro2} | - {con1}, - {con2} | {hrs}  | [GH]({url}), [docs]({url})  |

### Losers ({count} discarded)

| Name   | Category       | Why It Lost              | Source        |
| ------ | -------------- | ------------------------ | ------------- |
| {name} | unmaintained   | Last commit 2023-04      | [GH]({url})   |
| {name} | overengineered | 50+ deps for one feature | [npm]({url})  |
| {name} | wrong_platform | Python only, no JS       | [docs]({url}) |

### POC Recommendation

{If top 2 winners are close, or user is uncertain:}

> **Suggest:** 30-min sandbox POC with #{1} — test {specific I/O scenario}.
> **Skip POC if:** Winner is clear AND has >5K stars AND team has prior experience.

---

**Which solution?** [1 / 2 / 3 / POC first / None — research more]
```

**STOP POINT:** User must pick a solution before proceeding to Step 4.

**After user picks:** Steps 4-10 proceed with the chosen solution as context.
If user picks "POC first" → run Sub-step 3.5G before continuing.

**Persistence:** Store report in Serena memory as `boost_{evo_id}_report`.

**Metrics Collection (MANDATORY after Step 3.5F):**

Append one entry to `docs/evo/.boost-metrics.yaml`.

**Source verification (MANDATORY):** Every URL in Winners and Losers tables must be verified via `mcp_webfetch` or `web_search`. Broken/hallucinated URLs = blocked from output.

### Sub-step 3.5G — POC Sandbox (OPT-IN)

**Trigger:** User picks "POC first" in 3.5F, or top 2 winners are too close to call.

**Process:**

1. Create throwaway test file: `__boost_poc_{solution}.{ext}`
2. Install candidate: `npm i {lib}` / `pip install {lib}` / etc.
3. Implement the I/O spec from 3.5A — transform input → expected output
4. Run it. Report: works / partially works / fails
5. Clean up: remove test file, uninstall if needed

**Output:** Append POC result to the Boost Discovery Report, then re-ask the user:

```markdown
### POC Result: {solution}

- **Status:** works / partial / failed
- **Notes:** {what happened, any surprises}
- **Time spent:** {minutes}

**Pick now?** [1 / 2 / 3 / None — research more]
```

**STOP POINT:** User must pick after POC.

---

## Step 10.5: Flow Decomposition Gate

**Purpose:** Present ALL user flows with E2E test ideas. User approves before planning.

**MANDATORY OUTPUT FORMAT:**

```markdown
## Discovery Complete: EVO{N} - Feature Name

### Flows Identified

| #   | Flow Name | User Goal      | E2E Test Idea             | Scope      |
| --- | --------- | -------------- | ------------------------- | ---------- |
| 1   | Login     | Access account | User logs in successfully | ~80 lines  |
| 2   | Register  | Create account | New user completes signup | ~100 lines |

### Flow Diagrams (ASCII - NOT Mermaid)

#### Flow 1: Login

[Landing] --Login btn--> [Login Form] --submit--> [Dashboard]
--invalid--> [Error msg]

### Collision Check

- No existing login flow in codebase
- No semantic overlap with other EVOs

### Scope Validation

- Total: N flows = N sub-EVOs
- Max scope: ~100 lines
- All within limits (max 100 lines per sub-EVO)

### smoke.md Preview (E2E Tests)

Each flow becomes a section in smoke.md for agent-browser execution.

---

**Approve flow decomposition before planning?** [Y/N]
```

**Validation Rules:**

- Each flow = ONE E2E test = ONE sub-EVO
- Max scope per sub-EVO: ~100 lines
- Must check for collision with existing flows
- Must show ASCII diagram (NOT Mermaid - simpler to read)
- Must preview smoke.md test ideas

**STOP POINT:** User must approve before proceeding to PLANNING.

---

## Discovery Checklist

- [ ] Step 1: Flow defined with user journey
- [ ] Step 2: Domain expert review + **user mental model** documented
- [ ] Step 3: E2E test data + **state transitions** + component check
- [ ] **Step 3.5A (FULL tier):** Golden reference report — top 3 repos, architecture consensus, edge cases, anti-patterns
- [ ] **Step 3.5B (if --boost):** I/O spec extracted and user-confirmed
- [ ] **Step 3.5B (if --boost):** Library research complete (Omnisearch → Context7)
- [ ] **Step 3.5 (if --boost):** Winners (top 3) with pros, cons, and source URLs
- [ ] **Step 3.5 (if --boost):** Losers listed with category, reason, and source URLs
- [ ] **Step 3.5 (if --boost):** All source URLs verified (no hallucinated links)
- [ ] **Step 3.5 (if --boost):** POC run (if requested or top 2 too close)
- [ ] **Step 3.5 (if --boost):** User picked solution → informs Steps 4-10
- [ ] Step 4: Test cases with happy/error/edge paths
- [ ] Step 5: Interfaces added to schema.yaml
- [ ] Step 6: Communication patterns documented
- [ ] Step 7: Errors cataloged with handling strategy
- [ ] Step 8: Services identified (new vs existing)
- [ ] Step 9: Existing coverage audited
- [ ] Step 10: Gaps identified with action items
- [ ] **GATE:** Agent review consensus
- [ ] **Step 10.5:** Flow decomposition with ASCII diagrams
- [ ] **Step 10.5:** Collision check passed
- [ ] **Step 10.5:** Scope validated (~100 lines max per sub-EVO)
- [ ] **GATE:** User approves flow breakdown
