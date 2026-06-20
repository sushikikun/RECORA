# Gold Eval Cases

Use these cases to validate whether `recora-ai-citation-analysis` behaves correctly. These are manual evaluation cases, not executable scripts.

Each case should be evaluated with:

- `case_id`
- `purpose`
- `input_summary`
- `should_trigger`
- `required_reference_files`
- `expected_behavior`
- `must_not_do`
- `expected_output_sections`
- `pass_criteria`

## Case 1: URL-only citations, no source body

- `case_id`: `gold_001_url_only_no_source_text`
- `purpose`: Ensure URL-only evidence is not overclaimed.
- `input_summary`: AI answer text and citation URLs are provided, but no source text or snippets are available.
- `should_trigger`: true
- `required_reference_files`: `citation-audit-rubric.md`, `source-intelligence-report-contract.md`
- `expected_behavior`: classify obvious domains when possible, set `source_text_status: not_provided`, `alignment_status: unverifiable`, `finding_status: unverified`, and report readiness no stronger than `needs_more_evidence`.
- `must_not_do`: do not say the citations prove the answer; do not mark findings confirmed.
- `expected_output_sections`: all eight required sections plus Unverified Items.
- `pass_criteria`: all source-to-claim conclusions are caveated and verification steps are listed.

## Case 2: Source body matches AI answer

- `case_id`: `gold_002_source_matches_answer`
- `purpose`: Confirm positive support can be marked safely.
- `input_summary`: AI answer claim, citation URL, and source text passage directly support the same claim.
- `should_trigger`: true
- `required_reference_files`: `citation-audit-rubric.md`, `source-review-checklist.md`
- `expected_behavior`: split the claim, summarize the supporting passage, use `correct_supported`, `likely_faithful`, and `confirmed` or `likely` depending on source quality and freshness.
- `must_not_do`: do not ignore source freshness or authority; do not overquote source text.
- `expected_output_sections`: Source Classification Table, Claim Inventory, Passage-level Evidence Notes.
- `pass_criteria`: passage-level support is explicit and confidence is justified.

## Case 3: Source body contradicts AI answer

- `case_id`: `gold_003_source_contradicts_answer`
- `purpose`: Ensure contradictions are escalated.
- `input_summary`: AI answer says a vendor has public pricing; cited source says contact sales only.
- `should_trigger`: true
- `required_reference_files`: `citation-audit-rubric.md`, `client-safe-language.md`
- `expected_behavior`: mark `correctness_status: contradicted`, `finding_status: contradicted`, risk high/critical based on buyer impact, and report readiness blocked or internal only.
- `must_not_do`: do not soften contradiction into partial support.
- `expected_output_sections`: Citation Risk, Unverified Items, Report Readiness.
- `pass_criteria`: contradiction is visible before opportunities.

## Case 4: Competitor site is cited

- `case_id`: `gold_004_competitor_site_cited`
- `purpose`: Diagnose competitor-controlled citation advantage.
- `input_summary`: AI answer recommends a competitor and cites that competitor's own product page.
- `should_trigger`: true
- `required_reference_files`: `citation-audit-rubric.md`, `source-intelligence-report-contract.md`
- `expected_behavior`: classify as `competitor_site`, note non-neutral evidence, evaluate claim support, and propose own-site evidence building without claiming guaranteed citation gains.
- `must_not_do`: do not treat competitor marketing copy as neutral proof.
- `expected_output_sections`: Own / Competitor / Third-party Gap, Source Opportunity, Recommended Page / Content Actions.
- `pass_criteria`: competitor advantage is framed as hypothesis unless measured repeatedly.

## Case 5: Third-party comparison site strengthens competitor

- `case_id`: `gold_005_third_party_comparison_strengthens_competitor`
- `purpose`: Identify third-party source influence.
- `input_summary`: Comparison/ranking site includes competitor but omits client.
- `should_trigger`: true
- `required_reference_files`: `citation-audit-rubric.md`, `source-review-checklist.md`
- `expected_behavior`: classify `comparison_site`, record cited entity, check methodology/bias/freshness, and recommend third-party outreach or evidence building with caveats.
- `must_not_do`: do not assume the ranking is objective.
- `expected_output_sections`: Source Classification Table, Own / Competitor / Third-party Gap, Source Opportunity.
- `pass_criteria`: source owner, cited entity, bias flags, and control level are separated.

## Case 6: Comparison site has affiliate bias

- `case_id`: `gold_006_affiliate_bias`
- `purpose`: Ensure commercial influence is not missed.
- `input_summary`: Best-of page cites affiliate links and unclear methodology.
- `should_trigger`: true
- `required_reference_files`: `citation-audit-rubric.md`, `source-review-checklist.md`
- `expected_behavior`: add `affiliate_links_present` or `ranking_method_unclear`, reduce evidence strength, and include citation risk.
- `must_not_do`: do not call the source neutral.
- `expected_output_sections`: Citation Risk, Source Opportunity, Confidence Level.
- `pass_criteria`: bias flags affect confidence and wording.

## Case 7: Outdated source

- `case_id`: `gold_007_outdated_source`
- `purpose`: Detect stale citation risk.
- `input_summary`: AI answer cites an old article for current pricing, features, or market position.
- `should_trigger`: true
- `required_reference_files`: `citation-audit-rubric.md`, `client-safe-language.md`
- `expected_behavior`: mark freshness risk, set risk type `outdated_source`, and recommend verification or source update.
- `must_not_do`: do not call old information current without evidence.
- `expected_output_sections`: Citation Risk, Recommended Page / Content Actions, Unverified Items.
- `pass_criteria`: source age is tied to the claim's time sensitivity.

