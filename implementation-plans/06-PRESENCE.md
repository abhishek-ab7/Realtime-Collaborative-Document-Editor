# Phase 06 — Live Presence & Cursors

> **Days:** 22–24  
> **Status:** ✅ Complete  
> **Dependencies:** Phase 05 (Realtime Collaboration)  
> **Milestone:** M6-PRESENCE  
> **PRD Sections:** 5.4 (Presence Awareness)

---

## 1. Phase Objective

Add live presence features: remote cursor rendering with colored carets and name labels, stacked user avatars showing who's online, typing indicators, join/leave toast notifications, and deterministic color assignment. This transforms the editor from "real-time sync" to "real-time collaboration."

---

## 2. Day-by-Day Breakdown

### Day 22: Awareness Protocol + Presence Data + Stitch Design

| #    | Task                                                            | Est. Time | Output                                              |
| ---- | --------------------------------------------------------------- | --------- | --------------------------------------------------- |
| 22.1 | **Stitch MCP**: Generate presence UI component design           | 30 min    | `.stitch/designs/presence.png`                      |
| 22.2 | Implement awareness handler throttling (30 Hz max) on server    | 30 min    | `handlers/awareness.ts`                             |
| 22.3 | Build deterministic color assignment from palette               | 20 min    | `lib/awareness-colors.ts`                           |
| 22.4 | Build `usePresence` hook (reads Awareness state)                | 45 min    | Tracks cursor positions, typing state, online users |
| 22.5 | Configure `CollaborationCursor` TipTap extension with user info | 30 min    | Colored carets + name labels                        |
| 22.6 | Add cursor CSS animations (smooth movement, fade-in/out)        | 30 min    | CSS in `globals.css`                                |

**Day 22 Total: ~3 hours**

#### Stitch MCP Prompt for Presence UI

```
Presence indicator components for a collaborative document editor:
1. A horizontal row of stacked circular user avatars (32px each, overlapping by 8px).
   Each avatar has a colored ring matching their cursor color. Max 5 visible + "+3 more" counter.
2. Below the avatars: a small "Alice is typing..." indicator with animated dots.
3. A remote cursor in the editor: a thin vertical line (2px) with a small rounded
   label on top showing the user's first name (e.g., "Alice") in white text on a
   colored background matching their cursor color.
Clean, minimal design. Inter font. Indigo/violet color scheme.
```

### Day 23: Presence UI Components

| #    | Task                                                              | Est. Time | Output                                                   |
| ---- | ----------------------------------------------------------------- | --------- | -------------------------------------------------------- |
| 23.1 | Build `PresenceAvatars` component (stacked online users)          | 45 min    | `features/collaboration/components/presence-avatars.tsx` |
| 23.2 | Build `TypingIndicator` component                                 | 20 min    | Animated dots + user name                                |
| 23.3 | Build `EditorHeader` (title + avatars + connection + save status) | 60 min    | Complete editor header bar                               |
| 23.4 | Add join/leave toast notifications                                | 20 min    | Sonner toast on user events                              |
| 23.5 | Build `ConnectionStatus` badge (connected/connecting/offline)     | 20 min    | Status indicator                                         |
| 23.6 | Build `SaveStatus` display (Saving.../Saved/Offline)              | 20 min    | Auto-save indicator                                      |

**Day 23 Total: ~3 hours**

#### `apps/web/src/features/collaboration/components/presence-avatars.tsx`

```tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PRESENCE_COLORS } from '@collabdoc/shared';
import { usePresence } from '../hooks/use-presence';
import { cn } from '@/lib/utils';

export function PresenceAvatars() {
  const { onlineUsers } = usePresence();
  const maxVisible = 5;
  const visible = onlineUsers.slice(0, maxVisible);
  const overflow = onlineUsers.length - maxVisible;

  return (
    <div className="flex items-center -space-x-2" data-testid="presence-avatars">
      {visible.map((user, index) => {
        const color = PRESENCE_COLORS[index % PRESENCE_COLORS.length];
        const initials = user.name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2);

        return (
          <Tooltip key={user.userId}>
            <TooltipTrigger asChild>
              <div
                className="relative rounded-full ring-2 ring-[var(--color-bg-primary)] transition-transform hover:z-10 hover:scale-110"
                style={{ borderColor: color, borderWidth: '2px', borderStyle: 'solid' }}
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name} />
                  <AvatarFallback
                    className="text-[10px] font-semibold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {/* Online dot */}
                <div className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-bg-primary)] bg-[var(--color-success)]" />
              </div>
            </TooltipTrigger>
            <TooltipContent>{user.name}</TooltipContent>
          </Tooltip>
        );
      })}

      {overflow > 0 && (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-bg-tertiary)] text-[10px] font-semibold text-[var(--color-text-secondary)] ring-2 ring-[var(--color-bg-primary)]">
          +{overflow}
        </div>
      )}
    </div>
  );
}
```

