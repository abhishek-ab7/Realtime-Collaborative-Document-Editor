import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code2,
  Minus,
  List,
  ListOrdered,
  ListChecks,
  Table,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import type { Editor, Range } from '@tiptap/core';
import { cn } from '@/lib/utils';

const getIcon = (name: string) => {
  switch (name) {
    case 'text':
      return <Type className="h-4 w-4 text-slate-500" />;
    case 'h1':
      return <Heading1 className="h-4 w-4 text-slate-700" />;
    case 'h2':
      return <Heading2 className="h-4 w-4 text-slate-700" />;
    case 'h3':
      return <Heading3 className="h-4 w-4 text-slate-700" />;
    case 'bullet':
      return <List className="h-4 w-4 text-slate-500" />;
    case 'numbered':
      return <ListOrdered className="h-4 w-4 text-slate-500" />;
    case 'todo':
      return <ListChecks className="h-4 w-4 text-slate-500" />;
    case 'quote':
      return <Quote className="h-4 w-4 text-slate-500" />;
    case 'code':
      return <Code2 className="h-4 w-4 text-slate-500" />;
    case 'divider':
      return <Minus className="h-4 w-4 text-slate-500" />;
    case 'table':
      return <Table className="h-4 w-4 text-slate-500" />;
    case 'image':
      return <ImageIcon className="h-4 w-4 text-slate-500" />;
    case 'ai':
      return <Sparkles className="h-4 w-4 fill-indigo-100 text-indigo-500" />;
    default:
      return <Type className="h-4 w-4 text-slate-500" />;
  }
};

export interface SlashCommandItem {
  name: string;
  description: string;
  iconName: string;
  command: (editor: Editor, range: Range) => void;
}

export interface SlashCommandMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashCommandMenu = forwardRef((props: SlashCommandMenuProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
        return true;
      }

      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
        return true;
      }

      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }

      return false;
    },
  }));

  if (props.items.length === 0) {
    return null;
  }

  return (
    <div className="z-50 max-h-[330px] w-72 overflow-y-auto rounded-xl border border-[#e2e8f0] bg-white p-1.5 shadow-lg select-none">
      <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
        Slash Commands
      </div>
      <div className="space-y-0.5">
        {props.items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={index}
              onClick={() => selectItem(index)}
              className={cn(
                'flex h-12 w-full cursor-pointer items-center gap-3 rounded-lg px-2.5 text-left transition-colors',
                isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50',
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                  isSelected ? 'bg-white shadow-xs' : 'bg-slate-100',
                )}
              >
                {getIcon(item.iconName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm leading-tight font-semibold">{item.name}</div>
                <div className="mt-0.5 truncate text-xs leading-tight text-slate-400">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

SlashCommandMenu.displayName = 'SlashCommandMenu';
