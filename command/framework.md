---
description: S.A.G.E. Framework system diagnostics and management. Health checks, registry validation, state inspection.
agent: build
---

# /framework - System Diagnostics & Management

Self-diagnostic and management tools for the S.A.G.E. Framework.

## Usage

```bash
# Full health check
/framework health

# Quick status check
/framework status

# Rebuild command registry
/framework registry

# Validate state files
/framework validate

# Show framework info
/framework info
```

## Health Check Report

### ✅ Core System Status

```markdown
## S.A.G.E. Framework Health Check

### ✅ Command System
- **Commands**: 35 loaded, 0 errors
- **Registry**: framework/commands.json (12.4KB)
- **Categories**: 8 (evo: 9, flow: 3, primary: 3, research: 3, power: 3, validation: 3, experiment: 1, other: 10)
- **Load Time**: ~10ms (20x faster than file scanning)

### ✅ Skills System  
- **Skills**: 4 loaded
  - edd-overview (EDD protocol overview)
  - tdd-protocol (Red-Green-Refactor Plus)  
  - service-pattern (Enhanced SSP)
  - debugging (4-phase methodology)
- **Location**: skill/ directory

### ✅ Agent System
- **Primary Agents**: 2 configured
  - build (Sonnet 4.5 + TDD + Clean Code)
  - plan (Sonnet 4.5, read-only)
- **Subagents**: 6 configured
  - @implement (Sonnet 4.5, strict TDD)
  - @investigate (Haiku 4.5, research)
  - @verify (Haiku 4.5, review)
  - @security (Opus 4.6, audit)
  - @architect (Opus 4.6, design)
  - @orchestrate (Sonnet 4.5, coordination)

### ✅ State Management
- **EVO State**: No active EVO (clean)
  - File: docs/evo/.evo-state.yaml
  - Status: Valid YAML structure
- **Flow State**: No active flow (clean)  
  - File: docs/flow/.flow-state.yaml
  - Status: Valid YAML structure

### ✅ Memory System
- **Active Memories**: 4
  - ref_agents (no expiration)
  - ref_commands (no expiration)
  - ref_tools (no expiration)
  - session_continuity (expires: 2026-01-31)
- **TTL System**: Active, 1 memory with expiration
- **Archived**: 17 memories in archived/2026-01/
- **Templates**: 2 (research, analysis)

### ✅ External Tools
- **Serena**: Configured
  - Project file: .serena/project.yml ✓
  - Memory operations: Working ✓
- **Context7**: Available for library docs
- **Omnisearch**: 6 providers (Tavily, Brave, Exa, Linkup, Firecrawl, GitHub)
- **Sequential Thinking**: Available for complex reasoning

### ⚠️ Warnings
- Memory 'session_continuity' expires in 6 days
- No active EVO or Flow (start work with /evo start or /flow)

### 📊 Performance Metrics
- Command registry lookup: ~10ms
- Memory system response: ~50ms  
- Framework load time: ~200ms

---
**Status**: All systems operational ✅
**Framework ready for use** 🚀
```

## System Commands

### Health Diagnostics

```bash
# Full system health check
/framework health

# Quick status (summary only)
/framework status

# Check specific component
/framework health commands
/framework health memory
/framework health state
/framework health agents
```

### Registry Management

```bash
# Rebuild command registry
/framework registry

# Validate registry integrity
/framework registry --validate

# Show registry stats
/framework registry --stats

# Compare registry to files
/framework registry --check
```

### State Management

```bash
# Validate all state files
/framework validate

# Check EVO state specifically
/framework validate evo

# Check Flow state specifically  
/framework validate flow

# Repair corrupted state (if possible)
/framework repair
```

### Framework Information

```bash
# Show framework info
/framework info

# Show file locations
/framework paths

# Show memory usage
/framework memory

# Show performance stats
/framework perf
```

## Diagnostic Details

### Command Registry Health

**Checks:**
- ✅ Registry file exists and is valid JSON
- ✅ All 35 commands have required metadata
- ✅ No broken file references
- ✅ Categories are properly assigned
- ✅ No duplicate command names

**Performance:**
- Registry lookup: 10ms (vs 200ms file scanning)
- Memory usage: ~12KB (vs ~500KB for all files)
- Commands per category: Balanced distribution

### State File Validation

**EVO State (`docs/evo/.evo-state.yaml`):**
- ✅ Valid YAML syntax
- ✅ Schema compliance
- ✅ No active EVO conflicts

**Flow State (`docs/flow/.flow-state.yaml`):**
- ✅ Valid YAML syntax  
- ✅ Schema compliance
- ✅ No active flow conflicts

**Memory State:**
- ✅ 4 active memories with valid frontmatter
- ✅ TTL system operational
- ✅ Archive system working

### External Tool Integration

**Serena (Code Intelligence):**
- Project configuration: `.serena/project.yml` ✓
- Memory operations: All CRUD operations working ✓
- Symbol indexing: Available ✓

**Context7 (Library Docs):**
- Connection status: Available ✓
- Library resolution: Working ✓

**Omnisearch (Web Research):**
- Tavily: Configured ✓
- Brave Search: Configured ✓
- Exa: Configured ✓
- Linkup: Configured ✓
- Firecrawl: Configured ✓
- GitHub: Configured ✓

## Troubleshooting

### Common Issues

**"Command not found":**
```bash
/framework registry         # Rebuild command registry
/help <command>            # Check command exists
```

**"State file corrupted":**
```bash
/framework validate        # Check what's wrong
/framework repair          # Auto-repair if possible
```

**"Memory system not working":**
```bash
/framework health memory   # Check memory system
ls .serena/memories/       # Verify files exist
```

**"Slow performance":**
```bash
/framework perf           # Show performance stats
/framework registry       # Rebuild registry for speed
```

### Recovery Commands

```bash
# Reset framework to clean state
/framework reset

# Backup current state
/framework backup

# Restore from backup
/framework restore <backup-name>

# Emergency repair
/framework emergency-repair
```

## Framework Optimization

### Performance Improvements

The EVO017 Framework DX improvements provide:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Command discovery | 30+ file scans | Registry lookup | 20x faster |
| Help system | Manual browsing | Instant search | 100x faster |
| Error diagnosis | Cryptic messages | Context + suggestions | Much clearer |
| Health visibility | Manual checks | Automated diagnostics | Always available |

### Registry Advantages

- **Speed**: O(1) command lookup vs O(n) file scanning
- **Memory**: 12KB registry vs 500KB+ for all command files  
- **Reliability**: JSON validation vs markdown parsing
- **Features**: Search, categorization, examples

---

*Framework diagnostics powered by S.A.G.E. registry system*

Arguments: $ARGUMENTS