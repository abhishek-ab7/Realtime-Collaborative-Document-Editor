import { Extension } from '@tiptap/core';
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
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import { common, createLowlight } from 'lowlight';
import type * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';

const lowlight = createLowlight(common);

export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace('px', '') ?? null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}px`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: null }).run();
        },
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

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
      link: false,
      underline: false,
      horizontalRule: false,
      // Disable history in collab mode — Yjs provides its own undo manager
      ...(options?.yjsDoc ? { undoRedo: false } : {}),
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
    TextStyle,
    Color.configure({ types: ['textStyle'] }),
    FontFamily.configure({ types: ['textStyle'] }),
    FontSize,
  ];

  // Add collaboration extensions when Y.Doc is provided
  if (options?.yjsDoc) {
    extensions.push(
      Collaboration.configure({
        document: options.yjsDoc,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );

    if (options?.awareness && options?.user) {
      extensions.push(
        CollaborationCaret.configure({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          provider: { awareness: options.awareness } as any,
          user: options.user,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any,
      );
    }
  }

  return extensions;
}
