---
description: Generate docs/schema/infrastructure.yaml and auto-populate risk_allowlist
agent: sage
---

# /schema infra — Infrastructure Map Generator

Run `@infra-guardian` to map CI pipelines, Docker services, deploy targets, and env vars. Writes `docs/schema/infrastructure.yaml` and auto-populates `project-manifest.yaml.risk_allowlist.safe_hosts` from `.ops-manifest.yaml`.

## Usage

```bash
/schema infra                 # Generate or refresh infrastructure.yaml
/schema infra --force         # Ignore freshness cache
/schema infra --sync          # Only re-sync risk_allowlist from ops-manifest
```

## What happens

1. Reads `.ops-manifest.yaml` if present — authoritative source for IPs / SSH aliases.
2. `Task(infra-guardian)` is dispatched. Walks `.github/workflows/`, Dockerfiles, `docker-compose*.yml`, `.env.example`, Terraform, Kubernetes manifests.
3. For each Docker service, captures `container_name`, `safe_operations`, `dangerous_operations` — used by container-name validation in `@cloud` and `sage-manifest-gate`.
4. Flags secrets in `env_vars` with `secret: true`.
5. **Auto-populates `project-manifest.yaml.risk_allowlist.safe_hosts`** from ops-manifest servers (merge-only, preserves user entries).
6. Output path: `{cwd}/docs/schema/infrastructure.yaml`.
7. Memory trace: `findings_{session}_infra-guardian`.

## When to run

- First `/init` — establishes baseline and seeds `risk_allowlist`.
- After CI/Docker/deploy changes.
- After editing `.ops-manifest.yaml` to re-sync safe hosts.
- `@cloud` reads this before any `docker exec` / `ssh` / `kubectl` for container-name validation.

## Security note

`env_vars` block records *names and locations* only — never values. Secrets never land in the schema file or in git.
