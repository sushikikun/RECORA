# Source Evaluation Rubric

Project: Recora Evidence-Based Recommendation Program
Status: v0.1 foundation

## 1. Purpose

Research Corpusへ集めたsourceと、そこから抽出したclaimを同列に扱わないための評価基準。

重要な原則:

```text
Source authority ≠ claim truth
Source tier ≠ recommendation confidence
Official guidance ≠ measured causal effect
Research finding ≠ every platform's production behavior
Public skill pattern ≠ evidence
```

評価はsource-levelとclaim-levelの二段階で行う。

## 2. Source Tiers

### Tier A — Current Official / Normative Primary Source

Examples:

- current platform documentation
- official webmaster or crawler controls
- official product measurement documentation
- standards or vocabulary documentation
- official policy / specification

Best use:

- product behavior that the provider explicitly documents
- eligibility and control rules
- metric definitions
- supported/unsupported feature claims
- prohibited or discouraged practices

Limitations:

- provider documentation may not prove ranking or citation uplift.
- official recommendations may be guidance, not controlled causal evidence.
- the rule may apply only to one platform or surface.
- currentness must be checked.

Default treatment: high authority for the exact documented scope; not automatically high confidence for outcome claims.

### Tier B — Peer-reviewed Primary Research

Examples:

- conference or journal paper with original experiment/data
- peer-reviewed benchmark or measurement study

Best use:

- evaluation methods
- observed mechanisms
- replicated relationships
- limitations and failure modes

Limitations:

- laboratory or black-box setup may not match current commercial products.
- model and product versions may be obsolete.
- paper terminology may differ from Recora metrics.

Default treatment: potentially strong research support after method and scope review.

### Tier C — Preprint / Reproducible Experiment / Public Dataset

Examples:

- arXiv preprint with inspectable methodology
- public benchmark code and data
- controlled experiment with sufficient details

Best use:

- emerging hypotheses
- methodology candidates
- replication targets
- gaps not yet covered by peer review

Limitations:

- not peer-reviewed or independently replicated.
- code/data availability does not guarantee correct inference.
- benchmark leakage, prompt selection, sample size, or model drift may matter.

Default treatment: conditional until reviewed or replicated.

### Tier D — Method-rich Independent Study or Case Study

Examples:

- publisher case study with baseline/intervention/results
- independent SEO/GEO study with disclosed prompt set and dates
- technical audit with inspectable evidence

Best use:

- real-world implementation hypotheses
- edge cases
- experiment backlog
- operational feasibility

Limitations:

- control group may be absent.
- concurrent changes may confound results.
- single-site findings may not generalize.

Default treatment: contextual or conditional; rarely sufficient alone for causal rules.

### Tier E — Vendor / Agency / Industry Analysis

Examples:

- GEO vendor report
- SEO agency article
- product benchmark created by the vendor
- commercial webinar or white paper

Best use:

- terminology and market pattern discovery
- candidate tactics
- product/report taxonomy
- research leads

Limitations:

- commercial incentives and selective reporting.
- methodology may be incomplete.
- proprietary data may be unverifiable.
- product claim may be framed as general truth.

Default treatment: hypothesis generation or contextual support. Do not use alone for high-impact client-facing claims.

### Tier F — Skill / Prompt / Template / README Pattern

Examples:

- local or public agent skill
- prompt library
- checklist
- OSS README
- competitor workflow template

Best use:

- workflow design
- missing-field discovery
- output format
- handoff and quality-gate patterns
- adversarial test ideas

Limitations:

- generally not evidence of effectiveness.
- may contain copied, stale, fabricated, or unsafe claims.
- may request secrets, execution, or production changes.
- license and provenance may be unclear.

Default treatment: pattern inspiration only. Never elevate to `OFFICIAL_SOURCE` or `RESEARCH_BACKED` without independent evidence.

### Tier G — Unsupported / Untraceable / Low-integrity Source

Examples:

- unattributed social post
- content farm or scraped summary
- missing source chain
- fabricated citation
- unverifiable numerical claim
- anonymous guarantee claim

Best use: none for operational rules.

Default treatment: reject. Preserve only when documenting a misinformation or unsafe-output pattern.

## 3. Source-level Scoring

Each dimension receives 0–3 points. Total score is advisory; hard gates override the total.

| Dimension | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| Identity / provenance | unknown | weak attribution | identifiable publisher | authoritative primary owner/research team |
| Claim directness | source does not contain claim | indirect summary | directly discusses claim | directly defines/tests exact claim |
| Method transparency | absent | partial | mostly inspectable | fully inspectable and reproducible |
| Data adequacy | none | anecdotal/small undisclosed | useful but limited | appropriate and clearly described |
| Scope match | unrelated/unknown | broad analogy | partial match | exact platform/metric/context match |
| Recency / version fit | obsolete/unknown | likely stale | reasonably current | current version/date confirmed |
| Independence / bias control | severe undisclosed bias | commercial or selective | disclosed limitations | independent or bias well controlled |
| Replication / corroboration | contradicted/unreplicated | no corroboration | some corroboration | replicated or supported by multiple strong sources |

