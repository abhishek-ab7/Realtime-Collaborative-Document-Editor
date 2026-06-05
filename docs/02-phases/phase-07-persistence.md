# Phase 07 — Persistence & Offline Support

**Duration:** Days 25–28 (4 days)  
**Status:** Complete

## Deliverables

- [x] Debounced auto-save (2-second debounce)
- [x] Yjs snapshot storage in PostgreSQL (BYTEA)
- [x] Document loading from snapshot
- [x] IndexedDB local persistence (`y-indexeddb`)
- [x] Offline editing + merge on reconnect
- [x] Save status indicator (Saving... → Saved → Offline)
- [x] Recovery after browser crash / refresh
- [x] Room teardown → final persist on last user leave

## Files to Create/Modify

**Create:**

- `apps/socket-server/src/handlers/persistence.ts`
- `apps/web/src/features/collaboration/components/SaveStatus.tsx`

**Modify:**

- `packages/database/prisma/schema.prisma` (Add snapshot tables)
- `apps/socket-server/src/rooms/room-manager.ts`

## Implementation Order

1. **Step 1:** Setup client-side local database buffer → Files: `apps/web/src/features/editor/components/Editor.tsx`
2. **Step 2:** Write server debounced commit loops → Files: `apps/socket-server/src/handlers/persistence.ts`
3. **Step 3:** Setup status header layout elements → Files: `apps/web/src/features/collaboration/components/SaveStatus.tsx`

## Acceptance Criteria

- [x] All files from "Files to Create/Modify" exist
- [x] TypeScript strict mode passes (0 errors)
- [x] All tests for this phase pass
- [x] Code follows patterns from [[05-reference-code/prisma-patterns|Prisma Patterns]]
- [x] Zero data loss on disconnection and reconnection sequences

## Dependencies

- Depends on: [[02-phases/phase-06-presence|Phase 06 — Live Presence & Cursors]]
- Enables: [[02-phases/phase-08-versions|Phase 08 — Version History]]

## Potential Issues & Mitigations

| Issue                           | Mitigation                                                   |
| ------------------------------- | ------------------------------------------------------------ |
| Concurrent db write locks       | Implement a debounced server-side save mechanism (2 seconds) |
| Database connection pool limits | Enable connection pooling using PgBouncer/Prisma proxy       |

## Architecture References

- [[04-architecture/system-design|System Design]]
- [[04-architecture/database-schema|Database Schema]]
- [[05-reference-code/prisma-patterns|Prisma Patterns]]
