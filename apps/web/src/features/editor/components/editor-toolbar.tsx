'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  Type,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LinkDialog } from './link-dialog';

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);

  const setLink = useCallback(
    (url: string) => {
      if (!editor) return;
      if (!url) {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
        return;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    },
    [editor],
  );

  if (!editor) return null;

  const currentLink = editor.getAttributes('link').href ?? '';

  return (
    <>
      <div
        data-testid="editor-toolbar"
        className="relative z-40 flex h-12 w-full shrink-0 items-center gap-1.5 overflow-visible border-b border-[#e2e8f0] bg-white px-3 select-none"
      >
        <HistoryGroup editor={editor} />
        <Divider />
        <TypographyGroup editor={editor} />
        <Divider />
        <MarksGroup editor={editor} />
        <Divider />
        <ColorGroup editor={editor} />
        <Divider />
        <HeadingGroup editor={editor} />
        <Divider />
        <ListGroup editor={editor} />
        <Divider />
        <BlockGroup editor={editor} />
        <Divider />
        <AlignmentGroup editor={editor} />
        <Divider />
        <InsertGroup editor={editor} onInsertLink={() => setLinkDialogOpen(true)} />
      </div>

      <LinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        initialUrl={currentLink}
        onConfirm={setLink}
      />
    </>
  );
}

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex shrink-0 items-center gap-0.5">{children}</div>;
}

function Divider() {
  return <div className="mx-1 h-5 w-px shrink-0 self-center bg-[#e2e8f0]" />;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
  'data-testid'?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
  'data-testid': testId,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-testid={testId}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-[#475569] transition-all duration-100',
        'disabled:cursor-not-allowed disabled:opacity-40',
        active
          ? 'bg-[#4f46e5]/10 font-semibold text-[#4f46e5]'
          : 'hover:bg-[#f1f5f9] hover:text-[#0f172a] active:bg-[#e2e8f0]',
      )}
    >
      {children}
    </button>
  );
}

