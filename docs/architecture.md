# Architecture Overview

S.A.G.E. is an OpenCode agent framework organized around explicit roles, safe delegation, and repeatable workflows. It is designed to be copied and adapted, not consumed as a packaged product.

## Core Model

OpenCode supports primary agents and subagents. S.A.G.E. uses that split as the main architectural boundary.

```text
Primary agents
  receive the user's request
  decide whether work is simple or multi-step
  route to subagents when specialization helps
  summarize status and request human gates

Subagents
  do one focused job
  return structured findings or edits
  avoid unrelated improvements
  surface blockers instead of guessing
```

Primary agents are the entry points. Examples include general coding and product/design entry points. Subagents handle focused work such as implementation, investigation, security review, UI verification, writing, schema mapping, and maintenance.

## Routing and Delegation

The framework assumes that different tasks need different operating modes. A bugfix should not follow the same path as a product design sprint or a security audit.

```text
Request
  │
  ├─ simple and reversible ───────► primary agent handles directly
  │
  ├─ unclear or research-heavy ───► research / investigation agents
  │
  ├─ code change needed ──────────► implementer + verifier
  │
  ├─ UI/product work ─────────────► product + UI agents
  │
  └─ high-risk or sensitive ──────► security + review agents
```

Delegation works best when each handoff includes:

- the goal;
- relevant files or schemas;
- constraints and non-goals;
- expected output format;
- verification commands or acceptance criteria.

The agent files in `agent/` encode these expectations as reusable prompts. They are intentionally opinionated: implementation agents favor TDD, verification agents stay read-focused, security agents classify real risk, and writer agents turn structured facts into concise prose.

## Guardrails, Skills, Commands, and Plugins

S.A.G.E. combines four OpenCode extension surfaces.

```text
RULES.md + guardrails.json
  shared behavior and safety boundaries

agent/*.md
  named workers with role prompts and permissions

skill/*/SKILL.md
  reusable workflows loaded when a task matches

command/*.md
  slash-command prompts for repeatable entry points

plugins/*
  optional runtime hooks and automation examples
```

### Guardrails

Guardrails define operating principles: keep changes small, avoid speculation, verify claims, preserve public/private boundaries, and stop when user input is required. They are not a substitute for code review, but they reduce common failure modes.

### Skills

Skills package reusable methods such as TDD, debugging, service patterns, prioritization, reversibility checks, and discovery/planning phases. They are lighter than agents: a skill teaches the current agent how to perform a workflow; an agent changes who performs the work.

### Commands

Commands are reusable prompts for common workflows. They are useful when a process should start from a consistent checklist instead of an ad hoc request.

### Plugins

Plugins are optional. Treat them as examples until reviewed in your own environment. They can hook into OpenCode behavior, so keep them small, public-safe, and easy to disable.

## Public / Private Boundary

This mirror contains public-safe framework files only. The boundary is part of the architecture.

```text
Public mirror
  agents
  skills
  commands
  docs
  guardrail examples
  plugin examples

Private local config
  provider credentials
  model accounts
  MCP server settings
  project paths
  infrastructure details
  logs, sessions, traces, plans, decisions
```

Keep provider settings and operational details outside the mirror. In practice, that means you can share prompts and patterns, but each user supplies their own private OpenCode configuration and credentials.

## Extension Points

Use this framework as a starting point, then trim it to your needs.

| Extension point | Add when | Keep it safe by |
| --- | --- | --- |
| Agent | A role needs its own scope, permissions, or voice | Writing one job, one output contract |
| Skill | A repeatable method applies across many agents | Describing trigger conditions clearly |
| Command | A workflow starts the same way every time | Keeping prompts public-safe and project-neutral |
| Plugin | OpenCode runtime behavior needs automation | Reviewing code and avoiding secrets |
| Guardrail | A failure pattern should be prevented everywhere | Making the rule concrete and testable |

Good extensions are boring: they reduce ambiguity, prevent repeated mistakes, and make handoffs easier to review.

## Typical Flow

```text
1. User gives intent.
2. Primary agent classifies the task.
3. Research agent gathers evidence if needed.
4. Implementer makes the smallest useful change.
5. Verifier checks tests, contracts, and risk.
6. Writer or primary agent summarizes what changed.
7. Human reviews before commit, push, or release.
```

The human remains responsible for credentials, production actions, irreversible decisions, and final review.