Maximum: 24.

Suggested interpretation:

- `20–24`: strong source candidate for exact scope
- `15–19`: useful with limitations
- `9–14`: conditional / hypothesis support
- `0–8`: weak or reject

The score must not override hard gates or claim-level mismatch.

## 4. Hard Gates

Regardless of total score, a source cannot support an accepted operational rule when any of the following applies.

- source text was not inspected.
- cited source does not exist or cannot be identified.
- claim is materially stronger than the source statement.
- platform/surface is mismatched.
- date/version makes the behavior obsolete and no current confirmation exists.
- numerical outcome lacks denominator or measurement definition.
- methodology is fabricated, internally inconsistent, or impossible to reconstruct.
- source is only a skill, prompt, README, marketing snippet, or search-result summary.
- source requires invented access to paywalled, login-only, or blocked content.
- recommendation would require spam, fake reviews, fabricated mentions, cloaking, credential access, or other unsafe behavior.

Result: `rejected` or `NEEDS_VERIFICATION`.

## 5. Claim-level Evaluation

Every claim is evaluated separately from its source.

### 5.1 Claim Type

Use one:

- `definition`
- `platform_rule`
- `metric_definition`
- `observational_association`
- `causal_effect`
- `mechanism_hypothesis`
- `best_practice`
- `risk_or_failure_mode`
- `recora_policy`
- `unknown`

### 5.2 Evidence Directness

Use one:

- `direct`: exact claim is stated or tested.
- `partial`: source supports only part of the claim.
- `indirect`: source supports an adjacent concept.
- `none`: source is cited but does not test or state the claim.

### 5.3 Claim Status

Use exactly one:

- `accepted`: sufficiently supported for the stated scope and caveats.
- `conditional`: useful only under named conditions or with limited confidence.
- `disputed`: credible supporting and contradicting evidence remains unresolved.
- `stale`: previously useful but current applicability is unverified.
- `superseded`: replaced by newer authoritative evidence.
- `rejected`: unsupported, mismatched, fabricated, unsafe, or methodologically unusable.

### 5.4 Confidence

Use `high`, `medium`, or `low`.

High confidence requires:

- direct evidence.
- exact or clearly bounded scope.
- currentness where required.
- no unresolved major contradiction.
- no inference beyond source support.

Medium confidence:

- evidence is useful but sample, platform match, recency, or replication is limited.
- claim is plausible and bounded.
- verification path exists.

Low confidence:

- indirect or sparse evidence.
- single observation or anecdotal case.
- blocked/missing source text.
- uncertain platform behavior.
- must remain `NEEDS_VERIFICATION` in recommendation output.

## 6. Claim Quality Dimensions

Score each 0–3 where a quantitative review is useful.

| Dimension | Question |
|---|---|
| Directness | Does evidence directly state or test the claim? |
| Scope fidelity | Does claim preserve platform, locale, period, and metric scope? |
| Method quality | Can the observation or experiment support this type of claim? |
| Alternative explanations | Were confounders or competing hypotheses addressed? |
| Consistency | Do other strong sources support or contradict it? |
| Freshness | Is the evidence current enough for this product behavior? |
| Operational usefulness | Can Recora turn it into a bounded rule with checks? |
| Falsifiability | Can the claim or recommendation be tested and fail? |

A high score does not permit guaranteed outcome language.

## 7. Evidence Labels for Recora

Use existing shared labels consistently.

- `CONFIRMED_FACT`: supplied/inspected Recora observation or artifact.
- `OFFICIAL_SOURCE`: current primary-source guidance for the exact claim and platform.
- `RESEARCH_BACKED`: named research supports a studied concept or behavior.
- `INDUSTRY_PRACTICE`: common practice not established as guaranteed causal effect.
- `RECORA_ASSUMPTION`: internal policy, taxonomy, priority, product interpretation, or hypothesis.
- `NEEDS_VERIFICATION`: missing, stale, indirect, unsupported, or unmeasured.

Rules:

- one claim may have multiple labels through multiple evidence links.
- `INDUSTRY_PRACTICE` must not be presented as `RESEARCH_BACKED`.
- `RECORA_ASSUMPTION` must not be presented as external fact.
- `OFFICIAL_SOURCE` does not automatically mean the recommendation will improve outcomes.

## 8. Special Handling by Source Type

### 8.1 Official Platform Documentation

Ask:

- Is the page current?
- Is it normative, explanatory, promotional, or measurement documentation?
- Does it describe eligibility/control, or claim outcome improvement?
- Which exact product surface does it cover?
- Does it explicitly state limitations or non-guarantees?

Allowed inference:

- exact documented control, requirement, metric definition, or provider statement.

Forbidden inference:

- guaranteed inclusion, citation, ranking, authority, traffic, or conversion unless the provider explicitly guarantees it, which should still be treated with caution.

### 8.2 Academic Research

Ask:

- peer-reviewed or preprint?
- original data or review?
- model/product/version?
- prompt/query sampling method?
- sample size and repetitions?
- control/baseline?
- outcome metric?
- code/data availability?
- external validity?
- known replications or contradictions?

