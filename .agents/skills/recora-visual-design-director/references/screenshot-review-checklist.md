# Screenshot Review Checklist

Use this for screenshot-based review. Separate visual observations from source-code assumptions.

For substantial reviews, also list `External pattern references used`. Apply license-audited external checks as quality gates: focus visibility, hit targets, overflow, reduced motion, chart readability, resilient text, and dashboard density. Do not imply visual verification if screenshots or browser rendering were not inspected.

Also load `external-skill-review-methods.md` and use the `Screenshot-First Review`, `Before/After Delta Review`, and `Mobile 375px Diagnosis` formats before giving implementation advice.

## Evidence Labels

- `SCREENSHOT_OBSERVED`: visible in the screenshot.
- `CODE_OBSERVED`: confirmed in source files.
- `PRODUCT_TRUTH`: confirmed by `docs/recora-product-truth.md`.
- `REFERENCE_PATTERN`: inferred from allowed reference-site design principles.
- `ASSUMPTION`: plausible but not confirmed.
- `NEEDS_VERIFICATION`: cannot be confirmed from available artifacts.

## Desktop Hero

- Service category is clear in 3 seconds.
- H1 is readable and naturally broken.
- CTA is visible and primary.
- Product mock is visible above or near the fold.
- Header and hero align to the same width system.
- First viewport hints at the next section.
- No generic AI visual dominates the product proof.
- External delta is concrete: spacing, hierarchy, density, CTA affordance, and mock scale are named.

## Product Mock

- Looks like a real SaaS screen, not a decorative card.
- Has a clear page title, navigation, KPI row, table/ranking, and source/detail panel.
- Uses Recora-specific product objects.
- Text is readable enough.
- Sample label is visible but not overpowering.
- Does not imply unsupported provider connections or automation.
- Has a selected blueprint or a clear reason no blueprint applies.

## Tab Section

- Active state is clear.
- Tab labels are short and meaningful.
- Panel content changes in a meaningful way.
- Tabs do not look like arbitrary chips.
- Touch targets look usable on mobile.

## Cards

- Cards include mini UI or data shapes.
- Card density feels intentional.
- Padding, radius, border, and shadow are consistent.
- Cards do not all compete equally.
- Section does not become a wall of text.
- Each product-claim card has at least one mini UI object or a reason it should remain text-only.

## Sample Report

- Report looks shareable and client-safe.
- Sample data is labeled.
- Report sections include evidence context, not just scores.
- Tables and scores are readable.
- Method notes prevent false precision.
- Unsupported outcome claims are absent.

## Final CTA

- CTA restates the next step clearly.
- It visually connects with earlier product proof.
- It is not just a large floating card unless that card has a real interaction role.
- It does not introduce new claims or fake urgency.
- Primary CTA remains deep green and focused.

## Mobile 375px

- No horizontal scroll.
- H1 does not consume the entire first screen.
- CTA appears early.
- Product mock is simplified or intentionally cropped.
- Tabs are readable and touchable.
- Cards do not become a long repetitive wall.
- Form fields and buttons have comfortable tap targets.
- No text overlaps or spills out of buttons/cards.
- Touch targets appear usable; mock is cropped, excerpted, or stacked intentionally.

## "Why It Looks Cheap" Checklist

Check these before writing the final diagnosis:

- The product mock is too small or empty.
- The page has too many similar cards.
- Green is used everywhere with no semantic hierarchy.
- Typography scale is too loud for Japanese BtoB.
- Section gaps are too large, creating empty bands.
- Shadows are either too heavy or absent where depth is needed.
- Cards contain prose instead of product UI.
- CTA copy overpromises.
- Reference-site inspiration stayed at "make it look like X" instead of becoming concrete spacing, density, and hierarchy.
- Sample labels either disappear or dominate.

## Output Snippet

```md
Visual basis:
- Desktop screenshot: inspected / not inspected
- Mobile 375px: inspected / not inspected
- Product Truth: checked / missing / unavailable
- External pattern references used: [source/pattern or none]

Most visible quality issue:
- [one sentence]

Screenshot-confirmed issues:
- [issue]

Needs verification:
- [issue]
```
