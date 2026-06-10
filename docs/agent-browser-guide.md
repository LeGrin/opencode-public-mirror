# agent-browser CLI - Browser Automation for AI Agents

**Status:** Available for future use  
**Installation:** `npm install -g agent-browser`  
**Purpose:** Efficient browser automation designed specifically for AI agents  

## Overview

agent-browser is Vercel's purpose-built browser automation CLI for AI agents. It provides **93% less context usage** compared to Playwright MCP through its innovative "Snapshot + Refs" workflow.

## Key Benefits vs Playwright MCP

| Feature | Playwright MCP | agent-browser | Improvement |
|---------|----------------|---------------|-------------|
| **Context Usage** | Full DOM tree | Snapshot + Refs | 93% reduction |
| **Setup** | MCP server config | `npm install -g` | Zero configuration |
| **Tool Count** | 26+ MCP tools | ~15 core commands | Simplified |
| **Protocol** | MCP overhead | Direct bash commands | No protocol overhead |
| **Performance** | Node.js MCP server | Rust CLI + daemon | Faster execution |

## Installation & Setup

✅ **COMPLETED GLOBALLY** - agent-browser is ready to use!

```bash
# ✅ Already installed globally
npm install -g agent-browser

# ✅ Already downloaded and configured  
agent-browser install

# ✅ OpenCode skill integration active
# Skill available at: <opencode-config>/skill/agent-browser/
```

**Current Status:**
- ✅ **CLI accessible globally** - `agent-browser --version` → 0.7.6
- ✅ **OpenCode skill integrated** - Available to all agents
- ✅ **Documentation complete** - Full command reference ready
- ⚠️ **Browser setup** - Minor version mismatch (see troubleshooting below)

### Troubleshooting Browser Issues

If you encounter Chromium version mismatches:
```bash
# Clear browser cache and reinstall
rm -rf <browser-cache-dir>/ms-playwright/
agent-browser install --with-deps

# Alternative: Use system browser  
agent-browser --executable-path /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome open example.com
```

## Core Workflow: Snapshot + Refs

The key innovation is using accessibility tree snapshots with element references:

### 1. Get Snapshot
```bash
agent-browser open example.com
agent-browser snapshot -i  # Interactive elements only
```

**Output:**
```
button "Submit" [ref=e2]
input "Email" [ref=e3] 
link "Learn more" [ref=e4]
```

### 2. Use Refs for Actions
```bash
agent-browser click @e2                   # Click Submit button
agent-browser fill @e3 "test@example.com" # Fill email field
agent-browser hover @e4                   # Hover link
```

## Essential Commands

### Navigation
```bash
agent-browser open <url>        # Navigate to URL
agent-browser back              # Go back
agent-browser forward           # Go forward
agent-browser reload            # Refresh page
```

### Core Interactions
```bash
agent-browser click @ref        # Click element by ref
agent-browser fill @ref "text"  # Fill input field
agent-browser press Enter       # Press key
agent-browser hover @ref        # Hover element
agent-browser scroll down       # Scroll page
```

### Information Gathering  
```bash
agent-browser snapshot -i       # Get interactive elements
agent-browser get text @ref     # Get element text
agent-browser get value @ref    # Get input value
agent-browser screenshot        # Take screenshot
```

### Advanced Features
```bash
agent-browser --session name    # Isolated browser sessions
agent-browser --profile path    # Persistent browser state
agent-browser --headed          # Show browser window (debugging)
agent-browser --json            # JSON output for agents
```

## AI Agent Integration

### For Claude Code
Simply tell Claude to use agent-browser:

```
Use agent-browser to test the login flow on example.com
```

Claude will automatically:
1. Run `agent-browser open example.com`
2. Get snapshot with `agent-browser snapshot -i`
3. Analyze elements and use refs for interactions
4. Take actions like `agent-browser click @e2`

### JSON Mode for Agents
Use `--json` flag for structured output:

```bash
agent-browser snapshot -i --json
agent-browser get text @e1 --json
```

### Optimal AI Workflow
```bash
# 1. Navigate and get snapshot  
agent-browser open site.com
agent-browser snapshot -i --json    # AI parses refs

# 2. AI identifies target elements from snapshot
# 3. Execute actions using refs
agent-browser click @e2
agent-browser fill @e3 "input data"

# 4. Get new snapshot if page changed
agent-browser snapshot -i --json
```

## Session Management

```bash
# Multiple isolated sessions
agent-browser --session agent1 open site-a.com
agent-browser --session agent2 open site-b.com

# List active sessions
agent-browser session list

# Persistent profiles (save login state)
agent-browser --profile ~/.myapp-profile open myapp.com
```

## Common Patterns

### Form Automation
```bash
agent-browser open login-page.com
agent-browser snapshot -i
agent-browser fill @email "user@example.com"
agent-browser fill @password "secret"
agent-browser click @submit
```

### Testing Workflow
```bash
agent-browser open app.com
agent-browser snapshot -i
agent-browser click @feature-button
agent-browser wait --text "Success"
agent-browser screenshot result.png
```

### Data Extraction
```bash
agent-browser open data-page.com
agent-browser snapshot
agent-browser get text @title
agent-browser get value @data-field
```

## Comparison to Removed Playwright MCP

| Aspect | Old (Playwright MCP) | New (agent-browser) |
|--------|---------------------|-------------------|
| **Setup** | MCP server configuration required | Simple `npm install -g` |
| **Usage** | 26 MCP tools to choose from | Direct CLI commands |
| **Context** | Full DOM accessibility tree | Compact snapshot + refs |
| **Performance** | MCP protocol overhead | Direct bash execution |
| **AI Integration** | Complex tool selection | Simple command patterns |

## When to Use

Use agent-browser when you need:
- ✅ **Browser testing** - E2E test automation
- ✅ **Web scraping** - Data extraction from websites  
- ✅ **Form automation** - Login flows, form filling
- ✅ **UI validation** - Screenshot comparison, element verification
- ✅ **User journey testing** - Multi-step user workflows

## Resources

- **Official Repo:** [github.com/vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser)
- **Documentation:** [agent-browser.dev](https://agent-browser.dev)
- **License:** Apache 2.0 (Free and Open Source)

## Migration Notes

This replaces the previously configured Playwright MCP server which was:
- ❌ **Unused** - No actual browser automation in codebase
- ❌ **Heavy** - 26 tools, high context usage
- ❌ **Complex** - MCP server configuration required

agent-browser provides the same capabilities with:
- ✅ **Efficiency** - 93% less context usage
- ✅ **Simplicity** - Direct CLI commands
- ✅ **Performance** - Rust CLI + Node.js daemon

---

**Created:** 2026-01-24 (EVO019 completion)  
**Purpose:** Future browser automation reference  
**Status:** Ready to use when browser automation is needed
