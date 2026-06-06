'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2, Home, Settings, Plus, Loader2 } from 'lucide-react';
import { createDocument } from '@/features/documents/actions/document-actions';
import { cn } from '@/lib/utils';

export function AppNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleCreate = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const doc = await createDocument();
      if (doc?.id) {
        router.push(`/d/${doc.id}`);
      }
    } catch (error) {
      console.error('Failed to create document:', error);
      setIsPending(false);
    }
  };

  const navItems = [
    { href: '/dashboard', label: 'Home', icon: Home },
    { href: '/trash', label: 'Trash', icon: Trash2 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r border-[#e2e8f0] bg-white/50 p-6 md:flex">
        <div className="flex flex-col gap-1">
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:bg-[#4f46e5]/5 hover:text-[#4f46e5]',
              pathname === '/dashboard' ? 'bg-[#4f46e5]/5 text-[#4f46e5]' : 'text-slate-600',
            )}
          >
            <Home className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/trash"
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:bg-[#4f46e5]/5 hover:text-[#4f46e5]',
              pathname === '/trash' ? 'bg-[#4f46e5]/5 text-[#4f46e5]' : 'text-slate-600',
            )}
          >
            <Trash2 className="h-4 w-4" />
            Trash
          </Link>
        </div>

        <div className="mt-auto border-t border-[#e2e8f0] pt-4">
          <Link
            href="/settings"
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:bg-[#4f46e5]/5 hover:text-[#4f46e5]',
              pathname === '/settings' ? 'bg-[#4f46e5]/5 text-[#4f46e5]' : 'text-slate-500',
            )}
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </aside>

      {/* Mobile Floating Action Button (FAB) */}
      <button
        onClick={handleCreate}
        disabled={isPending}
        className="fixed right-6 bottom-[80px] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#4f46e5] text-white shadow-lg transition-all hover:bg-[#4f46e5]/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-80 md:hidden"
        title="Create new document"
      >
        {isPending ? <Loader2 className="h-6 w-6 animate-spin" /> : <Plus className="h-6 w-6" />}
      </button>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="bottom-nav fixed right-0 bottom-0 left-0 z-40 border-t border-[#e2e8f0] bg-white md:hidden">
        <div className="flex h-16 items-center justify-around px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs font-medium transition-colors',
                  isActive ? 'text-[#4f46e5]' : 'text-slate-500 hover:text-[#4f46e5]',
                )}
              >
                <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
