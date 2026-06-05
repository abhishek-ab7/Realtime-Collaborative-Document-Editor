'use client';

import { useEditor as useTipTapEditor } from '@tiptap/react';
import { useRef, useEffect, useMemo } from 'react';
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
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const userSerialized = user ? `${user.name}:${user.color}` : '';
  const extensions = useMemo(() => {
    return getEditorExtensions({
      yjsDoc,
      awareness,
      user,
    });
  }, [yjsDoc, awareness, userSerialized]);

  const editor = useTipTapEditor({
    extensions,
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
    onUpdate({ editor, transaction }) {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
      const isRemote = transaction.getMeta('y-sync$') !== undefined;
      if (awareness && !isRemote && transaction.docChanged) {
        awareness.setLocalStateField('isTyping', true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
          awareness.setLocalStateField('isTyping', false);
        }, 2000);
      }
    },
  });

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  return editor;
}
