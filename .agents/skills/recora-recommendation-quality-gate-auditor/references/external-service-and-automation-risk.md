# External Service And Automation Risk

## Purpose

Use this reference when a candidate depends on external services, automation, crawling, scraping, browser behavior, provider accounts, or credentials.

## Risk Categories

Treat these as risk categories:

- API key flows
- login flows
- stored sessions
- cookies or credentials
- browser automation
- UI automation
- headless browser usage
- crawling
- scraping
- CAPTCHA handling
- provider Terms of Service risk
- external paid services
- hosted APIs or data vendors
- package installs
- external scripts
- `.env` setup or secret access
- direct app/backend/database/LP/CLI/production implementation

## Decision Rules

### Suppress

Suppress when a candidate:

- asks for secrets, credentials, cookies, login sessions, API keys, or `.env` values
- instructs the user to implement, install, run scripts, crawl, scrape, automate browsers, or connect external services from the skill output
- presents browser automation or external service use as an approved RECORA workflow
- depends on provider ToS-sensitive behavior without explicit approval and scope

### Hold

Hold when a candidate:

- is strategically useful but depends on future external service review
- suggests live measurement, crawling, or automation as a research idea
- needs policy, compliance, cost, provider, or security approval

### Auto-Publish

Auto-publish only when:

- the candidate does not require external automation or secret handling
- the recommendation is backed by supplied RECORA evidence
- the output stays in strategy/gating scope

## Safe Wording

Use:

- "Future/research-only: evaluate this method after provider, security, compliance, and cost review."
- "Current recommendation should use supplied evidence only."
- "Do not request credentials or run automation from the skill."

Avoid:

- "Add your API key."
- "Log in and automate the provider UI."
- "Run a crawler to prove this."
- "Install this package and push the fix."

