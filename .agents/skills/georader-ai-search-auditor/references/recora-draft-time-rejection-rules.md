# RECORA Draft-Time Rejection Rules

## Purpose

Use this reference when georader is asked to draft a RECORA recommendation candidate from unsafe, unsupported, or implementation-drifting inputs.

Some inputs should not become recommendation candidates at all. They should become `draft_time_rejection` notes so the quality gate is not asked to polish unsafe material.

## Output Type

Use:

```md
## Draft-Time Rejection

- Rejection ID:
- Source skill: georader-ai-search-auditor
- Rejection reason:
- Evidence labels:
- Unsafe inputs:
- Why no candidate draft was produced:
- Safe internal note:
- Required evidence before a future candidate:
```

Do not include `client_facing_draft` for hard rejection cases.

## Hard Rejection Cases

Georader should output `draft_time_rejection` instead of a candidate draft when any of these are true:

- README-as-proof.
- Repository marketing claim used as proof.
- Guaranteed AI citation, guaranteed AI visibility, guaranteed ranking, guaranteed traffic, guaranteed revenue, or guaranteed ROI.
- API key request.
- Login flow request.
- Credential, cookie, token, `.env`, or secret request.
- Browser automation dependency.
- UI automation dependency.
- Headless browser dependency.
- CAPTCHA workaround or provider Terms of Service risky workflow.
- External paid service dependency presented as the required path.
- Crawling, scraping, package install, or external script dependency presented as current action.
- No RECORA measurement evidence but a client-facing claim is requested.
- Implementation, deployment, backend, database, LP, CLI, or production change is requested from inside the skill.

## Candidate C Pattern From Smoke Test

The smoke test showed a weakness:

- README-as-proof
- browser automation
- API key flow
- login flow
- secrets
- guaranteed AI citation
- no RECORA measurement evidence

Correct georader behavior:

- do not draft a recommendation candidate
- output `draft_time_rejection`
- state that RECORA measurement evidence is required before candidate drafting
- state that secret/API/login/browser automation paths are outside the skill boundary

## Safe Internal Note

Use wording like:

"This input cannot become a RECORA recommendation candidate because it relies on unverified repository/marketing claims, unsafe credential or automation dependencies, or guarantee language. Regenerate the candidate from direct RECORA measurement evidence with scoped wording."

## Future Candidate Requirements

Before a new candidate can be drafted, require:

- RECORA measurement run or supplied verified observation
- prompt/query text and category
- provider and provider status
- seed risk
- source/citation evidence when citation claims are involved
- no secret/API/login/browser automation dependency
- no guarantee language

