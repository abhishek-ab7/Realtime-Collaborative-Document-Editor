# Collabdoc — Master Implementation Plan Index

> **Project:** Realtime Collaborative Document Editor  
> **Total Phases:** 10  
> **Total Estimated Days:** 49  
> **Source PRD:** [PRD.md](../PRD.md)

---

## Phase Index

| Phase | Title                               | Days  | Status         | File                                       |
| ----- | ----------------------------------- | ----- | -------------- | ------------------------------------------ |
| 01    | Project Foundation & Infrastructure | 1–3   | ✅ Complete    | [Phase-01](./01-FOUNDATION.md)             |
| 02    | Authentication & Session Management | 4–7   | ⬜ Not Started | [Phase-02](./02-AUTHENTICATION.md)         |
| 03    | Document Management & Dashboard     | 8–11  | ⬜ Not Started | [Phase-03](./03-DOCUMENT-MANAGEMENT.md)    |
| 04    | Rich Text Editor (TipTap)           | 12–14 | ⬜ Not Started | [Phase-04](./04-EDITOR.md)                 |
| 05    | Realtime Collaboration Engine       | 15–21 | ⬜ Not Started | [Phase-05](./05-REALTIME-COLLABORATION.md) |
| 06    | Live Presence & Cursors             | 22–24 | ⬜ Not Started | [Phase-06](./06-PRESENCE.md)               |
| 07    | Persistence & Offline Support       | 25–28 | ⬜ Not Started | [Phase-07](./07-PERSISTENCE.md)            |
| 08    | Version History                     | 29–33 | ⬜ Not Started | [Phase-08](./08-VERSION-HISTORY.md)        |
| 09    | Sharing & Permissions               | 34–39 | ⬜ Not Started | [Phase-09](./09-SHARING-PERMISSIONS.md)    |
| 10    | Testing, Observability & Deployment | 40–49 | ⬜ Not Started | [Phase-10](./10-TESTING-DEPLOYMENT.md)     |

---

## Architecture Overview

```
collabdoc/                            (Turborepo Monorepo)
├── apps/
│   ├── web/                          (Next.js 16 — Vercel)
│   │   ├── src/
│   │   │   ├── app/                  (App Router pages + API routes)
│   │   │   ├── features/             (Feature modules)
│   │   │   │   ├── auth/
│   │   │   │   ├── documents/
│   │   │   │   ├── editor/
│   │   │   │   ├── collaboration/
│   │   │   │   ├── versions/
│   │   │   │   └── sharing/
│   │   │   ├── components/           (Shared UI — shadcn/ui)
│   │   │   ├── hooks/                (Global hooks)
│   │   │   ├── lib/                  (Utilities)
│   │   │   └── types/                (TypeScript types)
│   │   └── .stitch/                  (Stitch MCP design assets)
│   │       ├── DESIGN.md
│   │       ├── SITE.md
│   │       ├── metadata.json
│   │       └── designs/
│   │
│   └── socket-server/                (Socket.io — Railway/Render)
│       └── src/
│           ├── index.ts
│           ├── middleware/
│           ├── rooms/
│           ├── handlers/
│           └── lib/
│
├── packages/
│   ├── database/                     (Prisma schema + client)
│   ├── shared/                       (Types, Zod, permissions)
│   └── yjs-utils/                    (Yjs provider, encoding)
│
├── tests/
│   ├── e2e/                          (Playwright)
│   └── load/                         (k6)
│
├── .github/workflows/               (CI/CD)
├── docker-compose.yml                (Local PostgreSQL)
└── turbo.json                        (Monorepo config)
```

---

## Design System — Stitch MCP Integration

All UI pages and components are designed using **Stitch MCP** before implementation:

1. **Phase 1**: Create Stitch project, generate DESIGN.md with design tokens
2. **Phase 2**: Generate sign-in page design via Stitch
3. **Phase 3**: Generate dashboard, document card, and trash page designs
4. **Phase 4**: Generate editor toolbar and editor page designs
5. **Phase 6**: Generate presence UI (avatars, cursors) designs
6. **Phase 8**: Generate version history panel design
7. **Phase 9**: Generate share dialog design

Each Stitch-generated design is saved as `.stitch/designs/{page}.html` + `.stitch/designs/{page}.png`, then used as pixel-perfect reference during implementation.

---

## Dependency Graph

```
Phase 01 ──────────────┬──────────────────────────────┐
(Foundation)           │                              │
                       ▼                              ▼
                Phase 02                        Phase 03
                (Auth)                          (Documents)
                       │                              │
                       └──────────┬───────────────────┘
                                  ▼
                            Phase 04
                            (Editor)
                                  │
                                  ▼
                            Phase 05
                            (Realtime)
                              │     │
                              ▼     ▼
                        Phase 06  Phase 07
                        (Presence)(Persist)
                              │     │
                              └──┬──┘
                                 ▼
                           Phase 08
                           (Versions)
                                 │
                                 ▼
                           Phase 09
                           (Sharing)
                                 │
                                 ▼
                           Phase 10
                           (Deploy)
```

---

## Tech Stack Quick Reference

| Category      | Technology             | Version |
| ------------- | ---------------------- | ------- |
| Frontend      | Next.js                | 16.2+   |
| UI            | React                  | 19      |
| Language      | TypeScript             | 5.5+    |
| Styling       | Tailwind CSS           | 4.x     |
| Components    | shadcn/ui              | latest  |
| Editor        | TipTap                 | 2.x     |
| CRDT          | Yjs                    | 13.x    |
| Realtime      | Socket.io              | 4.x     |
| Database      | PostgreSQL             | 16+     |
| ORM           | Prisma                 | 6.x     |
| Auth          | Auth.js                | 5.x     |
| Design        | Stitch MCP             | latest  |
| Testing       | Vitest + Playwright    | latest  |
| Observability | Sentry + OpenTelemetry | latest  |