function Dropdown({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={containerRef} className="relative inline-block shrink-0 text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-8 items-center justify-between gap-1.5 rounded-md border border-[#e2e8f0] bg-white px-2.5 text-xs font-medium text-[#475569] shadow-xs transition-all hover:bg-[#f1f5f9]',
          className,
        )}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
      </button>

      {isOpen && (
        <div className="animate-in fade-in-0 zoom-in-95 absolute left-0 z-[100] mt-1 max-h-60 min-w-36 origin-top-left overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white p-1 shadow-md duration-100">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={cn(
                'flex w-full items-center rounded-md px-2 py-1.5 text-left text-xs transition-all',
                opt.value === value
                  ? 'bg-[#4f46e5]/10 font-semibold text-[#4f46e5]'
                  : 'text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
  icon,
  label,
}: {
  value: string;
  onChange: (color: string) => void;
  icon: React.ReactNode;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const presets = [
    '#000000',
    '#4b5563',
    '#9ca3af',
    '#e5e7eb',
    '#ffffff',
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#10b981',
    '#06b6d4',
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#f43f5e',
    '#b91c1c',
    '#c2410c',
    '#b45309',
    '#047857',
    '#1d4ed8',
  ];

  return (
    <div ref={containerRef} className="relative inline-block shrink-0">
      <button
        type="button"
        title={label}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e2e8f0] bg-white transition-all hover:bg-[#f1f5f9]"
      >
        <div className="flex flex-col items-center justify-center">
          {icon}
          <div
            className="mt-0.5 h-1 w-4 rounded-full border border-black/10"
            style={{ backgroundColor: value || '#000000' }}
          />
        </div>
      </button>

      {isOpen && (
        <div className="animate-in fade-in-0 zoom-in-95 absolute left-0 z-[100] mt-1 w-[168px] origin-top-left rounded-lg border border-[#e2e8f0] bg-white p-2.5 shadow-md duration-100">
          <div className="grid grid-cols-5 gap-1">
            {presets.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                className="h-6 w-6 cursor-pointer rounded-md border border-[#e2e8f0] transition-transform duration-100 hover:scale-110"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <div className="mt-2.5 border-t border-[#f1f5f9] pt-2">
            <span className="mb-1 block text-[10px] font-semibold tracking-wider text-[#94a3b8] uppercase">
              Custom Color
            </span>
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 w-full cursor-pointer rounded-md border border-[#e2e8f0] bg-white p-0.5"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryGroup({ editor }: { editor: Editor }) {
  return (
    <ToolbarGroup>
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
        data-testid="toolbar-undo"
      >
        <Undo2 className="h-[15px] w-[15px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Shift+Z)"
        data-testid="toolbar-redo"
      >
        <Redo2 className="h-[15px] w-[15px]" />
      </ToolbarButton>
    </ToolbarGroup>
  );
}

function TypographyGroup({ editor }: { editor: Editor }) {
  const currentFontFamily = editor.getAttributes('textStyle').fontFamily ?? 'Inter';
  const currentFontSizeStr = editor.getAttributes('textStyle').fontSize ?? '16';
  const currentFontSize = parseInt(currentFontSizeStr, 10) || 16;

  const fontOptions = [
    { label: 'Inter', value: 'Inter' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Playfair Display', value: 'Playfair Display' },
  ];

  const handleDecrease = () => {
    const newSize = Math.max(8, currentFontSize - 1);
    editor.chain().focus().setFontSize(newSize.toString()).run();
  };

  const handleIncrease = () => {
    const newSize = Math.min(120, currentFontSize + 1);
    editor.chain().focus().setFontSize(newSize.toString()).run();
  };

  return (
    <ToolbarGroup>
      <Dropdown
        value={currentFontFamily}
        options={fontOptions}
        onChange={(font) => editor.chain().focus().setFontFamily(font).run()}
        className="w-[120px]"
      />
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleDecrease}
          className="flex h-6 w-6 items-center justify-center rounded p-1 text-[#475569] hover:bg-[#f1f5f9] active:bg-[#e2e8f0]"
          title="Decrease font size"
        >
          <span className="block pb-0.5 text-lg leading-none font-bold select-none">-</span>
        </button>
        <span className="min-w-[28px] rounded-md border border-[#e2e8f0] bg-white px-2.5 py-0.5 text-center text-xs font-semibold text-[#191c1e] select-none">
          {currentFontSize}
        </span>
        <button
          type="button"
          onClick={handleIncrease}
          className="flex h-6 w-6 items-center justify-center rounded p-1 text-[#475569] hover:bg-[#f1f5f9] active:bg-[#e2e8f0]"
          title="Increase font size"
        >
          <span className="block text-lg leading-none font-bold select-none">+</span>
        </button>
      </div>
    </ToolbarGroup>
  );
}

function MarksGroup({ editor }: { editor: Editor }) {
  return (
    <ToolbarGroup>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
        data-testid="toolbar-bold"
      >
        <Bold className="h-[15px] w-[15px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
        data-testid="toolbar-italic"
      >
        <Italic className="h-[15px] w-[15px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
        data-testid="toolbar-underline"
      >
        <Underline className="h-[15px] w-[15px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive('strike')}
        title="Strikethrough"
        data-testid="toolbar-strikethrough"
      >
        <Strikethrough className="h-[15px] w-[15px]" />
      </ToolbarButton>
    </ToolbarGroup>
  );
}

function ColorGroup({ editor }: { editor: Editor }) {
  const currentTextColor = editor.getAttributes('textStyle').color ?? '#000000';
  const currentHighlightColor = editor.isActive('highlight')
    ? (editor.getAttributes('highlight').color ?? '#fef08a')
    : '';

  return (
    <ToolbarGroup>
      <ColorPicker
        value={currentTextColor}
        onChange={(color) => editor.chain().focus().setColor(color).run()}
        icon={<Type className="h-[15px] w-[15px]" />}
        label="Text Color"
      />
      <ColorPicker
        value={currentHighlightColor}
        onChange={(color) => editor.chain().focus().toggleHighlight({ color }).run()}
        icon={<Highlighter className="h-[15px] w-[15px]" />}
        label="Highlight Color"
      />
    </ToolbarGroup>
  );
}

function HeadingGroup({ editor }: { editor: Editor }) {
  return (
    <ToolbarGroup>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1 (Ctrl+Shift+1)"
        data-testid="toolbar-h1"
      >
        <Heading1 className="h-[15px] w-[15px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2 (Ctrl+Shift+2)"
        data-testid="toolbar-h2"
      >
        <Heading2 className="h-[15px] w-[15px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        title="Heading 3 (Ctrl+Shift+3)"
        data-testid="toolbar-h3"
      >
        <Heading3 className="h-[15px] w-[15px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        active={editor.isActive('paragraph')}
        title="Normal Text"
        data-testid="toolbar-paragraph"
      >
        <Type className="h-[15px] w-[15px]" />
      </ToolbarButton>
    </ToolbarGroup>
  );
}

function ListGroup({ editor }: { editor: Editor }) {
  return (
    <ToolbarGroup>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet List (Ctrl+Shift+8)"
        data-testid="toolbar-bullet-list"
      >
        <List className="h-[15px] w-[15px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Ordered List (Ctrl+Shift+7)"
        data-testid="toolbar-ordered-list"
      >
        <ListOrdered className="h-[15px] w-[15px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        active={editor.isActive('taskList')}
        title="Task List (Ctrl+Shift+9)"
        data-testid="toolbar-task-list"
      >
        <ListChecks className="h-[15px] w-[15px]" />
      </ToolbarButton>
    </ToolbarGroup>
  );
}

function BlockGroup({ editor }: { editor: Editor }) {
  return (
    <ToolbarGroup>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Blockquote"
        data-testid="toolbar-blockquote"
      >
        <Quote className="h-[15px] w-[15px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        active={editor.isActive('codeBlock')}
        title="Code Block"
        data-testid="toolbar-code-block"
      >
        <Code2 className="h-[15px] w-[15px]" />
      </ToolbarButton>
    </ToolbarGroup>
  );
}

function AlignmentGroup({ editor }: { editor: Editor }) {
  return (
    <ToolbarGroup>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        active={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
        data-testid="toolbar-align-left"
      >
        <AlignLeft className="h-[15px] w-[15px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        active={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
        data-testid="toolbar-align-center"
      >
        <AlignCenter className="h-[15px] w-[15px]" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        active={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
        data-testid="toolbar-align-right"
      >
        <AlignRight className="h-[15px] w-[15px]" />
      </ToolbarButton>
    </ToolbarGroup>
  );
}

function InsertGroup({ editor, onInsertLink }: { editor: Editor; onInsertLink: () => void }) {
  return (
    <ToolbarGroup>
      <ToolbarButton
        onClick={onInsertLink}
        active={editor.isActive('link')}
        title="Insert Link (Ctrl+K)"
        data-testid="toolbar-link"
      >
        <LinkIcon className="h-[15px] w-[15px]" />
      </ToolbarButton>
    </ToolbarGroup>
  );
}
