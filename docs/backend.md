# Backend Documentation

## Controllers

Thin, one per bounded domain. Full list with route prefixes:

| Controller | Route prefix | Roles enforced |
|---|---|---|
| `AuthController` | `/api/auth` | Public (login), `[Authorize]` (change-password) |
| `TicketController` | `/api/ticket` (+ `/api/categories`, `/api/priorities`, `/api/statuses` lookups) | Varies per action; create restricted to `Employee,Admin` |
| `CommentController` | `/api/ticket/{ticketId}/comment` | `[Authorize]`, role logic in service |
| `UserController` | `/api/user` | `[Authorize(Roles="Admin")]` for management; `/profile` endpoints open to all authenticated |
| `NotificationController` | `/api/notification` | `[Authorize]` |
| `AttachmentController` | `/api/attachment` | `[Authorize]` |
| `DashboardController` | `/api/dashboard` | `[Authorize]`, scoping done in service |
| `ReportsController` | `/api/reports` | `[Authorize(Roles="Admin,Manager")]` |
| `SettingsController` | `/api/settings` | `[Authorize(Roles="Admin")]` |
| `ActivityLogController` | `/api/logs` | `[Authorize(Roles="Admin,Manager,ITSupportAgent")]` |

Controllers perform only: attribute-based auth, presence/format validation (`string.IsNullOrEmpty`), and HTTP status mapping (200/201/400/404/403). No business rules.

## Services

| Service | Responsibility |
|---|---|
| `AuthService` | Login (BCrypt verify), password change, JWT issuance |
| `JwtService` | Builds and signs JWT with claims (`nameid`, `email`, `given_name`, `family_name`, `ClaimTypes.Role`, `ForcePasswordChange`) |
| `TicketService` | Full ticket CRUD, role-scoped visibility, per-role field mutation rules, status transition delegation |
| `TicketAssignService` | Assignment/reassignment (Admin), escalation request (Agent) |
| `CommentService` | Comment CRUD, internal note visibility gating, ticket history retrieval |
| `NotificationService` | Creates `Notification` rows; three notify methods (assigned, status changed, comment added) |
| `ActivityLogService` | Single `LogAsync` method — write-only, called by every mutating service |
| `ActivityLogViewService` | Read/query side of the audit trail — paginated, filterable, role-scoped |
| `DashboardService` | Aggregates KPIs + chart data, role-scoped (`Employee`→own, `Agent`→assigned, `Manager`/`Admin`→all) |
| `ReportsService` | Monthly summary (last N months) + agent performance (resolution rate, avg resolution time) |
| `SettingsService` | Category/Priority CRUD with duplicate-name guarding; Status is read-only |
| `UserService` | User CRUD (Admin), agent lookup, profile get/update (self-service) |
| `LookupService` | Simple active-only lookups for Category/Priority/Status dropdowns |
| `AttachmentService` | File upload/download/delete, delegates validation to `FileValidationHelper` |
| `EmailService` | SendGrid wrapper for transactional emails |

## Business Logic Highlights

- **RBAC is enforced twice**: at the controller via `[Authorize(Roles=)]` attributes (coarse gate), and again inside services via `(userId, role) = _queryHelper.GetUserInfo(userClaims)` for fine-grained, ownership-based checks (e.g. "Employee can only edit their own Open tickets").
- **Status transitions**: `TicketService.UpdateTicketAsync` calls `StatusTransitionHelper.IsValidTransition(currentStatusId, newStatusId)` before applying any status change, for both Agent and Admin paths; invalid transitions return a `400` with the list of allowed next statuses.
- **Assignment side-effects**: assigning a ticket always sets `StatusId = InProgress` and clears any existing `EscalationRequested`/`EscalationNote` — this is intentional (a reassignment resolves the escalation).

## Validation

- Controller-level: required-field presence checks (`string.IsNullOrEmpty`, `Guid.Empty`).
- Service-level: business validation — role checks, ownership checks, duplicate-name checks (Settings), file magic-byte checks (Attachments).
- No FluentValidation or DataAnnotations pipeline is used — validation is manual and explicit throughout.

## Middleware / Pipeline (`Program.cs`)

```csharp
app.UseCors("AllowReactApp");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");
```

CORS policy: origin `http://localhost:3000`, any header/method, **credentials allowed** (required for SignalR).

## Authentication

- JWT Bearer scheme, `MapInboundClaims = false` (claims are NOT remapped from short → long form automatically — this is why the role claim must be issued as `ClaimTypes.Role` directly by `JwtService`).
- `JwtBearerEvents.OnMessageReceived` overridden to extract the token from the query string (`?access_token=`) specifically for the `/hubs/notifications` path — required because WebSockets cannot carry an `Authorization` header.
- Token validation: issuer, audience, lifetime, and signing key all validated; `NameClaimType = "nameid"`.

## Authorization

Role-based only (no policy-based/claims-based authorization beyond roles). Applied via:
- Controller/action `[Authorize(Roles = "...")]` attributes.
- Service-layer manual `if (role != RoleConstants.X) return null/error` checks for anything not fully expressible by the attribute alone (e.g. "Admin can see all tickets, Agent only assigned").

## Exception Handling

No global exception middleware (`UseExceptionHandler`) is configured. Errors are handled per-method with explicit `try/catch` at the controller boundary in a few places (e.g. `CreateTicket` catching `UnauthorizedAccessException` from the service and returning `Forbid()`), and by returning `(result, error)` tuples from services that the controller inspects. This is a known gap — see `maintenance.md`.

## Caching

None implemented. All reads hit PostgreSQL directly via EF Core on every request. Acceptable at current scale; flagged as a future optimization (see `performance.md`).

## Background Jobs

None implemented. All operations (email sending, notification creation) are synchronous within the request lifecycle — no queue or hosted background service is used.

## Configuration

`appsettings.json` (gitignored) holds:
```json
{
  "ConnectionStrings": { "DefaultConnection": "..." },
  "JwtSettings": { "SecretKey", "Issuer", "Audience", "ExpiryInDays" },
  "SendGrid": { "ApiKey", "FromEmail", "FromName" }
}
```
`appsettings.example.json` is the committed template with placeholder values.
