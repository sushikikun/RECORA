# AI Answer Parser And Mention Extraction

## Parser Review Rules

- Preserve raw answer.
- Normalize without destroying source text.
- Distinguish explicit brand mention from fuzzy or ambiguous match.
- Distinguish target brand, competitor, and unrelated entity.
- Track mention span and surrounding context.
- Track recommendation language separately from mere mention.
- Track negative, neutral, and positive context carefully.
- Do not count prompt-seeded brand text as organic visibility.
- Handle malformed, empty, refusal, and partial answers.
- Record parser version.
- Make extraction rerunnable.

## Failure Cases

- name collision
- substring false positive
- Japanese spacing and width variations
- aliases and romanization variants
- URLs containing brand names
- cited page containing a brand not mentioned in answer
- prompt echo
- answer template echo
- markdown link title versus URL mismatch
- competitor alias overlapping a target alias

## Review Questions

- Can every mention be traced to exact answer text?
- Are brand aliases versioned and auditable?
- Are seeded terms propagated into extraction risk?
- Are URL-only matches excluded or separately flagged?
- Are parser upgrades able to supersede derived rows without mutating raw evidence?
