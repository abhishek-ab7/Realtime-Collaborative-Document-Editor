'use client';

import { useEditor as useTipTapEditor } from '@tiptap/react';
import { getEditorExtensions } from '../lib/extensions';
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

interface UseEditorOptions {
  content?: string;
  editable?: boolean;
  onUpdate?: (content: string) => void;
  /** Y.Doc for collaborative editing — when provided, content prop is ignored */
  yjsDoc?: Y.Doc;
  /** Awareness instance for cursor synchronization */
  awareness?: Awareness;
  /** Current user for cursor label rendering */
  user?: { name: string; color: string };
}

export function useDocumentEditor({
  content = '',
  editable = true,
  onUpdate,
  yjsDoc,
  awareness,
  user,
}: UseEditorOptions = {}) {
  const isCollaborative = !!yjsDoc;

  const editor = useTipTapEditor({
    extensions: getEditorExtensions({
      yjsDoc,
      awareness,
      user,
    }),
    // In collaborative mode, content comes from Y.Doc — don't set initial HTML
    ...(isCollaborative ? {} : { content }),
    editable,
    editorProps: {
      attributes: {
        class:
          'prose prose-slate max-w-none focus:outline-none min-h-[calc(100vh-280px)] px-12 py-8 text-[#0f172a]',
        'data-testid': 'tiptap-editor',
      },
    },
    onUpdate({ editor }) {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
  });

  return editor;
}
