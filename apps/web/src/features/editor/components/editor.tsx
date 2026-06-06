'use client';

import { useEffect } from 'react';
import { EditorContent, Editor as TipTapEditor } from '@tiptap/react';
import { useDocumentEditor } from '../hooks/use-editor';
import { EditorToolbar } from './editor-toolbar';
import { EditorBubbleMenu } from './editor-bubble-menu';
import { EditorStatusBar } from './editor-status-bar';
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

interface EditorProps {
  content?: string;
  editable?: boolean;
  onUpdate?: (content: string) => void;
  onCountChange?: (words: number, characters: number) => void;
  onEditorLoad?: (editor: TipTapEditor) => void;
  /** Collaborative mode props */
  yjsDoc?: Y.Doc;
  awareness?: Awareness;
  user?: { name: string; color: string };
}

export function Editor({
  content = '',
  editable = true,
  onUpdate,
  onCountChange,
  onEditorLoad,
  yjsDoc,
  awareness,
  user,
}: EditorProps) {
  const editor = useDocumentEditor({
    content,
    editable,
    onUpdate,
    yjsDoc,
    awareness,
    user,
  });

  useEffect(() => {
    if (editor && onEditorLoad) {
      onEditorLoad(editor);
    }
  }, [editor, onEditorLoad]);

  useEffect(() => {
    if (!editor || !onCountChange) return;

    const updateCounts = () => {
      const words = editor.storage.characterCount?.words?.() ?? 0;
      const chars = editor.storage.characterCount?.characters?.() ?? 0;
      onCountChange(words, chars);
    };

    editor.on('update', updateCounts);
    // Initial run
    updateCounts();

    return () => {
      editor.off('update', updateCounts);
    };
  }, [editor, onCountChange]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden" data-testid="editor-container">
      {editable && <EditorToolbar editor={editor} />}

      <div className="flex-1 overflow-y-auto bg-[var(--color-bg-secondary)]">
        {editor && editable && <EditorBubbleMenu editor={editor} />}
        <div className="editor-canvas-wrapper mx-auto min-h-full w-full max-w-[860px] border-x border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-16 py-12 shadow-sm">
          <EditorContent editor={editor} />
        </div>
      </div>

      {editable && <EditorStatusBar editor={editor} />}
    </div>
  );
}
