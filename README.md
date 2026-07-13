# 🎫 IDS IT Help Desk & Ticketing System

![.NET](https://img.shields.io/badge/.NET-10-512BD4?logo=dotnet)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)
![License](https://img.shields.io/badge/license-Internal-lightgrey)

> Full-stack IT support ticketing system built as an 8-week internship
> project at **Integrated Digital Systems**.

**Author:** Jamal Alboukai · **Supervisor:** Suha Mneimneh

---

## 📌 Description

A role-based IT Help Desk platform where employees submit support tickets,
agents resolve them, managers monitor performance, and admins control the
whole system — with AI-assisted triage, real-time notifications, and full
audit logging.

## ✅ Features

- JWT authentication with 4 roles (Employee, IT Support Agent, Manager, Admin)
- Full ticket lifecycle with enforced status workflow
- Real-time notifications (SignalR)
- AI ticket categorization/priority suggestion + chatbot (Groq)
- Dashboard analytics, monthly reports, Excel/PDF export
- Global activity log / audit trail
- Fully responsive UI (mobile, tablet, desktop)

## 📷 Screenshots

*(placeholders — to be added)*

`![Dashboard](./docs/screenshots/dashboard.png)`
`![Ticket Detail](./docs/screenshots/ticket-detail.png)`

## 🏗️ Architecture

React SPA → ASP.NET Core Web API → PostgreSQL (Neon), plus SendGrid (email)
and Groq (AI, called directly from the frontend). Full diagrams in
[`/docs/architecture.md`](./docs/architecture.md).

## 🚀 Installation

```bash
# Backend
cd server/WebApplication1server
cp appsettings.example.json appsettings.json   # fill in secrets
dotnet restore && dotnet ef database update && dotnet run

# Frontend
cd client
cp .env.example .env                            # add REACT_APP_GROQ_API_KEY
npm install && npm start
```

## ⚙️ Configuration

See [`/docs/deployment.md`](./docs/deployment.md) for all required
environment variables and setup details.

## ▶️ Running

- Backend: `http://localhost:5197`
- Frontend: `http://localhost:3000`

## 📁 Folder Structure

See [`/docs/project-structure.md`](./docs/project-structure.md) for the
full annotated tree.

## 📡 API Summary

See [`/docs/api.md`](./docs/api.md) for the complete endpoint reference.

## 🗄️ Database

See [`/docs/database.md`](./docs/database.md) for the ER diagram, table
descriptions, and migration history.

## 🔒 Security

See [`/docs/security.md`](./docs/security.md) for authentication,
authorization, and known security gaps.

## 🧪 Testing

See [`/docs/testing.md`](./docs/testing.md) — no automated test suite
currently exists; manual role-based regression testing is the current
strategy.

## 🤝 Contributing

See [`/docs/maintenance.md`](./docs/maintenance.md) — branch workflow is
`dev → main` via pull request.

## ❓ FAQ

**Q: Why Groq instead of OpenAI or Gemini for AI features?**
A: Free-tier availability. Gemini's free tier was blocked in the deployment
region; Groq (Llama 3.3 70B) has no such restriction and remains free.

**Q: Can IT Support Agents create tickets?**
A: No — only Employees and Admins can create tickets. Agents manage,
resolve, and escalate tickets that are assigned to them.

**Q: Is there an automated test suite?**
A: Not yet. See [`/docs/testing.md`](./docs/testing.md) for the current
manual testing strategy and the plan for adding automated coverage.

**Q: Is this containerized / deployable via Docker?**
A: Not yet — see [`/docs/deployment.md`](./docs/deployment.md) for the
current manual setup process and a suggested starting `Dockerfile`.

## 📄 License

Internal project — Integrated Digital Systems. Not licensed for external
use or distribution.

---

## 📚 Full Documentation Index

| Document | Contents |
|---|---|
| [`docs/overview.md`](./docs/overview.md) | Executive summary, purpose, features, glossary |
| [`docs/architecture.md`](./docs/architecture.md) | System architecture, diagrams, design decisions |
| [`docs/project-structure.md`](./docs/project-structure.md) | Full folder-by-folder breakdown |
| [`docs/backend.md`](./docs/backend.md) | Controllers, services, auth, middleware |
| [`docs/frontend.md`](./docs/frontend.md) | Pages, components, state, routing |
| [`docs/database.md`](./docs/database.md) | ERD, tables, relationships, migrations |
| [`docs/api.md`](./docs/api.md) | Full endpoint reference |
| [`docs/deployment.md`](./docs/deployment.md) | Setup, environment variables, Docker (planned) |
| [`docs/security.md`](./docs/security.md) | Auth, known risks, recommendations |
| [`docs/performance.md`](./docs/performance.md) | Caching, bottlenecks, scaling notes |
| [`docs/testing.md`](./docs/testing.md) | Current testing strategy and gaps |
| [`docs/maintenance.md`](./docs/maintenance.md) | Troubleshooting, known issues, onboarding |
