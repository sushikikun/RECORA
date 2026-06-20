# Seed Contamination Detection

Use this reference to detect whether a recommendation candidate treats seeded information as naturally surfaced AI search evidence.

## Definition

Seed contamination means a recommendation treats information injected by the measurement prompt, seed list, competitor list, target brand, category framing, or diagnostic setup as if it were naturally surfaced by the AI answer.

## Examples

- Prompt asks "Compare Recora with Competitor A," then candidate says "AI naturally recommended Recora against Competitor A."
- Seed competitor list appears in the answer, then candidate treats those competitors as discovered competitors.
- Prompt includes target brand or category, then candidate treats brand mention as organic non-branded visibility.
- Prompt asks the model to cite a specific source, then candidate treats the citation as independent source discovery.
- Diagnostic setup includes the desired recommendation, then candidate treats the model's agreement as measurement.

## Rules

- If seed influence cannot be separated, decision should be `hold`.
- If candidate directly misrepresents seeded information as natural discovery, decision should be `suppress`.
- Require prompt category, seed terms, and answer context before `auto_publish`.
- Treat seeded brand mentions as measurement of prompt compliance, not organic discovery.
- Treat seeded competitor lists as setup context, not competitor discovery evidence.

## Required Context For auto_publish

Before `auto_publish`, verify:

- prompt category.
- whether the query was branded, non-branded, comparison, citation-check, or seeded.
- seed terms supplied to the model.
- answer text and citations.
- whether competitor or brand names were supplied before the answer.
- whether the recommendation depends on natural discovery.

## Safe Rewrite

Risky:

- "AI naturally recommended Recora for this competitor comparison."

Safe:

- "In a seeded comparison prompt, Recora appeared in the answer. A clean non-branded or neutral comparison query set is needed before treating this as organic recommendation evidence."
