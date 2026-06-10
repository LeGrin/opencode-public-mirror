---
name: confidence-score
description: "Every structured output carries dual-grade uncertainty: confidence (evidence for) + doubt (evidence against). Below threshold → sage escalates to user via Hermes. Calibration > confidence."
---

# Confidence Scoring (Dual-Grade)

> Devin 2.0's key insight: agents that admit low confidence catch hallucinations before they compound. An agent that says "I'm 0.5 confident, need clarification" is worth more than one that says "done!" and ships nonsense.

> Calibration beats high confidence. If you score 0.9 on everything, you're lying. If your 0.9 actually means 90% correct over many runs, you're useful.

> **Two dimensions, not one.** Borrowed from q-rung orthopair fuzzy sets (Huang et al. 2025, PeerJ CS): `confidence` (Ẽ — evidence supporting the answer) and `doubt` (G˙ — evidence against it) are **independent**. Low confidence + low doubt = "haven't looked deeply yet, no red flags". Low confidence + **high** doubt = "saw something that contradicts — escalate". One number collapses these two very different states.

## When To Use

Every non-trivial structured output. Applies to: sage route decisions, phase agent completions, scout findings, architect recommendations, research reports, critic verdicts.

## The Score Bucket

| Range | Meaning | Action |
|---|---|---|
| **0.9 – 1.0** | Highly certain, multiple corroborations | Act |
| **0.7 – 0.9** | Confident, single strong signal | Act, log for later review |
| **0.5 – 0.7** | Plausible, mixed signals | Warn user; proceed if LOW risk; escalate if HIGH |
| **0.3 – 0.5** | Uncertain, leaning one way | Escalate to user via Hermes for gate |
| **0.0 – 0.3** | Don't know | STOP. Ask clarifying question. |

## The Doubt Bucket (new)

| Range | Meaning | Action |
|---|---|---|
| **0.0 – 0.2** | No counter-evidence | Proceed at confidence level |
| **0.2 – 0.4** | Minor caveats (edge case, missing source) | Log caveat, proceed |
| **0.4 – 0.7** | Active red flags (contradicting source, failing test, schema drift) | Escalate regardless of confidence |
| **0.7 – 1.0** | Strong contradiction | STOP. Don't act. Report the contradiction to Hermes. |

**Constraint (q=2, Pythagorean):** `confidence² + doubt² ≤ 1`. If both are high, you're lying — revisit rationale. A reviewer who is both very confident AND has strong counter-evidence has not reconciled them.

## Escalation Rule (dual-grade)

```
if doubt >= 0.4:
  escalate_to_user                       # red flags dominate
elif confidence < 0.6:
  escalate_to_user                       # not enough evidence
elif confidence < 0.8 AND risk >= HIGH:
  escalate_to_user                       # risky two-way door
else:
  proceed
```

**Routing implication:** Opus-tier review (reflexion-critic, codex-review) is triggered when `doubt ≥ 0.4` even if `confidence` is also high — the two flags together signal "I see the contradiction but can't resolve it", exactly the case where 1M-ctx senior review pays off.

## Calibration Practice

Over time, track how often your 0.8-scored outputs were actually correct. If <80% → you're overconfident; downgrade threshold. If >90% → you're underconfident; adjust up.

`learner` agent's weekly digest includes a calibration plot: scored confidence vs observed accuracy.

## Output Format

Attach to any structured output:

```yaml
... # agent's main output
confidence:
  score: 0.7            # evidence FOR
  doubt: 0.3            # evidence AGAINST (NEW — independent axis)
  rationale: "3 sources agree; 1 source dissents; my domain knowledge leans toward majority"
  doubt_rationale: "dissenting source is the most recent primary — can't dismiss without re-checking"
  would_increase_if: "second primary source for contested claim"
  would_decrease_if: "majority sources turn out to be derivative of one upstream"
```

Legacy single-score outputs are accepted (`doubt` defaults to `1 - confidence` for backward compat), but new agents MUST emit both.

## Rules

- **Rationale is mandatory.** A number without reasoning is a lie.
- **"would_increase/decrease if" fields** — force yourself to articulate what evidence would update your belief. If you can't name one, confidence is performative.
- **Never round to 0.9 or 1.0 unless evidence genuinely justifies.** Default for a "looks right" code change: 0.75.
- **Research tasks cap at 0.85** unless you personally verified the primary source. Hearsay about benchmark results → 0.7.
- **Architecture decisions cap at 0.8** if irreversible (one-way door). You should feel uneasy making one-way calls without user gate.

## Anti-Patterns

- Always scoring 0.95 (uncalibrated; trust degrades over time)
- Always scoring 0.6 (uninformative; user can't distinguish real uncertainty from habitual hedging)
- Scoring without rationale (theater)
- Downgrading AFTER being wrong to backfill "I knew it was risky" (retro-fitting)

## Integration

- `sage` uses confidence × risk in Step 4 gate decision.
- `reflexion-critic` uses confidence to choose between `warn` and `fail` verdicts.
- `deep-researcher` MUST attach confidence to every report.
- `architect` MUST attach confidence to every recommendation.
- `housekeeper` escalates to Hermes when confidence < 0.7 on a one-way action.
- `learner` weekly: track calibration (scored vs observed accuracy) — tune prompts when drift detected.
