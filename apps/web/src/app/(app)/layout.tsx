import Link from 'next/link';
import { UserMenu } from '@/features/auth/components/user-menu';
import { FileText, Trash2, Home, Settings } from 'lucide-react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await auth();

  // Route guard fallback in case middleware is bypassed
  if (!session) {
    redirect('/signin');
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8ff] text-[#131b2e]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#e2e8f0] bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4f46e5] text-white shadow-sm">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <Link
              href="/dashboard"
              className="text-xl font-bold tracking-tight text-[#131b2e] transition-opacity hover:opacity-90"
            >
              Collabdoc
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto flex w-full max-w-7xl flex-grow">
        {/* Sidebar Navigation */}
        <aside className="hidden w-64 flex-col gap-6 border-r border-[#e2e8f0] bg-white/50 p-6 md:flex">
          <div className="flex flex-col gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:bg-[#4f46e5]/5 hover:text-[#4f46e5]"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/trash"
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:bg-[#4f46e5]/5 hover:text-[#4f46e5]"
            >
              <Trash2 className="h-4 w-4" />
              Trash
            </Link>
          </div>

          <div className="mt-auto border-t border-[#e2e8f0] pt-4">
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-[#4f46e5]/5 hover:text-[#4f46e5]"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </aside>

        {/* Content Canvas */}
        <main className="flex flex-grow flex-col overflow-x-hidden p-6 md:p-8">{children}</main>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-[#e2e8f0] bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-xs text-slate-400 sm:flex-row">
          <div className="font-medium">
            © {new Date().getFullYear()} Collabdoc Inc. All rights reserved.
          </div>
          <nav className="flex gap-6">
            <a href="#" className="transition-colors hover:text-[#4f46e5]">
              Privacy Policy
            </a>
            <a href="#" className="transition-colors hover:text-[#4f46e5]">
              Terms of Service
            </a>
            <a href="#" className="transition-colors hover:text-[#4f46e5]">
              Help Center
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