## Case 8: Citation URL returns 404

- `case_id`: `gold_008_404_source`
- `purpose`: Handle missing citations.
- `input_summary`: Cited URL is broken or unavailable.
- `should_trigger`: true
- `required_reference_files`: `citation-audit-rubric.md`, `source-review-checklist.md`
- `expected_behavior`: set `source_accessibility: broken`, `source_text_status: unavailable`, risk `hallucinated_or_missing_source` or `unverifiable_source`.
- `must_not_do`: do not infer the page contents from URL alone.
- `expected_output_sections`: Source Classification Table, Citation Risk, Unverified Items.
- `pass_criteria`: broken URL cannot support any claim.

## Case 9: Citation requires login

- `case_id`: `gold_009_login_required_source`
- `purpose`: Avoid hidden-source overclaiming.
- `input_summary`: Cited URL requires login and no source body is supplied.
- `should_trigger`: true
- `required_reference_files`: `citation-audit-rubric.md`, `source-review-checklist.md`
- `expected_behavior`: set `source_accessibility: login_required`, `alignment_status: unverifiable`, and confidence low.
- `must_not_do`: do not request credentials or login sessions.
- `expected_output_sections`: Citation Risk, Unverified Items.
- `pass_criteria`: report clearly states verification blocker.

## Case 10: AI answer mentions own site, citations are competitor sources

- `case_id`: `gold_010_own_mentioned_competitor_cited`
- `purpose`: Detect brand/source mismatch.
- `input_summary`: AI answer mentions client positively but citations point to competitor or third-party competitor profiles.
- `should_trigger`: true
- `required_reference_files`: `citation-audit-rubric.md`, `source-intelligence-report-contract.md`
- `expected_behavior`: separate mention visibility from citation support, mark brand/source mismatch risk, and recommend evidence building or third-party correction.
- `must_not_do`: do not count mention as own-site citation.
- `expected_output_sections`: Citation Summary, Own / Competitor / Third-party Gap, Citation Risk.
- `pass_criteria`: own-site citation absence remains visible.

## Case 11: AI answer text only, no citation URLs

- `case_id`: `gold_011_answer_only_no_urls`
- `purpose`: Handle missing citations while still auditing claims.
- `input_summary`: AI answer text is supplied without cited URLs.
- `should_trigger`: true
- `required_reference_files`: `source-intelligence-report-contract.md`, `machine-readable-output-schema.md`
- `expected_behavior`: build Claim Inventory, mark source support as missing, and list citations as not provided.
- `must_not_do`: do not invent citation URLs.
- `expected_output_sections`: Citation Summary, Claim Inventory, Unverified Items.
- `pass_criteria`: no source classification certainty is fabricated.

## Case 12: One measured observation

- `case_id`: `gold_012_single_observation`
- `purpose`: Prevent overgeneralizing from one run.
- `input_summary`: One prompt run shows competitor citations.
- `should_trigger`: true
- `required_reference_files`: `citation-audit-rubric.md`, `cross-engine-observation-protocol.md`
- `expected_behavior`: label as `anecdotal_observation`, use hypothesis/advisory language, and recommend monitoring.
- `must_not_do`: do not report a stable pattern.
- `expected_output_sections`: Confidence Level, Recommended Page / Content Actions.
- `pass_criteria`: observation count threshold is explicit.

## Case 13: Twenty-plus observations show same competitor advantage

- `case_id`: `gold_013_twenty_plus_same_competitor_pattern`
- `purpose`: Allow stronger pattern language with proper grouping.
- `input_summary`: 20+ like-for-like observations show the same competitor cited across the same engine/model/prompt family.
- `should_trigger`: true
- `required_reference_files`: `citation-audit-rubric.md`, `cross-engine-observation-protocol.md`
- `expected_behavior`: label as `stronger_pattern` only if conditions are comparable; still check source-to-claim support.
- `must_not_do`: do not combine mixed engines/models/personas into one count.
- `expected_output_sections`: Citation Summary, Own / Competitor / Third-party Gap, Confidence Level.
- `pass_criteria`: count threshold and comparability are both stated.

## Case 14: User wants schema guarantee

- `case_id`: `gold_014_schema_guarantee_claim`
- `purpose`: Prevent magic-fix claims.
- `input_summary`: User asks whether adding schema, robots edits, or `llms.txt` will make AI cite the page.
- `should_trigger`: true
- `required_reference_files`: `client-safe-language.md`, `citation-audit-rubric.md`
- `expected_behavior`: state no guarantee, frame technical support as discovery/understanding/validation aid, and suggest verification.
- `must_not_do`: do not promise citation increase.
- `expected_output_sections`: Recommended Page / Content Actions, Confidence Level.
- `pass_criteria`: wording is client-safe and non-deterministic.

## Case 15: Google AI Overview and Perplexity differ

- `case_id`: `gold_015_cross_engine_difference`
- `purpose`: Ensure cross-engine observations are not mixed.
- `input_summary`: Google AI Overview cites official/media sources; Perplexity cites comparison/review sites for similar prompts.
- `should_trigger`: true
- `required_reference_files`: `cross-engine-observation-protocol.md`, `source-intelligence-report-contract.md`
- `expected_behavior`: split by engine/model/interface/date, compare source mix cautiously, and avoid global claims.
- `must_not_do`: do not say one source mix applies to all AI systems.
- `expected_output_sections`: Observation Context, Own / Competitor / Third-party Gap, Confidence Level.
- `pass_criteria`: cross-engine caveats and same-condition comparison rules are visible.
