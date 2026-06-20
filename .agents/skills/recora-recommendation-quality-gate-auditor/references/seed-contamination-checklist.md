# Seed Contamination Checklist

Use this checklist to detect whether a recommendation candidate is based on contaminated observation data.

## What Counts As Seed Contamination

Seed contamination occurs when the observation or recommendation is influenced by information injected into the prompt, query, seed list, or candidate-generation process in a way that makes the result look more organic or evidence-backed than it is.

## Common Patterns

Suppress or hold when the candidate relies on:

- a prompt that names the client and then treats the model's mention as organic visibility.
- a prompt that supplies competitor names and then treats their appearance as discovered by the AI system.
- a query that tells the model which vendor to recommend.
- an instruction that asks the model to cite a specific source, then treats the citation as independent evidence.
- generated candidate text that cites Recora's own assumptions as observed facts.
- circular evidence, such as "Recora recommended this because Recora's recommendation says it is important."
- seeded category definitions that are later treated as market consensus.
- query templates where the desired answer is embedded.

## Severity

- `suppress`: contamination creates a false claim of visibility, citation, recommendation, competitor dominance, official support, or measurement.
- `hold`: seed influence is possible but the candidate can be reframed as a hypothesis or requires clean measurement.
- `auto_publish`: no contamination detected and evidence is independently traceable.

## Questions To Ask

- Was the brand name included in a non-branded discovery query?
- Were competitor names supplied before the model generated competitors?
- Did the prompt ask for a specific conclusion?
- Was the cited source requested by the prompt?
- Is the candidate based on measured output or on a model's generated rationale?
- Can the observation be reproduced with a clean query set?

## Safe Rewrite

Risky:

- "The AI recommends us for this category."

Safe:

- "In the supplied seeded prompt, the brand appeared in the answer. A clean non-branded query set is needed before treating this as organic AI visibility."
