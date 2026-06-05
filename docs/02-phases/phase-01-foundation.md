# Phase 01 — Foundation & Infrastructure

**Duration:** Days 1–3 (3 days)  
**Status:** Complete

## Deliverables

- [x] Next.js 16 project initialized with TypeScript strict mode
- [x] Tailwind CSS + shadcn/ui configured
- [x] PostgreSQL running locally (Docker Compose)
- [x] Prisma schema created and initial migration applied
- [x] Project structure scaffolded (all folders)
- [x] ESLint, Prettier, Husky pre-commit hooks
- [x] Vitest and Playwright configured
- [x] CI pipeline (GitHub Actions): lint + type-check + test
- [x] Environment variable management (.env.example)

## Files to Create/Modify

**Create:**

- `turbo.json`
- `docker-compose.yml`
- `packages/database/prisma/schema.prisma`
- `packages/database/src/index.ts`
- `packages/shared/src/constants.ts`
- `packages/shared/src/schemas/document.ts`
- `packages/shared/src/permissions.ts`
- `apps/web/next.config.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/app/layout.tsx`
- `apps/socket-server/package.json`
- `apps/socket-server/src/index.ts`

**Modify:**

- `package.json` (root workspace definitions)
- `.gitignore` (ignore database credentials and cache)

## Implementation Order

1. **Step 1:** Initialize Turborepo layout and root configs → Files: `turbo.json`, `package.json`
2. **Step 2:** Next.js application core setup and token styling → Files: `apps/web/`
3. **Step 3:** Prisma database client setup and Docker integration → Files: `packages/database/`, `docker-compose.yml`

## Acceptance Criteria

- [x] All files from "Files to Create/Modify" exist
- [x] TypeScript strict mode passes (0 errors)
- [x] All tests for this phase pass
- [x] Code follows patterns from [[05-reference-code/next-js-patterns|Next.js Patterns]]
- [x] `npm run dev` starts correctly on port 3000

## Dependencies

- Depends on: None
- Enables: [[02-phases/phase-02-authentication|Phase 02 — Authentication & Session Management]]

## Potential Issues & Mitigations

| Issue                      | Mitigation                                                   |
| -------------------------- | ------------------------------------------------------------ |
| Docker connection failures | Double check port bindings and credentials matches in .env   |
| Next.js v16 route changes  | Strictly use directory structures specified in documentation |

## Architecture References

- [[04-architecture/system-design|System Design]]
- [[04-architecture/database-schema|Database Schema]]
- [[05-reference-code/next-js-patterns|Next.js Patterns]]
