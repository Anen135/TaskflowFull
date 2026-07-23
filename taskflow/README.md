# TaskFlow — Portfolio Project

A full-stack SaaS task management platform demonstrating:

- **Role-Based Access Control (RBAC)** with fine-grained permissions
- **Real-time WebSocket notifications** using Socket.IO with Redis adapter
- **Interactive analytics dashboard** with Recharts (3 chart types)
- **NestJS backend** with TypeORM, JWT auth, PostgreSQL
- **React frontend** with Vite, TypeScript, and a polished UI

## Quick Start (Frontend Demo)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and login with: `admin@taskflow.dev` / `password123`

The frontend works in **demo mode** — no database required. The analytics dashboard renders with sample data. The login page, sidebar navigation, notification panel, and permission gates all function offline.

## Full Stack (with Docker)

```bash
docker-compose up -d
```

This starts PostgreSQL, Redis, the NestJS API (port 3000), and the React frontend (port 5173).

## Project Structure

```
taskflow/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/               # JWT authentication (login, strategy, guard)
│   │   ├── rbac/               # Role-based access control
│   │   │   ├── entities/       # User, Role, Permission
│   │   │   ├── guards/         # PermissionsGuard
│   │   │   ├── decorators/     # @RequirePermissions()
│   │   │   ├── permissions.enum.ts
│   │   │   ├── roles.enum.ts
│   │   │   └── rbac.service.ts
│   │   ├── workspaces/         # Multi-tenant workspace support
│   │   ├── tasks/              # Task CRUD with seed data
│   │   ├── analytics/          # Aggregated SQL queries + Redis caching
│   │   ├── notifications/      # WebSocket gateway + service
│   │   └── seed/               # Auto-seeds demo data on startup
│   ├── package.json
│   └── tsconfig.json
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── contexts/           # AuthContext (demo + real login)
│   │   ├── hooks/              # useNotifications (WebSocket hook)
│   │   ├── components/
│   │   │   ├── LoginPage.tsx   # Beautiful login with demo hint
│   │   │   ├── Layout.tsx      # Sidebar + topbar + content
│   │   │   ├── AnalyticsDashboard.tsx  # 3-chart dashboard
│   │   │   ├── PermissionGate.tsx      # UI permission guard
│   │   │   └── NotificationBell.tsx    # Real-time notification dropdown
│   │   ├── App.tsx             # Main app with 5 pages
│   │   └── index.css           # Complete design system (500+ lines)
│   ├── package.json
│   └── vite.config.ts
└── docker-compose.yml
```

## Key Features Demonstrated

| Feature | Backend | Frontend |
|---------|---------|----------|
| JWT Authentication | JwtStrategy, AuthGuard, login endpoint | Login page with demo fallback |
| RBAC | PermissionsGuard + @RequirePermissions() | PermissionGate component |
| WebSocket Notifications | Socket.IO gateway + Redis adapter | useNotifications hook + NotificationBell |
| Analytics | SQL aggregates + Redis cache-aside | Recharts (Line, Pie, Bar charts) |
| Multi-Tenant | Workspace-scoped roles and tasks | Workspace context in sidebar |

## Design Decisions

- **Demo-first**: The frontend works completely offline with mock data, so an employer can open it and see a polished app without any setup
- **Progressive enhancement**: If the backend is running, all API calls go to real endpoints; otherwise demo data kicks in
- **Human touches**: Realistic comments, seed data with natural-sounding task titles, consistent error handling, proper loading states
- **Production patterns**: Cache-aside with Redis, WebSocket adapter for horizontal scaling, privilege escalation protection in RBAC, proper validation pipes