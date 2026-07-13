# Project Structure

```
it-helpdesk-system/
├── client/                                → React frontend (CRA, not Next.js)
│   ├── src/
│   │   ├── assets/                        → Static images/icons
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── NotificationBell.tsx   → SignalR client, unread badge
│   │   │   │   ├── ProtectedRoute.tsx     → Route guard, checks AuthContext
│   │   │   │   └── AIChatbot.tsx          → Floating chat widget, Groq calls
│   │   │   └── tickets/
│   │   │       ├── AttachmentList.tsx     → Renders/downloads ticket files
│   │   │       ├── CommentSection.tsx     → Public/internal comment thread + upload
│   │   │       └── HistoryTimeline.tsx    → Per-ticket activity log view
│   │   ├── context/
│   │   │   └── AuthContext.tsx            → Decodes JWT, exposes user + login/logout
│   │   ├── layouts/
│   │   │   └── MainLayout.tsx             → Sidebar, role-filtered nav, chatbot mount point
│   │   ├── pages/
│   │   │   ├── auth/            → LoginPage, ChangePasswordPage
│   │   │   ├── dashboard/       → DashboardPage (charts, KPIs)
│   │   │   ├── notifications/   → NotificationsPage
│   │   │   ├── tickets/         → List, Detail, Create, Edit
│   │   │   ├── users/           → UsersPage (Admin)
│   │   │   ├── settings/        → SettingsPage (Categories/Priorities/Statuses tabs)
│   │   │   ├── reports/         → ReportsPage (monthly + agent perf, export)
│   │   │   ├── logs/            → ActivityLogPage (global audit trail)
│   │   │   └── profile/         → ProfilePage (all roles)
│   │   └── services/            → One file per API domain (axios wrappers)
│   │       ├── api.ts            → Shared axios instance (base URL, interceptors)
│   │       ├── authService.ts
│   │       ├── ticketService.ts
│   │       ├── userService.ts
│   │       ├── settingsService.ts
│   │       ├── reportsService.ts
│   │       ├── activityLogService.ts
│   │       ├── profileService.ts
│   │       ├── attachmentService.ts
│   │       ├── notificationService.ts
│   │       └── aiService.ts       → Direct Groq API calls (no backend involvement)
│   └── package.json
│
└── server/
    └── WebApplication1server/
        ├── Controllers/          → Thin HTTP layer, one per domain
        ├── Data/
        │   ├── AppDbContext.cs           → DbSets, OnModelCreating, all HasData seeds
        │   └── AppDbContextFactory.cs    → Design-time factory for EF CLI tools
        ├── DTOs/                  → Request/response contracts, one file per domain
        ├── Helpers/
        │   ├── RoleConstants.cs          → Role name/GUID constants
        │   ├── SeedConstants.cs          → Category/Priority/Status GUID constants
        │   ├── StatusTransitionHelper.cs → Workflow state machine rules
        │   ├── TicketQueryHelper.cs      → Shared ticket queries, JWT claim reader, DTO mapper
        │   └── FileValidationHelper.cs   → Magic-byte + MIME + extension validation
        ├── Hubs/
        │   └── NotificationHub.cs        → SignalR hub, JWT-authenticated
        ├── Migrations/            → EF Core migration history (chronological)
        ├── Models/                → EF Core entities (10 tables)
        ├── Services/              → Business logic, one interface+impl per domain
        ├── appsettings.json               → GITIGNORED (secrets)
        ├── appsettings.example.json       → Template, committed
        └── Program.cs             → DI registration, JWT config, middleware pipeline
```

## Module Boundaries

- **Frontend `services/`** never talk to each other — each wraps one backend domain 1:1 (exception: `aiService.ts`, which talks to Groq, not the backend).
- **Backend `Services/`** may call each other's *helpers* freely (e.g. every ticket-related service uses `TicketQueryHelper`) but do not call each other directly — cross-domain orchestration happens in the calling service itself (e.g. `TicketAssignService` calls `IActivityLogService` and `INotificationService` directly, not through `TicketService`).
- **DTOs are one-directional artifacts** — a `CreateTicketDTO` is never reused as a response shape, and vice versa.

## Folder-by-Folder Responsibilities

### `client/src/components/common/`
Shared, cross-page UI pieces not tied to a single domain. `ProtectedRoute` gates access based on `AuthContext`; `NotificationBell` owns the SignalR connection lifecycle; `AIChatbot` is mounted once by `MainLayout` and persists across navigations.

### `client/src/components/tickets/`
Ticket-detail-specific sub-components. Each fetches its own data independently by `ticketId` prop rather than receiving data from the parent page — this keeps `TicketDetailPage.tsx` from becoming a single monolithic data-fetching component.

### `client/src/context/`
Only one context exists (`AuthContext`). No global state library is used; all other state is local to each page.

### `client/src/layouts/`
`MainLayout` is the single authenticated-area shell — sidebar navigation (role-filtered), header bar (notification bell), and the floating chatbot.

### `client/src/pages/`
One folder per domain, one file per route. Pages are self-contained: each fetches its own data on mount and manages its own loading/error state.

### `client/src/services/`
The API boundary. Each file exports a plain object of async functions wrapping one backend controller. Types/interfaces here mirror backend DTOs by convention (not by codegen — manually kept in sync).

### `server/.../Controllers/`
HTTP entry points only. See `backend.md` for the full responsibility breakdown.

### `server/.../Data/`
`AppDbContext` is the single EF Core context — all `DbSet`s, all `OnModelCreating` relationship configuration, and all seed data (`HasData`) live here.

### `server/.../DTOs/`
One file per domain, split into IN (request) and OUT (response) types. Never shared bidirectionally.

### `server/.../Helpers/`
Cross-cutting, stateless utilities used by multiple services. Not business-logic owners themselves — `StatusTransitionHelper` defines *what* transitions are legal, but `TicketService` decides *when* to check.

### `server/.../Hubs/`
SignalR hub definitions. Currently one hub (`NotificationHub`) for the notification bell's real-time channel.

### `server/.../Migrations/`
Standard EF Core migration history — see `database.md` for the full chronological list and what each one introduced.

### `server/.../Models/`
Plain EF Core entity classes — no business logic, only properties and navigation properties.

### `server/.../Services/`
Business logic layer. One interface + one implementation per domain, each independently registered in `Program.cs`'s DI container.
