'use client';

import { Editor } from '@tiptap/react';
import { FileText } from 'lucide-react';

interface WordCountProps {
  editor: Editor | null;
}

export function WordCount({ editor }: WordCountProps) {
  if (!editor) return null;

  const characterCount = editor.storage.characterCount?.characters?.() ?? 0;
  const wordCount = editor.storage.characterCount?.words?.() ?? 0;

  return (
    <div className="flex items-center gap-3 text-xs text-[#94a3b8]" data-testid="word-count">
      <div className="flex items-center gap-1.5">
        <FileText className="h-3.5 w-3.5" />
        <span>
          <span className="font-medium text-[#475569]" data-testid="word-count-words">
            {wordCount.toLocaleString()}
          </span>{' '}
          {wordCount === 1 ? 'word' : 'words'}
        </span>
      </div>
      <span>·</span>
      <span>
        <span className="font-medium text-[#475569]" data-testid="word-count-chars">
          {characterCount.toLocaleString()}
        </span>{' '}
        {characterCount === 1 ? 'character' : 'characters'}
      </span>
    </div>
  );
}
