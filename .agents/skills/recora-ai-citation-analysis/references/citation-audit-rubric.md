# Citation Audit Rubric

Use this reference when the audit requires detailed classification, scoring, or report readiness decisions.

## Source Classification Rubric

Use one primary `source_type` per URL.

| source_type | Use when | Checks | Caveat |
|---|---|---|---|
| `own_site` | Client-controlled page, docs, blog, help, pricing, research, case study, comparison, FAQ, or landing page. | domain ownership, visible claim, page purpose, update date. | Owned content is not independent validation. |
| `competitor_site` | Known competitor-controlled domain or subdomain. | competitor mapping, product/category fit, claim support. | Competitor copy is not neutral evidence. |
| `third_party_media` | Editorial, news, industry blog, analyst, expert article, or podcast notes. | publisher, author, date, independence, entity strengthened. | Can be shallow, stale, or commercially influenced. |
| `comparison_site` | Best-of, alternatives, versus, ranking, shortlist, or vendor-selection guide. | criteria, methodology, date, included vendors, sponsorship. | Ranking method may be opaque. |
| `review_site` | Review/rating profile, marketplace review, or review aggregation. | review count, review freshness, ownership, category fit. | Reviews need corroboration. |
| `directory` | Listing, tool database, marketplace profile, partner directory, association page. | listing owner, completeness, category, freshness. | Listing presence is weak proof alone. |
| `social` | Forum, social, community, video, Q&A, creator, or discussion thread. | author/community signal, recency, corroboration. | UGC is volatile and anecdotal. |
| `official_source` | Official docs, release notes, standards, vendor docs, canonical non-client source. | scope, publisher, date, primary-source status. | Official does not always support the client claim. |
| `government_or_academic` | Government, regulator, university, paper, dataset, research institution. | jurisdiction, method, date, authority. | May support background only. |
| `unknown` | Cannot categorize from available evidence. | missing body, missing metadata, ambiguous domain. | Do not infer quality. |
| `low_confidence` | Some signals exist but ownership, body, or purpose is uncertain. | state missing evidence. | Caution label, not a conclusion. |

## Citation Correctness Rubric

Citation correctness asks whether the cited source actually supports the AI-answer claim.

- `correct_supported`: source directly supports the atomic claim in entity, scope, date, product, and context.
- `partially_correct`: source supports part of the claim, but a qualifier, date, comparison basis, product, or region is missing.
- `adjacent_but_not_supporting`: source is topically related but does not prove the claim.
- `unsupported`: checked source does not support the claim.
- `contradicted`: source conflicts with the claim.
- `unverifiable`: source text cannot be checked.

## Citation Faithfulness Rubric

Citation faithfulness asks whether the AI answer appears genuinely grounded in the cited source, or whether the citation looks post-hoc.

- `likely_faithful`: answer wording and cited passage align closely.
- `possibly_faithful`: source supports the gist, but grounding is incomplete.
- `weak_faithfulness`: source is loosely related or too broad.
- `likely_post_rationalized`: citation appears attached after the fact and does not explain the answer claim.
- `unverifiable`: source text or answer-to-source mapping is unavailable.

## Correctness vs Faithfulness Quick Distinction

| Situation | correctness_status | faithfulness_status | Note |
|---|---|---|---|
| Passage directly proves the same claim. | `correct_supported` | `likely_faithful` | Good support if page is accessible and current. |
| Source says the same topic but not the same claim. | `adjacent_but_not_supporting` | `weak_faithfulness` | Do not present as proof. |
| Source proves only one part of a bundled claim. | `partially_correct` | `possibly_faithful` | Split the claim further. |
| Source conflicts with the answer. | `contradicted` | `likely_post_rationalized` | Treat as high/critical risk. |
| Source text is missing. | `unverifiable` | `unverifiable` | Finding cannot be confirmed. |

## Source Accessibility Rubric

- `accessible`
- `blocked`
- `paywalled`
- `login_required`
- `broken`
- `redirected`
- `unavailable`
- `not_checked`

A redirected source must preserve both raw URL and final URL. A paywalled or login-required source can be classified but should not receive strong claim support unless supplied text is available.

## Source Accessibility Judgment

