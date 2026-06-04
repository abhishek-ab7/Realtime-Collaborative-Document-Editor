# Collabdoc — Real-time Collaborative Document Editor

Collabdoc is a portfolio-grade, real-time collaborative document editing SaaS platform designed to showcase conflict-free document synchronization, presence awareness, granular access permissions, and version histories at scale.

## 🚀 Tech Stack

- **Monorepo Build System**: [Turborepo](https://turbo.build/)
- **Frontend App**: [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Collaborative Engine**: [Yjs (CRDT)](https://github.com/yjs/yjs) + [TipTap Editor](https://tiptap.dev/)
- **Real-time Server**: Standalone [Socket.io](https://socket.io/) (NodeJS + Express + TypeScript)
- **Database Layer**: [Prisma](https://www.prisma.io/) + [PostgreSQL 16](https://www.postgresql.org/)
- **Cache & Scaling**: [Redis 7](https://redis.io/)
- **Authentication**: [Auth.js (NextAuth)](https://authjs.dev/)
- **Quality Assurance**: [Vitest](https://vitest.dev/) (Unit/Integration) + [Playwright](https://playwright.dev/) (E2E)

---

## 📁 Project Structure

```
├── apps/
│   ├── web/               # Next.js 16 App (Port 3000)
│   └── socket-server/     # Node/Express Socket.io server (Port 3001)
├── packages/
│   ├── database/          # Prisma schema, client, migrations, seeds
│   ├── shared/            # Shared validation schemas (Zod), constants, permissions
│   └── yjs-utils/         # Custom Yjs socket providers and syncing utilities
├── e2e/                   # Playwright E2E browser tests
├── docker-compose.yml     # Local Postgres and Redis services
├── turbo.json             # Turborepo task pipeline
└── package.json           # Root package workspace scripts
```

---

## 🛠️ Getting Started

### Prerequisites

Make sure you have [NodeJS >=20.9.0](https://nodejs.org/), `npm`, and [Docker](https://www.docker.com/) installed.

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Local Databases (PostgreSQL + Redis)

```bash
docker compose up -d
```

_Note: Postgres is mapped to host port `5434` and Redis to host port `6380` to avoid conflicts._

### 3. Apply Migrations and Seed Test Data

Copy `.env.example` to `.env` if you haven't, then run:

```bash
npm run db:migrate
npm run db:seed
```

### 4. Run Development Servers

```bash
npm run dev
```

- Next.js Web App will launch at `http://localhost:3000`
- Socket.io Server will launch at `http://localhost:3001`
- Health check is available at `http://localhost:3001/health`

---

## 🧪 Testing

### Run Unit and Integration Tests

```bash
npm run test
```

### Run End-to-End Tests

```bash
npm run test:e2e
```

---

## 📚 Development Guide

For more granular details regarding project workflows, linting, git hooks, and styling guidelines, please read the [Development Guide](docs/development.md).
