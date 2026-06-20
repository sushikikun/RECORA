# Test Cases

These are fictional cases for skill validation. They are not Recora evidence.

## Test Case A: Mixed Domestic, Overseas, And Substitute Mentions

Input:

- client: Recora
- competitors mentioned: ミエルカSEO, PEEC, Gumshoe, Rankscale, SEO会社, 内製運用

Expected handling:

- ミエルカSEO is `Direct candidate` or `Adjacent` depending on use-case and buying-context evidence.
- PEEC is `Global reference`, `Aspirational`, or `Adjacent`; do not treat it as Japan Direct without domestic purchase evidence.
- Gumshoe and Rankscale are `Overseas aspirational`.
- SEO会社 and 内製運用 are `Substitute`.
- Do not assert Share of Voice without measured samples.

## Test Case B: Only Overseas GEO Tools Appear

Input:

- AI answers mention only overseas GEO tools.
- The client and domestic competitors do not appear.

Expected handling:

- Do not conclude that no Japan Direct competitors exist.
- Classify the tools as `Global reference` or `Overseas aspirational`.
- Output `client_absence` and `category_visibility_gap`.
- Mark domestic competitive conclusions as `low_confidence` or `insufficient_data`.

## Test Case C: Only Competitor Official Sites Are Cited

Input:

- Competitor official sites are cited.
- No third-party sources, comparison pages, reviews, case studies, or media are available.

Expected handling:

- Do not rate citation strength high from official sources alone.
- Output `third_party_source_gap`.
- Do not treat competitor self-claims as facts.
- Mark source confidence as limited.

## Test Case D: Competitors Change By Persona

Input:

- Executives see consultants.
- SEO owners see tools.
- PR owners see PR agencies.

Expected handling:

- Split competitor sets by persona.
- Do not average away persona differences.
- Output `persona_specific_gap`.
- Recommend counter-moves by persona and prompt topic.

