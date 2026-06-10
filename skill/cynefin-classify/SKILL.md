---
name: cynefin-classify
description: "Cynefin classification primitive — tag each task as Clear, Complicated, Complex, or Chaotic. Determines routing strategy (best-practice vs expert vs probe vs act-first)."
---

# Cynefin Classification

> Dave Snowden's framework for matching response to problem type. The wrong strategy for the wrong domain burns tokens and user trust.

## The Four Domains

| Domain | What you face | Pattern | Sage response |
|---|---|---|---|
| **Clear** (known-known) | Cause & effect obvious, repeatable | Sense → Categorize → Respond | Route directly (best practice exists) |
| **Complicated** (known-unknown) | Cause & effect requires expertise | Sense → Analyze → Respond | Dispatch expert (`architect`, `security`) |
| **Complex** (unknown-unknown) | Cause & effect only visible in hindsight | Probe → Sense → Respond | Dispatch scouts (small experiments) |
| **Chaotic** (unknowable) | No discernible cause & effect; crisis | Act → Sense → Respond | Stabilize first, analyze later |

## When To Use

- Before sage picks a routing strategy for a non-trivial prompt
- When a task seems to fit multiple agents — domain disambiguates
- When an agent stalls — wrong domain diagnosis → switch strategy
- In decomposition: different buckets often live in different domains

## Classification Prompts

Ask yourself (in order):

1. **"Does a checklist solve this?"** → Clear. Use best practice. Route directly.
2. **"Does an expert solve this in a reasonable time?"** → Complicated. Dispatch the relevant specialist (`architect` / `security` / `deep-researcher`).
3. **"Can the solution only be found by trying something?"** → Complex. Dispatch scouts as probes; expect to iterate.
4. **"Is there an active fire / production down?"** → Chaotic. Mitigate first (stop the bleeding), analyze after.

## Output Format

```yaml
classification:
  domain: clear | complicated | complex | chaotic
  rationale: "<1 sentence>"
  strategy:
    clear: "direct route to <agent>"
    complicated: "expert dispatch to <agent>"
    complex: "2-3 parallel scouts: <areas>"
    chaotic: "stabilize: <action>; postmortem: <when>"
  confidence: high | medium | low
```

Confidence `low` means you're not sure which domain — default to complex (probe) as the safer choice.

## Examples

- "Rename `tenderId` to `tender_uuid` across repo" → **Clear** → direct `implement`.
- "Should we use Postgres or ScyllaDB for event store?" → **Complicated** → `architect` + `deep-researcher`.
- "Why is this page 800ms slow under load?" → **Complex** → scouts: profiler, db queries, cache, network.
- "Production is down, logs show OOM" → **Chaotic** → restart service, then investigate.

## Anti-Patterns

- Treating Complex as Complicated (dispatching an expert who confidently produces wrong answer)
- Treating Complicated as Clear (running a playbook that doesn't fit)
- Treating Chaotic as Complex (running slow probes while the house burns)
- Promoting "Chaotic" to "Complex" too early (before the fire is out)

## Integration

- `sage` Step 1 (classify intent) → immediately after intent detection, run Cynefin.
- `architect` adversity mode → escalates to Chaotic if decisions keep failing.
- `housekeeper` → all tasks are Clear by definition (use playbook).
- `phase-discovery` → tasks in Complex domain should produce spikes, not specs.
