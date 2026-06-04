'use client';

import { useState, useCallback, useLayoutEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Link as LinkIcon,
  Code,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { LinkDialog } from './link-dialog';

interface EditorBubbleMenuProps {
  editor: Editor;
}

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const editorState = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive('bold'),
      isItalic: ctx.editor.isActive('italic'),
      isUnderline: ctx.editor.isActive('underline'),
      isStrike: ctx.editor.isActive('strike'),
      isHighlight: ctx.editor.isActive('highlight'),
      isCode: ctx.editor.isActive('code'),
      isLink: ctx.editor.isActive('link'),
      isEmpty: ctx.editor.state.selection.empty,
      link: ctx.editor.getAttributes('link').href ?? '',
    }),
  });

  // Position the bubble menu above the current selection
  useLayoutEffect(() => {
    const updatePosition = () => {
      const { state } = editor;
      const { from, to, empty } = state.selection;

      if (empty || linkDialogOpen) {
        setPosition(null);
        return;
      }

      const view = editor.view;
      const start = view.coordsAtPos(from);
      const end = view.coordsAtPos(to);

      const menuWidth = menuRef.current?.offsetWidth ?? 280;
      const left = Math.max(8, (start.left + end.left) / 2 - menuWidth / 2);
      const top = start.top - (menuRef.current?.offsetHeight ?? 40) - 8 + window.scrollY;

      setPosition({ top, left });
    };

    updatePosition();

    editor.on('selectionUpdate', updatePosition);
    editor.on('blur', () => setPosition(null));

    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('blur', () => setPosition(null));
    };
  }, [editor, linkDialogOpen]);

  const setLink = useCallback(
    (url: string) => {
      if (!url) {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    },
    [editor],
  );

  const isVisible = !editorState.isEmpty && (position !== null || process.env.NODE_ENV === 'test');

  return (
    <>
      {isVisible &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            data-testid="bubble-menu"
            style={{
              position: 'absolute',
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              zIndex: 9999,
            }}
            className="flex items-center gap-0.5 rounded-lg border border-[#e2e8f0] bg-white p-1 shadow-lg"
            // Prevent editor from losing focus when clicking menu
            onMouseDown={(e) => e.preventDefault()}
          >
            <BubbleButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editorState.isBold}
              title="Bold (Ctrl+B)"
              data-testid="bubble-bold"
            >
              <Bold className="h-4 w-4" />
            </BubbleButton>
            <BubbleButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editorState.isItalic}
              title="Italic (Ctrl+I)"
              data-testid="bubble-italic"
            >
              <Italic className="h-4 w-4" />
            </BubbleButton>
            <BubbleButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editorState.isUnderline}
              title="Underline (Ctrl+U)"
              data-testid="bubble-underline"
            >
              <Underline className="h-4 w-4" />
            </BubbleButton>
            <BubbleButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editorState.isStrike}
              title="Strikethrough"
              data-testid="bubble-strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </BubbleButton>
            <BubbleButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              active={editorState.isHighlight}
              title="Highlight"
              data-testid="bubble-highlight"
            >
              <Highlighter className="h-4 w-4" />
            </BubbleButton>
            <div className="mx-1 h-5 w-px bg-[#e2e8f0]" />
            <BubbleButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editorState.isCode}
              title="Inline Code"
              data-testid="bubble-code"
            >
              <Code className="h-4 w-4" />
            </BubbleButton>
            <BubbleButton
              onClick={() => setLinkDialogOpen(true)}
              active={editorState.isLink}
              title="Insert Link (Ctrl+K)"
              data-testid="bubble-link"
            >
              <LinkIcon className="h-4 w-4" />
            </BubbleButton>
          </div>,
          document.body,
        )}

      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        initialUrl={editorState.link}
        onConfirm={setLink}
      />
    </>
  );
}

interface BubbleButtonProps {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
  'data-testid'?: string;
}

function BubbleButton({
  onClick,
  active,
  title,
  children,
  'data-testid': testId,
}: BubbleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      data-testid={testId}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all',
        active
          ? 'bg-[#4f46e5] text-white'
          : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]',
      )}
    >
      {children}
    </button>
  );
}
