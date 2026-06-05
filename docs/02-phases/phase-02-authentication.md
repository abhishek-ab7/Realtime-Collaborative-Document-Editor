# Phase 02 — Authentication & Session Management

**Duration:** Days 4–7 (4 days)  
**Status:** Complete

## Deliverables

- [x] Supabase Auth configured (Migrated from NextAuth v5)
- [x] Sign-in page with Google and email login
- [x] Session persistence (Supabase cookie session)
- [x] Auth middleware protecting `/app/*` routes
- [x] User profile page (name, avatar, user menu)
- [x] Sign-out functionality
- [x] Auth guard component for protected routes

## Files to Create/Modify

**Create:**

- `apps/web/src/lib/auth.ts`
- `apps/web/src/app/api/auth/[...nextauth]/route.ts`
- `apps/web/src/middleware.ts`
- `apps/web/src/features/auth/components/sign-in-button.tsx`
- `apps/web/src/features/auth/components/user-menu.tsx`
- `apps/web/src/features/auth/hooks/use-session.ts`
- `apps/web/src/app/(auth)/signin/page.tsx`
- `apps/socket-server/src/middleware/auth.ts`

**Modify:**

- `packages/database/prisma/schema.prisma` (Add session relations)
- `apps/web/package.json`

## Implementation Order

1. **Step 1:** Configure Auth.js library handlers and adapter → Files: `apps/web/src/lib/auth.ts`
2. **Step 2:** Write Next.js middleware router protection layer → Files: `apps/web/src/middleware.ts`
3. **Step 3:** Implement styling components and signin page → Files: `apps/web/src/app/(auth)/signin/page.tsx`

## Acceptance Criteria

- [x] All files from "Files to Create/Modify" exist
- [x] TypeScript strict mode passes (0 errors)
- [x] All tests for this phase pass
- [x] Code follows patterns from [[05-reference-code/next-js-patterns|Next.js Patterns]]
- [x] Unauthenticated requests redirect to `/signin`

## Dependencies

- Depends on: [[02-phases/phase-01-foundation|Phase 01 — Foundation & Infrastructure]]
- Enables: [[02-phases/phase-03-documents|Phase 03 — Document Management & Dashboard]]

## Potential Issues & Mitigations

| Issue                                 | Mitigation                                          |
| ------------------------------------- | --------------------------------------------------- |
| Google OAuth credential leak          | Store credentials strictly in environment variables |
| Auth.js session cookie flags mismatch | Enable secure cookie flags only for HTTPS targets   |

## Architecture References

- [[04-architecture/system-design|System Design]]
- [[04-architecture/auth-flow|Auth Flow]]
- [[05-reference-code/next-js-patterns|Next.js Patterns]]
