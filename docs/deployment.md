# Deployment Documentation

## Prerequisites

- .NET 10 SDK
- Node.js 18+
- PostgreSQL (or a Neon Cloud account)
- Groq API key (free — console.groq.com)
- SendGrid API key (optional, for email notifications)

## Installation

```bash
# Backend
cd server/WebApplication1server
cp appsettings.example.json appsettings.json   # fill in secrets
dotnet restore
dotnet ef database update                      # applies all migrations
dotnet run

# Frontend
cd client
cp .env.example .env                            # add REACT_APP_GROQ_API_KEY
npm install
npm start
```

## Environment Variables

### Backend — `appsettings.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=...neon.tech;Database=neondb;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true"
  },
  "JwtSettings": {
    "SecretKey": "min_32_character_secret",
    "Issuer": "IDSHelpDesk",
    "Audience": "IDSHelpDeskUsers",
    "ExpiryInDays": 7
  },
  "SendGrid": {
    "ApiKey": "SG.xxx",
    "FromEmail": "your_email@example.com",
    "FromName": "IDS Help Desk"
  }
}
```

### Frontend — `client/.env`
```env
REACT_APP_GROQ_API_KEY=your_groq_key
```

## Running Locally

- Backend: `http://localhost:5197`
- Frontend: `http://localhost:3000`
- CORS policy in `Program.cs` currently hardcodes `http://localhost:3000` as the only allowed origin — **must be updated for any other deployment origin**.

## Docker

**Not implemented** in the current codebase. No `Dockerfile` or `docker-compose.yml` exists. This was identified as a candidate improvement during planning but was deprioritized against the submission deadline.

Suggested minimal starting point if added later:

```dockerfile
# server/WebApplication1server/Dockerfile (example — not present in repo)
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "WebApplication1server.dll"]
```

```dockerfile
# client/Dockerfile (example — not present in repo)
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install && npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
```

## Production Deployment

Not implemented. No production configuration (`appsettings.Production.json` beyond the default template), no reverse proxy config, no HTTPS certificate setup documented. Database is already cloud-hosted (Neon), so only the API and static frontend build would need hosting (e.g. Azure App Service + Static Web Apps, or a VPS with Nginx).

## CI/CD

Not implemented — no GitHub Actions workflows or other pipeline configuration found in the repository. Recommended first step if added: a build-only workflow on push to `main` (`dotnet build` + `npm run build`), expanding to test execution once a test suite exists (see `testing.md`).

## Build Process

- Frontend: `npm run build` → static output in `client/build/`
- Backend: `dotnet publish -c Release`

## SSL / Reverse Proxy / Scaling

Not configured — out of scope for the current internship deliverable. Single-instance local/dev deployment only. Any future multi-instance deployment would require a Redis backplane for SignalR to keep real-time notifications consistent across instances.
