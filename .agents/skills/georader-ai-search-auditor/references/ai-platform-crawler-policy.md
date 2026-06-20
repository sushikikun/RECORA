# AI Platform Crawler Policy

Use this reference for AI crawler access, robots.txt, WAF, user-agent, log-review, or citation-readiness recommendations.

## Core Rule

Crawler access can affect whether a platform can fetch, index, retrieve, or use content under that platform's stated rules. It does not guarantee indexing, citation, recommendation, AI Overview inclusion, ChatGPT search inclusion, Perplexity citation, Claude retrieval, traffic, rankings, or conversion.

## Required Framing

- Say "access and eligibility" instead of "citation guarantee".
- Say "platform-specific controls" instead of "universal AI crawler rules".
- Say "official docs should be rechecked before client implementation" for crawler policies because bot names, IP ranges, and product behavior change.
- Mark crawler behavior in server logs as `CONFIRMED_FACT` only after logs are inspected with sensitive values redacted.
- Mark uninspected crawler behavior, WAF settings, CDN blocking, robots.txt contents, or AI platform visibility as `NEEDS_VERIFICATION`.

## Platform Guidance Scope

| Platform | Official Guidance Scope | Safe Planning Language |
|---|---|---|
| Google Search AI features | Use Google Search Central for AI Overviews, AI Mode, Search eligibility, preview controls, Googlebot, and Google-Extended. | "Google's guidance ties AI feature eligibility to normal Search eligibility and snippets; inclusion is not guaranteed." |
| OpenAI | Use OpenAI crawler docs for OAI-SearchBot, GPTBot, and ChatGPT-User. | "Allowing OAI-SearchBot supports ChatGPT search access under OpenAI's docs, but citation still requires query-level testing." |
| Anthropic | Use Claude Help Center crawler docs for ClaudeBot, Claude-User, and Claude-SearchBot: `https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler`. | "Claude crawler access can be reviewed by bot purpose; visibility impact needs verification." |
| Perplexity | Use Perplexity crawler docs for PerplexityBot, Perplexity-User, and official IP endpoints: `https://docs.perplexity.ai/docs/resources/perplexity-crawlers`. | "Perplexity access can be planned around documented user agents and IP endpoints; citation outcomes require testing." |
| Generic crawlers | Use RFC 9309 for robots.txt protocol behavior and each platform's current docs for platform-specific interpretation. | "robots.txt is a crawler directive signal, not authentication or a universal enforcement mechanism." |

## P0 / P1 / P2 Use

- `P0`: client-facing claim says crawler access guarantees AI citation, or the output asks for secrets, cookies, private logs, or production WAF changes inside this skill.
- `P1`: robots.txt, CDN, WAF, or rendering likely blocks important crawlers or text access, but current evidence is incomplete.
- `P2`: crawler documentation, source map, log-review checklist, or monthly monitoring language can be clarified.

## Safe Evidence Checklist

Use redacted, non-secret inputs only:

- Public URL and page type.
- Current `robots.txt` content if public.
- Public HTTP status and indexability signals.
- Redacted server-log excerpts with user agent, timestamp, URL path, status code, and IP range category.
- Screenshots or exports showing AI answer citations, with dates and query text.
- Official crawler documentation inspected date.

Do not request or inspect `.env`, API keys, cookies, credentials, private tokens, Supabase secrets, Stripe secrets, Resend secrets, OpenAI/Gemini/Perplexity secrets, or unredacted logs containing sensitive identifiers.

## Client-Safe Phrases

- "This improves access conditions for documented crawlers, but AI citation must be measured separately."
- "The source evidence supports eligibility planning, not guaranteed inclusion."
- "Current AI answer visibility needs fresh query testing before it is stated as a fact."
- "This is a Recora or GEORADER evidence-scope recommendation, not an official platform standard."

## Internal Warnings

- Do not implement robots.txt, WAF, CDN, Next.js, database, CLI, or production changes while this skill is active.
- Do not provide credential-dependent instructions.
- Do not copy platform docs into reports as long quoted passages. Summarize and cite primary sources.
- Do not hard-code crawler IP ranges in skill text; point to official endpoints and require rechecking.
