# Phase 06 — Live Presence & Cursors

**Duration:** Days 22–24 (3 days)  
**Status:** Not Started

## Deliverables

- [ ] Yjs Awareness API integrated
- [ ] Online user avatars shown in editor header
- [ ] Remote cursors rendered in editor with user name labels
- [ ] User color assignment (deterministic, colorblind-friendly)
- [ ] Typing indicators
- [ ] Join/leave notifications (toast)
- [ ] Cursor position throttling (30 Hz max)

## Files to Create/Modify

**Create:**

- `apps/web/src/features/collaboration/components/AvatarStack.tsx`
- `apps/web/src/features/collaboration/hooks/use-awareness.ts`
- `apps/web/src/features/collaboration/styles/cursors.css`

**Modify:**

- `apps/socket-server/src/handlers/sync.ts`
- `apps/web/src/features/editor/components/Editor.tsx`

## Implementation Order

1. **Step 1:** Integrate Yjs Awareness API mappings → Files: `apps/web/src/features/collaboration/hooks/use-awareness.ts`
2. **Step 2:** Capture caret positions and layout cursor markers → Files: `apps/web/src/features/collaboration/styles/cursors.css`
3. **Step 3:** Implement color hashes and typing signals → Files: `apps/web/src/features/collaboration/components/AvatarStack.tsx`

## Acceptance Criteria

- [ ] All files from "Files to Create/Modify" exist
- [ ] TypeScript strict mode passes (0 errors)
- [ ] All tests for this phase pass
- [ ] Code follows patterns from [[05-reference-code/yjs-patterns|Yjs Patterns]]
- [ ] Presence caret positions update smoothly (30 Hz)

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
