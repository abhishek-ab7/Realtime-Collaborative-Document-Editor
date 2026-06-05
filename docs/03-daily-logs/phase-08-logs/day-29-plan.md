## Day 29 Plan

**Task:** Phase 8 - Automatic Version Creation (Server)
**Phase:** [[02-phases/phase-08-version-history|Phase 08]]

**Files:**

- Modify: `packages/database/prisma/schema.prisma`
- Create: `apps/socket-server/src/rooms/version-manager.ts`
- Modify: `apps/socket-server/src/rooms/room-manager.ts`
- Create: `apps/socket-server/__tests__/version-manager.test.ts`

**Order:**

1. Update database schema with `wordCount` and `trigger` in `DocumentVersion`.
2. Generate Prisma client.
3. Implement `VersionManager` with 30-minute auto-save and manual snapshot methods.
4. Integrate `VersionManager` inside `RoomManager` (start timer on room init, snapshot on teardown).
5. Write unit tests for `VersionManager`.

**Acceptance Criteria:**

- [ ] TypeScript: 0 errors
- [ ] Tests: all pass
- [ ] Schema successfully pushed to database
- [ ] Auto-version created every 30 minutes of activity or on room teardown.
