# API Documentation

*Format: Method, URL, Auth, Body, Response.*

## Auth

### POST `/api/auth/login`
- **Auth:** none
- **Body:** `{ email, password }`
- **200:** `{ token }`
- **401:** invalid credentials

### POST `/api/auth/change-password`
- **Auth:** `[Authorize]`
- **Body:** `{ currentPassword, newPassword }`
- **200:** `{ message, token }` (new token issued)
- **400:** validation failure / current password wrong

---

## Tickets

### GET `/api/ticket?search=&categoryId=&priorityId=&statusId=&page=&pageSize=`
- **Auth:** `[Authorize]`, role-scoped automatically
- **200:** `PaginatedResponseDTO<TicketListResponseDTO>`

### GET `/api/ticket/{id}`
- **200:** `TicketResponseDTO`
- **404:** not found or access denied

### POST `/api/ticket`
- **Auth:** `Employee,Admin` only
- **Body:** `CreateTicketDTO { title, description, categoryId, priorityId, dueAt? }`
- **201:** `TicketResponseDTO`
- **400:** missing fields

### PUT `/api/ticket/{id}`
- **Body:** `UpdateTicketDTO` (fields vary by role — see `backend.md`)
- **200:** updated ticket
- **400:** invalid status transition / access denied reason
- **404:** not found

### DELETE `/api/ticket/{id}`
- Soft-delete (sets status to Closed)
- **200:** `{ message }`
- **404:** not found/denied

### POST `/api/ticket/{id}/assign`
- **Auth:** `Admin` only
- **Body:** `{ assignedToId }`
- **200:** updated ticket
- **404:** ticket not found or target user not an Agent

### POST `/api/ticket/{id}/escalate`
- **Auth:** `ITSupportAgent` only
- **Body:** `{ escalationNote }`
- **200:** updated ticket
- **404:** not found/not assigned to caller

### GET `/api/categories` · `/api/priorities` · `/api/statuses`
- Active-only lookups, `[Authorize]`, any role
- **200:** `LookupDTO[]`

---

## Comments

### GET `/api/ticket/{ticketId}/comment`
- **200:** `CommentResponseDTO[]` (internal notes filtered by role)

### POST `/api/ticket/{ticketId}/comment`
- **Body:** `{ content, isInternal }`
- **201:** `CommentResponseDTO`

### GET `/api/ticket/{ticketId}/history`
- **200:** `ActivityLogResponseDTO[]`

---

## Users

All `Admin` only except `/profile`.

| Endpoint | Method | Description |
|---|---|---|
| `/api/user` | GET | All users |
| `/api/user/agents` | GET | Agent lookup for assign dropdown |
| `/api/user/{id}` | GET | Single user detail |
| `/api/user` | POST | Create user |
| `/api/user/{id}` | PUT | Update user |
| `/api/user/{id}/toggle-active` | PUT | Activate/deactivate |
| `/api/user/roles` | GET | Role lookup |
| `/api/user/profile` | GET | Own profile (any authenticated role) |
| `/api/user/profile` | PUT | Update own name (any authenticated role) |

---

## Dashboard

### GET `/api/dashboard/stats`
- **Auth:** `[Authorize]`, role-scoped
- **200:** `DashboardStatsDTO`

---

## Reports

`Admin,Manager` only:

| Endpoint | Method | Description |
|---|---|---|
| `/api/reports/monthly-summary?months=12` | GET | Monthly ticket totals |
| `/api/reports/agent-performance` | GET | Per-agent resolution stats |
| `/api/reports/summary?months=12` | GET | Both combined |

---

## Settings

`Admin` only:

| Endpoint | Method |
|---|---|
| `/api/settings/categories` | GET/POST |
| `/api/settings/categories/{id}` | PUT |
| `/api/settings/priorities` | GET/POST |
| `/api/settings/priorities/{id}` | PUT |
| `/api/settings/statuses` | GET (read-only) |

---

## Activity Log

`Admin,Manager,ITSupportAgent`:

### GET `/api/logs?search=&action=&fromDate=&toDate=&page=&pageSize=`
- `pageSize` capped at 50 server-side

### GET `/api/logs/action-types`
- Returns distinct action strings for filter dropdown

---

## Notifications

`[Authorize]`:

| Endpoint | Method |
|---|---|
| `/api/notification` | GET |
| `/api/notification/unread-count` | GET |
| `/api/notification/{id}/read` | PUT |
| `/api/notification/read-all` | PUT |

---

## SignalR

`ws://.../hubs/notifications?access_token={jwt}` — authenticated via query-string JWT (see `backend.md` for why).

---

## Attachments

`[Authorize]`:

| Endpoint | Method |
|---|---|
| `/api/attachment/upload` | POST |
| `/api/attachment/ticket/{ticketId}` | GET |
| `/api/attachment/download/{id}` | GET |
| `/api/attachment/{id}` | DELETE |

Files validated by extension, MIME type, and magic bytes before storage. Max size 5MB. Allowed types: jpg, png, gif, webp, pdf, doc, docx, xlsx.
