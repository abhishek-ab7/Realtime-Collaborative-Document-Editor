import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  FileText,
  Sparkles,
  History,
  Share2,
  Printer,
  ArrowLeft,
  X,
  Plus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createDocument } from '@/features/documents/actions/document-actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DocumentItem {
  id: string;
  title: string;
  updatedAt: string | Date;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory?: () => void;
  onOpenAI?: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenHistory, onOpenAI }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch documents on open
  useEffect(() => {
    if (!isOpen) return;

    Promise.resolve().then(() => setIsLoading(true));
    fetch('/api/documents?status=ACTIVE')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch');
      })
      .then((data) => {
        setDocuments(data || []);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        setSelectedIndex(0);
        setQuery('');
      }, 50);
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Command palette items configuration
  const commands = [
    {
      name: 'New Document',
      description: 'Create a brand new collaborative document',
      icon: Plus,
      action: async () => {
        toast.loading('Creating document...');
        try {
          const doc = await createDocument();
          if (doc?.id) {
            router.push(`/d/${doc.id}`);
            onClose();
          }
        } catch {
          toast.error('Failed to create document');
        } finally {
          toast.dismiss();
        }
      },
    },
    {
      name: 'AI Writing Assistant',
      description: 'Open the Claude 3.5 Sonnet side panel',
      icon: Sparkles,
      action: () => {
        onOpenAI?.();
        onClose();
      },
    },
    {
      name: 'Version History',
      description: 'View and restore previous document versions',
      icon: History,
      action: () => {
        onOpenHistory?.();
        onClose();
      },
    },
    {
      name: 'Share Document',
      description: 'Manage collaborator roles and share links',
      icon: Share2,
      action: () => {
        window.dispatchEvent(new CustomEvent('open-share-dialog'));
        onClose();
      },
    },
    {
      name: 'Export as PDF',
      description: 'Open print settings to save document as PDF',
      icon: Printer,
      action: () => {
        window.print();
        toast.success('Print dialog opened');
        onClose();
      },
    },
  ];

  const actions = [
    {
      name: 'Back to Dashboard',
      description: 'Return to your documents list',
      icon: ArrowLeft,
      action: () => {
        router.push('/dashboard');
        onClose();
      },
    },
  ];

  // Filter items based on query
  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(query.toLowerCase()),
  );

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase()),
  );

  const filteredActions = actions.filter((act) =>
    act.name.toLowerCase().includes(query.toLowerCase()),
  );

  // Flattened array of visible items for keyboard navigation index matching
  interface FlatItem {
    type: 'doc' | 'command' | 'action';
    name: string;
    description?: string;
    icon: React.ComponentType<{ className?: string }> | React.ElementType;
    action: () => void;
  }

  const flatItems: FlatItem[] = useMemo(
    () => [
      ...filteredDocs.map(
        (doc): FlatItem => ({
          type: 'doc',
          name: doc.title,
          description: `Last updated: ${new Date(doc.updatedAt).toLocaleDateString()}`,
          icon: FileText,
          action: () => {
            router.push(`/d/${doc.id}`);
            onClose();
          },
        }),
      ),
      ...filteredCommands.map(
        (cmd): FlatItem => ({
          type: 'command',
          name: cmd.name,
          description: cmd.description,
          icon: cmd.icon,
          action: cmd.action,
        }),
      ),
      ...filteredActions.map(
        (act): FlatItem => ({
          type: 'action',
          name: act.name,
          description: act.description,
          icon: act.icon,
          action: act.action,
        }),
      ),
    ],
    [filteredDocs, filteredCommands, filteredActions, router, onClose],
  );

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (flatItems.length === 0 ? 0 : (prev + 1) % flatItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          flatItems.length === 0 ? 0 : (prev + flatItems.length - 1) % flatItems.length,
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          flatItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, flatItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh] backdrop-blur-xs">
      <div
        ref={containerRef}
        className="animate-in fade-in zoom-in-95 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl duration-150"
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 border-b border-[#e2e8f0] px-4 py-3.5">
          <Search className="h-5 w-5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search documents..."
            className="w-full border-none text-sm text-slate-800 placeholder-slate-400 outline-none"
          />
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* List Content */}
        <div className="max-h-[350px] overflow-y-auto p-2">
          {flatItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              {isLoading ? 'Loading documents...' : 'No results found.'}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filtered Sections */}
              {filteredDocs.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Recent Documents
                  </div>
                  {filteredDocs.map((doc, docIdx) => {
                    const globalIdx = docIdx;
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <ItemRow
                        key={doc.id}
                        isSelected={isSelected}
                        title={doc.title}
                        description={`Last updated: ${new Date(doc.updatedAt).toLocaleDateString()}`}
                        icon={FileText}
                        onClick={() => flatItems[globalIdx].action()}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      />
                    );
                  })}
                </div>
              )}

              {filteredCommands.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Commands
                  </div>
                  {filteredCommands.map((cmd, cmdIdx) => {
                    const globalIdx = filteredDocs.length + cmdIdx;
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <ItemRow
                        key={cmd.name}
                        isSelected={isSelected}
                        title={cmd.name}
                        description={cmd.description}
                        icon={cmd.icon}
                        onClick={() => flatItems[globalIdx].action()}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      />
                    );
                  })}
                </div>
              )}

              {filteredActions.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Actions
                  </div>
                  {filteredActions.map((act, actIdx) => {
                    const globalIdx = filteredDocs.length + filteredCommands.length + actIdx;
                    const isSelected = globalIdx === selectedIndex;
                    return (
                      <ItemRow
                        key={act.name}
                        isSelected={isSelected}
                        title={act.name}
                        icon={act.icon}
                        onClick={() => flatItems[globalIdx].action()}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="flex items-center justify-between border-t border-[#e2e8f0] bg-slate-50 px-4 py-2 text-[10px] text-slate-400">
          <div className="flex gap-2">
            <span>↑↓ Navigate</span>
            <span>↵ Enter</span>
          </div>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}

function ItemRow({
  isSelected,
  title,
  description,
  icon: Icon,
  onClick,
  onMouseEnter,
}: {
  isSelected: boolean;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }> | React.ElementType;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
        isSelected ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50/50',
      )}
    >
      <Icon className={cn('h-4 w-4 shrink-0', isSelected ? 'text-indigo-600' : 'text-slate-400')} />
      <div className="min-w-0 flex-1">
        <span className="block text-xs font-semibold">{title}</span>
        {description && (
          <span className="mt-0.5 block truncate text-[10px] text-slate-400">{description}</span>
        )}
      </div>
    </button>
  );
}
