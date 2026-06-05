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
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { common, createLowlight } from 'lowlight';
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

const lowlight = createLowlight(common);

interface ExtensionOptions {
  /** Y.Doc for collaborative editing mode */
  yjsDoc?: Y.Doc;
  /** Awareness instance for cursor sync */
  awareness?: Awareness;
  /** Current user info for cursor labels */
  user?: {
    name: string;
    color: string;
  };
}

export function getEditorExtensions(options?: ExtensionOptions) {
  const extensions = [
    StarterKit.configure({
      codeBlock: false, // Using CodeBlockLowlight instead
      heading: { levels: [1, 2, 3] },
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
      // Disable history in collab mode — Yjs provides its own undo manager
      ...(options?.yjsDoc ? { history: false } : {}),
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
      HTMLAttributes: {
        class: 'editor-link',
        rel: 'noopener noreferrer',
        target: '_blank',
      },
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

  // Add collaboration extensions when Y.Doc is provided
  if (options?.yjsDoc) {
    extensions.push(
      Collaboration.configure({
        document: options.yjsDoc,
      }) as any,
    );

    if (options?.awareness && options?.user) {
      extensions.push(
        CollaborationCursor.configure({
          provider: { awareness: options.awareness } as any,
          user: options.user,
        }) as any,
      );
    }
  }

  return extensions;
}
