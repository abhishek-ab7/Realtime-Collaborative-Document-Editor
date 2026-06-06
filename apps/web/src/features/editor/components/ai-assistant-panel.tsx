import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Loader2, Wand2 } from 'lucide-react';
import type { Editor as TipTapEditor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  editor: TipTapEditor | null;
  documentTitle: string;
}

export function AIAssistantPanel({
  isOpen,
  onClose,
  documentId,
  editor,
  documentTitle,
}: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      sender: 'ai',
      text: 'Hello! I am your AI writing assistant. I can analyze this document, rewrite sections, fix grammar, or answer questions about the content. What would you like to do?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isPending, setIsPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle listening for event from slash command
  useEffect(() => {
    const handleSlashEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const initialPrompt = customEvent.detail?.prompt || '';
      if (initialPrompt) {
        handleSendPrompt(`Improve this block: ${initialPrompt}`);
      }
    };
    window.addEventListener('open-ai-assistant', handleSlashEvent);
    return () => window.removeEventListener('open-ai-assistant', handleSlashEvent);
  }, [editor]);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isPending) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: promptText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsPending(true);

    try {
      const context = editor?.getText() || '';
      const response = await fetch(`/api/documents/${documentId}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: promptText, context, title: documentTitle }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI response');
      }

      const data = await response.json();
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: data.text || 'No suggestion received.',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      toast.error('AI assistant failed to generate response');
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Sorry, I encountered an error communicating with the AI service. Please verify your API keys and configuration.',
        },
      ]);
    } finally {
      setIsPending(false);
    }
  };

  const handleQuickAction = (action: string) => {
    let promptText = '';
    switch (action) {
      case 'summarize':
        promptText = 'Summarize this document';
        break;
      case 'grammar':
        promptText = 'Fix grammar and spelling';
        break;
      case 'concise':
        promptText = 'Make this document more concise';
        break;
      case 'title':
        promptText = 'Suggest a better title for this document';
        break;
      case 'continue':
        promptText = 'Continue writing from here';
        break;
      default:
        return;
    }
    handleSendPrompt(promptText);
  };

  const handleApply = (text: string) => {
    if (!editor) {
      toast.error('Editor is not ready');
      return;
    }
    try {
      // Insert the exact AI response text at the cursor position
      editor.chain().focus().insertContent(text).run();
      toast.success('AI suggestion applied to document');
    } catch (err) {
      console.error(err);
      toast.error('Failed to apply text');
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="absolute top-0 right-0 bottom-0 z-45 flex h-full w-full max-w-[320px] shrink-0 flex-col border-l border-[#e2e8f0] bg-white shadow-xl transition-all duration-200 ease-in-out lg:relative lg:w-[320px] lg:shadow-none">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#e2e8f0] bg-white p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 fill-indigo-100 text-indigo-600" />
          <div>
            <h3 className="text-sm font-bold text-[#191c1e]">AI Writing Assistant</h3>
            <p className="text-[10px] font-medium text-slate-400">Powered by Gemini AI</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex cursor-pointer items-center justify-center rounded-md p-1 text-[#464555] transition-colors hover:bg-[#eceef0] active:opacity-80"
          title="Close assistant"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Actions Panel */}
      <div className="border-b border-[#e2e8f0] bg-slate-50/50 p-3">
        <div className="mb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Quick Actions
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleQuickAction('summarize')}
            className="rounded-md border border-[#e2e8f0] bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            Summarize
          </button>
          <button
            onClick={() => handleQuickAction('grammar')}
            className="rounded-md border border-[#e2e8f0] bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            Fix Grammar
          </button>
          <button
            onClick={() => handleQuickAction('concise')}
            className="rounded-md border border-[#e2e8f0] bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            Make Concise
          </button>
          <button
            onClick={() => handleQuickAction('title')}
            className="rounded-md border border-[#e2e8f0] bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            Suggest Title
          </button>
          <button
            onClick={() => handleQuickAction('continue')}
            className="rounded-md border border-[#e2e8f0] bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            Continue Writing
          </button>
        </div>
      </div>

      {/* Messages Thread */}
      <div ref={scrollRef} className="flex flex-1 flex-col space-y-4 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex max-w-[85%] flex-col gap-1.5 rounded-2xl px-3.5 py-2.5 text-xs shadow-xs',
              msg.sender === 'user'
                ? 'ml-auto self-end rounded-tr-none bg-[#4f46e5] text-white'
                : 'mr-auto self-start rounded-tl-none bg-slate-100 text-slate-800',
            )}
          >
            <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>

            {msg.sender === 'ai' && msg.id !== 'init' && (
              <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                <button
                  onClick={() => handleApply(msg.text)}
                  className="flex cursor-pointer items-center gap-1.5 rounded border border-indigo-100 bg-white px-2 py-1 text-[10px] font-semibold text-indigo-700 shadow-2xs transition-all hover:bg-slate-50 active:scale-95"
                >
                  <Wand2 className="h-3 w-3" /> Apply to document
                </button>
                {msg.text.toLowerCase().includes('title') ||
                messages
                  .find((m) => m.id === (parseInt(msg.id) - 1).toString())
                  ?.text.toLowerCase()
                  .includes('title') ||
                msg.text.match(/\d\.\s+[^\n]+/) ? (
                  <button
                    onClick={() => {
                      let suggestedTitle = '';
                      const quoteMatch = msg.text.match(/"([^"]+)"/);
                      const listMatch = msg.text.match(/\d\.\s+([^\n]+)/);
                      if (quoteMatch) {
                        suggestedTitle = quoteMatch[1];
                      } else if (listMatch) {
                        suggestedTitle = listMatch[1];
                      } else {
                        suggestedTitle = msg.text
                          .split('\n')[0]
                          .replace(/Title Suggestion:?/i, '')
                          .trim();
                      }

                      const newTitle = prompt(
                        'Confirm title to apply:',
                        suggestedTitle || msg.text,
                      );
                      if (newTitle && newTitle.trim()) {
                        window.dispatchEvent(
                          new CustomEvent('update-document-title', {
                            detail: { title: newTitle.trim() },
                          }),
                        );
                        toast.success('Title updated');
                      }
                    }}
                    className="flex cursor-pointer items-center gap-1.5 rounded border border-indigo-100 bg-white px-2 py-1 text-[10px] font-semibold text-indigo-700 shadow-2xs transition-all hover:bg-slate-50 active:scale-95"
                  >
                    <Wand2 className="h-3 w-3" /> Apply as title
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ))}
        {isPending && (
          <div className="mr-auto flex max-w-[85%] items-center gap-2 self-start rounded-2xl rounded-tl-none bg-slate-100 px-3.5 py-2.5 text-xs text-slate-500 shadow-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" />
            Generating response...
          </div>
        )}
      </div>

      {/* Prompt Input Form */}
      <div className="sticky bottom-0 border-t border-[#e2e8f0] bg-white p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendPrompt(input);
          }}
          className="relative"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isPending}
            className="w-full rounded-lg border-none bg-[#f2f4f6] py-2 pr-10 pl-4 text-xs transition-all outline-none focus:bg-white focus:ring-2 focus:ring-[#3525cd] disabled:opacity-60"
            placeholder="Ask AI anything about your document..."
          />
          <button
            type="submit"
            disabled={!input.trim() || isPending}
            className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-[#3525cd] transition-colors hover:bg-[#eceef0] disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
