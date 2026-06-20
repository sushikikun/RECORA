# Local Skill Patterns Extracted

Use this reference when borrowing patterns from adjacent local skills. This file records safe operating patterns only; it is not evidence for client-facing claims.

## Safe Patterns To Borrow

- Keep evidence labels: `CONFIRMED_FACT`, `OFFICIAL_SOURCE`, `RESEARCH_BACKED`, `INDUSTRY_PRACTICE`, `GEORADER_ASSUMPTION`, `NEEDS_VERIFICATION`.
- Keep P0/P1/P2 severity for audits, report QA, trust risk, crawler access, conversion SEO, and roadmap prioritization.
- Keep internal and client-facing outputs separated.
- From `ai-seo`: use citation-readiness, source quality, answer evidence, and no-guarantee language.
- From `seo-audit`: use structured findings, impact, evidence, recommendation, and verification status.
- From `seo-technical`: use crawlability, indexability, rendering, mobile, structured data, JavaScript rendering, and protocol checks.
- From `schema`: require structured data to match visible content and be validated before implementation.
- From `programmatic-seo`: use intent-template discipline, thin-content risk checks, and scalable architecture only as planning.
- From `copywriting`: use clear value propositions, proof, objections, and CTA clarity without overclaiming.
- From `sales-enablement`: make recommendations buyer-readable, tied to business impact, and suitable for sales/report collateral.
- From `marketing-psychology`: use framing, trust, risk reduction, and proof responsibly.
- From `georader-lp-reviewer`: default to review-only behavior and separate visual/product critique from implementation.
- From `web-design-guidelines`: consider UX clarity, accessibility, scanning, and mobile trust when reviewing pages or reports.

## Do Not Borrow

- API-key handling, secret inspection, credential setup, or login-session workflows.
- Search Console, DataForSEO, MCP, external fetch, browser-login, or crawler-log automation patterns that require credentials or private data.
- Executable scripts, SDK setup, dependency installation, or data ingestion pipelines.
- Schema implementation code, Next.js implementation, database edits, CLI edits, LP edits, backend edits, deployment steps, or production modification permissions.
- Unrelated SNS, social posting, social listening, gambling, schoolwork, or personal-message behavior.
- Claims that AI Overview rates, citation rates, GEO effects, crawler behavior, rankings, or conversion outcomes are guaranteed or generally true without official or research support.

## Recora Adoption Pattern

Treat Recora as a product-name-ready evolution of GEORADER when useful for strategy and client-facing packaging. Do not hard-code unverified Recora product claims. Mark unverified Recora business, customer, pricing, platform, and workflow claims as `NEEDS_VERIFICATION`.

## Output Pattern

For any borrowed pattern, state the source as "local skill pattern" only in internal reasoning or internal notes. In client-facing work, cite actual inspected evidence, official sources, research, or user-provided facts instead of this file.
