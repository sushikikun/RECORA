# AI Crawler Platform Research Pack

Use this pack when Recora or GEORADER outputs discuss AI crawlers, robots.txt, bot allow/block settings, WAF/CDN access, log review, crawler policy, or AI citation readiness.

This pack is a research guide. It does not verify current crawler policy by itself. Assign `OFFICIAL_SOURCE` per platform and per claim only after inspecting current primary documentation or using user-supplied source evidence. Unknown source URLs, current source status, or last checked dates must be `NEEDS_VERIFICATION`.

## Source Targets To Verify

- OpenAI Crawlers documentation.
- Anthropic crawler documentation.
- Perplexity Crawlers documentation.
- Google common crawlers and Google-Extended documentation.
- RFC 9309 Robots Exclusion Protocol.
- Google robots.txt documentation.

## Platform-Specific Separation

Do not bundle crawler claims across platforms. Treat each as a separate evidence item.

| Platform | Bots or controls to separate | Safe claim scope |
|---|---|---|
| OpenAI | OAI-SearchBot, GPTBot, ChatGPT-User | Discuss each bot's stated purpose and controls only when verified from OpenAI documentation. |
| Anthropic | ClaudeBot, Claude-User, Claude-SearchBot | Discuss each crawler/user agent and robots behavior only when verified from Anthropic documentation. |
| Perplexity | PerplexityBot, Perplexity-User | Discuss crawler and user-triggered access separately when verified from Perplexity documentation. |
| Google | Googlebot, Google-Extended | Discuss Search crawling separately from Google-Extended controls when verified from Google documentation. |
| Generic robots.txt | RFC 9309 and platform docs | Discuss robots.txt as a crawl/access directive, not as security or a universal enforcement guarantee. |

## Core Rules

- robots.txt is access or crawl control, not an AI citation guarantee.
- Bot allow/block settings may affect access conditions, but do not guarantee inclusion, citation, recommendation, ranking, traffic, or conversion.
- Crawler policies, bot names, IP endpoints, and platform behavior can change.
- Mark current platform behavior as `NEEDS_VERIFICATION` unless verified in a current source during the task or supplied by the user.
- Redacted logs can support observed crawler access only for the inspected time, URL, status code, and user agent.
- Never request or inspect secrets, cookies, credentials, API keys, unredacted logs, or private tokens.

## Safe Labels

- `OFFICIAL_SOURCE`: Current platform-owned crawler documentation supports the narrow platform-specific claim.
- `CONFIRMED_FACT`: Redacted log excerpts or public robots.txt were inspected in the task.
- `INDUSTRY_PRACTICE`: Reviewing robots.txt, WAF, CDN, rendering, and logs is a common technical SEO and crawlability practice.
- `GEORADER_ASSUMPTION`: Recora prioritizes crawler access checks as part of its evidence-scope framework.
- `NEEDS_VERIFICATION`: Current bot behavior, source URL, source status, IP ranges, WAF behavior, CDN blocking, or AI citation outcome is unknown.

## Unsafe Wording

- "Allowing these bots guarantees AI citation."
- "All AI crawlers follow the same rules."
- "Googlebot and Google-Extended mean the same thing."
- "GPTBot, OAI-SearchBot, and ChatGPT-User have the same purpose."
- "robots.txt blocks all AI usage in every system."

## Client-Facing Safe Language

- "Crawler access can affect whether documented systems can reach public content, but citation and recommendation outcomes must be measured separately."
- "Crawler policies differ by platform, so OpenAI, Anthropic, Perplexity, and Google checks should be handled separately."
- "Current crawler behavior and AI answer visibility require fresh verification before being stated as facts."
