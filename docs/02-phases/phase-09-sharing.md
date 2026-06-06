# Phase 09 — Sharing & Permissions

**Duration:** Days 34–39 (6 days)  
**Status:** ✓ COMPLETE

## Deliverables

- ✓ Share dialog UI
- ✓ Add collaborator by email
- ✓ Remove collaborator
- ✓ Change collaborator role
- ✓ Share link generation (view/edit)
- ✓ Share link access (anonymous viewing/editing)
- ✓ Permission enforcement on all API routes
- ✓ Permission enforcement on Socket.io events
- ✓ Permission enforcement in UI (disable edit for viewers)
- ✓ Activity log recording for all sharing actions

## Files to Create/Modify

**Created:**

- `apps/web/src/features/sharing/components/collaborator-list.tsx`
- `apps/web/src/features/sharing/components/invite-form.tsx`
- `apps/web/src/features/sharing/components/share-dialog.tsx`
- `apps/web/src/features/sharing/components/share-link-manager.tsx`
- `apps/web/src/features/sharing/hooks/use-collaborators.ts`
- `apps/web/src/features/sharing/hooks/use-share-link.ts`
- `apps/web/src/lib/permissions.ts`
- `apps/web/src/lib/share-token.ts`
- `apps/web/src/app/api/documents/[id]/collaborators/route.ts`
- `apps/web/src/app/api/documents/[id]/collaborators/[userId]/route.ts`
- `apps/web/src/app/api/documents/[id]/share/link/route.ts`
- `apps/web/src/app/share/[token]/page.tsx`
- `apps/web/src/features/sharing/__tests__/collaborator-list.test.tsx`
- `apps/web/src/features/sharing/__tests__/collaborators-api.test.ts`
- `apps/web/src/features/sharing/__tests__/invite-form.test.tsx`
- `apps/web/src/features/sharing/__tests__/permission-matrix.test.ts`
- `apps/web/src/features/sharing/__tests__/share-dialog.test.tsx`
- `apps/web/src/features/sharing/__tests__/share-link-api.test.ts`
- `apps/web/src/features/sharing/__tests__/share-link-manager.test.tsx`

**Modified:**

- `apps/web/src/app/(app)/d/[documentId]/document-editor-client.tsx`
- `apps/web/src/app/(app)/d/[documentId]/page.tsx`
- `apps/web/src/app/api/documents/[id]/route.ts`
- `apps/web/src/features/editor/components/editor-header.tsx`
- `apps/socket-server/src/handlers/room.ts`
- `apps/socket-server/src/handlers/collaboration.ts`

## Implementation Order

1. **Step 1:** Define permission rules and RBAC middleware checks → Files: `apps/web/src/lib/permissions.ts`
2. **Step 2:** Write JWT-based invite token generation and verification → Files: `apps/web/src/lib/share-token.ts` and `/api/documents/[id]/share/link/route.ts`
3. **Step 3:** Implement collaborators API routes and role updates → Files: `/api/documents/[id]/collaborators/route.ts`
4. **Step 4:** Build the Share Dialog UI and connect hooks → Files: `apps/web/src/features/sharing/components/share-dialog.tsx`

## Acceptance Criteria

- ✓ All files from "Files to Create/Modify" exist
- ✓ TypeScript strict mode passes (0 errors)
- ✓ All tests for this phase pass
- ✓ Code follows patterns from [[05-reference-code/prisma-patterns|Prisma Patterns]]
- ✓ Unauthorized request calls return `403 Forbidden` errors

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
