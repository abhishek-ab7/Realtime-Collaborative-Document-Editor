'use client';

import { EditorContent } from '@tiptap/react';
import { useDocumentEditor } from '../hooks/use-editor';
import { EditorToolbar } from './editor-toolbar';
import { EditorBubbleMenu } from './editor-bubble-menu';
import { WordCount } from './word-count';
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

interface EditorProps {
  content?: string;
  editable?: boolean;
  onUpdate?: (content: string) => void;
  /** Collaborative mode props */
  yjsDoc?: Y.Doc;
  awareness?: Awareness;
  user?: { name: string; color: string };
}

export function Editor({
  content = '',
  editable = true,
  onUpdate,
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

  return (
    <div className="flex flex-col" data-testid="editor-container">
      {editable && <EditorToolbar editor={editor} />}

      <div className="flex-1 overflow-auto">
        {editor && editable && <EditorBubbleMenu editor={editor} />}
        <EditorContent editor={editor} />
      </div>

      {editable && (
        <div className="sticky bottom-0 flex items-center justify-end border-t border-[#f1f5f9] bg-white/80 px-12 py-2 backdrop-blur-sm">
          <WordCount editor={editor} />
        </div>
      )}
    </div>
  );
}