| access state | allowed use | report caveat |
|---|---|---|
| `accessible` with checked text | May support correctness/faithfulness. | Cite checked scope and date. |
| `redirected` | May be used if final URL preserves intent. | Record raw URL and final URL. |
| `paywalled` | Use only supplied visible or licensed text. | Mark limited verification. |
| `login_required` | Do not infer body content. | Mark unverifiable unless text supplied. |
| `broken` / `unavailable` | Use as citation risk only. | Do not use as claim support. |
| `not_checked` | Use only for inventory. | Keep confidence low. |

## Claim Atomicity

Split AI-answer text into the smallest verifiable claims. Avoid checking bundled claims as one unit.

Bad: `Company A is cheap and has strong reviews.`

Better atomic claims:

- `Company A is claimed to be cheap.`
- `Company A is claimed to have strong reviews.`
- `There is a source supporting price comparison.`
- `There is a source supporting review quality.`

## Claim Type And Severity

Use `claim_type` from the machine-readable schema. Assign `claim_severity` by buyer impact, compliance risk, and brand risk.

- `low`: descriptive or low-impact claim; unlikely to affect purchase or compliance decisions.
- `medium`: feature, category, reputation, or comparison claim that can affect evaluation.
- `high`: pricing, recommendation, competitor comparison, market positioning, or important factual claim.
- `critical`: legal/regulatory, safety, financial, brand-misrepresentation, direct contradiction, or buyer-harmful claim.

## Passage-level Evidence Rules

For each material claim, capture:

- `claim_id`
- `atomic_claim`
- `cited_url`
- `supporting_passage_summary`
- `passage_location_hint`
- `alignment_status`
- `correctness_status`
- `faithfulness_status`
- `evidence_strength`
- `confidence`
- `verification_note`

Use a passage summary, not a long quote. If no passage is available, set `supporting_passage_summary: not_checked` and confidence no higher than low.

## Triangulation

For important claims and P0/P1 risks, record whether support is:

- `single_source_only`
- `multiple_independent_sources`
- `primary_source_available`
- `third_party_only`
- `conflicting_sources`
- `no_source`

Do not require triangulation for every minor observation, but do require it or explain its absence for material client-facing claims.

## Contradictory Evidence

Record contradiction state:

- `no_conflict_found`
- `minor_conflict`
- `major_conflict`
- `direct_contradiction`
- `unknown`

Direct contradiction blocks client-ready reporting until resolved or clearly framed as a risk.

## Citation Drift

Citation drift means the cited source or AI answer citation behavior changes over time.

Track when available:

- raw URL changed or redirected.
- cited page content changed since prior observation.
- same prompt now cites different sources.
- same source supports different claims across models.
- citation disappeared or became inaccessible.

Use drift as a monitoring reason, not as proof of source quality by itself.

## Source Volatility

Use one volatility label:

- `stable_official_page`
- `frequently_updated_page`
- `news_or_blog`
- `user_generated_content`
- `directory_listing`
- `comparison_ranking`
- `volatile_unknown`

Volatile sources need fresher verification before client-facing conclusions.

## Synthetic / AI-generated Source Risk

Add `risk_flags` when applicable:

- `likely_ai_generated_page`
- `thin_affiliate_page`
- `synthetic_comparison_page`
- `scraped_or_rewritten_content`
- `no_original_evidence`
- `unclear_author_or_publisher`
- `excessive_commercial_intent`

## Commercial Bias / Affiliate Bias

Add `bias_flags` when applicable:

- `affiliate_links_present`
- `sponsored_content_possible`
- `vendor_profile_claimed`
- `ranking_method_unclear`
- `review_count_unclear`
- `pay_to_play_possible`
- `unknown_bias`

Comparison and review sources are not automatically neutral.

## Commercial Bias Judgment

| signal | bias risk | handling |
|---|---|---|
| Clear methodology, no obvious paid placement | lower | Still check claim support. |
| Affiliate disclosure or outbound monetized links | medium | Mark `affiliate_links_present`; avoid neutrality claims. |
| Sponsored/vendor profile/claimed listing | medium/high | Mark control or sponsorship caveat. |
| Opaque ranking criteria with commercial CTAs | high | Treat ranking as weak evidence. |
| Scraped/AI-generated comparison content | high | Add synthetic source risk; seek corroboration. |

## Citation Share / Citation Footprint

Citation footprint should consider:

- cited domain count.
- cited page count.
- source type diversity.
- own-site versus competitor-site presence.
- third-party media, review, comparison, directory, and official-source mix.
- source-to-claim alignment, not only citation count.

Never use raw citation count alone as proof of authority.

## Observation Count Thresholds

