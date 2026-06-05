# Debugging Journal: Tiptap Editor Collaboration Extension Mismatch

## Issue Description

When initializing/mounting the collaborative editor, the browser throws a runtime TypeError:
`Cannot read properties of undefined (reading 'doc')`
at `createDecorations` inside ProseMirror/Tiptap's plugin initialization.

## Root Cause Analysis

1. In the prior configuration of the editor, `Collaboration` (priority: 1000) was loaded from `@tiptap/extension-collaboration`, which installs the `ySyncPlugin` from `@tiptap/y-tiptap`.
2. Simultaneously, `CollaborationCursor` (priority: 999) was loaded from `@tiptap/extension-collaboration-cursor`, which internally imports and installs the `yCursorPlugin` from the upstream `y-prosemirror` package.
3. During the initialization of the editor state, `y-prosemirror`'s `yCursorPlugin` attempts to retrieve the sync plugin's state using `y-prosemirror`'s `ySyncPluginKey`:
   ```javascript
   const ystate = ySyncPluginKey.getState(state);
   const y = ystate.doc;
   ```
4. Because the sync plugin was installed by `@tiptap/extension-collaboration` (which uses `@tiptap/y-tiptap`'s own copy of `ySyncPluginKey`), `ySyncPluginKey.getState(state)` from `y-prosemirror` returned `undefined`. Reading `.doc` from it threw the runtime TypeError.

## Resolution

1. Switched the cursor extension from `@tiptap/extension-collaboration-cursor` to `@tiptap/extension-collaboration-caret` in `apps/web/package.json`.
2. Replaced the import in `apps/web/src/features/editor/lib/extensions.ts` from `CollaborationCursor` to `CollaborationCaret`.
3. Since `@tiptap/extension-collaboration-caret` imports its cursor plugin directly from `@tiptap/y-tiptap`, both the collaboration sync and collaboration cursor extensions now resolve to `@tiptap/y-tiptap`'s plugin keys.
4. Verified that the editor loads and mounts successfully without any runtime TypeErrors.

## CI/CD Pipeline Mitigation

Additionally, the automated TestSprite E2E testing run in GitHub Actions failed because `testsprite_tests/tmp/config.json` is gitignored. To fix this, updated `.github/workflows/ci.yml` to dynamically generate the `config.json` before running the TestSprite test CLI.
