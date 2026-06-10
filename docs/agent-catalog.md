# Agent Catalog

This catalog is a browsing guide for the public-safe agents in `agent/`. Copy only the agents that fit your workflow, then adapt descriptions, permissions, and model tiers to your own OpenCode setup.

Model notes are intentionally generic. Use stronger models for strategy, architecture, security, and final review; use faster models for scouting, maintenance, and structured extraction.

## Orchestration

| Agent | Role | When to use | Notes / model tier |
| --- | --- | --- | --- |
| `build` | General primary coding agent | Everyday coding tasks that do not need a full workflow | Primary; balanced coding model |
| `product-designer` | Primary product/design lead | Turning vague product intent into flows, specs, prototypes, or handoffs | Primary; strategy/design tier |
| `orchestrator` | Universal workflow router | Multi-step work that needs research, parallel tasks, or synthesis | Strategy tier |
| `main-orchestrator` | Phase-based lifecycle coordinator | Structured discovery/planning/red/green/complete workflows | Strategy tier; adapt or remove lifecycle terms if unused |
| `multiplex` | Parallel session coordinator | Splitting independent workstreams and aggregating results | Strategy tier; use only with strong contract checks |
| `decomposer` | Prompt decomposition | Converting messy or multi-intent input into a structured plan | Fast reasoning tier |
| `flow-scout` | Read-only scout | Fast file/context discovery before synthesis | Fast tier |
| `flow-alchemist` | Synthesis agent | Combining scout findings into a recommendation or plan | Strategy tier |

## Implementation

| Agent | Role | When to use | Notes / model tier |
| --- | --- | --- | --- |
| `implement` | TDD implementer | Writing the smallest code change after the target behavior is clear | Strong coding tier |
| `ui-implementer` | UI implementation | Turning UI specs into accessible frontend code | Strong coding tier |
| `architect` | Architecture decision support | Choosing boundaries, tradeoffs, or designs that are costly to reverse | Strategy tier; keep human gates |
| `domain-expert` | Domain analysis | Understanding an unfamiliar domain before planning implementation | Fast/analysis tier |
| `analyst` | Data and metric analysis | Summarizing logs, calculations, metrics, or numeric evidence | Fast/analysis tier |
| `writer` | Technical writing | README sections, PR descriptions, runbooks, release notes, ADR prose | Writing tier; should not invent facts |

## Research

| Agent | Role | When to use | Notes / model tier |
| --- | --- | --- | --- |
| `investigate` | Codebase exploration | Finding root causes, relevant files, and implementation patterns | Strong reasoning tier |
| `deep-researcher` | Multi-pass research | Research requiring query expansion, source comparison, and citations | Strategy/research tier |
| `product-researcher` | Product/UX research | Finding examples, constraints, and product patterns | Research tier |
| `concept-sprinter` | Divergent concept generation | Producing alternative UX/product directions quickly | Fast creative tier |
| `product-critic` | Adversarial product critique | Stress-testing product concepts, scope, assumptions, and UX risks | Review tier |

## Verification

| Agent | Role | When to use | Notes / model tier |
| --- | --- | --- | --- |
| `verify` | Code review and test execution | Checking diffs, tests, and severity after implementation | Review tier |
| `codex-review` | Cross-provider review | Getting a second model family to review generated work | Review tier |
| `reflexion-critic` | Self-critique gate | Checking whether tests prove the bug and implementation fixes the root cause | Review tier |
| `contract-verifier` | Cross-contract verification | Checking API, database, UI, and workstream consistency | Review tier |
| `security` | Security audit and deep debugging | Reviewing auth, secrets, dependencies, validation, and threat exposure | Security/review tier |
| `guardrail-assessor` | Pre-block risk assessment | Evaluating whether a guardrail should stop or escalate work | Fast reasoning tier |
| `ui-verifier` | UI verification | Running visual, accessibility, and browser-level checks | Fast verification tier |

## UI / Product

| Agent | Role | When to use | Notes / model tier |
| --- | --- | --- | --- |
| `product-designer` | Product design primary | Framing users, constraints, design directions, and handoffs | Primary; strategy/design tier |
| `ui-designer` | Component/page spec writer | Translating product requirements and designs into implementation specs | Design tier; should not write production code |
| `ui-implementer` | Frontend builder | Implementing UI from approved specs | Strong coding tier |
| `ui-verifier` | Browser/a11y verifier | Checking UI output against acceptance criteria | Verification tier |
| `concept-sprinter` | Alternative direction generator | Exploring multiple product or visual directions | Fast creative tier |
| `product-researcher` | UX evidence gatherer | Finding patterns and examples before committing to a design | Research tier |
| `product-critic` | Product risk reviewer | Finding weak assumptions and scope creep | Review tier |

## Schema / Maintenance

| Agent | Role | When to use | Notes / model tier |
| --- | --- | --- | --- |
| `schema-api` | API schema mapper | Generating or refreshing API contract documentation from handlers | Fast extraction tier |
| `schema-db` | Database schema mapper | Generating or refreshing database schema docs from ORM/source | Fast extraction tier |
| `schema-ui` | UI schema mapper | Mapping frontend routes, screens, and components | Fast extraction tier |
| `contract-verifier` | Contract consistency checker | Validating that schema documents agree with each other | Review tier |
| `housekeeper` | Anti-entropy maintenance | Cleaning branches, docs, artifacts, memory, or stale structure after review | Fast tier; keep permissions conservative |
| `tidy-up` | Project janitor | Small maintenance passes across docs, artifacts, dependencies, and health checks | Fast tier; review before edits |

## Archived / Example Agents

| Agent | Role | When to use | Notes / model tier |
| --- | --- | --- | --- |
| `phase-discovery` | Discovery phase coordinator | Example of phase-based domain discovery and flow decomposition | Lifecycle example; adapt before use |
| `phase-planning` | Planning phase coordinator | Example of detailed planning, test strategy, and impact analysis | Lifecycle example; adapt before use |
| `phase-red` | Test-writing phase coordinator | Example of writing failing tests before implementation | Lifecycle example; adapt before use |
| `phase-green` | Implementation phase coordinator | Example of implementation plus quality gates | Lifecycle example; adapt before use |
| `phase-complete` | Completion phase coordinator | Example of final review and documentation handoff | Lifecycle example; adapt before use |
| `copilot-sonnet-4.6-smoke` | Smoke-test primary agent | Temporary compatibility or provider test pattern | Example only; usually remove |

## Copy / Adapt Guidance

- Start with `build`, `implement`, `verify`, `investigate`, `security`, and `writer`.
- Add product/UI agents only if you use OpenCode for design work.
- Add schema agents only if your projects maintain schema documents.
- Keep one primary entry point per workflow to avoid routing confusion.
- Replace model names and provider settings in your private config, not in this public mirror.
- Review permissions before enabling any agent that can edit files or run shell commands.