- `1 observation`: `anecdotal_observation`
- `2-5 observations`: `weak_pattern`
- `6-19 observations`: `emerging_pattern`
- `20+ observations`: `stronger_pattern`

Do not combine counts blindly when engine, model, prompt, persona, locale, or date differs.

## Evidence Strength Rules

- `strong`: checked source text plus direct claim support, ideally with measured observation and/or multiple independent sources.
- `moderate`: source text partly checked or one checked source supports the gist, but recency, recurrence, or independence is limited.
- `weak`: URL-only, snippet-only, one-off observation, competitor copy, social-only evidence, or heavy inference.
- `none`: no support, missing source, contradicted source, or no ledger row.
- `unknown`: input too incomplete.

## Claim Severity x Evidence Strength Matrix

| claim_severity | strong evidence | moderate evidence | weak evidence | none/unknown |
|---|---|---|---|---|
| `low` | `confirmed` or `likely` | `likely` or `advisory` | `advisory` | `unverified` |
| `medium` | `confirmed` or `likely` | `hypothesis` or `advisory` | `unverified` or `advisory` | `unverified` |
| `high` | `likely` or `confirmed` only if source text is checked | `hypothesis` | `unverified` | `blocked` |
| `critical` | `confirmed` only with checked evidence and no conflict | `blocked` or `hypothesis` for internal use | `blocked` | `blocked` |

If evidence contradicts the claim, use `finding_status: contradicted` regardless of evidence strength.

## Finding Status

- `confirmed`: checked evidence directly supports the finding.
- `likely`: strong evidence but one non-critical dependency remains.
- `hypothesis`: plausible explanation requiring additional evidence.
- `advisory`: safe recommendation or caution, not a finding.
- `unverified`: source text, measurement, dates, or domain mapping is missing.
- `contradicted`: checked evidence conflicts with the claim.
- `blocked`: unsafe for client-facing use until resolved.

## Risk Scoring

- `0-20 low`: relevant, current, aligned source; minor caveats.
- `21-50 medium`: partial support, freshness uncertainty, limited authority, or weak context.
- `51-75 high`: mismatched claim, stale source, misleading comparison, commercial bias, competitor-dominated framing, or low-quality source.
- `76-100 critical`: hallucinated/missing source, direct contradiction, brand misrepresentation, or buyer-harmful unsupported claim.

Risk severity and confidence are separate. A high-risk issue may be low-confidence if evidence is incomplete.

## Report Readiness Gate

Use one decision:

- `ready_for_client_report`
- `internal_only`
- `needs_more_evidence`
- `blocked_by_missing_source_text`
- `blocked_by_conflicting_evidence`

`ready_for_client_report` requires:

- AI answer text is available.
- cited URLs are available when citation claims are made.
- major cited source text is checked.
- own/competitor/third-party source classification is possible.
- claim alignment is checked.
- low-confidence inference is labeled.
- recommendations include `verification_method` and `acceptance_criteria`.
- wording follows `client-safe-language.md`.

`internal_only` applies when the hypothesis is useful but too weak for client-facing conclusions.

`needs_more_evidence` applies when measurement count, source text, domain mapping, observation date, or conflict resolution is missing.

## Report Readiness Gate Decision Table

| condition | decision |
|---|---|
| Major source text missing for key claims | `blocked_by_missing_source_text` or `needs_more_evidence` |
| Direct contradiction unresolved | `blocked_by_conflicting_evidence` |
| One observation only, no source body | `needs_more_evidence` |
| Checked sources support low/medium claims, caveats labeled | `ready_for_client_report` may be possible |
| High/critical claims supported only by weak evidence | `internal_only` or `blocked_by_missing_source_text` |

## Cross-engine Comparison Cautions

- Compare like-for-like observation sets only.
- Do not merge observations across engine, model, interface, persona, language, region, login state, personalization possibility, or date without labeling the split.
- Treat Google AI Overview, Google AI Mode, ChatGPT, Perplexity, Gemini, Claude, and Copilot as different citation surfaces.
- Record citation UI type because displayed links, footnotes, source panels, and answer-grounding links may not mean the same thing.

## Google Generative AI Search Caution

For Google AI features, ordinary SEO foundations remain important. Special schema, `llms.txt`, robots edits, or AI-specific files do not guarantee citation or AI visibility. Treat technical actions as support for discovery, understanding, validation, or extraction, not as guaranteed citation levers. Always distinguish Google AI Overview and AI Mode from other engines/models.
