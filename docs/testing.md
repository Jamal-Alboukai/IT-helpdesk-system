# Testing Documentation

## Unit Tests

**None found in the reviewed codebase.** No test project (`*.Tests.csproj`) exists alongside `WebApplication1server`. No frontend test files (`*.test.tsx`, `*.spec.tsx`) were present either.

## Integration Tests

None implemented.

## End-to-End Tests

No automated E2E test suite (Cypress, Playwright, or similar) exists. **Manual E2E testing was performed instead**, structured as detailed role-by-role checklists covering:

- Full ticket lifecycle across all 4 roles (Employee creates → Admin assigns → Agent works → Employee closes).
- Manager read-only access verification (cannot create, edit, assign, or escalate any ticket).
- Cross-role access-denial verification (e.g. an Agent cannot view another agent's assigned tickets; an Employee cannot view another employee's tickets).
- Responsive design verification at 375px / 768px / 1024px / 1440px breakpoints across every page.
- Real-time SignalR notification verification across two simultaneous browser sessions (different roles, different tabs).
- AI feature verification using a fixed set of sample ticket descriptions mapped to expected category/priority outputs (e.g. "laptop won't turn on" → Hardware/Critical).

Two full worked scenarios were used repeatedly as regression scripts:

1. **Employee reports a critical issue** → AI-assisted creation → Admin assignment → Agent resolution (with internal note) → Employee closes ticket → Admin reviews the full activity log trail and exports a report.
2. **Manager reviews team performance** → dashboard review → all-tickets read-only review → escalated ticket inspection → Reports export → Activity Log filtering → Profile/password change → chatbot interaction.

## How to Execute

No automated test runner is configured. `dotnet test` would find no test projects to run; `npm test` would launch Create React App's default Jest runner but find zero custom test files to execute against.

## Coverage

**0% automated coverage.** This is a significant, explicitly acknowledged gap for a system otherwise built to production-quality conventions (layered architecture, DTOs, RBAC). It is the most important item for any engineer extending this project to address first.

## Testing Strategy (as actually practiced)

Manual, checklist-driven, role-based regression testing performed before each feature-branch merge, supplemented by direct API inspection via the browser DevTools Network tab. No CI gate enforces any of this — it is entirely a developer-discipline process, not a tooling-enforced one.

## Recommended Path to Automated Coverage

If this project is extended, the recommended order of investment is:

1. **Backend unit tests** for `Helpers/` first (`StatusTransitionHelper`, `FileValidationHelper`) — pure functions, no DB dependency, highest test-value-per-effort ratio.
2. **Backend service tests** using an in-memory EF Core provider or a test container Postgres instance, targeting the RBAC branching logic in `TicketService.UpdateTicketAsync` (the most business-critical and highest-risk method in the codebase).
3. **Frontend component tests** (React Testing Library) for the permission-gated rendering logic in `TicketDetailPage.tsx` (the `canEdit`/`canUpdateStatus`/`canClose`/`canEscalate` boolean flags).
4. **E2E smoke test** (Playwright) automating the two manual regression scripts already used above, since they are already well-defined and proven useful.
