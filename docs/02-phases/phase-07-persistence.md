# Phase 07 — Persistence & Offline Support

**Duration:** Days 25–28 (4 days)  
**Status:** Not Started

## Deliverables

- [ ] Debounced auto-save (2-second debounce)
- [ ] Yjs snapshot storage in PostgreSQL (BYTEA)
- [ ] Document loading from snapshot
- [ ] IndexedDB local persistence (`y-indexeddb`)
- [ ] Offline editing + merge on reconnect
- [ ] Save status indicator (Saving... → Saved → Offline)
- [ ] Recovery after browser crash / refresh
- [ ] Room teardown → final persist on last user leave

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

- [ ] All files from "Files to Create/Modify" exist
- [ ] TypeScript strict mode passes (0 errors)
- [ ] All tests for this phase pass
- [ ] Code follows patterns from [[05-reference-code/prisma-patterns|Prisma Patterns]]
- [ ] Zero data loss on disconnection and reconnection sequences

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
