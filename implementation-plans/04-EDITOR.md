# Phase 04 — Rich Text Editor (TipTap)

> **Days:** 12–14  
> **Status:** ⬜ Not Started  
> **Dependencies:** Phase 03 (Document Management)  
> **Milestone:** M4-EDITOR  
> **PRD Sections:** 5.3 (Collaborative Editing — editor baseline)

---

## 1. Phase Objective

Integrate TipTap (ProseMirror-based) rich text editor with full formatting toolbar, bubble menu, keyboard shortcuts, word count, and document title editing. This phase builds the **single-user** editor experience; collaboration is added in Phase 05.

---

## 2. Day-by-Day Breakdown

### Day 12: TipTap Setup + Extensions + Editor Core

| #    | Task                                              | Est. Time | Output                                  |
| ---- | ------------------------------------------------- | --------- | --------------------------------------- |
| 12.1 | Install TipTap core + extensions                  | 15 min    | Dependencies installed                  |
| 12.2 | **Stitch MCP**: Generate editor page design       | 30 min    | `.stitch/designs/editor.html` + `.png`  |
| 12.3 | Configure TipTap extensions (StarterKit + extras) | 60 min    | `features/editor/lib/extensions.ts`     |
| 12.4 | Build core Editor component                       | 90 min    | `features/editor/components/editor.tsx` |
| 12.5 | Build `useEditor` hook                            | 30 min    | `features/editor/hooks/use-editor.ts`   |
| 12.6 | Create editor page route                          | 30 min    | `app/(app)/d/[documentId]/page.tsx`     |
| 12.7 | Add loading skeleton                              | 15 min    | `app/(app)/d/[documentId]/loading.tsx`  |

**Day 12 Total: ~4.5 hours**

#### Installation

```bash
cd apps/web
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npm install @tiptap/extension-placeholder @tiptap/extension-character-count
npm install @tiptap/extension-link @tiptap/extension-underline
npm install @tiptap/extension-typography @tiptap/extension-text-align
npm install @tiptap/extension-highlight @tiptap/extension-code-block-lowlight
npm install @tiptap/extension-task-list @tiptap/extension-task-item
npm install @tiptap/extension-image @tiptap/extension-horizontal-rule
npm install lowlight

# Collaboration extensions (installed now, used in Phase 05)
npm install @tiptap/extension-collaboration @tiptap/extension-collaboration-cursor
npm install yjs y-prosemirror y-indexeddb
```

#### TipTap Extensions Configuration

```typescript
// features/editor/lib/extensions.ts
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Typography from '@tiptap/extension-typography';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);

export function getEditorExtensions() {
  return [
    StarterKit.configure({
      codeBlock: false, // Using CodeBlockLowlight instead
      heading: { levels: [1, 2, 3] },
    }),
    Placeholder.configure({
      placeholder: 'Start writing...',
      emptyEditorClass: 'is-editor-empty',
    }),
    CharacterCount,
    Link.configure({
      openOnClick: false,
      autolink: true,
      defaultProtocol: 'https',
    }),
    Underline,
    Typography,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Highlight.configure({ multicolor: true }),
    TaskList,
    TaskItem.configure({ nested: true }),
    CodeBlockLowlight.configure({ lowlight }),
    HorizontalRule,
  ];
}
```

### Day 13: Toolbar + Bubble Menu + Keyboard Shortcuts

| #    | Task                                                  | Est. Time | Output                          |
| ---- | ----------------------------------------------------- | --------- | ------------------------------- |
| 13.1 | Build `EditorToolbar` component                       | 90 min    | Full formatting toolbar         |
| 13.2 | Build `EditorBubbleMenu` (selection-based formatting) | 45 min    | Floating menu on text selection |
| 13.3 | Build `LinkDialog` for inserting/editing links        | 30 min    | URL input dialog                |
| 13.4 | Implement keyboard shortcuts display                  | 20 min    | Tooltip with shortcuts          |
| 13.5 | Build `WordCount` component                           | 15 min    | Character + word count display  |
| 13.6 | Build `EditorHeader` (title + metadata)               | 30 min    | Inline editable document title  |
| 13.7 | Add editor CSS styles (code blocks, task lists, etc.) | 30 min    | Prose styles in globals.css     |

**Day 13 Total: ~4.5 hours**

