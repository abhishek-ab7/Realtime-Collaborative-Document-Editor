# Phase 09 — Sharing & Permissions

**Duration:** Days 34–39 (6 days)  
**Status:** Not Started

## Deliverables

- [ ] Share dialog UI
- [ ] Add collaborator by email
- [ ] Remove collaborator
- [ ] Change collaborator role
- [ ] Share link generation (view/edit)
- [ ] Share link access (anonymous viewing/editing)
- [ ] Permission enforcement on all API routes
- [ ] Permission enforcement on Socket.io events
- [ ] Permission enforcement in UI (disable edit for viewers)
- [ ] Activity log recording for all sharing actions

## Files to Create/Modify

**Create:**

- `apps/web/src/features/sharing/components/ShareDialog.tsx`
- `apps/web/src/features/sharing/hooks/use-permissions.ts`
- `packages/shared/src/permissions.ts`

**Modify:**

- `apps/web/src/app/api/documents/[id]/share/route.ts`
- `apps/socket-server/src/middleware/auth.ts`

## Implementation Order

1. **Step 1:** Define permission rules and RBAC middleware checks → Files: `packages/shared/src/permissions.ts`
2. **Step 2:** Write token hashing routes and guards → Files: `apps/web/src/app/api/documents/[id]/share/route.ts`
3. **Step 3:** Implement sharing forms and access status toggles → Files: `apps/web/src/features/sharing/components/ShareDialog.tsx`

## Acceptance Criteria

- [ ] All files from "Files to Create/Modify" exist
- [ ] TypeScript strict mode passes (0 errors)
- [ ] All tests for this phase pass
- [ ] Code follows patterns from [[05-reference-code/prisma-patterns|Prisma Patterns]]
- [ ] Unauthorized request calls return `403 Forbidden` errors

## Dependencies

- Depends on: [[02-phases/phase-08-versions|Phase 08 — Version History]]
- Enables: [[02-phases/phase-10-deploy|Phase 10 — Testing, Observability & Deployment]]

## Potential Issues & Mitigations

| Issue                            | Mitigation                                                      |
| -------------------------------- | --------------------------------------------------------------- |
| direct ws URL connections bypass | Perform permission check during the initial websocket handshake |
| Link leak security threat        | Hashed token storage; support link expiration bounds            |

## Architecture References

- [[04-architecture/system-design|System Design]]
- [[04-architecture/security-model|Security Model]]
- [[05-reference-code/prisma-patterns|Prisma Patterns]]
