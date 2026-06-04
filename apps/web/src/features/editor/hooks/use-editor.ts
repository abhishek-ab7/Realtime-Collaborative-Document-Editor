'use client';

import { useEditor as useTipTapEditor } from '@tiptap/react';
import { getEditorExtensions } from '../lib/extensions';

interface UseEditorOptions {
  content?: string;
  editable?: boolean;
  onUpdate?: (content: string) => void;
}

export function useDocumentEditor({
  content = '',
  editable = true,
  onUpdate,
}: UseEditorOptions = {}) {
  const editor = useTipTapEditor({
    extensions: getEditorExtensions(),
    content,
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
