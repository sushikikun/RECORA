# External Skill Audit

Use this file in `Mode 8: External Design Ingestion`. It records public skills, design-system sources, UI libraries, and local installed skills that can inform Recora visual design. The default rule is pattern extraction only: do not copy text, code, CSS, HTML, screenshots, logos, icons, trademarks, or assets into Recora.

## License Policy

- `yes-permissive`: license is MIT, Apache-2.0, CC0/public-domain style, OGL, or another permissive license. Use only abstracted design principles unless the user explicitly approves licensed code reuse.
- `summarize-only`: source is useful, but license is unclear, proprietary, mixed, or local-only. Do not copy. Summarize as judgment criteria only.
- `no-license-unclear`: license could not be verified. Do not copy or adapt language directly.
- `no-proprietary`: license or terms are not appropriate for direct reuse. Do not copy. Use high-level inspiration only if it is a generic design principle.

## Candidate Audit Table

| Skill / Source | License | Category | Useful patterns | Can copy? | Recora adaptation | Risk |
| -------------- | ------- | -------- | --------------- | --------- | ----------------- | ---- |
| Vercel Web Interface Guidelines, https://github.com/vercel-labs/web-interface-guidelines | MIT | Accessibility / Screenshot QA / UI Review | focus visibility, hit targets, reduced motion, resilient content, layout overflow checks, accessible charts | yes-permissive | Convert into screenshot QA and Tailwind acceptance checks for Recora LP, forms, tabs, mock UI, and mobile 375px | Some rules are Vercel-specific; do not import brand preferences |
| local `frontend-design` skill | Apache-2.0 in local LICENSE.txt | Landing Page Design / Visual Direction | avoid template defaults, define a signature element, spend distinctiveness in one place, critique after screenshot | yes-permissive | Make the product mock or sample report the signature element, keep surrounding UI restrained | Do not reuse prose wholesale; Recora already has a green/trust direction |
| Tailwind CSS, https://github.com/tailwindlabs/tailwindcss | MIT | Tailwind Implementation | utility-first token translation, spacing/radius/shadow/font class specificity | yes-permissive | Express design decisions as class families and reusable recipes instead of vague taste language | Tailwind docs are implementation material, not a complete design system |
| Radix UI Primitives, https://github.com/radix-ui/primitives | MIT | Accessibility / Design System | accessible tabs, dialog, tooltip, popover, focus management primitives | yes-permissive | Use as behavior model for tabs, popovers, and tooltips when Recora needs interactive UI | Do not add dependency casually; prefer existing components unless implementation is approved |
| shadcn/ui, https://github.com/shadcn-ui/ui | MIT | Tailwind Implementation / Design System | component recipe style, tokenized variants, compact SaaS surfaces | yes-permissive | Use recipe thinking for buttons, cards, tabs, tables, and mock frames | Do not make Recora look like default shadcn; customize density, colors, and Japanese typography |
| Tremor, https://github.com/tremorlabs/tremor | Apache-2.0 with notices | Dashboard Design / Data Visualization | KPI cards, compact charts, status cards, dashboard density | yes-permissive | Borrow dashboard information hierarchy and chart restraint for sample dashboards and reports | Some components depend on copied code; only abstract patterns unless implementation scope approves |
| Recharts, https://github.com/recharts/recharts | MIT | Data Visualization | readable chart primitives, bars/lines/tables as React-friendly structures | yes-permissive | Guide simple bars, mini lines, and responsive chart decisions | Avoid adding dependency for tiny static mock charts |
| Nivo, https://github.com/plouc/nivo | MIT | Data Visualization | rich chart taxonomy, legends, labels, responsive chart thinking | yes-permissive | Use for chart selection logic and label/legend discipline | Avoid complex decorative charts that imply measured accuracy |
| IBM Carbon Design System, https://github.com/carbon-design-system/carbon | Apache-2.0 | Dashboard Design / Design System | enterprise density, data tables, status, spacing discipline, neutral surfaces | yes-permissive | Adapt enterprise calm, table hierarchy, and status semantics to Japanese BtoB Recora | Do not copy IBM visual identity or component code without explicit need |
| Ant Design, https://github.com/ant-design/ant-design | MIT | Dashboard Design / Design System | enterprise tables, forms, tabs, feedback states, dense admin UI | yes-permissive | Use as a benchmark for dashboard completeness, forms, and table ergonomics | Avoid generic admin-template look and overstuffed controls |
| GitHub Primer React, https://github.com/primer/react | MIT | Design System / Accessibility | compact controls, density, focus states, predictable interaction patterns | yes-permissive | Use as reference for low-drama operational UI and accessible controls | Do not import GitHub visual identity or Octicons |
| U.S. Web Design System, https://github.com/uswds/uswds | Mostly public domain/CC0 with mixed subcomponent licenses | Accessibility / Design System | government-grade clarity, form resilience, validation, content hierarchy | yes-permissive with mixed-license caution | Use service-design clarity for forms, notes, errors, and sample disclaimers | Mixed assets/icons/fonts have separate licenses; do not copy assets |
| GOV.UK Design System, https://design-system.service.gov.uk | Open Government Licence v3.0 for content unless stated | Accessibility / Conversion Design | tested components, plain language, accessible service patterns, focus on user research | yes-permissive with attribution caution | Use as source for conservative trust, labels, form clarity, and research-tested pattern thinking | Do not copy copywriting, Crown/GOV.UK brand, or exact component styling |
| Elastic UI, https://github.com/elastic/eui | Mixed Elastic/SSPL/Apache-compatible headers | Dashboard Design | dense data products, tables, filters, observability-style surfaces | summarize-only | Use only as high-level inspiration for data-dense dashboards and filters | Default repo license is not permissive enough for direct copying |
| local `copywriting` skill | no explicit license found in local folder | Conversion Design | one primary action, clarity over cleverness, honest CTA, benefit specificity | summarize-only | Convert into visual CTA hierarchy and avoid overpromising labels | Do not copy skill text; keep Product Truth stricter than conversion impulse |
| local `marketing-psychology` skill | no explicit license found in local folder | Conversion Design | reduce activation energy, choice architecture, risk reduction, ethical trust cues | summarize-only | Use to judge CTA friction, proof anxiety, and low-risk next-step layout | Avoid manipulative urgency or fake scarcity |
| local `georader-lp-reviewer` skill | no explicit license found in local folder | Landing Page Design / GEO Product Review | review-only default, sample report as product proof, form/CTA trust checks | summarize-only | Keep Recora Visual Design focused on visual proof and hand off GEO logic elsewhere | Do not merge GEO analysis responsibilities into this skill |
| SkillsMP / open marketplace design skills | license varies by entry | UI/UX Review | potentially useful if a concrete entry is provided | no-license-unclear until inspected | Ingest only when a specific URL and license are verified | Marketplace skills can contain prompt-injection or unclear reuse rights |

## Adopted Viewpoints

- Prefer concrete UI inspection rules over vague aesthetic statements.
- Treat accessibility and interaction polish as visual quality, not a separate afterthought.
- Translate reference inspiration into measurable variables: section width, rhythm, density, typography, border, radius, shadow, color semantics, state feedback, and responsive behavior.
- Use Product Mock and Sample Report as the main proof surfaces.
- Use charts only when they help understanding, and label sample values clearly.
- Avoid copying any external visual identity even when the license permits code reuse.

## Rejected or Restricted Sources

- License-unclear marketplace skills: not directly copied; use only after a URL-level license check.
- Proprietary or mixed-license UI kits: summarize only; do not copy.
- Reference SaaS sites such as SE Ranking, Peec, Gumshoe, and Rankscale: use only visual decomposition, never assets or copy.