#### Editor Toolbar Structure

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Undo][Redo] │ [B][I][U][S][~] │ [H1][H2][H3] │ [•][1.][☐] │ ... │
│              │ text formatting  │ headings     │ lists      │ more │
├──────────────────────────────────────────────────────────────────────┤
│ [🔗 Link][📎 Code Block][— Horizontal Rule][Left][Center][Right]   │
└──────────────────────────────────────────────────────────────────────┘
```

#### Keyboard Shortcuts

| Shortcut                   | Action        |
| -------------------------- | ------------- |
| `Ctrl/Cmd + B`             | Bold          |
| `Ctrl/Cmd + I`             | Italic        |
| `Ctrl/Cmd + U`             | Underline     |
| `Ctrl/Cmd + Shift + S`     | Strikethrough |
| `Ctrl/Cmd + Shift + H`     | Highlight     |
| `Ctrl/Cmd + K`             | Insert link   |
| `Ctrl/Cmd + Shift + 1/2/3` | Heading 1/2/3 |
| `Ctrl/Cmd + Shift + 8`     | Bullet list   |
| `Ctrl/Cmd + Shift + 7`     | Ordered list  |
| `Ctrl/Cmd + Shift + 9`     | Task list     |
| `Ctrl/Cmd + E`             | Code (inline) |
| `Ctrl/Cmd + Z`             | Undo          |
| `Ctrl/Cmd + Shift + Z`     | Redo          |

### Day 14: Editor Page Integration + Tests + Polish

| #    | Task                                                     | Est. Time | Output                      |
| ---- | -------------------------------------------------------- | --------- | --------------------------- |
| 14.1 | Connect editor to document data (Server Component fetch) | 45 min    | SSR document metadata       |
| 14.2 | Update `lastAccessedAt` on document open                 | 15 min    | Server Action on page visit |
| 14.3 | Implement document title inline editing                  | 30 min    | Auto-save on blur/Enter     |
| 14.4 | Add print stylesheet                                     | 15 min    | `@media print` styles       |
| 14.5 | Write unit tests for Editor, Toolbar, BubbleMenu         | 60 min    | 10–12 tests                 |
| 14.6 | Write integration tests for editor page data loading     | 30 min    | 3–4 tests                   |
| 14.7 | Polish: focus management, transitions, scrollbar         | 20 min    | UX refinement               |
| 14.8 | Git commit: "M4: Rich text editor complete"              | 5 min     | Clean commit                |

**Day 14 Total: ~3.5 hours**

---

## 3. Stitch MCP — Editor Page Design

### Stitch Prompt

```
A document editor page for 'Collabdoc'. Clean white background.
Top: a narrow toolbar bar with formatting buttons (bold, italic, underline,
headings, lists, link, code) using subtle gray icon buttons with hover effects.
Below toolbar: full-width editor area with generous padding (48px sides).
The editor shows sample text: a heading "Project Roadmap", a paragraph of body text,
a bullet list, and a code block. Left of title: small back arrow to dashboard.
Right side of top bar: user avatar, share button, and 3-dot menu.
Typography: Inter font, 16px body text, 24px heading. Clean, distraction-free.
```

---

## 4. Testing Requirements

| Category    | File                          | Tests                                                           |
| ----------- | ----------------------------- | --------------------------------------------------------------- |
| Unit        | `editor.test.tsx`             | 4 — renders, accepts content, fires onChange, shows placeholder |
| Unit        | `editor-toolbar.test.tsx`     | 5 — renders buttons, toggles bold/italic, disables in read-only |
| Unit        | `editor-bubble-menu.test.tsx` | 3 — shows on selection, hides on blur, formats text             |
| Unit        | `word-count.test.tsx`         | 2 — shows count, updates on edit                                |
| Integration | `editor-page.test.ts`         | 4 — loads document, updates lastAccessedAt, 404 for missing doc |

**Phase 4 Test Total: ~18 tests**

---

## 5. Acceptance Criteria

| #   | Criterion                                                                    |
| --- | ---------------------------------------------------------------------------- |
| 1   | Clicking a document card opens the editor at `/d/{documentId}`               |
| 2   | Editor renders with placeholder "Start writing..."                           |
| 3   | All toolbar buttons work (bold, italic, underline, strikethrough, highlight) |
| 4   | Headings H1/H2/H3 toggle correctly                                           |
| 5   | Bullet, numbered, and task lists work                                        |
| 6   | Code blocks with syntax highlighting render                                  |
| 7   | Links can be inserted/edited/removed                                         |
| 8   | Keyboard shortcuts work for all formatting actions                           |
| 9   | Bubble menu appears on text selection with quick formatting                  |
| 10  | Word/character count updates in real time                                    |
| 11  | Document title is editable inline, auto-saves on blur                        |
| 12  | Back button returns to dashboard                                             |
| 13  | Editor matches Stitch design reference                                       |
| 14  | All 18 tests pass                                                            |
