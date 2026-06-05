# Phase 08 — Version History

**Duration:** Days 29–33 (5 days)  
**Status:** Not Started

## Deliverables

- [ ] Automatic version creation (every 30 min of editing, on room empty)
- [ ] Version history panel (sidebar)
- [ ] Version preview (read-only render)
- [ ] Version restore with confirmation dialog
- [ ] Backup-before-restore mechanism
- [ ] Diff view between two versions (Myers diff)
- [ ] Editor attribution on versions
- [ ] Snapshot garbage collection (keep last 50)

## Files to Create/Modify

**Create:**

- `apps/web/src/features/versions/components/VersionHistory.tsx`
- `apps/web/src/features/versions/components/DiffViewer.tsx`
- `apps/web/src/app/api/documents/[id]/versions/route.ts`

**Modify:**

- `packages/database/prisma/schema.prisma` (Version history tables)
- `apps/web/src/features/editor/components/Editor.tsx`

## Implementation Order

1. **Step 1:** Establish snapshot database models → Files: `packages/database/prisma/schema.prisma`
2. **Step 2:** Write Myers diff visual text comparisons → Files: `apps/web/src/features/versions/components/DiffViewer.tsx`
3. **Step 3:** Implement sidebar toggle list and restore flows → Files: `apps/web/src/features/versions/components/VersionHistory.tsx`

## Acceptance Criteria

- [ ] All files from "Files to Create/Modify" exist
- [ ] TypeScript strict mode passes (0 errors)
- [ ] All tests for this phase pass
- [ ] Code follows patterns from [[05-reference-code/yjs-patterns|Yjs Patterns]]
- [ ] Reverts restore vectors correctly with backups

## Dependencies

- Depends on: [[02-phases/phase-07-persistence|Phase 07 — Persistence & Offline Support]]
- Enables: [[02-phases/phase-09-sharing|Phase 09 — Sharing & Permissions]]

## Potential Issues & Mitigations

| Issue                               | Mitigation                                                     |
| ----------------------------------- | -------------------------------------------------------------- |
| Diff computation CPU overhead       | Compute plain text differences on-the-fly; cache summaries     |
| Restores conflict with active edits | Broadcast reload updates vector messages to all active clients |

## Architecture References

- [[04-architecture/system-design|System Design]]
- [[04-architecture/crdt-design|CRDT Design]]
- [[05-reference-code/yjs-patterns|Yjs Patterns]]