Do not translate a benchmark result directly into universal client advice.

### 8.3 Vendor Studies

Ask:

- Is the vendor selling the proposed solution?
- Is the complete methodology visible?
- Are unsuccessful cases reported?
- Is the dataset proprietary?
- Are branded and non-branded prompts mixed?
- Is the metric denominator clear?
- Are platform and date controlled?

Default wording: `conditional industry evidence` or `hypothesis`, not proven rule.

### 8.4 Case Studies

Require where possible:

- baseline
- intervention
- timeline
- concurrent changes
- measurement definition
- sample
- observed result
- limitations
- replication conditions

Without these, use only as anecdotal support.

### 8.5 Skills, Prompts, and README Files

Evaluate for:

- useful taxonomy
- required fields
- workflow separation
- quality gates
- unsafe permissions
- secret handling
- remote execution
- supply-chain risk
- unsupported outcome language
- copied or unlicensed content

Never use skill existence or popularity as evidence that a tactic works.

## 9. Numerical Claim Rules

A numerical claim cannot be accepted without:

- metric name and definition
- numerator and denominator where applicable
- sample size
- platform/surface
- prompt/query set construction
- observation period
- run count or aggregation method
- baseline/comparator
- uncertainty or limitation
- source location

Examples of claims that require hold/rejection:

- “AI visibility improved 40%” without denominator.
- “schema increased citations” without controlled comparison.
- “top cited domains are authoritative” when citation placement/role is not measured.
- “brand ranks #1” from one seeded branded prompt.

## 10. Causal Claim Rules

Use `causal_effect` only when the method reasonably supports intervention → outcome.

Minimum checks:

- intervention is defined.
- baseline and post-intervention measurements exist.
- measurement method is stable.
- major concurrent changes are addressed.
- regression to the mean and platform drift are considered.
- sample and repeats are adequate for the conclusion.
- alternative explanations are documented.

Otherwise use:

- `observational_association`
- `mechanism_hypothesis`
- `best_practice`

Recommended wording:

- “may support…”
- “is associated with…”
- “provides a testable hypothesis…”
- “should be remeasured after implementation…”

## 11. Conflict Resolution Rubric

When sources conflict, compare in this order:

1. Are they discussing the same platform and surface?
2. Are the dates and versions compatible?
3. Are metric definitions identical?
4. Is one normative guidance and the other empirical outcome?
5. Are methods and sample selection comparable?
6. Are branded/non-branded prompts separated?
7. Are citation selection and answer absorption being conflated?
8. Is one source making a stronger claim than it tested?

Resolution options:

- narrow the claim scope.
- split one claim into multiple platform-specific claims.
- mark `conditional`.
- create a `disputed` conflict group.
- add an experiment to the backlog.
- reject the overbroad interpretation.

## 12. Recommendation Readiness Gate

A claim can inform a Recommendation Card only when all are true.

- claim status is `accepted` or `conditional`.
- exact source/evidence links exist.
- platform and metric scope are explicit.
- implementation mechanism is plausible and not overstated.
- required checks can be named.
- alternative causes are not hidden.
- verification and failure criteria can be defined.
- do-not-infer / do-not-claim is present.

A low-confidence claim may still create an experiment or monitoring card, but not a strong implementation recommendation.

## 13. Examples

### Example A: Official Google guidance on llms.txt

Evaluation:

- source tier: A
- claim type: platform rule
- scope: Google Search generative features
- accepted claim: Google Search does not require or use llms.txt for visibility/ranking in Google Search.
- do not infer: no other AI service uses llms.txt; llms.txt is harmful everywhere.
- Recommendation Card use: prevent Google-specific llms.txt guarantee claims; only assess other services separately.

### Example B: Bing citation counts

Evaluation:

- source tier: A
- claim type: metric definition
- accepted claim: citation counts represent displayed source references in supported AI experiences.
- accepted limitation: counts do not indicate placement, ranking, authority, or a page’s role in an individual answer.
- Recommendation Card use: separate citation frequency from prominence and answer absorption.

### Example C: Vendor says FAQ increases AI citations

Evaluation:

- source tier: E
- claim type: observational association or best practice
- directness: depends on method
- status: conditional or rejected if method absent
- allowed use: experiment hypothesis or content-clarity card with caveat
- forbidden use: “FAQ will increase AI citations.”

### Example D: Public skill recommends AggregateRating

Evaluation:

- source tier: F
- accepted value: checklist pattern only
- evidence status: not evidence of effectiveness or eligibility
- required independent checks: visible, real, verifiable reviews; platform rules; schema validation
- reject when ratings are fabricated or not visible.

## 14. Reviewer Checklist

Before accepting a claim:

- I inspected the actual source content.
- I recorded source identity, date, and platform.
- The claim is atomic.
- The source directly supports the wording.
- I separated source statement from Recora inference.
- I recorded limitations and do-not-infer.
- I checked for conflicts or newer evidence.
- I did not convert correlation into causation.
- I did not treat a skill/README/vendor claim as proof.
- I can explain how this claim may or may not enter a Recommendation Card.
