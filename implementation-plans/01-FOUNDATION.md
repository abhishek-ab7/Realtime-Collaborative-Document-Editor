# Phase 01 — Project Foundation & Infrastructure

> **Days:** 1–3  
> **Status:** ⬜ Not Started  
> **Dependencies:** None  
> **Milestone:** M1-FOUNDATION  
> **PRD Sections:** 4 (Tech Stack), 9 (Database Design), 13 (Project Structure)

---

## Table of Contents

1. [Phase Objective](#1-phase-objective)
2. [Day-by-Day Breakdown](#2-day-by-day-breakdown)
3. [Detailed File Specifications](#3-detailed-file-specifications)
4. [Database Schema](#4-database-schema)
5. [Stitch MCP — Design System Setup](#5-stitch-mcp--design-system-setup)
6. [Environment Variables](#6-environment-variables)
7. [Testing Requirements](#7-testing-requirements)
8. [Acceptance Criteria](#8-acceptance-criteria)
9. [Risk Register](#9-risk-register)

---

## 1. Phase Objective

Establish the complete project infrastructure: Turborepo monorepo, Next.js 16 frontend, standalone Socket.io server scaffold, Prisma database schema with all 10 tables, local PostgreSQL via Docker, shared packages, linting/formatting, CI/CD pipeline, and Stitch MCP design system initialization.

**After this phase, every subsequent phase has a stable foundation to build on.**

---

## 2. Day-by-Day Breakdown

### Day 1: Monorepo + Next.js + Docker PostgreSQL

#### Tasks

| #    | Task                                                 | Est. Time | Output                                                |
| ---- | ---------------------------------------------------- | --------- | ----------------------------------------------------- |
| 1.1  | Initialize Git repository                            | 5 min     | `.git/`, `.gitignore`                                 |
| 1.2  | Set up Turborepo monorepo structure                  | 30 min    | `turbo.json`, root `package.json`                     |
| 1.3  | Create Next.js 16 app (`apps/web`)                   | 15 min    | `apps/web/` with TS + Tailwind + App Router           |
| 1.4  | Initialize shadcn/ui in `apps/web`                   | 15 min    | `components.json`, `apps/web/src/components/ui/`      |
| 1.5  | Configure Tailwind CSS v4 design tokens              | 45 min    | `apps/web/src/app/globals.css` with full token system |
| 1.6  | Set up Docker Compose for PostgreSQL 16              | 20 min    | `docker-compose.yml`                                  |
| 1.7  | Create root `.env.example` and `apps/web/.env.local` | 15 min    | Env templates                                         |
| 1.8  | Configure root ESLint + Prettier                     | 30 min    | `.eslintrc.cjs`, `.prettierrc`                        |
| 1.9  | Set up Husky + lint-staged pre-commit hooks          | 15 min    | `.husky/pre-commit`                                   |
| 1.10 | Verify `npm run dev` starts Next.js on `:3000`       | 10 min    | Working dev server                                    |

**Day 1 Total: ~3.5 hours**

#### Exact Commands

```bash
# 1.1 — Initialize Git
cd "/home/abhi/Downloads/Realtime Collaborative Document Editor"
git init
cat > .gitignore << 'EOF'
node_modules/
.next/
dist/
build/
.env
.env.local
.env.*.local
*.log
.DS_Store
.turbo/
coverage/
playwright-report/
test-results/
.stitch/designs/
EOF

# 1.2 — Initialize Turborepo
# Create root package.json manually (not using create-turbo to avoid boilerplate)
cat > package.json << 'EOF'
{
  "name": "collabdoc",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check",
    "test": "turbo test",
    "test:e2e": "playwright test",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "db:migrate": "cd packages/database && npx prisma migrate dev",
    "db:push": "cd packages/database && npx prisma db push",
    "db:seed": "cd packages/database && npx prisma db seed",
    "db:studio": "cd packages/database && npx prisma studio",
    "prepare": "husky"
  },
  "devDependencies": {
    "turbo": "^2.5.0",
    "prettier": "^3.5.0",
    "eslint": "^9.0.0",
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  },
  "packageManager": "npm@10.0.0",
  "engines": {
    "node": ">=20.9.0"
  }
}
EOF

# turbo.json
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
EOF

# 1.3 — Create Next.js app
mkdir -p apps
cd apps
npx -y create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --turbopack --yes
cd ..

# 1.5 — Docker Compose for PostgreSQL
cat > docker-compose.yml << 'EOF'
version: "3.9"
services:
  postgres:
    image: postgres:16-alpine
    container_name: collabdoc-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: collabdoc
      POSTGRES_PASSWORD: collabdoc_dev_password
      POSTGRES_DB: collabdoc
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: collabdoc-redis
    restart: unless-stopped
    ports:
      - "6379:6379"

volumes:
  pgdata:
EOF

# Start PostgreSQL
docker compose up -d postgres
```

---

### Day 2: Prisma Schema + Shared Packages + Socket.io Server Scaffold

#### Tasks

| #   | Task                                                      | Est. Time | Output                             |
| --- | --------------------------------------------------------- | --------- | ---------------------------------- |
| 2.1 | Create `packages/database/` with complete Prisma schema   | 90 min    | All 10 tables from PRD             |
| 2.2 | Run initial migration                                     | 10 min    | `prisma/migrations/`               |
| 2.3 | Create Prisma client singleton                            | 15 min    | `packages/database/src/index.ts`   |
| 2.4 | Create seed script with test data                         | 30 min    | `packages/database/prisma/seed.ts` |
| 2.5 | Create `packages/shared/` (types, Zod schemas, constants) | 60 min    | Shared validation + types          |
| 2.6 | Create `packages/yjs-utils/` scaffold                     | 30 min    | Package structure                  |
| 2.7 | Create `apps/socket-server/` scaffold                     | 45 min    | Express + Socket.io skeleton       |
| 2.8 | Wire all packages in Turborepo                            | 20 min    | Package references work            |
| 2.9 | Verify `npm run dev` starts both apps                     | 15 min    | Web `:3000` + Socket `:3001`       |

**Day 2 Total: ~5.5 hours**

#### Exact Commands

```bash
# 2.1 — Create database package
mkdir -p packages/database
cd packages/database
npm init -y
npm install @prisma/client
npm install -D prisma typescript
npx prisma init --datasource-provider postgresql
cd ../..

# 2.7 — Create socket server
mkdir -p apps/socket-server/src
cd apps/socket-server
npm init -y
npm install socket.io yjs y-protocols lib0 express cors pino
npm install -D typescript tsx tsup @types/node @types/express @types/cors
cd ../..

# 2.5 — Create shared package
mkdir -p packages/shared/src
cd packages/shared
npm init -y
npm install zod
npm install -D typescript
cd ../..

# 2.6 — Create yjs-utils package
mkdir -p packages/yjs-utils/src
cd packages/yjs-utils
npm init -y
npm install yjs y-protocols y-indexeddb lib0 socket.io-client
npm install -D typescript
cd ../..
```

---

### Day 3: CI/CD + Linting + Vitest + Playwright Setup + Stitch Design Init

#### Tasks

| #    | Task                                                | Est. Time | Output                                       |
| ---- | --------------------------------------------------- | --------- | -------------------------------------------- |
| 3.1  | Configure Vitest in `apps/web`                      | 30 min    | `vitest.config.ts`, test helpers             |
| 3.2  | Configure Vitest in `apps/socket-server`            | 20 min    | `vitest.config.ts`                           |
| 3.3  | Set up Playwright                                   | 30 min    | `playwright.config.ts`, fixture files        |
| 3.4  | Create GitHub Actions CI workflow                   | 30 min    | `.github/workflows/ci.yml`                   |
| 3.5  | Create root `README.md`                             | 30 min    | Setup instructions                           |
| 3.6  | Create `docs/development.md`                        | 30 min    | Local dev guide                              |
| 3.7  | **Stitch MCP**: Create project + Generate DESIGN.md | 45 min    | `.stitch/DESIGN.md`, `.stitch/metadata.json` |
| 3.8  | **Stitch MCP**: Create SITE.md with roadmap         | 20 min    | `.stitch/SITE.md`                            |
| 3.9  | Run full CI checks locally                          | 15 min    | All green                                    |
| 3.10 | Git commit: "M1: Project foundation complete"       | 5 min     | Clean commit                                 |

**Day 3 Total: ~4.5 hours**

---

## 3. Detailed File Specifications

### 3.1 Root Configuration Files

#### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "lint": { "dependsOn": ["^build"] },
    "type-check": { "dependsOn": ["^build"] },
    "test": { "dependsOn": ["^build"] }
  }
}
```

#### `.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

#### `.eslintrc.cjs`

```javascript
module.exports = {
  root: true,
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: ['node_modules/', '.next/', 'dist/', 'coverage/'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

---

### 3.2 `apps/web/` — Next.js Configuration

#### `apps/web/next.config.ts`

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@collabdoc/database', '@collabdoc/shared', '@collabdoc/yjs-utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google avatars
    ],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
  ],
};

export default nextConfig;
```

#### `apps/web/src/app/globals.css` — Design Token System

```css
@import 'tailwindcss';

/* ─── DESIGN TOKENS ─── */
:root {
  /* Brand Colors — derived from Stitch DESIGN.md */
  --color-brand-primary: #6366f1; /* Indigo-500 */
  --color-brand-primary-hover: #4f46e5; /* Indigo-600 */
  --color-brand-secondary: #8b5cf6; /* Violet-500 */
  --color-brand-accent: #06b6d4; /* Cyan-500 */

  /* Neutrals */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-tertiary: #f1f5f9;
  --color-bg-inverse: #0f172a;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-tertiary: #94a3b8;
  --color-text-inverse: #f8fafc;
  --color-border-default: #e2e8f0;
  --color-border-hover: #cbd5e1;

  /* Semantic */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Spacing Scale (4px base) */
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 0.75rem; /* 12px */
  --space-4: 1rem; /* 16px */
  --space-5: 1.25rem; /* 20px */
  --space-6: 1.5rem; /* 24px */
  --space-8: 2rem; /* 32px */
  --space-10: 2.5rem; /* 40px */
  --space-12: 3rem; /* 48px */
  --space-16: 4rem; /* 64px */

  /* Typography */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);

  /* Radii */
  --radius-sm: 0.375rem; /* 6px */
  --radius-md: 0.5rem; /* 8px */
  --radius-lg: 0.75rem; /* 12px */
  --radius-xl: 1rem; /* 16px */
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);

  /* Z-Index Scale */
  --z-dropdown: 50;
  --z-sticky: 100;
  --z-modal: 200;
  --z-popover: 300;
  --z-toast: 400;
  --z-cursor: 500;
}

/* Dark Mode */
.dark {
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-bg-tertiary: #334155;
  --color-bg-inverse: #f8fafc;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-tertiary: #64748b;
  --color-text-inverse: #0f172a;
  --color-border-default: #334155;
  --color-border-hover: #475569;
}

/* ─── GLOBAL STYLES ─── */
body {
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* ─── COLLABORATION CURSOR STYLES ─── */
.collaboration-cursor__caret {
  position: relative;
  margin-left: -1px;
  margin-right: -1px;
  border-left: 2px solid;
  border-right: 0;
  word-break: normal;
  pointer-events: none;
}

.collaboration-cursor__label {
  position: absolute;
  top: -1.4em;
  left: -1px;
  font-size: 12px;
  font-weight: 600;
  line-height: normal;
  padding: 0.1rem 0.3rem;
  border-radius: 3px 3px 3px 0;
  color: white;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
}

/* ─── TIPTAP EDITOR STYLES ─── */
.tiptap {
  outline: none;
  min-height: 500px;
  padding: var(--space-8);
}

.tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--color-text-tertiary);
  pointer-events: none;
  height: 0;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-border-default);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-hover);
}
```

#### `apps/web/src/app/layout.tsx` — Root Layout

```tsx
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Collabdoc — Collaborative Document Editor',
    template: '%s | Collabdoc',
  },
  description:
    'Real-time collaborative document editing with conflict-free synchronization, live cursors, and version history.',
  keywords: ['collaborative editing', 'real-time', 'document editor', 'CRDT'],
  authors: [{ name: 'Collabdoc Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Collabdoc',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[var(--color-bg-primary)] antialiased">{children}</body>
    </html>
  );
}
```

---

### 3.3 `apps/socket-server/` — Socket.io Server Scaffold

#### `apps/socket-server/package.json`

```json
{
  "name": "@collabdoc/socket-server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsup src/index.ts --format cjs --dts",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "lint": "eslint src/"
  },
  "dependencies": {
    "socket.io": "^4.8.0",
    "express": "^5.0.0",
    "cors": "^2.8.5",
    "yjs": "^13.6.0",
    "y-protocols": "^1.0.6",
    "lib0": "^0.2.0",
    "pino": "^9.0.0",
    "pino-pretty": "^11.0.0",
    "jsonwebtoken": "^9.0.0",
    "@collabdoc/database": "workspace:*",
    "@collabdoc/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tsx": "^4.0.0",
    "tsup": "^8.0.0",
    "@types/node": "^22.0.0",
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.0",
    "@types/jsonwebtoken": "^9.0.0",
    "vitest": "^3.0.0"
  }
}
```

#### `apps/socket-server/src/index.ts` — Entry Point (Scaffold)

```typescript
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

const PORT = parseInt(process.env.PORT || '3001', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Express app for health checks
const app = express();
app.use(cors({ origin: CORS_ORIGIN }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// HTTP + Socket.io server
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e6, // 1 MB max message size
  pingTimeout: 60000,
  pingInterval: 25000,
});

// TODO: Phase 4 — Add auth middleware
// TODO: Phase 4 — Add room handlers
// TODO: Phase 4 — Add collaboration handlers
// TODO: Phase 5 — Add awareness handlers

io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Client connected');

  socket.on('disconnect', (reason) => {
    logger.info({ socketId: socket.id, reason }, 'Client disconnected');
  });
});

httpServer.listen(PORT, () => {
  logger.info({ port: PORT, cors: CORS_ORIGIN }, '🚀 Socket.io server running');
});

export { io, httpServer };
```

---

### 3.4 `packages/database/` — Prisma Package

#### `packages/database/package.json`

```json
{
  "name": "@collabdoc/database",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "type-check": "tsc --noEmit",
    "build": "echo 'No build needed'"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0"
  },
  "devDependencies": {
    "prisma": "^6.0.0",
    "typescript": "^5.5.0",
    "tsx": "^4.0.0"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

#### `packages/database/src/index.ts` — Prisma Client Singleton

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
export type { PrismaClient } from '@prisma/client';
```

---

### 3.5 `packages/shared/` — Shared Types & Validation

#### `packages/shared/package.json`

```json
{
  "name": "@collabdoc/shared",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "type-check": "tsc --noEmit",
    "build": "echo 'No build needed'",
    "test": "vitest run"
  },
  "dependencies": {
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^3.0.0"
  }
}
```

#### `packages/shared/src/constants.ts`

```typescript
// ─── Collaboration Colors (colorblind-friendly) ───
export const PRESENCE_COLORS = [
  '#E57373',
  '#F06292',
  '#BA68C8',
  '#9575CD',
  '#64B5F6',
  '#4FC3F7',
  '#4DB6AC',
  '#81C784',
  '#FFD54F',
  '#FFB74D',
  '#A1887F',
  '#90A4AE',
] as const;

// ─── Limits ───
export const MAX_DOCUMENT_TITLE_LENGTH = 255;
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_CONCURRENT_EDITORS = 20;
export const MAX_DOCUMENTS_PER_PAGE = 50;
export const AUTO_SAVE_DEBOUNCE_MS = 2000;
export const SNAPSHOT_INTERVAL_UPDATES = 100;
export const SNAPSHOT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
export const VERSION_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
export const ROOM_TEARDOWN_DELAY_MS = 30 * 1000; // 30 seconds
export const AWARENESS_THROTTLE_MS = 33; // ~30 Hz
export const MAX_SNAPSHOTS_PER_DOCUMENT = 50;
export const SHARE_TOKEN_BYTES = 32;
export const SESSION_MAX_AGE_DAYS = 30;
export const TYPING_INDICATOR_TIMEOUT_MS = 2000;

// ─── Roles ───
export const ROLES = {
  OWNER: 'OWNER',
  EDITOR: 'EDITOR',
  VIEWER: 'VIEWER',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];
```

#### `packages/shared/src/schemas/document.ts`

```typescript
import { z } from 'zod';
import { MAX_DOCUMENT_TITLE_LENGTH, MAX_DOCUMENTS_PER_PAGE } from '../constants';

export const createDocumentSchema = z.object({
  title: z.string().max(MAX_DOCUMENT_TITLE_LENGTH).optional(),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(MAX_DOCUMENT_TITLE_LENGTH).optional(),
  isStarred: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'TRASHED']).optional(),
});

export const listDocumentsSchema = z.object({
  status: z.enum(['ACTIVE', 'TRASHED']).default('ACTIVE'),
  starred: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['updated', 'created', 'title', 'accessed']).default('accessed'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(MAX_DOCUMENTS_PER_PAGE).default(20),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ListDocumentsInput = z.infer<typeof listDocumentsSchema>;
```

#### `packages/shared/src/permissions.ts`

```typescript
import type { Role } from './constants';

const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 3,
  EDITOR: 2,
  VIEWER: 1,
};

export function hasMinRole(userRole: string | null | undefined, requiredRole: Role): boolean {
  if (!userRole) return false;
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 999);
}

export function canViewDocument(role: string | null): boolean {
  return hasMinRole(role, 'VIEWER');
}

export function canEditDocument(role: string | null): boolean {
  return hasMinRole(role, 'EDITOR');
}

export function canDeleteDocument(role: string | null): boolean {
  return hasMinRole(role, 'OWNER');
}

export function canShareDocument(role: string | null): boolean {
  return hasMinRole(role, 'OWNER');
}

export function canRenameDocument(role: string | null): boolean {
  return hasMinRole(role, 'OWNER');
}

export function canManageCollaborators(role: string | null): boolean {
  return hasMinRole(role, 'OWNER');
}

export function canRestoreVersion(role: string | null): boolean {
  return hasMinRole(role, 'EDITOR');
}
```

#### `packages/shared/src/index.ts`

```typescript
export * from './constants';
export * from './permissions';
export * from './schemas/document';
// Additional schemas added in later phases:
// export * from './schemas/sharing';
// export * from './schemas/version';
// export * from './schemas/user';
```

---

## 4. Database Schema

Complete Prisma schema — see PRD Section 9.2 for the full annotated version. The schema is written to `packages/database/prisma/schema.prisma`.

**Tables created in this phase:**

| Table                 | Columns                                                                        | Purpose                      |
| --------------------- | ------------------------------------------------------------------------------ | ---------------------------- |
| `users`               | id, email, name, avatar_url, email_verified, created_at, updated_at            | User profiles                |
| `accounts`            | id, user_id, type, provider, provider_account_id, tokens...                    | OAuth accounts (Auth.js)     |
| `sessions`            | id, session_token, user_id, expires                                            | DB sessions (Auth.js)        |
| `verification_tokens` | identifier, token, expires                                                     | Email verification (Auth.js) |
| `documents`           | id, owner_id, title, status, is_starred, word_count, timestamps                | Documents                    |
| `collaborators`       | id, document_id, user_id, role, invited_by, timestamps                         | Document access              |
| `document_versions`   | id, document_id, created_by, version_num, yjs_snapshot, plain_text, timestamps | Version history              |
| `document_snapshots`  | id, document_id, yjs_state, state_vector, byte_size, created_at                | Internal persistence         |
| `share_links`         | id, document_id, created_by, token_hash, permission, is_active, expires_at     | Share links                  |
| `activity_logs`       | id, document_id, user_id, action, metadata, ip_address, created_at             | Audit trail                  |

**Key indexes:**

- `documents(owner_id, status)` — user's active documents
- `documents(owner_id, is_starred)` — starred documents
- `documents(owner_id, last_accessed_at)` — recent documents
- `collaborators(document_id, user_id)` — unique constraint
- `collaborators(user_id)` — user's collaborations
- `document_snapshots(document_id, created_at)` — latest snapshot
- `document_versions(document_id, created_at)` — version history
- `share_links(token_hash)` — unique, for validation
- `activity_logs(document_id, created_at)` — activity feed

---

## 5. Stitch MCP — Design System Setup

### Step 1: Create Stitch Project

```
Use Stitch MCP tools to:
1. Call create_project with:
   - title: "Collabdoc"
   - deviceType: "DESKTOP"
   - designTheme:
       colorMode: "LIGHT"
       font: "INTER"
       roundness: "ROUND_EIGHT"
       customColor: "#6366f1"   (Indigo-500 — our brand primary)
       saturation: 3
2. Call get_project to retrieve full metadata
3. Save to .stitch/metadata.json
```

### Step 2: Generate Landing Page Screen

```
Prompt for Stitch:
"A modern SaaS landing page for 'Collabdoc', a collaborative document editor.
Hero section with headline 'Write together, in real time' and subline
'Conflict-free collaborative editing with live cursors, version history,
and instant sync.' A CTA button 'Get Started Free'. Below: 3-column feature
grid showing 'Real-time Collaboration', 'Version History', 'Share & Permissions'.
Clean, professional design. White background, indigo accent color."
```

### Step 3: Generate DESIGN.md

Use the `design-md` skill to analyze the generated landing page screen and create `.stitch/DESIGN.md` with:

- Visual theme & atmosphere
- Color palette & roles
- Typography rules
- Component stylings
- Layout principles

### Step 4: Create SITE.md

```markdown
# Collabdoc — Site Vision

## Project ID

[from .stitch/metadata.json]

## Vision

A modern collaborative document editor with real-time sync.

## Sitemap

- [x] Landing Page (index)
- [ ] Sign-In Page
- [ ] Dashboard
- [ ] Editor Page
- [ ] Share Dialog
- [ ] Version History Panel
- [ ] Settings Page
- [ ] Trash Page

## Roadmap

1. Sign-In Page (Phase 2)
2. Dashboard (Phase 3)
3. Editor Page (Phase 4)
4. Presence UI Components (Phase 6)
5. Version History Panel (Phase 8)
6. Share Dialog (Phase 9)
```

---

## 6. Environment Variables

### `apps/web/.env.example`

```env
# ─── Database ───
DATABASE_URL="postgresql://collabdoc:collabdoc_dev_password@localhost:5432/collabdoc?schema=public"

# ─── Auth.js ───
AUTH_SECRET="generate-with-npx-auth-secret"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
AUTH_URL="http://localhost:3000"

# ─── Socket.io Server ───
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"
SOCKET_AUTH_SECRET="shared-jwt-secret-for-socket-auth"

# ─── Sentry (Phase 9) ───
SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""

# ─── App ───
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### `apps/socket-server/.env.example`

```env
# ─── Server ───
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug

# ─── CORS ───
CORS_ORIGIN="http://localhost:3000"

# ─── Database ───
DATABASE_URL="postgresql://collabdoc:collabdoc_dev_password@localhost:5432/collabdoc?schema=public"

# ─── Auth ───
SOCKET_AUTH_SECRET="shared-jwt-secret-for-socket-auth"

# ─── Redis (Phase 10 — scaling) ───
# REDIS_URL="redis://localhost:6379"

# ─── Sentry (Phase 9) ───
# SENTRY_DSN=""
```

---

## 7. Testing Requirements

### Phase 1 Tests (minimal — validate infrastructure)

| Test                                 | File                                             | Type        |
| ------------------------------------ | ------------------------------------------------ | ----------- |
| Prisma client connects to PostgreSQL | `packages/database/__tests__/connection.test.ts` | Integration |
| Shared constants are exported        | `packages/shared/__tests__/constants.test.ts`    | Unit        |
| Permission helpers work              | `packages/shared/__tests__/permissions.test.ts`  | Unit        |
| Zod schemas validate correctly       | `packages/shared/__tests__/schemas.test.ts`      | Unit        |
| Socket server health endpoint        | `apps/socket-server/__tests__/health.test.ts`    | Integration |

**Target: 10–15 tests passing**

---

## 8. Acceptance Criteria

| #   | Criterion                                            | Verification                         |
| --- | ---------------------------------------------------- | ------------------------------------ |
| 1   | `npm install` completes without errors               | Run command                          |
| 2   | `docker compose up -d` starts PostgreSQL on `:5432`  | `docker compose ps`                  |
| 3   | `npm run db:migrate` creates all 10 tables           | `npx prisma studio`                  |
| 4   | `npm run db:seed` populates test data                | Query `users` table                  |
| 5   | `npm run dev` starts Next.js on `:3000`              | Visit `http://localhost:3000`        |
| 6   | `npm run dev` starts Socket.io on `:3001`            | Visit `http://localhost:3001/health` |
| 7   | `npm run lint` passes with 0 errors                  | Run command                          |
| 8   | `npm run type-check` passes with 0 errors            | Run command                          |
| 9   | `npm run test` passes all Phase 1 tests              | Run command                          |
| 10  | `.stitch/DESIGN.md` exists with design system tokens | File inspection                      |
| 11  | `.stitch/metadata.json` has valid Stitch project ID  | File inspection                      |
| 12  | shadcn/ui button component renders correctly         | Visual check                         |
| 13  | Git commit is clean with proper `.gitignore`         | `git status`                         |

---

## 9. Risk Register

| Risk                                       | Likelihood | Impact | Mitigation                                                      |
| ------------------------------------------ | ---------- | ------ | --------------------------------------------------------------- |
| Turborepo version conflict with Next.js 16 | LOW        | HIGH   | Pin Turborepo version; test `turbo dev` early                   |
| Docker PostgreSQL port conflict on `:5432` | MEDIUM     | LOW    | Use `5433` as fallback; document in setup guide                 |
| Prisma migration failure on complex schema | LOW        | MEDIUM | Test each table independently; use `db push` for iteration      |
| shadcn/ui incompatibility with Tailwind v4 | LOW        | MEDIUM | Follow shadcn/ui docs for Tailwind v4; test immediately         |
| Stitch MCP server unavailable              | MEDIUM     | LOW    | Fallback: skip design generation; use placeholder UI            |
| npm workspace resolution issues            | MEDIUM     | MEDIUM | Use explicit `workspace:*` protocol; test cross-package imports |
