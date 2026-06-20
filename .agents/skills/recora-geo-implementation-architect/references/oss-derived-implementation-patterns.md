# OSS-Derived Implementation Patterns

## Scope

Use this reference when reviewing RECORA implementation architecture through the lens of the prior OSS research packages:

- `skill-patches/recora-open-source-reference-research-v0.1/`
- `skill-patches/recora-open-source-patterns-apply-v0.1/`

The inspected research was README/repository-page based. Source code, tests, runtime behavior, issues, deployments, credentials, live AI answers, SERPs, crawler outputs, and RECORA production behavior were not inspected. Treat repository claims as `NEEDS_VERIFICATION`.

## Core Rule

Borrow implementation patterns, not code, claims, dependencies, scripts, or operational behavior.

OSS references can inform review questions, contract fields, failure fixtures, dashboard evidence structure, and anti-pattern detection. They cannot prove RECORA provider support, crawler safety, SEO scoring validity, AI citation outcomes, ranking impact, traffic, revenue, or implementation quality.

## Borrowable Review Patterns

### Evidence Ledger First

Review whether every recommendation, score, report section, and gate decision can trace to measured or supplied evidence:

- prompt/query
- query class
- collection method
- provider/platform status
- raw answer/source/crawl artifact reference
- brand and competitor mentions
- citation/source records
- timestamp
- locale/language/persona/market
- confidence
- not-inspected fields

### Measurement Method Separate From Result

Require separate fields for collection method and observed result:

- API answer
- product UI answer
- SERP result
- crawl result
- manual source review
- README-only research
- supplied artifact review

Do not compare, aggregate, or trend different methods without explicit compatibility warnings.

### Query Taxonomy And Seed Risk

Review whether prompts classify:

- non-branded discovery
- problem-aware
- category
- comparison
- alternative
- branded/entity verification
- citation verification
- persona/locale/language/market variants

Seeded prompts must not prove organic visibility.

### Provider Capability Registry

Require explicit status:

- `supported`
- `planned`
- `not_supported`
- `unknown`
- `not_inspected`
- `manual_only`
- `research_only`
- `blocked`
- `disabled`

Status describes method availability, not result quality.

### Citation And Source Ledger

Review whether citations are first-class source records with URL, domain, title, source type, cited claim, source-to-claim status, freshness, and client/competitor association.

### Technical Readiness Lane

Crawler, SEO audit, structured data, `llms.txt`, page speed, indexability, and source-accessibility checks are readiness evidence. They do not prove AI answer visibility or citation.

### Score Decomposition

Prefer visible dimensions over one magic score:

- measurement coverage
- query coverage
- citation quality
- source support
- competitor context
- technical readiness
- recommendation confidence

## Anti-Patterns To Flag

- README claims treated as RECORA implementation facts.
- OSS feature lists converted into product requirements.
- Browser automation, login sessions, cookies, provider UI automation, or CAPTCHA handling introduced without explicit legal and technical approval.
- API key, BYOK, or `.env` workflows handled by the skill.
- Crawler/proxy/stealth/JS-rendering dependencies assumed from OSS research.
- Technical SEO findings used as direct AI citation proof.
- Citation count used as claim support.
- Planned provider support displayed as live.
- LLM judge output treated as objective truth.
- External scoring frameworks described as official GEO standards.

## Review Output Requirement

When OSS patterns influence a review, label them as `OSS_RESEARCH_PATTERN` and state:

- which pattern is being used
- what was not inspected
- what remains `NEEDS_VERIFICATION`
- why the pattern affects implementation architecture rather than client-facing evidence
