# Security Documentation

## Authentication

JWT with BCrypt-hashed passwords (`BCrypt.Net-Next`). Tokens expire per `JwtSettings.ExpiryInDays` (7 days in dev config). Token stored client-side in a cookie (`SameSite=Strict`), not `localStorage` — reduces some CSRF exposure.

**Residual risk:** the cookie is set via `document.cookie` in JavaScript (`AuthContext.login()`), meaning it is **not** `HttpOnly`. Any successful XSS injection could therefore read the token directly. This is a known gap — see the XSS note under OWASP Considerations below.

## Authorization

Role-based, enforced at both controller attribute level and service logic level (see `backend.md`). No resource-level ACLs beyond ownership checks (`CreatedById == userId`, `AssignedToId == userId`).

## Validation

Manual, explicit, per-field. No centralized validation framework. File uploads validated via magic bytes (`FileValidationHelper`), not just extension — mitigates the "renamed executable" attack class.

## Rate Limiting

**Not implemented.** No rate limiting middleware on the API. The login endpoint has no brute-force protection (no lockout, no CAPTCHA, no attempt throttling). This is a priority gap for any production deployment.

## Secrets Management

`appsettings.json` and `.env` are both gitignored; `.example` templates are committed instead. The Groq API key is exposed client-side (readable via browser DevTools) — acceptable for a free-tier key with generous rate limits in an internal tool, but would need server-side proxying before any production/public-facing deployment.

## OWASP Considerations

- **SQL Injection** — mitigated by EF Core parameterized queries throughout (no raw SQL found in the reviewed services).
- **XSS** — `CreateCommentDTO.Content` is stored and returned as-is; no sanitization step was confirmed in either the backend or the frontend render path. This was explicitly identified as an outstanding task in the original project handoff ("Input Sanitization — Strip HTML/script tags from comment content") and was **not completed** before submission. **This is the single highest-priority security gap in the system.**
- **CSRF** — JWT Bearer auth via an `Authorization` header (not cookie-based auth for API calls) inherently reduces CSRF risk for the REST API. The SignalR connection does authenticate via a JWT in the query string, which could appear in server access logs — a minor information-exposure consideration, not a direct CSRF vector.
- **Broken Access Control** — actively mitigated via the dual-layer RBAC described in `backend.md`, and was iteratively verified through manual cross-role access testing (see `testing.md`).

## Security Decisions Log

- **JWT role claim standardization.** Mid-project, the token was issued with a short `"role"` claim key while ASP.NET Core's default `RoleClaimType` and the frontend's `AuthContext` both expected the long-form `ClaimTypes.Role` URI. This silently broke every `[Authorize(Roles=)]` check (all requests were effectively unauthorized) without throwing an obvious error, and was fixed by aligning `JwtService.GenerateToken` to issue `new Claim(ClaimTypes.Role, roleName)` and updating `TicketQueryHelper.GetUserInfo` to read the same claim type. This is documented in detail in `maintenance.md` as a troubleshooting entry, since the failure mode (silent full-system auth rejection with no obvious error message) is easy to reintroduce.

## Priority Recommendations (Not Yet Implemented)

1. Sanitize or encode all user-submitted comment/note content before storage or render.
2. Set the auth cookie as `HttpOnly` (requires moving cookie-setting server-side, since JS-set cookies cannot be `HttpOnly`).
3. Add login rate limiting / account lockout after repeated failures.
4. Move the Groq API call server-side before any public-facing deployment, to avoid exposing the key.
