## Editor Toolbar — Design Documentation

**Design Choice:** Option C — Command Center
**Aesthetic:** Soft & rounded (6–8px radius)
**Toolbar Density:** All tools always visible

**Extensions Used:**

- `@tiptap/extension-color`
- `@tiptap/extension-text-style`
- `@tiptap/extension-font-family`
- `@tiptap/extension-underline`
- `@tiptap/extension-text-align`
- `@tiptap/extension-highlight`
- Custom `FontSize` Extension (defined in `extensions.ts`)

**Component Architecture:**

- `EditorToolbar` (parent container, 100vw, height 48px, horizontal scrollable overflow)
  ├── `HistoryGroup` (Undo, Redo)
  ├── `TypographyGroup` (FontFamily select, FontSize select)
  ├── `MarksGroup` (Bold, Italic, Underline, Strikethrough)
  ├── `ColorGroup` (Text Color popover, Highlight Color popover)
  ├── `HeadingGroup` (H1, H2, H3, Paragraph reset)
  ├── `ListGroup` (Bullet, Ordered, Task Lists)
  ├── `BlockGroup` (Blockquote, Code block)
  ├── `AlignmentGroup` (Left, Center, Right align)
  └── `InsertGroup` (Link insertion dialog)

**Layout Notes:**

- Outer Frame: `flex h-screen w-full flex-col overflow-hidden` spanning 100% viewport.
- Chrome/Toolbar: `w-full shrink-0 border-b bg-white` for an edge-to-edge layout.
- Text Canvas Wrapper: `flex-1 overflow-y-auto bg-[var(--color-bg-secondary)]` allowing independent scroll.
- Text Canvas Column: Centered `max-w-[860px] mx-auto min-h-full px-16 py-12 border-x shadow-sm bg-[var(--color-bg-primary)]` matching comfortable typing width guidelines.
- Status Bar: `w-full h-7 shrink-0 border-t bg-[var(--color-bg-primary)] px-4 flex justify-between` for metadata.

**Why Option C:**

- Fits the requested "everything visible" density.
- Follows the industry-standard Google Docs / MS Word workflow for power users.
- Scales beautifully across wider screens (1280px to 1920px+) without feeling cluttered or empty.
- Avoids Option A's vertical layout overhead, and Option B's hidden control menus which can slow down heavy formatting.
