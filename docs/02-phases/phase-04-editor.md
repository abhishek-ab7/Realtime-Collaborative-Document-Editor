# Phase 04 — Rich Text Editor (TipTap)

**Duration:** Days 12–14 (3 days)  
**Status:** Complete

## Deliverables

- [x] TipTap editor canvas integration
- [x] Editor toolbar (bold, italic, headings, lists, links, code blocks)
- [x] Floating bubble menus for text highlighting formats
- [x] Synchronized document title updates in editor
- [x] Custom rendering styles and node bounds

## Files to Create/Modify

**Create:**

- `apps/web/src/features/editor/components/Editor.tsx`
- `apps/web/src/features/editor/components/Toolbar.tsx`
- `apps/web/src/features/editor/hooks/use-editor.ts`

**Modify:**

- `apps/web/src/app/d/[documentId]/page.tsx`
- `apps/web/package.json` (Add TipTap core packages)

## Implementation Order

1. **Step 1:** Scaffold core TipTap editor module → Files: `apps/web/src/features/editor/components/Editor.tsx`
2. **Step 2:** Construct editor control buttons and bubble settings → Files: `apps/web/src/features/editor/components/Toolbar.tsx`
3. **Step 3:** Integrate hooks to sync UI updates → Files: `apps/web/src/features/editor/hooks/use-editor.ts`

## Acceptance Criteria

- [x] All files from "Files to Create/Modify" exist
- [x] TypeScript strict mode passes (0 errors)
- [x] All tests for this phase pass
- [x] Code follows patterns from [[05-reference-code/tiptap-patterns|TipTap Patterns]]
- [x] Editing canvas functions properly without lags

## Dependencies

- Depends on: [[02-phases/phase-03-documents|Phase 03 — Document Management & Dashboard]]
- Enables: [[02-phases/phase-05-realtime|Phase 05 — Realtime Collaboration Engine]]

## Potential Issues & Mitigations

| Issue                           | Mitigation                                                            |
| ------------------------------- | --------------------------------------------------------------------- |
| Extraneous re-renders in editor | Memoize components; handle editor events outside React component loop |
| Style conflicts with Tailwind   | Strict CSS rules bindings to editor container classes                 |

## Architecture References

- [[04-architecture/system-design|System Design]]
- [[05-reference-code/tiptap-patterns|TipTap Patterns]]
