---
name: tool-sonarqube
description: "Canonical workflow for SonarQube quality gate — strict project isolation, scan, verdict. Load when running or interpreting SonarQube scans."
---

# Tool Skill: SonarQube

> Load this skill when you need to run a scan, check a gate, onboard a project, or interpret SonarQube output.

## When To Use

- Before `/ship` or any merge gate
- When `sonar-gate` agent is invoked
- When debugging a BLOCK/WARN verdict
- When onboarding a new project to SonarQube

## Isolation Contract (MANDATORY)

**Never use `basename $(pwd)` as a project key.** This causes cross-project cache pollution.

The script enforces this — it will exit 1 if no key can be resolved cleanly.

```
projectKey resolution order:
  1. --project-key <key>  (explicit flag — highest priority)
  2. sonar-project.properties → sonar.projectKey
  3. FAIL FAST — no fallback
```

## Exact Commands

```bash
# Status check (safe, read-only)
<opencode-config>/scripts/sonar-gate.sh --status

# Status from explicit root (use when CWD is ambiguous)
<opencode-config>/scripts/sonar-gate.sh --status --root <project-path>

# Scan + gate check (blocks until gate resolves)
<opencode-config>/scripts/sonar-gate.sh --scan

# Scan with explicit key (no sonar-project.properties required)
<opencode-config>/scripts/sonar-gate.sh --scan --project-key my-project

# Gate check only (after manual scan)
<opencode-config>/scripts/sonar-gate.sh --check

# Branch analysis (requires Developer Edition)
<opencode-config>/scripts/sonar-gate.sh --scan --branch feature/my-branch

# PR decoration (requires Developer Edition)
<opencode-config>/scripts/sonar-gate.sh --scan \
  --pr 42 --pr-branch feature/x --pr-base main
```

## Token Resolution

```
1. Private env var
2. Private local token file outside the repository
```

Never hardcode tokens. Never echo tokens to stdout. Never commit token files.

## Cache Isolation

The script sets:
- `sonar.userHome=<sonar-cache-dir>/<projectKey>` — per-project cache
- `sonar.working.directory=<root>/.sonar/scanner-work` — per-project work dir
- `sonar.projectBaseDir=<root>` — explicit, never inferred

This prevents one project's analysis from polluting another's cache.

## Onboarding a New Project

```bash
# 1. Create sonar-project.properties in project root
cat > sonar-project.properties <<EOF
sonar.projectKey=my-project-name
sonar.projectName=My Project Name
sonar.sources=.
sonar.exclusions=**/node_modules/**,**/.next/**,**/dist/**,**/build/**,**/__pycache__/**
EOF

# 2. Create project on server using a private token source
curl -s -X POST -H "Authorization: Bearer <private-token>" \
  "http://localhost:9000/api/projects/create?name=my-project-name&project=my-project-name"

# 3. Run initial scan
<opencode-config>/scripts/sonar-gate.sh --scan
```

## Verdict Interpretation

| Gate Status | Verdict | Action |
|-------------|---------|--------|
| OK          | PASS    | Proceed |
| WARN        | WARN    | Show conditions, ask user |
| ERROR       | BLOCK   | List failing conditions, must fix |
| Server DOWN | SKIP    | Non-blocking — warn user, continue |

## Failure Modes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot determine project key` | No properties + no `--project-key` | Create `sonar-project.properties` or pass `--project-key` |
| `HTTP 401` | Token invalid/expired | Regenerate: `curl -X POST -u admin:admin http://localhost:9000/api/user_tokens/generate?name=...` |
| `Server DOWN` | Docker stopped | `docker start legrin-sonarqube` |
| `scanner not found` | sonar-scanner not installed | `brew install sonar-scanner` |
| `qualitygate.wait timeout` | Scan too slow | Increase `--Dsonar.qualitygate.timeout=600` |

## Safety Gates

- **Never run `--scan` in CI without `sonar-project.properties`** — ambiguous key = wrong project analyzed
- **Never pass `--project-key $(basename $(pwd))`** — defeats isolation
- **Branch/PR flags require Developer Edition** — Community Edition silently ignores them; document this in scan output
- **Server DOWN is non-blocking** — script exits 1 but callers should treat as SKIP, not BLOCK

## Edition Caveat

Branch analysis (`--branch`) and PR decoration (`--pr`) require **SonarQube Developer Edition or above**.

**Community Edition (default self-hosted) silently ignores these props** — the scan succeeds but analyzes the main branch, not the feature branch. No error is raised. This is a silent correctness failure.

The script emits a multi-line WARNING to stderr when these flags are used:
```
WARNING: Branch analysis requires SonarQube Developer Edition or above.
         Community Edition will SILENTLY ignore sonar.branch.name and scan main branch.
         Verify your edition at: http://localhost:9000/api/system/status
```

Both flags are **opt-in only** — they are never passed unless explicitly provided. No auto-detection of current git branch occurs.
