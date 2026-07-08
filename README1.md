# 🎫 IDS IT Help Desk & Ticketing System

> Full-stack IT support management system built as an 8-week 
> internship project at **Integrated Digital Systems**.

**Intern:** Jamal Alboukai  
**Supervisor:** Suha Mneimneh  
**Deadline:** July 10, 2026

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Tailwind CSS |
| Backend | ASP.NET Core Web API (.NET 10) |
| Database | PostgreSQL (Neon Cloud) |
| Auth | JWT + BCrypt |
| Real-time | SignalR |
| Email | SendGrid |
| AI | Groq API (Llama 3.3 70B) |
| Charts | Recharts |
| Export | xlsx |

---

## 👥 Roles & Permissions

| Feature | Employee | Agent | Manager | Admin |
|---|---|---|---|---|
| Create ticket | ✅ | ❌ | ❌ | ✅ |
| View tickets | Own | Assigned | All | All |
| Update ticket | Own+Open | Assigned | ❌ | ✅ |
| Assign ticket | ❌ | ❌ | ❌ | ✅ |
| Escalate | ❌ | Assigned | ❌ | ❌ |
| Reports | ❌ | ❌ | ✅ | ✅ |
| Settings | ❌ | ❌ | ❌ | ✅ |
| Users | ❌ | ❌ | ❌ | ✅ |
| Activity Log | ❌ | Assigned | All | All |

---

## ✅ Features Completed

- JWT authentication with role-based access control
- Ticket CRUD with full RBAC enforcement
- Ticket assignment and escalation workflow
- Status transition validation
- Comment system (public + internal notes)
- File attachments (magic byte validation, secure download)
- Real-time notifications via SignalR
- Email notifications via SendGrid
- Dashboard analytics with Recharts (role-scoped)
- User management (Admin)
- Settings management — Categories & Priorities
- Global activity log (audit trail)
- Reports — monthly summary + agent performance
- PDF export (browser print) + Excel export
- AI ticket categorization + priority detection (Groq)
- AI chatbot assistant (floating, all pages)
- User profile page (all roles)
- Fully responsive design (mobile → desktop)

---

## 🚀 Running the Project

### Prerequisites
- .NET 10 SDK
- Node.js 18+
- PostgreSQL (or Neon account)
- Groq API key (free at console.groq.com)

### Backend
```bash
cd server/WebApplication1server
# Copy and fill in secrets
cp appsettings.example.json appsettings.json
dotnet restore
dotnet run
# Runs on http://localhost:5197
```

### Frontend
```bash
cd client
cp .env.example .env
# Add your REACT_APP_GROQ_API_KEY to .env
npm install
npm start
# Runs on http://localhost:3000
```

### Database
- Hosted on Neon (neon.tech) — no local setup needed
- Connection string goes in `appsettings.json`

---

## 🔑 Test Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@ids.com | Admin@123 |
| Agent | (create via Users page) | (set on creation) |
| Employee | (create via Users page) | (set on creation) |
| Manager | (create via Users page) | (set on creation) |

---

## ⚙️ Environment Variables

### Backend — `appsettings.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "your_neon_connection_string"
  },
  "JwtSettings": {
    "SecretKey": "your_secret_min_32_chars",
    "Issuer": "IDSHelpDesk",
    "Audience": "IDSHelpDeskUsers",
    "ExpiryInDays": 7
  },
  "SendGrid": {
    "ApiKey": "your_sendgrid_key",
    "FromEmail": "your_email",
    "FromName": "IDS Help Desk"
  }
}
```

### Frontend — `client/.env`
```env
REACT_APP_GROQ_API_KEY=your_groq_key
```

---

## 📁 Project Structure
it-helpdesk-system/
├── client/                  → React frontend
│   ├── src/
│   │   ├── components/      → Shared components
│   │   ├── context/         → Auth context
│   │   ├── layouts/         → MainLayout with sidebar
│   │   ├── pages/           → All page components
│   │   └── services/        → API service layer
│   └── package.json
│
└── server/
└── WebApplication1server/
├── Controllers/     → API endpoints
├── Services/        → Business logic
├── Models/          → EF Core entities
├── DTOs/            → Request/response models
├── Helpers/         → RBAC, status transitions
├── Hubs/            → SignalR hub
├── Migrations/      → EF Core migrations
└── Program.cs

---

## 🗓️ 8-Week Timeline

| Week | Deliverable |
|---|---|
| 1 | ERD, wireframes, repo setup |
| 2 | Auth, JWT, protected routes |
| 3 | Ticket CRUD, RBAC, filters |
| 4 | Comments, history, notifications |
| 5 | Email, attachments, dashboard, users |
| 6 | Settings, reports, activity log, assign UI |
| 7 | AI features, responsive design, bug fixes |
| 8 | Profile page, final testing, documentation |
