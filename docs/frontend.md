# Frontend Documentation

## Pages

One page component per route; each is self-contained (fetches its own data via `useEffect`, holds local `useState`). No shared global state store (Redux/Zustand) — `AuthContext` is the only cross-cutting shared state.

| Page | Route | Notes |
|---|---|---|
| `LoginPage` | `/login` | Public |
| `ChangePasswordPage` | `/change-password` | Public (forced flow) |
| `DashboardPage` | `/dashboard` | Recharts, role-scoped API response |
| `TicketListPage` | `/tickets` | Search/filter/paginate, role-conditional "New Ticket" button |
| `CreateTicketPage` | `/tickets/new` | AI-suggest integration, file upload |
| `TicketDetailPage` | `/tickets/:id` | Largest page — assign panel, status update, escalation, comments, history, attachments |
| `EditTicketPage` | `/tickets/:id/edit` | Ticket edit flow |
| `UsersPage` | `/users` | Admin only |
| `SettingsPage` | `/settings` | Tabs: Categories, Priorities, Statuses |
| `ReportsPage` | `/reports` | Monthly + agent tables, PDF/Excel export |
| `ActivityLogPage` | `/logs` | Filterable global audit log |
| `NotificationsPage` | `/notifications` | Full notification list |
| `ProfilePage` | `/profile` | All roles — view/edit name, change password |

## Components (Reusable)

- `ProtectedRoute` — wraps routes needing auth, redirects unauthenticated users.
- `NotificationBell` — SignalR connection lifecycle + unread badge, mounted in `MainLayout` header.
- `AIChatbot` — floating widget, mounted once in `MainLayout`, persists across page navigation (component doesn't unmount on route change since `MainLayout` wraps all protected routes).
- `AttachmentList`, `CommentSection`, `HistoryTimeline` — ticket-detail sub-components, each independently fetching their own slice of data by `ticketId` prop.

## State Management

- **Local component state** (`useState`) is the default for all page-level data (loading, error, form fields, fetched lists).
- **`AuthContext`** is the only React Context — holds `user`, `login()`, `logout()`, `isAuthenticated`, decoded from the JWT stored in a cookie (`auth_token`, `SameSite=Strict`, 7-day expiry).
- No memoization library, no server-state cache (React Query/SWR) — every page re-fetches on mount via `useEffect`.

## Routing

`react-router-dom` v6, `BrowserRouter`. Structure:
```
/login, /change-password           → public
/*  (everything else)              → <ProtectedRoute><MainLayout>{page}</MainLayout></ProtectedRoute>
/ and unmatched routes             → redirect to /login
```
`MainLayout` renders the sidebar (role-filtered nav array, `.filter(item => item.roles.includes(user?.role))`) and mounts `AIChatbot` once for the whole authenticated session.

## Forms

No form library (Formik/React Hook Form) — all forms are plain controlled components (`useState` per field, manual `onChange`). Validation is manual, inline (`if (!field.trim()) setError(...)`).

## API Communication

- `api.ts` — single Axios instance, base URL pointing at the backend, attaching the JWT via an interceptor for authenticated requests.
- Each `*Service.ts` file wraps one backend controller's endpoints 1:1, returning typed interfaces matching backend DTOs.
- `aiService.ts` is the one exception — calls `api.groq.com` directly with `fetch()`, bypassing the Axios instance and the backend entirely.

## Styling

Tailwind CSS utility classes throughout, dark theme (`bg-gray-900` pages, `bg-gray-800` cards, `bg-gray-700` inputs). Responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`) applied per the responsive-design pass: `overflow-x-auto` wrapping every table, `hidden md:table-cell` for secondary columns, `grid-cols-1 lg:grid-cols-2/3` for multi-column layouts, `flex-col sm:flex-row` for header rows.

## Frontend Folder Structure

See `project-structure.md` for the full annotated tree — `components/`, `context/`, `layouts/`, `pages/`, `services/`.

## Key Frontend Conventions

- Every page follows the same shape: `useState` for `loading`/`error`/`data`, a `useEffect` to fetch on mount, a loading guard, an error guard, then the main render.
- Role checks in JSX are simple boolean comparisons against `user?.role` from `AuthContext` (e.g. `user?.role === 'Admin'`), not a dedicated permissions abstraction.
- All service files return typed Promises; components `await` them inside `async function` handlers rather than `.then()` chains.
