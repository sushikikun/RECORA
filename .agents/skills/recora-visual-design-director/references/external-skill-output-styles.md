# External Skill Output Styles

Use these Recora-specific templates when an answer should feel like a practical external design review rather than abstract theory.

## 1. Visual Audit Table

- Use when: broad LP/Dashboard/Sample Report review.
- Output items: area, observed issue, severity, external lens, Recora constraint, fix direction, acceptance criteria.
- Example: `Hero | product mock too small | P1 | SaaS LP Reviewer | Product Truth safe | enlarge mock and add sample scope row | CTA + mock visible in first viewport`.
- Recora note: include Product Truth risk separately from visual severity.

## 2. Before/After Delta Table

- Use when: reviewing changes.
- Output items: criterion, before, after, pass/fail, remaining risk.
- Example: `Mock density | sparse cards | KPI + source table added | pass | mobile crop still needed`.
- Recora note: color-only changes should not pass product-proof criteria.

## 3. Component-Level Polish Checklist

- Use when: reviewing cards, tabs, buttons, forms, mock panels.
- Output items: padding, radius, border, shadow, state, focus, label, density, mobile fit.
- Example: `Tabs: active visible, keyboard focus, no 375px wrap, panel content changes meaningfully`.
- Recora note: cards need mini UI when they claim product capability.

## 4. Tailwind Implementation Diff Plan

- Use when: creating Codex prompts.
- Output items: target section, class families to change, tokens, responsive breakpoints, motion/focus, acceptance criteria.
- Example: `Hero wrapper: max-w-7xl, py-20/24, grid gap-8; H1: text-4xl lg:text-6xl leading-tight`.
- Recora note: provide direction, not copied external class strings.

## 5. Screenshot Critique Format

- Use when: user provides screenshots or local browser views.
- Output items: visual basis, top visible issue, screenshot-confirmed issues, needs verification, mobile risk.
- Example: `SCREENSHOT_OBSERVED: CTA appears below mock on 375px`.
- Recora note: never claim Product Truth from screenshot alone.

## 6. Conversion CTA Critique

- Use when: CTA, form, final CTA, or free-check path is weak.
- Output items: action clarity, promise risk, button affordance, visual priority, safer label, acceptance.
- Example: `Label implies automatic analysis; change to consultation/sample-report action unless Product Truth confirms automation`.
- Recora note: conversion pressure must not override truth boundaries.

## 7. Product Mock Rebuild Brief

- Use when: mock is sparse, fake, or decorative.
- Output items: blueprint, layout hierarchy, UI objects, sample label, mobile crop, forbidden claims.
- Example: `Hero Large Product Mock: topbar + scope row + KPI + ranking + source panel`.
- Recora note: no provider UI mimicry.

## 8. Mobile Fix Brief

- Use when: 375px or responsive issues exist.
- Output items: overflow, H1 lines, CTA location, mock strategy, tab strategy, chart/card simplification.
- Example: `Replace full desktop mock with KPI pair + 3-row source list excerpt`.
- Recora note: do not hide sample labels.

## 9. Reference-Site Similarity Report

- Use when: user mentions SE Ranking, Peec, Gumshoe, Rankscale, or another site.
- Output items: reference quality, similarity score, structural delta, adaptation, do-not-copy.
- Example: `SE Ranking similarity 42%: whitespace is close, mock density is not`.
- Recora note: similarity is method-level, not asset-level.

## 10. Implementation Prompt With Acceptance Criteria

- Use when: user asks for Codex prompt.
- Output items: scope, references, external lenses used, exact changes, prohibited actions, acceptance criteria, validation.
- Example: `commit/push禁止; Product Truth確認; external assets copy禁止; 375px no overflow`.
- Recora note: prompt must mention external methods used and Recora-specific constraints.
