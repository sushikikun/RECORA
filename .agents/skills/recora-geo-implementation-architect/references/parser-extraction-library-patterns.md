# Parser And Extraction Library Patterns

Use this file when reviewing RECORA parser, crawler, extraction, URL normalization, and citation processing design. Borrow patterns from extraction libraries conceptually only. Do not adopt crawler or browser automation without explicit approval.

## Safe Patterns

- Preserve raw and derived content separately.
- Store original URL and normalized URL separately.
- Record extraction status and parser version.
- Distinguish article extraction from product, docs, pricing, comparison, FAQ, and app pages.
- Use fixtures for malformed, noisy, empty, redirected, and duplicate sources.
- Keep source-to-claim review separate from source presence.

## Content Normalization Review

Check whether the implementation records:

- raw answer text
- raw cited URL
- original source URL
- normalized URL
- canonical URL when available
- extracted title
- extracted text
- extraction method
- parser version
- extraction status
- source availability

## URL Normalization Matrix

Review cases for:

- `www` and non-`www`
- mobile subdomains
- trailing slashes
- fragments
- tracking parameters
- language paths
- canonical tags
- redirects
- query parameters that change page meaning

## Browser / Crawler Boundary

Any future crawler must define:

- allowed domains
- depth
- rate limit
- robots policy
- stop reasons
- no-login default
- no-cookie default
- no-browser-automation default unless approved
- raw evidence storage

## Anti-Patterns

- replacing raw evidence with cleaned text
- assuming article readability extraction covers all page types
- counting domains as claim support
- treating provider errors as brand absence
- adopting hosted crawlers, API-key services, or browser automation without approval
