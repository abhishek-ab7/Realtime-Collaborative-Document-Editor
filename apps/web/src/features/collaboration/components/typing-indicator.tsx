'use client';

import { usePresence } from '../hooks/use-presence';

export function TypingIndicator() {
  const { typingUsers } = usePresence();

  if (typingUsers.length === 0) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0].name} is typing`
      : typingUsers.length === 2
        ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing`
        : `${typingUsers.length} people are typing`;

  return (
    <div
      className="animate-in fade-in flex items-center gap-1.5 text-xs text-slate-500 duration-200"
      data-testid="typing-indicator"
    >
      <span>{label}</span>
      <span className="mt-0.5 flex items-center gap-0.5">
        <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400" />
      </span>
    </div>
  );
}
