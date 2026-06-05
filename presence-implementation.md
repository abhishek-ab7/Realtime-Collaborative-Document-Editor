# Presence Implementation Plan (Phase 06)

**Goal:** Implement Live Presence, stacked user avatars, remote cursors, typing indicators, and server-side cursor update throttling (30 Hz).

## Tasks Breakdown

- [ ] Task 1: Throttled awareness broadcast handling on socket server.
  - Files to create/modify: `apps/socket-server/src/handlers/awareness.ts`, `apps/socket-server/src/handlers/room.ts`
- [ ] Task 2: Implement `usePresence` client hook.
  - Files to create/modify: `apps/web/src/features/collaboration/hooks/use-presence.ts`
- [ ] Task 3: Build `PresenceAvatars` and `TypingIndicator` UI components.
  - Files to create/modify: `apps/web/src/features/collaboration/components/presence-avatars.tsx`, `apps/web/src/features/collaboration/components/typing-indicator.tsx`
- [ ] Task 4: Propagate user image/avatar session state.
  - Files to create/modify: `apps/web/src/app/(app)/d/[documentId]/page.tsx`, `apps/web/src/app/(app)/d/[documentId]/document-editor-client.tsx`
- [ ] Task 5: Integrate components into editor header.
  - Files to create/modify: `apps/web/src/features/editor/components/editor-header.tsx`, `apps/web/src/features/collaboration/providers/collaboration-provider.tsx`
- [ ] Task 6: Add cursor animations and transitions.
  - Files to create/modify: `apps/web/src/app/globals.css`
- [ ] Task 7: Unit tests verification.
  - Files to create/modify: Unit test files.

## Verification Checklist

- [ ] Lint and Type Checks pass: `npm run lint && npx tsc --noEmit`
- [ ] Unit tests pass: `npm run test`
- [ ] Build compiles successfully: `npm run build`
