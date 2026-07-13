# Architecture Documentation

## Overall Architecture

Three-tier architecture: React SPA (frontend) → ASP.NET Core Web API (backend) → PostgreSQL (Neon Cloud), with two external service integrations (SendGrid for email, Groq for AI) and one real-time channel (SignalR).

```mermaid
flowchart LR
    subgraph Client["Client Tier"]
        A[React + TypeScript SPA]
    end
    subgraph Server["Application Tier"]
        B[ASP.NET Core Web API]
        C[SignalR Hub]
    end
    subgraph Data["Data Tier"]
        D[(PostgreSQL - Neon Cloud)]
    end
    subgraph External["External Services"]
        E[SendGrid - Email]
        F[Groq API - AI]
    end

    A -->|HTTPS REST/JSON| B
    A <-->|WebSocket JWT-authenticated| C
    B --> D
    B --> E
    A -->|Direct fetch, no backend proxy| F
    B --> C
```

**Note:** AI calls (`aiService.ts`) bypass the backend entirely — the frontend calls Groq directly. This was a deliberate simplicity tradeoff; it means the Groq API key lives client-side in `.env`, acceptable for a free-tier internal tool but a documented tradeoff (see `security.md`).

## Component Diagram

```mermaid
graph TD
    subgraph Frontend
        Pages --> Services[Frontend Services Layer]
        Services --> API[api.ts - Axios instance]
        Pages --> Context[AuthContext]
        Pages --> Layout[MainLayout + Sidebar + Chatbot]
    end
    subgraph Backend
        Controllers --> BizServices[Services]
        BizServices --> Helpers
        BizServices --> DbContext[AppDbContext]
        Controllers --> DTOs
    end
    API -->|HTTP| Controllers
    DbContext --> DB[(PostgreSQL)]
```

## Layered Architecture (Backend)

Strictly enforced, per project convention:

```
Controllers (thin HTTP layer)
      ↓
Services (business logic, RBAC enforcement, orchestration)
      ↓
Helpers (RoleConstants, SeedConstants, StatusTransitionHelper, TicketQueryHelper, FileValidationHelper)
      ↓
AppDbContext (EF Core)
      ↓
PostgreSQL
```

DTOs are split request (IN) vs response (OUT) per domain and cross-cut all layers as data contracts — they are not a "layer" in the vertical sense but a horizontal concern.

## Request Flow (Example: Assign Ticket)

```mermaid
sequenceDiagram
    participant U as Admin (Browser)
    participant C as TicketController
    participant S as TicketAssignService
    participant H as TicketQueryHelper
    participant AL as ActivityLogService
    participant N as NotificationService
    participant DB as PostgreSQL
    participant SR as SignalR Hub

    U->>C: POST /api/ticket/{id}/assign
    C->>C: [Authorize(Roles="Admin")]
    C->>S: AssignTicketAsync(id, dto, User)
    S->>H: GetUserInfo(claims)
    S->>DB: Load ticket + validate agent role
    S->>DB: Update AssignedToId, StatusId=InProgress
    S->>AL: LogAsync("Ticket Assigned")
    S->>N: NotifyTicketAssignedAsync()
    N->>DB: Insert Notification row
    N-->>SR: (future) push via hub
    S->>H: MapToResponse(ticket)
    S-->>C: TicketResponseDTO
    C-->>U: 200 OK + ticket JSON
    SR-->>U: WebSocket push (agent's tab, real-time)
```

## Data Flow (Ticket Creation with AI)

```mermaid
sequenceDiagram
    participant E as Employee
    participant AI as Groq API
    participant FE as CreateTicketPage
    participant BE as Backend API
    participant DB as PostgreSQL

    E->>FE: Types title + description
    E->>FE: Clicks "Suggest"
    FE->>AI: POST chat/completions (direct, no backend)
    AI-->>FE: JSON {categoryName, priorityName, reason}
    FE->>FE: Auto-select dropdowns
    E->>FE: Submits ticket
    FE->>BE: POST /api/ticket
    BE->>DB: Insert Ticket (Status=Open)
    BE-->>FE: 201 Created + TicketResponseDTO
    FE->>FE: Navigate to ticket detail
```

## Design Decisions

| Decision | Rationale |
|---|---|
| DTOs split IN/OUT per domain | Prevents over-posting attacks, decouples API contract from EF models |
| Fixed GUIDs for seed data (`SeedConstants`) | Guarantees consistent references between code and DB across environments/migrations |
| Status transitions enforced server-side only (`StatusTransitionHelper`) | Prevents workflow bypass even if the UI is tampered with |
| Role claim under `ClaimTypes.Role` (long URI) | Matches ASP.NET Core's default `RoleClaimType` for `[Authorize(Roles=)]` without needing custom `TokenValidationParameters.RoleClaimType` overrides |
| AI calls made frontend → Groq directly | Avoids backend proxy complexity for a free-tier, non-sensitive feature; accepted tradeoff of exposing the API key client-side |
| SignalR JWT via query string | WebSocket protocol cannot carry `Authorization` headers; `OnMessageReceived` event reads `access_token` from the query string instead |
| Soft-delete via status = Closed (not row deletion) | Preserves the audit trail — `ActivityLog` records referencing a ticket must always resolve |

## Architectural Patterns

- **Repository-less EF Core** — `AppDbContext` is injected directly into services (no separate repository abstraction); acceptable at this scale, keeps `TicketQueryHelper` as the sole shared-query surface.
- **Service-per-domain** — one interface + implementation per bounded context (`ITicketService`, `IUserService`, `IReportsService`, etc.), each independently registered in DI.
- **Thin Controller pattern** — controllers validate only input shape/presence; all business rules (role checks, status validation, ownership checks) live in services.
- **CQRS-lite in Reports/Dashboard** — read-only aggregation services (`ReportsService`, `DashboardService`) that never write, separate from the write-heavy `TicketService`.

## Dependency Graph (Backend DI Registrations)

```mermaid
graph LR
    Program.cs --> IJwtService
    Program.cs --> IAuthService
    Program.cs --> ITicketQueryHelper
    Program.cs --> ITicketService
    Program.cs --> ITicketAssignService
    Program.cs --> ILookupService
    Program.cs --> IActivityLogService
    Program.cs --> ICommentService
    Program.cs --> INotificationService
    Program.cs --> ISettingsService
    Program.cs --> IEmailService
    Program.cs --> IAttachmentService
    Program.cs --> IDashboardService
    Program.cs --> IUserService
    Program.cs --> IReportsService
    Program.cs --> IActivityLogViewService

    ITicketService --> ITicketQueryHelper
    ITicketService --> IActivityLogService
    ITicketService --> INotificationService
    ITicketAssignService --> ITicketQueryHelper
    ITicketAssignService --> IActivityLogService
    ITicketAssignService --> INotificationService
    ICommentService --> ITicketQueryHelper
    ICommentService --> IActivityLogService
    ICommentService --> INotificationService
    IDashboardService --> ITicketQueryHelper
    IActivityLogViewService --> ITicketQueryHelper
```

All registered as `Scoped` (per-request lifetime), consistent with EF Core's `AppDbContext` scoping.
