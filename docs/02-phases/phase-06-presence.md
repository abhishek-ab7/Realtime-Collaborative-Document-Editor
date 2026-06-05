# Phase 06 — Live Presence & Cursors

**Duration:** Days 22–24 (3 days)  
**Status:** ✓ COMPLETE

## Deliverables

- [x] Yjs Awareness API integrated
- [x] Online user avatars shown in editor header
- [x] Remote cursors rendered in editor with user name labels
- [x] User color assignment (deterministic, colorblind-friendly)
- [x] Typing indicators
- [x] Join/leave notifications (toast)
- [x] Cursor position throttling (30 Hz max)

## Files to Create/Modify

**Create:**

- `apps/web/src/features/collaboration/components/presence-avatars.tsx`
- `apps/web/src/features/collaboration/components/typing-indicator.tsx`
- `apps/web/src/features/collaboration/hooks/use-presence.ts`

**Modify:**

- `apps/socket-server/src/handlers/awareness.ts`
- `apps/socket-server/src/handlers/room.ts`
- `apps/web/src/app/(app)/d/[documentId]/document-editor-client.tsx`
- `apps/web/src/app/(app)/d/[documentId]/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/features/collaboration/providers/collaboration-provider.tsx`
- `apps/web/src/features/editor/components/editor-header.tsx`
- `apps/web/src/features/editor/hooks/use-editor.ts`

## Implementation Order

1. **Step 1:** Integrate Yjs Awareness API mappings → Files: `apps/web/src/features/collaboration/hooks/use-presence.ts`
2. **Step 2:** Capture caret positions and layout cursor markers → Files: `apps/web/src/app/globals.css`
3. **Step 3:** Implement color hashes and typing signals → Files: `apps/web/src/features/collaboration/components/presence-avatars.tsx`

## Acceptance Criteria

- [x] All files from "Files to Create/Modify" exist
- [x] TypeScript strict mode passes (0 errors)
- [x] All tests for this phase pass
- [x] Code follows patterns from [[05-reference-code/yjs-patterns|Yjs Patterns]]
- [x] Presence caret positions update smoothly (30 Hz)

## Dependencies

- Depends on: [[02-phases/phase-05-realtime|Phase 05 — Realtime Collaboration Engine]]
- Enables: [[02-phases/phase-07-persistence|Phase 07 — Persistence & Offline Support]]

## Potential Issues & Mitigations

| Issue                                   | Mitigation                                                |
| --------------------------------------- | --------------------------------------------------------- |
| High bandwidth use from cursor tracking | Implement throttling on cursor movements (30 Hz maximum)  |
| Colors collision between users          | Fallback shift hash index if duplicate exists in the room |

## Architecture References

- [[04-architecture/system-design|System Design]]
- [[04-architecture/crdt-design|CRDT Design]]
- [[05-reference-code/yjs-patterns|Yjs Patterns]]
