---
description: MVP security scan - secrets, CVEs, common vulnerabilities.
agent: security
---

MVP security scan for secrets, dependency CVEs, and common vulnerabilities.

## Usage

- `/security` - Full security scan
- `/security secrets` - Only secret scanning
- `/security deps` - Only dependency CVEs
- `/security code` - Only code vulnerabilities

## Philosophy

**MVP Security = Block the obvious attacks**

We check:

- Exposed secrets (API keys, tokens, passwords)
- Known CVEs in dependencies
- Common injection points
- Framework-specific exploits

We DON'T do:

- Penetration testing
- Full OWASP compliance
- Enterprise security audit

## Process

### 1. Secret Scanning

Scan for exposed secrets using gitleaks patterns:

```bash
# Patterns to search (grep -r or ripgrep)
```

**High Severity Patterns:**

```
# API Keys
[aA][pP][iI]_?[kK][eE][yY].*['\"][0-9a-zA-Z]{16,}['\"]
OPENAI_API_KEY|ANTHROPIC_API_KEY|STRIPE_KEY

# AWS
AKIA[0-9A-Z]{16}
aws_secret_access_key

# Private Keys
-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----

# Tokens
gh[pousr]_[0-9a-zA-Z]{36}  # GitHub
xox[baprs]-[0-9a-zA-Z]{10,}  # Slack
sk-[0-9a-zA-Z]{48}  # OpenAI
sk-ant-[0-9a-zA-Z-]{90,}  # Anthropic

# Passwords
[pP]assword\s*[=:]\s*['\"][^'\"]{8,}['\"]
[sS]ecret\s*[=:]\s*['\"][^'\"]{8,}['\"]

# Database URLs
postgres://.*:.*@
mysql://.*:.*@
mongodb(\+srv)?://.*:.*@
```

**Check Locations:**

- All source files
- .env files (should be in .gitignore)
- Config files (_.json, _.yaml, \*.toml)
- Docker files
- CI/CD configs (.github/, .gitlab-ci.yml)

**Git History Check:**

```bash
# Check if secrets ever committed
git log -p --all -S 'API_KEY' --  # Example
git log -p --all -S 'password' --
```

### 2. Dependency CVE Scan

Run appropriate audit tool:

**Node.js:**

```bash
npm audit --json
# Parse: severity (critical, high, medium, low)
# Show: package name, CVE, fix version
```

**Python:**

```bash
pip-audit --format json
# Or: safety check --json
```

**Go:**

```bash
govulncheck ./...
```

**Output format:**

```markdown
### Dependencies with CVEs

| Package | Severity | CVE            | Fix Version |
| ------- | -------- | -------------- | ----------- |
| lodash  | High     | CVE-2021-23337 | 4.17.21     |
```

### 3. Code Vulnerability Scan

Use @security agent for:

**Injection Points:**

- SQL injection (string concatenation in queries)
- Command injection (shell exec with user input)
- XSS (unescaped output, dangerouslySetInnerHTML)
- Path traversal (user input in file paths)

**Auth Issues:**

- Hardcoded credentials
- Weak password requirements
- Missing rate limiting on auth endpoints
- JWT without expiration

**Data Exposure:**

- Sensitive data in logs
- Verbose error messages in production
- Debug endpoints exposed

### 4. Framework-Specific Checks

**Next.js:**

- Server actions exposing sensitive logic
- Environment variables without NEXT*PUBLIC* leaking
- API routes without auth middleware

**FastAPI:**

- CORS misconfiguration (allow_origins=["*"])
- Missing input validation (Pydantic models)
- Debug mode in production

**React:**

- dangerouslySetInnerHTML usage
- Storing sensitive data in localStorage
- Console.log with sensitive data

**Express:**

- Missing helmet middleware
- Body parser without limits
- Session cookies without secure flag

## Output

```markdown
## Security Scan Results

### Secrets Found

| Type           | File      | Line | Status          |
| -------------- | --------- | ---- | --------------- |
| OpenAI API Key | .env      | 3    | In .gitignore ✓ |
| AWS Key        | config.js | 45   | EXPOSED         |

### Dependency CVEs

| Package | Severity | CVE            | Action            |
| ------- | -------- | -------------- | ----------------- |
| lodash  | High     | CVE-2021-23337 | Update to 4.17.21 |

### Code Vulnerabilities

| Type          | File       | Line | Severity |
| ------------- | ---------- | ---- | -------- |
| SQL Injection | db.py      | 23   | Critical |
| XSS           | render.tsx | 156  | High     |

### Summary

- Critical: 2 (must fix)
- High: 3 (fix soon)
- Medium: 5 (backlog)
- Low: 8 (monitor)

### Recommended Actions

1. [ ] Rotate exposed AWS key immediately
2. [ ] Fix SQL injection in db.py:23
3. [ ] Update lodash to 4.17.21

Create security EVO with fixes? (y/n)
```

## Quick Mode (/security quick)

Only runs:

1. Secret scanning (high severity patterns only)
2. Dependency audit

Skips code analysis and framework checks.

## Integration

### Pre-commit Hook

```bash
# Add to .pre-commit-config.yaml
- repo: local
  hooks:
    - id: secret-scan
      name: Check for secrets
      entry: opencode /security secrets
      language: system
```

### CI Pipeline

```yaml
# GitHub Actions example
- name: Security Scan
  run: opencode /security --ci
```

Arguments: $ARGUMENTS
