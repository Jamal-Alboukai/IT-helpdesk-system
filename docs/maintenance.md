# Maintenance Documentation

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| All `[Authorize(Roles=)]` endpoints reject valid users | JWT role claim key mismatch (`"role"` vs `ClaimTypes.Role`) | Ensure `JwtService.GenerateToken` uses `new Claim(ClaimTypes.Role, roleName)` and `TicketQueryHelper.GetUserInfo` reads `ClaimTypes.Role` |
| SignalR WebSocket fails to connect | JWT not read from query string by auth middleware | Add an `OnMessageReceived` handler in `Program.cs`'s JWT config reading the `access_token` query param specifically for the `/hubs/notifications` path |
| AI suggestion calls return quota/region errors | Free tier region-blocked for some providers (e.g. Gemini in certain countries) | Switch to Groq (`llama-3.3-70b-versatile`) — no region restriction observed |
| Stale JWT claims after code change | Old build cached | Always run `dotnet clean && dotnet build && dotnet run` after any claim/auth change |
| React StrictMode double SignalR connect warning in dev console | Known React 18 dev-mode double-invoke behavior | Benign — the second connection attempt succeeds; this does not occur in a production build |
| Model returns `models/gemini-1.5-flash is not found` type errors | Provider deprecated/renamed a model | Confirm current model name against provider docs before assuming a code bug |

## Known Issues

- No input sanitization on comment content (XSS risk) — flagged in the original project requirements, not completed before submission. **Highest priority item to address.**
- `TicketAttachment` migration parity not fully confirmed against the model — verify before assuming the migration history in `database.md` is exhaustive.
- Cookie-based JWT storage is not `HttpOnly`, and is therefore readable by any successfully injected script.
- No rate limiting on the login endpoint.
- Groq API key exposed client-side (acceptable at current scale, not acceptable for a public-facing deployment).
- The Ticket Detail status dropdown historically showed all statuses rather than only valid next-transitions in the UI (the server always validates and rejects invalid transitions regardless, so this is a UX polish issue, not a security one).

## Technical Debt

- No automated test suite of any kind (unit, integration, or E2E) — see `testing.md`.
- No global exception-handling middleware — error handling is manual and per-endpoint, using `(result, error)` tuple returns from services rather than exceptions/middleware.
- `ReportsService` and `DashboardService` perform in-memory aggregation that will not scale past a moderate ticket volume — see `performance.md`.
- No repository abstraction over `AppDbContext` — acceptable at the current scale, would need introducing if the domain model grows significantly or multiple data sources are introduced.
- No caching layer anywhere in the system.

## Future Improvements

The following were considered during planning and explicitly deprioritized due to the fixed internship deadline, listed in approximate order of likely value if picked up later:

- Docker deployment (`Dockerfile` + `docker-compose.yml` for both frontend and backend).
- SLA timer system (automatic alerts when a ticket approaches or breaches its due date).
- CI/CD pipeline (GitHub Actions — at minimum a build check on push; ideally running the test suite once one exists).
- Multi-language support (i18n).
- Real-time chat support (a distinct, synchronous feature from the existing async AI chatbot).
- Microsoft Teams integration (notifications/ticket creation from Teams).
- Email-to-ticket automation (parsing inbound support emails into tickets automatically).
- QR code asset management (for physical IT asset tracking).
- Native mobile app.

## Developer Onboarding Guide

1. Read the root `README.md` for environment setup.
2. Read this `/docs` set in order, starting with `overview.md` and `architecture.md`, before touching any code.
3. Trace one full feature vertically to understand the layering convention before making changes — for example, start at `TicketController.AssignTicket`, follow into `TicketAssignService`, then `TicketQueryHelper`, then `AppDbContext`, then find the equivalent frontend call in `ticketService.assignTicket()` and see how `TicketDetailPage.tsx`'s assign panel consumes it.
4. Always run `dotnet clean` before `dotnet run` after touching any JWT/claims-related code — stale build caches have caused silent, hard-to-diagnose bugs in this project before (see Troubleshooting above).
5. Never commit `appsettings.json` or `client/.env` — use the `.example` templates and keep secrets local.

## Contribution Guide

Branch workflow: feature work happens on `dev`, merged into `main` via pull request, roughly one PR per feature sprint (as practiced throughout the project: Assign UI, Settings, Reports + Activity Log, AI features, Responsive design pass, Profile page + agent-permission fix).

Commit message convention observed throughout: `type: short summary` as the subject line, followed by a bulleted body of specific changes — types used include `feat:`, `fix:`, `docs:`, and `chore:`. New contributions should follow this same convention for consistency with the existing git history.
