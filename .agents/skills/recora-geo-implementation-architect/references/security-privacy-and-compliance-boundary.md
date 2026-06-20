# Security, Privacy, And Compliance Boundary

## Rules

- Never inspect `.env` or secrets.
- Never ask for API keys, cookies, credentials, private tokens, or login sessions.
- Do not put credentials in logs, tests, fixtures, screenshots, prompts, or reports.
- Minimize stored raw user data.
- Redact sensitive fields.
- Separate customer data by tenant.
- Review RLS and authorization if Supabase is confirmed.
- Use least privilege for jobs, database roles, storage, and provider access.
- Define retention and deletion policy for raw prompts, answers, citations, and customer data.
- Provider terms and crawler compliance need separate review.
- No browser/login automation without explicit legal and technical approval.

## Review Questions

- Could raw AI responses include confidential customer data?
- Are tenant IDs required on all customer-owned evidence and recommendation records?
- Are RLS policies and service-role boundaries inspected before database advice?
- Are external calls approved and costed?
- Are logs safe for support and debugging?
- Are deletion and remeasurement flows compatible with audit requirements?
