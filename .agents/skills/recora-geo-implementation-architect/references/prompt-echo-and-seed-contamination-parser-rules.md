# Prompt Echo And Seed Contamination Parser Rules

## CONFIRMED_FROM_FILES

- Candidate output includes seed/sample/example scoring notes, but no confirmed persisted seed-risk object was found.
- `inspect-openai-output.ts` stores the prompt alongside output analysis.
- Mention parsing appears to run against output text, but no confirmed code subtracts prompt echo spans or marks seed-originated mentions.

## USER_PROVIDED_CONTEXT

- v0.5 should prevent prompt echo, seeded brand mentions, and seeded competitor mentions from being counted as organic visibility.

## NEEDS_VERIFICATION

- Prompt echo handling is not confirmed.
- Seed terms and prompt-injected brand lists are not confirmed as persisted parser inputs.
- Parser and citation extraction implementation not fully inspected. Exact extraction behavior remains NEEDS_VERIFICATION.

## RECOMMENDED_ARCHITECTURE

- Persist parser input context: prompt text, seed terms, seeded target brand, seeded competitors, and allowed/disallowed echo rules.
- Classify mention origin as explicit answer text, prompt echo, seed echo, citation title, URL, source page text, answer template, or unknown.
- Propagate seed-risk flags into brand mentions, candidate evidence, and quality-gate handoff.
- Block strict organic visibility claims when mention origin is prompt echo, seed echo, URL-only, or unknown.

## DO_NOT_ASSUME

- Do not treat repeated prompt terms as organic mentions.
- Do not treat seeded competitor names as discovered competitors.
- Do not drop seed-risk context before candidate generation.
