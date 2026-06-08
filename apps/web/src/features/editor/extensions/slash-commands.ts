import { Extension, Editor, Range } from '@tiptap/core';
import Suggestion, { SuggestionProps } from '@tiptap/suggestion';
import { ReactRenderer } from '@tiptap/react';
import tippy, { Instance } from 'tippy.js';
import { SlashCommandMenu, SlashCommandItem } from '../components/slash-command-menu';

export type CommandItem = SlashCommandItem;

export const getSuggestionItems = ({ query }: { query: string }): CommandItem[] => {
  const items: CommandItem[] = [
    {
      name: 'Text',
      description: 'Start writing with plain text.',
      iconName: 'text',
      command: (editor, range) => {
        editor.chain().focus().deleteRange(range).setParagraph().run();
      },
    },
    {
      name: 'Heading 1',
      description: 'Big section heading.',
      iconName: 'h1',
      command: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
      },
    },
    {
      name: 'Heading 2',
      description: 'Medium section heading.',
      iconName: 'h2',
      command: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
      },
    },
    {
      name: 'Heading 3',
      description: 'Small section heading.',
      iconName: 'h3',
      command: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
      },
    },
    {
      name: 'Bullet List',
      description: 'Create a simple bulleted list.',
      iconName: 'bullet',
      command: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      name: 'Numbered List',
      description: 'Create a list with numbering.',
      iconName: 'numbered',
      command: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      name: 'Todo List',
      description: 'Track tasks with a todo list.',
      iconName: 'todo',
      command: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      name: 'Blockquote',
      description: 'Capture a quote.',
      iconName: 'quote',
      command: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      name: 'Code Block',
      description: 'Write code with syntax highlighting.',
      iconName: 'code',
      command: (editor, range) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      name: 'Divider',
      description: 'Insert a horizontal divider line.',
      iconName: 'divider',
      command: (editor, range) => {
        editor.chain().focus().deleteRange(range).setHorizontalRule().run();
      },
    },
    {
      name: 'Table',
      description: 'Insert a 3x3 table grid.',
      iconName: 'table',
      command: (editor, range) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run();
      },
    },
    {
      name: 'Image',
      description: 'Upload or insert an image.',
      iconName: 'image',
      command: (editor, range) => {
        if (typeof window === 'undefined') return;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const url = e.target?.result as string;
              editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      },
    },
    {
      name: 'AI Writing Assistant',
      description: 'Ask AI to write or edit this block.',
      iconName: 'ai',
      command: (editor, range) => {
        const { state } = editor;
        const { $from } = state.selection;
        const blockText = $from.parent.textContent || '';

        editor.chain().focus().deleteRange(range).run();

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('open-ai-assistant', {
              detail: { prompt: blockText },
            }),
          );
        }
      },
    },
  ];

  return items.filter(
    (item) =>
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()),
  );
};

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '/',
        startOfLine: true,
        items: ({ query }) => getSuggestionItems({ query }),
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: { command: (editor: Editor, range: Range) => void };
        }) => {
          props.command(editor, range);
        },
        render: () => {
          let component: ReactRenderer;
          let popup: Instance;

          return {
            onStart: (props: SuggestionProps) => {
              component = new ReactRenderer(SlashCommandMenu, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              popup = tippy(document.body, {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },

            onUpdate(props: SuggestionProps) {
              component.updateProps(props);

              if (!props.clientRect) {
                return;
              }

              popup.setProps({
                getReferenceClientRect: props.clientRect as () => DOMRect,
              });
            },

            onKeyDown(props) {
              if (props.event.key === 'Escape') {
                popup.hide();
                return true;
              }

              return (
                (
                  component.ref as {
                    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
                  }
                )?.onKeyDown(props) ?? false
              );
            },

            onExit() {
              popup.destroy();
              component.destroy();
            },
          };
        },
      }),
    ];
  },
});
