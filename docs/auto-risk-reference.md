# /auto Risk Scoring & Execution Reference

> Detailed reference for risk scoring, execution phases, error handling, and state management.
> Command overview: `command/auto.md`

## Risk Scoring Algorithm

Each operation gets a risk score. Sum of all factors:

| Risk Factor                     | Score | Examples                                         |
| ------------------------------- | ----- | ------------------------------------------------ |
| **Self-modification**           | +50   | Editing AGENTS.md, risk rules, safety configs    |
| **Filesystem outside project**  | +40   | Access to credential dirs, `/etc`, system files  |
| **Data deletion**               | +35   | DELETE, DROP, TRUNCATE, purge, destroy           |
| **Shell command execution**     | +35   | rm, curl\|sh, exec, eval, system calls           |
| **Payment processing**          | +20   | Billing, transactions, payment APIs              |
| **PII/Privacy handling**        | +20   | Email, password, SSN, credit card, personal data |
| **Network exfiltration risk**   | +18   | Outbound HTTP to unknown hosts, webhooks         |
| **Security-sensitive**          | +15   | Auth, sessions, crypto, tokens                   |
| **Authorization changes**       | +15   | Permissions, roles, access control, admin        |
| **Critical infrastructure**     | +12   | CI/CD, monitoring, logging core                  |
| **Database migration**          | +10   | Schema changes, data migrations                  |
| **API contract changes**        | +8    | Breaking changes, public APIs                    |
| **New external dependency**     | +5    | npm install, pip install                         |
| **>5 files changed**            | +5    | Large refactors                                  |
| **Configuration changes**       | +4    | Environment, build, deploy configs               |
| **>100 lines changed**          | +3    | Substantial implementations                      |
| **First time in codebase area** | +3    | New modules, unfamiliar patterns                 |

### Keyword Detection Patterns

| Risk Factor                    | Keywords                                                                                                              |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| **Self-modification**          | `AGENTS.md`, `risk`, `checkpoint`, `threshold`, `auto.md`, `safety`                                                   |
| **Filesystem outside project** | `<credential-dir>`, `<opencode-config>`, `/etc`, `credentials`, `id_rsa`, `secrets`                                  |
| **Data deletion**              | `delete`, `remove`, `drop`, `truncate`, `purge`, `destroy`, `wipe`, `clear`, `erase`                                  |
| **Shell execution**            | `rm -rf`, `curl.*\|.*sh`, `exec`, `eval`, `system`, `spawn`, `child_process`                                          |
| **Payment**                    | `payment`, `billing`, `stripe`, `charge`, `invoice`, `subscription`, `refund`, `transaction`                          |
| **PII/Privacy**                | `email`, `password`, `ssn`, `credit_card`, `phone`, `address`, `personal`, `user_data`, `profile`, `dob`, `birthdate` |
| **Network exfiltration**       | `fetch`, `axios`, `http.request`, `webhook`, `external_url`, `POST.*http`                                             |
| **Security**                   | `auth`, `login`, `session`, `token`, `jwt`, `oauth`, `crypto`, `encrypt`, `hash`, `secret`                            |
| **Authorization**              | `permission`, `role`, `access`, `grant`, `revoke`, `admin`, `privilege`, `acl`, `rbac`, `policy`                      |
| **Infrastructure**             | `ci`, `cd`, `pipeline`, `deploy`, `docker`, `kubernetes`, `terraform`, `monitoring`, `logging`                        |
| **Migration**                  | `migration`, `schema`, `alter`, `migrate`, `seed`, `rollback`                                                         |
| **API changes**                | `breaking`, `deprecated`, `v2`, `api_version`, `contract`, `swagger`, `openapi`                                       |
| **External deps**              | `npm install`, `pip install`, `yarn add`, `go get`, `cargo add`                                                       |
| **Config changes**             | `.env`, `config.json`, `settings`, `environment`, `secrets.yaml`                                                      |

**Detection Logic:** Scan description → file paths → code changes → sum factors → highest per category (no double-counting). Score 50+ = BLOCKED.

## Checkpoint Triggers

| Risk Range | Behavior                        | Checkpoints                           |
| ---------- | ------------------------------- | ------------------------------------- |
| **0-10**   | Auto-proceed                    | None (full autonomy)                  |
| **11-20**  | Checkpoint at EVO end           | 1 (final review)                      |
| **21-34**  | Checkpoint after each iteration | Multiple (per iteration)              |
| **35-49**  | **HUMAN APPROVAL REQUIRED**     | Cannot proceed without explicit yes   |
| **50+**    | **BLOCKED**                     | Manual only, autonomous mode disabled |

**Safety rules:** Data deletion (35+) = human "yes". Shell execution (35+) = human review. Filesystem outside project (40+) = NEVER auto-approved. Self-modification (50+) = BLOCKED.

## Execution Phases

1. **Risk Assessment** (always) — scan feature, calculate score, determine checkpoint frequency
2. **Research** (auto if risk < 21) — parallel investigate + explore agents, 30-60s
3. **Design** (auto if risk < 21) — generate architecture, plan iterations (max 50 lines each)
4. **Implementation** (risk-based checkpoints) — TDD per iteration, auto-proceed if under threshold
5. **Validation** (always) — full test suite, code review (risk > 15), security scan (risk > 20)
6. **Ship** (checkpoint if risk > 10) — commit, push, report metrics

## Error Handling

### Automatic Recovery

- On test failure: analyze → fix → retry (up to 2 retries per iteration)
- On 3rd failure: `git revert` to last checkpoint, escalate to human

### Git Safety Net

Before each iteration: `git add -A && git commit -m "auto: checkpoint before iteration N"`
On 3rd failure: revert to checkpoint. **Never leave broken code on disk.**

## State Management

Auto-mode state stored in Serena memory: feature, risk score, current phase, last checkpoint, context usage, failure count, next actions.

```bash
/auto pause    # Saves state, stops at next safe point
/auto resume   # Continues from last checkpoint
/auto status   # Shows current state
/auto reset    # Clear session state
```

## Context Management

- **80% context** — auto-save state, suggest new session
- **90% context** — mandatory handoff, save and restart with `/auto resume`
