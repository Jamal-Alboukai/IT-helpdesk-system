# 🎫 IT Help Desk & Ticketing Management System

> A modern, full-stack web application for managing internal IT support operations — built as part of a Full Stack Web Development Internship at **Integrated Digital Systems**.

---

## 👨‍💻 Intern

**Jamal Alboukai**
GitHub: [@Jamal-Alboukai](https://github.com/Jamal-Alboukai/Jamal-Alboukai)

**Supervisor:** Suha Mneimneh
**Company:** Integrated Digital Systems

---

## 📌 Project Overview

This system allows company employees to submit IT support tickets, while IT agents and administrators can manage, prioritize, assign, and resolve them through a centralized dashboard.

The project simulates a real-world enterprise software development environment, covering frontend development, backend APIs, database design, authentication, reporting, and AI integrations.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Tailwind CSS |
| Backend | ASP.NET Core Web API (C#) |
| Database | PostgreSQL (Neon Cloud) |
| Authentication | JWT + ASP.NET Identity |
| Deployment | Azure / Docker |
| AI Integration | OpenAI API |

---

## 👥 System Roles

| Role | Description |
|---|---|
| Admin | Full system access |
| IT Support Agent | Manage and resolve tickets |
| Employee | Create and track tickets |
| Manager | Monitor team tickets and reports |

---

## 📦 Core Modules

- **Authentication & User Management** — Admin-created accounts, JWT auth, forced password change on first login
- **Ticket Management** — Create, update, track tickets with categories, priorities, and statuses
- **Ticket Assignment & Workflow** — Assign, reassign, escalate tickets with full audit trail
- **Communication & Notifications** — In-app notifications, comment system, internal notes
- **Dashboard & Reporting** — Analytics, charts, PDF/Excel export
- **Admin Panel** — User management, role management, system settings
- **AI Features** *(Advanced)* — Auto categorization, priority suggestion, reply suggestions

---

## 🗄️ Database Schema

The system uses a relational PostgreSQL database with 10 tables:

`User` · `Role` · `Ticket` · `TicketComment` · `TicketAttachment` · `Notification` · `ActivityLog` · `Category` · `Priority` · `Status`

📎See full ERD diagram in [`/docs/ERD.png`](./docs/ERD.png)

---

## 📁 Project Structure

```
it-helpdesk-system/
├── client/         → React.js frontend
├── server/         → ASP.NET Core Web API backend
├── docs/           → ERD diagrams, wireframes, documentation
└── README.md
```

---

## 🗓️ 8-Week Timeline

| Week | Focus |
|---|---|
| 1 | Planning, wireframes, ERD, database schema |
| 2 | Project setup, authentication, role management |
| 3 | Ticket CRUD, categories & priorities |
| 4 | Assignment workflow, comments, statuses |
| 5 | Notifications, file uploads, dashboard |
| 6 | Reports, charts, export, AI integration |
| 7 | Testing, bug fixing, UI improvements |
| 8 | Deployment, documentation, final demo |

---

## 🚀 Getting Started

> Setup instructions will be added in Week 2 once the project structure is initialized.

---

## 📄 Documentation

- [ ] ERD Diagram
- [ ] System Workflow Diagrams
- [ ] UI Wireframes
- [ ] API Documentation
- [ ] Setup Instructions
- [ ] Final Demo Video

---

## 📝 Weekly Progress

| Week | Status | Deliverable |
|---|---|---|
| Week 1 | 🔄 done | Wireframes, ERD, Schema, Repo setup |
| Week 2 | 🔄 done| Auth system |
| Week 3 | 🔄 done | Ticket module |
| Week 4 | 🔄 done | Workflow |
| Week 5 | 🔄 done | Dashboard |
| Week 6 | 🔄 done | Reports & AI |
| Week 7 | ⏳ InProgrees | Testing |
| Week 8 | ⏳ Pending | Deployment |

---

*Internship Project — Integrated Digital Systems · 2025*