#### `apps/web/src/features/collaboration/hooks/use-presence.ts`

```typescript
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useCollaborationContext } from '../providers/collaboration-provider';
import { PRESENCE_COLORS, TYPING_INDICATOR_TIMEOUT_MS } from '@collabdoc/shared';

interface OnlineUser {
  userId: string;
  name: string;
  avatarUrl: string | null;
  color: string;
  cursor: { anchor: number; head: number } | null;
  isTyping: boolean;
}

export function usePresence() {
  const { awareness } = useCollaborationContext();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (!awareness) return;

    const updateUsers = () => {
      const states = awareness.getStates();
      const users: OnlineUser[] = [];

      states.forEach((state, clientId) => {
        if (clientId === awareness.doc.clientID) return; // Skip self
        if (!state.user) return;

        users.push({
          userId: state.user.userId,
          name: state.user.name,
          avatarUrl: state.user.avatarUrl,
          color: state.user.color || PRESENCE_COLORS[users.length % PRESENCE_COLORS.length],
          cursor: state.cursor ?? null,
          isTyping: state.isTyping ?? false,
        });
      });

      setOnlineUsers(users);
    };

    awareness.on('change', updateUsers);
    updateUsers(); // Initial state

    return () => {
      awareness.off('change', updateUsers);
    };
  }, [awareness]);

  // Set local user info in awareness
  const setLocalUser = useCallback(
    (user: { userId: string; name: string; avatarUrl: string | null; color: string }) => {
      awareness?.setLocalStateField('user', user);
    },
    [awareness],
  );

  // Set typing state
  const setTyping = useCallback(
    (isTyping: boolean) => {
      awareness?.setLocalStateField('isTyping', isTyping);
    },
    [awareness],
  );

  const typingUsers = onlineUsers.filter((u) => u.isTyping);

  return { onlineUsers, typingUsers, setLocalUser, setTyping };
}
```

### Day 24: Tests + Polish + Edge Cases

| #    | Task                                                             | Est. Time | Output                    |
| ---- | ---------------------------------------------------------------- | --------- | ------------------------- |
| 24.1 | Unit tests for PresenceAvatars, TypingIndicator                  | 30 min    | 5 tests                   |
| 24.2 | Unit tests for usePresence hook                                  | 30 min    | 4 tests                   |
| 24.3 | E2E test: cursor visibility across two browsers                  | 45 min    | Playwright test           |
| 24.4 | Handle edge cases: rapid typing, user avatar missing, many users | 30 min    | Edge case handling        |
| 24.5 | Awareness cleanup on disconnect (30s timeout)                    | 20 min    | Server-side cleanup       |
| 24.6 | Performance: verify cursor updates at 30fps without jank         | 15 min    | Chrome DevTools profiling |
| 24.7 | Git commit: "M6: Live presence & cursors"                        | 5 min     | Clean commit              |

**Day 24 Total: ~3 hours**

---

## 3. Testing Requirements

| Category | File                         | Tests                                                     |
| -------- | ---------------------------- | --------------------------------------------------------- |
| Unit     | `presence-avatars.test.tsx`  | 3 — renders users, overflow counter, tooltips             |
| Unit     | `typing-indicator.test.tsx`  | 2 — shows typing user, hides when not typing              |
| Unit     | `connection-status.test.tsx` | 3 — connected, connecting, offline states                 |
| Unit     | `use-presence.test.ts`       | 4 — online users, typing state, color assignment, cleanup |
| E2E      | `presence.spec.ts`           | 2 — cursor visibility, avatar list update                 |

**Phase 6 Test Total: ~14 tests**

---

## 4. Acceptance Criteria

| #   | Criterion                                                                      |
| --- | ------------------------------------------------------------------------------ |
| 1   | User A sees User B's cursor with name label and unique color                   |
| 2   | Presence avatars show all online users with colored rings                      |
| 3   | Overflow counter shows "+N" when > 5 users online                              |
| 4   | "Alice is typing..." indicator appears during remote editing                   |
| 5   | Typing indicator disappears 2s after last keystroke                            |
| 6   | Toast notification on user join ("Alice joined")                               |
| 7   | Toast notification on user leave ("Alice left")                                |
| 8   | Connection status badge: green (connected), yellow (connecting), red (offline) |
| 9   | Save status: "Saving..." → "All changes saved" → "Offline — saved locally"     |
| 10  | Cursor updates render at ≤ 30fps without layout jank                           |
| 11  | All 14 tests pass                                                              |
