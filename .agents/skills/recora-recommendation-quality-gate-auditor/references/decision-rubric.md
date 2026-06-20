# Decision Rubric

Use this rubric to make consistent quality-gate decisions.

## Step 1: Identify Evidence Type

Classify the strongest available basis:

- measured Recora observation data.
- supplied AI answer export.
- supplied SERP export.
- supplied citation URL.
- verified official source.
- named research source.
- industry practice.
- Recora assumption.
- no traceable evidence.

If no traceable evidence exists, the decision cannot be `auto_publish`.

## Step 2: Check Hard Blocks

Suppress immediately if the candidate contains:

- guaranteed AI citation, recommendation, ranking, traffic, conversion, or revenue.
- fake official standard claim.
- hallucinated source or invented measurement.
- citation misuse that changes what the source supports.
- seed contamination.
- secret access request.
- implementation or production-change instruction.
- factually wrong or client-harming claim.

## Step 3: Check Publishability

`auto_publish` requires:

- direct evidence or verified source support.
- tight connection between evidence and recommendation.
- clear action.
- safe client-facing wording.
- low display risk.
- high score.
- no unresolved freshness or source-status risk.

If the recommendation is directionally useful but any of these are missing, use `hold`.

## Step 4: Check Genericness

Generic SEO advice should not auto-publish.

Hold or suppress advice such as:

- "Improve meta tags."
- "Add more content."
- "Build backlinks."
- "Add FAQ."
- "Improve page speed."

It can be held if it can be tied to measured Recora evidence, such as missing query intent coverage, unextractable answer sections, unsupported claims, inaccessible pages, or competitor citation gaps.

Suppress if it remains generic after review.

## Step 5: Check Client-Facing Risk

Rate risk:

- `low`: clear, scoped, evidence-backed, non-alarming, no guarantees.
- `medium`: useful direction but wording or source scope needs review.
- `high`: unsupported, overconfident, reputationally risky, privacy-sensitive, or likely to mislead.

High display risk usually means `hold` or `suppress`.

## Step 6: Decide

Use this compact rule:

| Evidence | Risk | Specificity | Decision |
|---|---|---|---|
| direct and traceable | low | specific | auto_publish |
| partial or stale | low/medium | useful | hold |
| absent, invented, contaminated, or misleading | any | any | suppress |
| direct but risky wording | medium/high | useful | hold |
| generic and disconnected from data | medium/high | weak | suppress |

## Confidence

Assign:

- `high`: direct evidence, clean source scope, and low ambiguity.
- `medium`: plausible evidence but missing freshness, source detail, or measurement context.
- `low`: weak evidence, indirect support, unclear input, or high uncertainty.

Confidence is not optimism. It is confidence in the decision and evidence fit.
