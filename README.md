# S.A.G.E. for OpenCode

A curated, public-safe starter framework for routing AI coding work through specialized OpenCode agents, skills, guardrails, and review loops.

## What This Is

S.A.G.E. is an agent framework for developers who want more structure than a single all-purpose coding assistant. It treats OpenCode as a small team: one primary agent receives intent, decomposes the work, delegates to focused subagents, and asks verification agents to check the result.

This repository is a sanitized portfolio mirror. It is useful as a reference implementation and starter kit, but it is not a packaged product yet. Expect to copy, review, and adapt the files before using them in your own OpenCode setup.

## Why It Exists

Large AI-assisted coding sessions fail when every task goes through one overloaded prompt. S.A.G.E. separates responsibilities:

- orchestration agents decide what should happen next;
- implementation agents make small, testable changes;
- research agents gather evidence before decisions;
- verification agents review diffs, contracts, UI behavior, and security;
- skills encode repeatable workflows like TDD, debugging, prioritization, and architectural discovery.

The goal is not more ceremony. The goal is safer delegation, smaller changes, and clearer handoffs.

## Quick Start

1. Install and configure [OpenCode](https://opencode.ai/).
2. Copy the public-safe pieces you want into your OpenCode config directory:

   ```text
   agent/      -> your OpenCode agent directory
   skill/      -> your OpenCode skill directory
   command/    -> your OpenCode command directory
   plugins/    -> your OpenCode plugin directory, after review
   RULES.md    -> shared instructions, if they fit your workflow
   ```

3. Provide your own private configuration separately:
   - model/provider settings;
   - API keys and credentials;
   - MCP server configuration;
   - project-specific paths and infrastructure details.
4. Review every copied file before enabling it.
5. Restart OpenCode so config-time files are reloaded.

Do not copy provider credentials or machine-specific config from any other source. This mirror intentionally excludes private OpenCode configuration.

## Directory Map

```text
.
├── agent/       Specialized primary agents and subagents
├── command/     Public-safe slash-command prompts
├── docs/        Framework documentation and references
├── plugins/     Optional OpenCode plugin examples
├── skill/       Reusable workflow instructions
├── guardrails.json
├── RULES.md     Shared operating principles
└── README.md
```

## Architecture at a Glance

```text
User intent
   │
   ▼
Primary agent
   │  decomposes, routes, asks for gates
   ├──────────────┬──────────────┬──────────────┐
   ▼              ▼              ▼              ▼
Research       Implement      UI/Product      Security
agents         agents         agents          agents
   │              │              │              │
   └──────────────┴──────┬───────┴──────────────┘
                         ▼
                  Verification agents
                         │
                         ▼
                 Reviewed output + notes
```

Read the full overview in [`docs/architecture.md`](docs/architecture.md).

## Featured Workflows

### Bugfix

```text
investigate -> implement -> verify -> reflexion-critic
```

Use when a bug needs evidence, a minimal fix, and a final review. The implementation path favors TDD: reproduce the issue, make the smallest change, then run verification.

### Design / Product

```text
product-designer -> concept-sprinter / product-researcher -> ui-designer -> ui-implementer -> ui-verifier
```

Use when a vague idea needs to become a decision-ready flow, component spec, prototype, or implementation handoff.

### Security Review

```text
security -> codex-review -> verify
```

Use for threat modeling, vulnerability review, dependency concerns, and adversarial review of sensitive changes.

### Validation

```text
contract-verifier -> schema-* agents -> verify
```

Use when API, database, and UI assumptions need to stay aligned across a codebase.

## Public / Private Boundary

This mirror includes reusable framework ideas only. It does not include:

- secrets, tokens, credentials, or environment files;
- provider and account configuration;
- private hostnames, IP addresses, or infrastructure details;
- private project references, logs, sessions, traces, plans, or decision records;
- operational memory or machine-specific state.

If you adapt this framework, keep the same boundary: agents and skills can be public; credentials, infrastructure, and project memory stay private.

## Safety Philosophy

S.A.G.E. is built around a few practical rules:

- **Small changes beat sweeping rewrites.** Make the smallest useful edit.
- **Tests and verification are fixed stars.** Do not trust generated code without checks.
- **Delegation needs contracts.** Every subagent should know its scope and output.
- **Fail loudly.** Unknowns, blocked decisions, and missing context should be surfaced.
- **Public artifacts must be sanitized.** Do not mix reusable framework files with private operations.

## Docs

- [`docs/architecture.md`](docs/architecture.md) — routing model, guardrails, extension points.
- [`docs/agent-catalog.md`](docs/agent-catalog.md) — browsable list of agents and suggested uses.

## Status

This is a curated sanitized mirror for portfolio and starter-kit use. It is not yet a one-command installer, a hosted service, or a complete OpenCode distribution.
