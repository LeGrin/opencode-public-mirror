---
name: pareto-prioritize
description: "Pareto 80/20 primitive — rank issues/tasks by expected impact, identify the 20% that delivers 80%. Used by housekeeper, health-scorer, /next backlog triage."
---

# Pareto Prioritization

> Vilfredo Pareto's empirical observation: in most systems, ~20% of inputs produce ~80% of outputs. A housekeeper that addresses the worst 2-3 of 10 concerns drops the noise floor more than cleaning all 10 superficially.

## When To Use

- `housekeeper` before picking which concern to address this run
- `health-scorer` when reporting issues (call out which dominate)
- `/next` backlog triage — rank TODO/FIXME by impact, not by age
- `architect` when laying out refactor options
- `learner` aggregating runtime-learnings fingerprints (addressing the top 3 eliminates most recurrence)

## The Procedure

1. **List candidates.** Minimum 5, maximum 15. Below 5, just pick; above 15, filter obvious low-signal first.
2. **Score each on two axes** (0-5 each):
   - **Impact** — how much noise / pain does this cause if unfixed?
   - **Cost** — how many tool calls / minutes to address?
3. **Compute leverage** = Impact / max(Cost, 1). Higher = better Pareto candidate.
4. **Sort by leverage desc.**
5. **Pick the top 1-3.** If top N's combined leverage exceeds 50% of total → that's your 20%.
6. **Act on top, defer or drop the rest.**

## Output Format

```yaml
ranking_method: pareto
candidates_evaluated: <N>
items:
  - label: "<what>"
    impact: 0-5
    cost: 0-5
    leverage: <Impact / Cost>
    action: pick | defer | drop
picked:
  - "<label>"  # the 20% → 80% bucket
leverage_coverage: <% of total leverage covered by picked>
```

## Examples

**Housekeeper on a dirty repo:**

| Issue | Impact | Cost | Leverage | Action |
|---|---|---|---|---|
| 30 merged branches >60d | 4 | 1 | 4.0 | pick |
| Stale PR #234 no activity 21d | 3 | 1 | 3.0 | pick |
| 12 TODOs in auth module | 2 | 3 | 0.67 | defer |
| `.DS_Store` files | 1 | 1 | 1.0 | defer |
| Schema hash stale 14d | 3 | 2 | 1.5 | defer |

Pick branches + PR. Combined leverage = 7.0 / total 10.17 = 69% coverage for 2 actions. Defer rest.

## Rules

- **Impact is impact on user/session, not absolute badness.** A `console.log` is annoying but impact 1; a broken test blocks shipping, impact 5.
- **Cost must be honest.** "Fix the whole test suite" is cost 5, not cost 2.
- **Never pick 0-leverage items** even if you have spare budget. Do nothing is better than doing the wrong thing.
- **Re-rank on next run.** Impacts change as other issues resolve.

## Anti-Patterns

- "Let's clean up everything" (negates Pareto — spreads effort thin)
- Counting items without weighting (10 trivial items ≠ 1 critical item)
- Picking highest-impact irrespective of cost (often the most expensive item blocks on external dependency)
- Static ranking that never gets re-sorted

## Integration

- `housekeeper` ALWAYS calls this before acting.
- `/next` uses this to present "Top 3 candidates for next iteration".
- `health-scorer` report section "Pareto concentration" — what % of score delta from top 3 issues.
- `learner` weekly digest ranks fail-fingerprints by leverage.
