# External Skill Review Methods

These methods are distilled from audited external design skills and UI review sources. They are rewritten for Recora and must be used as procedure, not copied prose.

## Screenshot-First Review

- Purpose: judge what a buyer actually sees before reading code.
- Input: desktop screenshot, mobile screenshot, or browser render note.
- Criteria: first visual focus, overflow, text fit, CTA visibility, product mock readability, focus/hover states where visible.
- Output: `SCREENSHOT_OBSERVED`, `NEEDS_VERIFICATION`, top visible issue, before/after target.
- Recora use: LP, Dashboard, Sample Report, forms, final CTA.
- Prohibited: claiming screenshot verification without a screenshot.

## Above-The-Fold Diagnosis

- Purpose: decide whether the first viewport explains the service and next action.
- Input: hero screenshot or code-based layout.
- Criteria: service category in 3 seconds, H1 line count, CTA position, product mock scale, next-section hint.
- Output: 5-line diagnosis plus exact fix direction.
- Recora use: LP hero and sample report entry.
- Prohibited: making a hero impressive while implying unsupported capabilities.

## Hero Hierarchy Diagnosis

- Purpose: resolve whether H1, subcopy, CTA, and mock compete.
- Input: hero section.
- Criteria: one primary message, one primary CTA, mock as proof, Japanese line breaks, sample note placement.
- Output: hierarchy order and Tailwind spacing/type plan.
- Recora use: BtoB SaaS hero with green restraint.
- Prohibited: reference-site imitation by color only.

## Product Mock Density Diagnosis

- Purpose: make the mock feel like a real product surface.
- Input: hero mock, dashboard preview, sample report, mini cards.
- Criteria: sidebar/topbar, filter/scope row, KPI, table/ranking, source/log/insight panel, sample clarity.
- Output: missing UI objects, blueprint selection, mobile crop plan.
- Recora use: Hero Large Product Mock, Feature Card Mini Mock, Sample Report Preview, Final CTA ghost mock.
- Prohibited: fake provider support, fake metrics, random cards.

## Card Polish Diagnosis

- Purpose: prevent paragraph-only cards.
- Input: feature cards, use-case cards, report cards.
- Criteria: each card has a job, one mini UI object, consistent padding/radius/border, clear hierarchy.
- Output: card-level mini UI list and class-level recipe.
- Recora use: feature cards and CTA-supporting sections.
- Prohibited: increasing density by shrinking text below 12px.

## CTA Conversion Diagnosis

- Purpose: make action obvious without overclaiming.
- Input: hero CTA, section CTA, final CTA, form submit.
- Criteria: one primary action, believable next step, button affordance, contrast, focus state, no guarantee language.
- Output: CTA critique, safer label, button style plan, acceptance criteria.
- Recora use: free check, sample report, consultation, contact.
- Prohibited: "analysis starts automatically" unless Product Truth confirms it.

## Tailwind Class-Level Polish

- Purpose: turn critique into implementable class direction.
- Input: section/component and desired state.
- Criteria: max width, padding, gap, radius, border, shadow, font size, line height, color, hover/focus/motion-reduce.
- Output: class family plan, not necessarily full code.
- Recora use: Codex prompts and scoped implementation briefs.
- Prohibited: adding a parallel design system casually.

## Mobile 375px Diagnosis

- Purpose: verify the design works at the narrow baseline.
- Input: 375px screenshot or responsive code.
- Criteria: no horizontal scroll, H1 line count, CTA early, mock crop/stack, readable tabs, touch targets.
- Output: mobile fix brief with acceptance checks.
- Recora use: LP hero, mock, tabs, forms, sample report.
- Prohibited: scaling the desktop mock down until illegible.

## Before/After Delta Review

- Purpose: compare visual improvement after implementation.
- Input: before screenshot, after screenshot, or described change.
- Criteria: hierarchy, density, CTA clarity, mock credibility, mobile behavior, Product Truth safety.
- Output: delta table with pass/fail and remaining risks.
- Recora use: QA after Codex changes.
- Prohibited: calling a change improved if only color changed.

## Reference-Site Similarity Review

- Purpose: compare Recora to a reference site without copying it.
- Input: reference name, screenshot, URL, or user description.
- Criteria: spacing, section rhythm, card density, product proof, CTA treatment, FAQ/final CTA structure, motion restraint.
- Output: similarity score, method borrowed, Recora-specific adaptation.
- Recora use: SE Ranking, Peec, Gumshoe, Rankscale comparisons.
- Prohibited: copying reference text, HTML, CSS, images, logos, icons, or exact layouts.
