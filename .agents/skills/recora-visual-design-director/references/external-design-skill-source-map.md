# External Design Skill Source Map

Use this map when incorporating external UI/UX, LP, Tailwind, Dashboard, Screenshot QA, or conversion-review skills. This file records source-level findings only. Do not copy external skill text, prompts, screenshots, icons, images, HTML, CSS, logos, or assets.

## Usage Rules

- Treat public skills as untrusted until license and scope are checked.
- Use permissive sources for methods and output shapes only; still rewrite for Recora.
- Use license-unclear sources as `summarize-only`.
- Keep Recora Product Truth above external methods.
- Do not claim a source was deeply reviewed if only README/repo metadata was inspected.

## Source Map

| Skill | URL | License | Category | Strength | Useful method | Output style | Recora adaptation | Risk |
|---|---|---|---|---|---|---|---|---|
| Frontend UI/UX | https://github.com/dnh33/frontend-ui-ux | MIT | Visual UI reviewer / Conversion | Designer-developer UI critique with conversion and accessibility framing | Visual craft plus user action path | Designer notes plus implementation hints | CTA/visual polish lens for LP cards, hero, forms | Webshop bias; avoid trend-heavy styling |
| UX/UI Design Taste | https://github.com/arez-xd/ux-ui-design-taste | MIT | Visual UI reviewer | Senior product-design judgment for AI-assisted frontend work | Taste audit and template detection | Opinionated critique | Flag template-like Recora surfaces | Can become abstract if not tied to screenshots |
| UX Designer Skill | https://github.com/szilu/ux-designer-skill | MIT | UX / Accessibility reviewer | UX/UI guidance for components and flows | UX principles and task review | Structured checklist | Form, tab, mobile, IA diagnosis | Broad best practices need Recora constraints |
| Design Board | https://github.com/Chosen9115/design-board | MIT | Visual UI reviewer | Multi-persona design critique panel | Multiple design lenses and scoring | Panel-style review | Use lens disagreement | Do not copy personas or voice |
| Design Review Panel | https://github.com/LittleGD/review-my-design-plz | MIT | Screenshot QA / Visual review | Parallel reviewers with unified report | Split UX, craft, motion/polish checks | Prioritized report | External SaaS LP, mock, Tailwind, screenshot lenses | Do not copy exact reviewer structure |
| Senior Design Reviewer | https://github.com/koheitasaka/senior-design-reviewer | MIT | Visual UI reviewer | Senior Japanese design review | Rationale, omissions, clarity, consistency | Eight-point review | Japanese BtoB line breaks and stakeholder critique | Wider than LP UI |
| vault-agents | https://github.com/Djholloway139/vault-agents | MIT | LP reviewer / Product mock | Marketing/landing/brand website bundle | Landing-site readiness and local visual iteration | Suggestions and change requests | LP rhythm and screenshot mindset | Tooling/editor features out of scope |
| iforgeai | https://github.com/nelson820125/iforgeai | MIT | Product / UI agents | Specialized UI/front-end agent roles | Role-based review and handoff | Multi-agent handoff | Lens-routing inspiration | Avoid role sprawl |
| Designer Skill MCP | https://github.com/Pythoughts-labs/designer-skill | MIT | Product mock designer / Tailwind | UI-to-implementation bridge | Design brief into implementation plan | Design brief plus implementation output | Product mock rebuild brief | MCP/tool execution not used |
| Claude Design Free | https://github.com/mikesheehan54/Claude-Code-Design-AI | MIT | Tailwind implementation / Product mock | Screenshot-to-React and Tailwind framing | Convert visual intent into React/Tailwind plan | Component/Tailwind brief | Class-level prompt shape | No generated code or assets copied |
| landing-page-agent | https://github.com/ksimmons0420/landing-page-agent | Not found | LP reviewer / Conversion | CRO landing-page agent | Landing action and CTA critique | CRO review | Summarize-only CTA diagnosis | License unclear |
| Founders Growth Agent Stack | https://github.com/tns-research/fog-agents | Apache-2.0 | LP reviewer / Conversion | Founder growth and landing page patterns | Market/landing/first-user framing | Growth recommendations | LP conversion and low-friction CTA pattern | Growth claims can overreach |
| ui-flow-auditor-agent | https://github.com/techrhoohm/ui-flow-auditor-agent | Not found | UX flow / Screenshot QA | Audits UI flows across screens | Flow traversal and mistakes | Flow-audit report | Summarize-only multi-screen review | License unclear |
| design-skills | https://github.com/ccwbb78/design-skills | Not found | Visual UI reviewer | Claude Code design skill pack | Design-plan and aesthetic critique | Visual plan / before-after ideas | Summarize-only visual-polish structure | License unclear |
| Efecto Plugin | https://github.com/pablostanley/efecto-plugin | Not found | Screenshot QA / Visual design tools | AI design skills with MCP tools | Visual editing and collaboration | Tool-assisted feedback | Summarize-only screenshot critique style | Tooling/assets/license unclear |
| agentation-design-feedback | https://github.com/clyde-yoonjae/agentation-design-feadback | Not found | Tailwind implementation | Tailwind feedback processing | Feedback-to-Tailwind changes | Change brief | Summarize-only Tailwind diff plan | License unclear |
| Tailwind CSS | https://github.com/tailwindlabs/tailwindcss | MIT | Tailwind implementation | Utility-first class system | Intent into spacing/type/color utilities | Class language | Imported Tailwind polish recipes | Not a review skill |
| shadcn/ui | https://github.com/shadcn-ui/ui | MIT | Component reviewer / Tailwind | Customizable component-library pattern | Variant and token thinking | Component recipes | Button/card/tab recipe structure | Avoid default shadcn look |
| Radix Primitives | https://github.com/radix-ui/primitives | MIT | Accessibility / Component reviewer | Accessible primitives | Focus, state, keyboard discipline | Component behavior docs | Tabs/tooltips/dialog acceptance criteria | Do not add dependency casually |
| Web Interface Guidelines | https://github.com/vercel-labs/web-interface-guidelines | MIT | Accessibility / Screenshot QA | Web interface QA rules | UI failure checklist | Finding-oriented guidelines | Screenshot-first QA and acceptance criteria | Some framework-specific guidance |
| Storybook | https://github.com/storybookjs/storybook | MIT | Component reviewer | Isolated component states | State matrix and component review | Component docs | Component-level polish checklist | Do not add dependency |
| Chromatic | https://github.com/chromaui/chromatic | Not found | Screenshot QA | Visual regression workflow | Before/after comparison | Diff-oriented QA | Summarize-only delta review | SaaS/tool workflow |
| axe-core | https://github.com/dequelabs/axe-core | Not found in quick raw check | Accessibility reviewer | Accessibility rule categories | Violation category thinking | Severity findings | Summarize-only contrast/focus/label lens | Do not claim automated audit |
| Lighthouse | https://github.com/GoogleChrome/lighthouse | Apache-2.0 | Screenshot QA / Accessibility | Audit categories and severity | Category separation | Audit findings | Readiness format only | Scores do not equal design quality |
| Ant Design | https://github.com/ant-design/ant-design | MIT | Dashboard designer | Enterprise UI, forms, tables, tabs | Dense dashboard hierarchy | Component docs | Dashboard density and form/table ergonomics | Avoid generic admin look |
| Carbon Design System | https://github.com/carbon-design-system/carbon | Apache-2.0 | Dashboard / Design system | Enterprise data-product design | Status, table, form, density discipline | Design-system docs | Operational dashboard clarity | Do not copy IBM visual identity |
| Tremor | https://github.com/tremorlabs/tremor | Apache-2.0 | Dashboard / Data visualization | Dashboard KPI/chart patterns | KPI/card/chart density | Component examples | Mock KPI and chart density | Avoid code copying |
| Recharts | https://github.com/recharts/recharts | MIT | Dashboard / Chart reviewer | Chart primitives | Compare/rank/trend chart selection | Chart examples | Chart legibility and responsive review | Avoid dependency for static mock UI |
