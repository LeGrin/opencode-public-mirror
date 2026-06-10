# S.A.G.E / OpenCode Framework Public Mirror

This is a **local sanitized mirror** of selected public-safe framework files from a private OpenCode configuration.

## Included

- Agent descriptions from `agent/` and safe archived agent descriptions.
- Skill trigger/instruction files from `skill/*/SKILL.md`.
- Public-safe command prompt descriptions from `command/`.
- Guardrails and behavioral rules: `RULES.md`, `guardrails.json`.
- Selected framework docs under `docs/`.
- Public-safe plugin source files from `plugins/`.

## Excluded

This mirror intentionally excludes private or operational material: `.git`, `.opencode`, `.serena`, decisions, plans, EVO docs, logs, traces, sessions, runtime learnings, private memory, local config, MCP configuration/credentials, lazy-MCP hierarchy/config, token files, `.env` files, backups, usage/cache state, infra/private endpoint docs, generated graph data, and package/dependency state.

If a file looked uncertain, it was excluded rather than redacted.

## Use

Copy files from this mirror into an OpenCode config only after review. OpenCode loads config-time files on startup; quit and restart OpenCode after adopting agent, skill, plugin, command, or guardrail changes.

## Publishing

This directory is local only. It has not been committed, pushed, or made public by this generation step.
