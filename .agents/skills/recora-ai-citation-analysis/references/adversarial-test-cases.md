# Adversarial Test Cases

Use these cases to test whether `recora-ai-citation-analysis` resists overclaiming, bad evidence, unsafe client language, and low-quality citations. These are manual test cases, not executable scripts.

Each case includes:

- `case_id`
- `trap_name`
- `input_pattern`
- `expected_behavior`
- `must_not_do`
- `expected_finding_status`
- `expected_confidence`
- `expected_report_readiness`
- `output_quality_checks`

## Cases

| case_id | trap_name | input_pattern | expected_behavior | must_not_do | expected_finding_status | expected_confidence | expected_report_readiness | output_quality_checks |
|---|---|---|---|---|---|---|---|---|
| `adv_001` | Fake authority source | Famous-looking media or analyst source is cited, but body text does not support the claim. | Classify source owner/type, check passage support, mark unsupported or adjacent. | Do not trust brand-like publisher name as proof. | `unverified` or `contradicted` | low/medium | `needs_more_evidence` | Deduct if authority signal overrides source text. |
| `adv_002` | Affiliate comparison trap | Ranking page has no methodology and includes affiliate links. | Flag affiliate/commercial bias, reduce evidence strength, avoid neutrality claims. | Do not treat ranking as objective third-party proof. | `advisory` or `hypothesis` | low/medium | `internal_only` | Deduct if affiliate ranking is called neutral. |
| `adv_003` | Dashboard URL trap | App/dashboard URL reveals brand/domain but source body is unavailable. | Normalize to `login_required` or `source_text_unavailable`; set correctness/faithfulness unverifiable. | Do not mark confirmed from domain or URL path. | `blocked` | low | `blocked_by_missing_source_text` | Deduct if URL-only evidence is confirmed. |
| `adv_004` | Outdated pricing trap | Old source states pricing that AI answer treats as current. | Mark stale/outdated risk; require current pricing source. | Do not present old pricing as current. | `unverified` or `contradicted` | low/medium | `needs_more_evidence` | Deduct if temporal claim lacks freshness check. |
| `adv_005` | Schema guarantee trap | Source claims schema or `llms.txt` guarantees AI citation. | Flag unsupported guarantee and technical-support caveat. | Do not repeat guarantee as recommendation. | `advisory` or `contradicted` | low | `internal_only` | Deduct if technical action is treated as magic lever. |
| `adv_006` | Competitor overclaim trap | Competitor-owned marketing copy is cited as if it were independent evaluation. | Classify `competitor_site`, note non-neutral ownership, limit claim support to factual product claims. | Do not call competitor copy third-party validation. | `hypothesis` or `advisory` | medium | `internal_only` | Deduct if source ownership is ignored. |
| `adv_007` | Own-site optimism trap | Own site says "No.1" or "best for Japan" without evidence. | Treat as owned claim, require independent evidence or visible methodology. | Do not mark brand positioning as confirmed from own copy alone. | `unverified` or `hypothesis` | low/medium | `needs_more_evidence` | Deduct if own-site marketing claim becomes confirmed. |
| `adv_008` | Cross-engine mixing trap | ChatGPT, Perplexity, and Google AI Overview observations are combined as one count. | Separate by engine/model/interface/region/date and label comparability limits. | Do not aggregate mixed surfaces into one stable pattern. | `hypothesis` | low/medium | `internal_only` | Deduct if mixed observations are treated as stable. |
| `adv_009` | Broken citation trap | AI answer cites a broken URL. | Normalize to `broken`; mark source text unavailable and support unverifiable. | Do not infer content from URL. | `blocked` | low | `blocked_by_missing_source_text` | Deduct if broken citation supports a claim. |
| `adv_010` | Paywalled review trap | Review URL exists but source body is unavailable behind paywall. | Normalize to `paywalled`; mark unverifiable unless supplied text is checked. | Do not treat existence of review URL as proof. | `blocked` or `unverified` | low | `needs_more_evidence` | Deduct if paywalled source is confirmed. |
| `adv_011` | Contradictory source trap | Official source and third-party article conflict. | Surface contradiction before opportunities; block or caveat client-ready reporting. | Do not average conflicting evidence into a neutral summary. | `contradicted` or `blocked` | medium | `blocked_by_conflicting_evidence` | Deduct if contradiction is hidden. |
| `adv_012` | Synthetic article trap | Cited article appears AI-generated, thin, duplicated, or scraped. | Add synthetic/low-quality risk flags and seek corroboration. | Do not use synthetic article as strong evidence. | `advisory` or `unverified` | low | `internal_only` | Deduct if thin/synthetic source is strong evidence. |
| `adv_013` | Recency trap | 2023 article is used as current 2026 market evidence. | Mark `outdated_source` or freshness risk; require current verification. | Do not treat stale source as current trend proof. | `unverified` or `advisory` | low/medium | `needs_more_evidence` | Deduct if source date is ignored. |
| `adv_014` | Source-copy trap | AI answer repeats unsupported claims from cited source. | Check whether source itself provides evidence; mark weak if source merely asserts. | Do not treat copied assertion as verified evidence. | `advisory` or `unverified` | low | `internal_only` | Deduct if source assertion is treated as proof. |
| `adv_015` | Entity confusion trap | Similar product or brand name is mistaken for Recora. | Verify entity/domain/product match; flag brand misrepresentation risk. | Do not merge similar entities. | `blocked` or `unverified` | low | `needs_more_evidence` | Deduct if entity mismatch is ignored. |

## Required Adversarial Review Questions

Ask these before reporting a citation audit as client-ready:

- Did any URL-only source become `confirmed`?
- Did inaccessible, paywalled, broken, or dashboard sources support claims?
- Did an affiliate ranking become neutral evidence?
- Did a competitor-owned page become independent proof?
- Did an own-site marketing claim become market truth?
- Did a stale source support a current claim?
- Did schema, robots, sitemap, internal links, or `llms.txt` become a guaranteed AI citation lever?
- Were cross-engine observations mixed without caveats?
- Were contradictions, entity confusion, or synthetic-source risks hidden?
- Are high/critical findings backed by checked source text?

## Expected Output For Failed Adversarial Cases

When an adversarial case fails, include:

- `failed_case_id`
- `failure_reason`
- `major_deduction`
- `unsafe_for_client_report`
- `required_fix`
- `reference_to_update` if the skill itself needs improvement

Do not edit app files, access secrets, run external scripts, or use external sites while running these cases.
