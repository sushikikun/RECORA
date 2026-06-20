# Eval Prompts And Regression Checklist

Use this reference for lightweight skill regression. Do not execute scripts or external tools.

## should_trigger

These requests should trigger `recora-ai-citation-analysis`:

- Analyze these AI-answer citation URLs and classify source quality.
- Explain why our own site is not cited in this AI answer.
- Explain why only competitors are cited for this prompt.
- Check whether the AI answer text matches the cited source text.
- The answer has citations; check claim alignment and citation faithfulness.
- Produce a Source Intelligence report from this citation export.
- Check whether a low-quality comparison site is influencing the AI answer.
- Check whether cited sources are outdated.
- Build an Evidence Ledger for this AI answer and citations.
- Decide whether this citation analysis is ready for a client report.
- Produce machine-readable citation audit output.
- Compare Google AI Overview and Perplexity citation behavior.
- Check whether client-facing wording is safe for this citation finding.
- Create handoff payloads for competitor benchmarking or recommendation QA.

## should_not_trigger

These requests should not trigger this skill by themselves:

- Build a landing page design.
- Review Supabase RLS policies.
- Implement schema markup only.
- Create a generic competitor ranking without citation or source evidence.
- Fix a React component.
- Create a PDF layout.
- Edit Recora app files or production configuration.
- Read `.env` or API keys.
- Run external skill scripts.

## edge_case

Expected behavior: mark uncertainty explicitly, use `low_confidence` / `unverifiable`, keep conclusions narrow, and list verification needed.

- Citation URLs are provided but source text is missing.
- AI answer text exists but citation URLs are absent.
- Cited source text supports the AI answer.
- Cited source text contradicts the AI answer.
- `brand_domain` is missing.
- `competitor_domains` are missing.
- Only one measured observation is available.
- A comparison site has affiliate bias.
- A cited URL returns 404.
- A cited URL redirects.
- A cited URL requires login.
- Sources conflict within the same AI answer.
- Official site and third-party article disagree.
- A source is high-quality but does not support the AI claim.
- A cited page appears AI-generated or scraped.
- AI answer mentions the own site but only competitor sources are cited.
- Google AI Overview and Perplexity cite different source types.
- User asks whether schema, robots, or `llms.txt` will guarantee citations.

## Regression Checklist

Before completing skill work or a generated audit, check:

- Only files under `.agents/skills/recora-ai-citation-analysis/` were changed.
- App files were not touched.
- Secrets were not touched.
- `SKILL.md` description is concise and trigger-focused.
- References are loaded only when needed.
- Required eight output sections are preserved.
- Machine-readable schema is available when structured output is requested.
- Evidence Ledger exists for substantial audits.
- Citation Inventory exists for substantial audits.
- Claim Inventory exists when AI answer text is provided.
- Citation Correctness and Citation Faithfulness are distinct.
- Passage-level Evidence exists when cited source text is available.
- Missing source text downgrades to `low_confidence` / `unverifiable`.
- URL-only findings are not marked `confirmed`.
- `finding_status` is assigned correctly.
- Contradicted source text can produce `contradicted` finding status.
- P0/P1 or high/critical findings are not reported without checked evidence.
- AI citation increase is never guaranteed.
- Schema, robots, sitemap, `llms.txt`, and internal links are not treated as magic fixes.
- Cross-engine observations are not mixed when conditions differ.
- Recommended Actions include `verification_method` and `acceptance_criteria`.
- Handoff payload can be created for downstream Recora skills.
- Client-safe language avoids overclaiming.
- Report Readiness Gate is present.
- External skill text was not copied.
- External skill scripts were not executed.

## Sample Regression Cases

### Case 1: URL-only citations

Input: AI answer with three URLs, no source text.

Expected:

- Source Classification Table may classify domains only when obvious.
- `source_text_status: not_provided`.
- `alignment_status: unverifiable`.
- `finding_status: unverified` or `advisory`.
- confidence no higher than low.
- report readiness no stronger than `needs_more_evidence`.

### Case 2: Contradicted source

Input: AI answer says Vendor A has public pricing, cited source says contact sales only.

Expected:

- Claim Inventory splits the pricing claim.
- Citation Correctness: `contradicted`.
- `finding_status: contradicted`.
- risk high or critical depending buyer impact.
- report readiness blocked or internal only until resolved.

### Case 3: Competitor citation advantage

Input: competitor is cited across seven observations by review and comparison sites.

Expected:

- observation threshold: `emerging_pattern`.
- classify source mix by type.
- record commercial/affiliate bias if present.
- do not claim competitor superiority from citation count alone.
- recommend third-party outreach or evidence building with verification method.

### Case 4: Google AI technical recommendation

Input: user asks whether adding schema will make AI cite the page.

Expected:

- say no guarantee.
- frame schema as technical support for understanding/eligibility, not citation proof.
- hand off implementation details to `recora-schema-seo-aio` if needed.

### Case 5: Machine-readable output

Input: user asks for a structured citation audit object.

Expected:

- Include top-level schema objects from `machine-readable-output-schema.md`.
- Preserve the eight report sections if a report is also requested.
- Use stable IDs for citations, claims, risks, opportunities, and actions.

### Case 6: Client-safe wording

Input: a draft says, "This page will make Google AI cite us."

Expected:

- Rewrite as hypothesis or advisory.
- State verification method.
- Add no-guarantee caveat.

### Case 7: Cross-engine comparison

Input: Google AI Overview cites media pages, Perplexity cites comparison pages, ChatGPT has no URLs.

Expected:

- Do not aggregate as one citation count.
- Separate by engine/model/interface/date.
- Discuss source mix differences as observations, not universal behavior.
