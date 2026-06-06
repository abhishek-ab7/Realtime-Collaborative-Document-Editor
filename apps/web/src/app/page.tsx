import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  ArrowRight,
  FileText,
  Users,
  Zap,
  CloudOff,
  History,
  Shield,
  Layers,
  Sparkles,
  Star,
} from 'lucide-react';

export default async function Home() {
  const session = await auth();

  // If already authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 selection:bg-indigo-500/10 selection:text-indigo-600 dark:bg-slate-950 dark:text-slate-100">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-full max-w-7xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-600 text-white shadow-md shadow-indigo-500/20">
              <FileText className="h-5.5 w-5.5" />
            </div>
            <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-xl font-bold tracking-tight text-transparent dark:from-white dark:to-slate-300">
              Collabdoc
            </span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              Features
            </a>
            <a
              href="#architecture"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              Architecture
            </a>
            <a
              href="#security"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
            >
              Security
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/signin"
              className="text-sm font-semibold text-slate-700 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/signin"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto flex min-h-[90vh] max-w-7xl items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Announcement Badge */}
          <div className="animate-fade-in inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50/50 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            Real-time conflict-free collaborative editing
          </div>

          {/* Heading */}
          <h1 className="mt-8 max-w-4xl text-4xl leading-[1.1] font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl dark:text-white">
            Create, Edit & Collaborate.{' '}
            <span className="bg-gradient-to-r from-indigo-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              Together in Real-Time.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl dark:text-slate-400">
            A lightning-fast collaborative document editor powered by CRDTs (Yjs) and WebSockets.
            Edit with your team simultaneously, track history, and write without conflicts—even when
            offline.
          </p>

          {/* Actions */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signin"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 active:scale-[0.98]"
            >
              Start Editing Now
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/share/demo-token"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80"
            >
              Try Demo
            </Link>
            <a
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-50 active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80"
            >
              Explore Features
            </a>
          </div>

          {/* Social Proof */}
          <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span>Used by 5,000+ developers</span>
            <span className="mx-1 h-3 w-px bg-slate-300 dark:bg-slate-800" />
            <span>★ 4.9/5 on Product Hunt</span>
          </div>
        </div>

        {/* Live Mockup Editor */}
        <div className="mt-16 sm:mt-20">
          <div className="relative rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Window Chrome Header */}
            <div className="flex items-center justify-between rounded-t-xl border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Project_Briefing.docx
                </span>
              </div>
              <div className="flex items-center gap-4">
                {/* Active users avatar group */}
                <div className="flex -space-x-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    JD
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    SM
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    AH
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 ring-2 ring-white dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-900">
                    +2
                  </div>
                </div>
                <span className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-500" />
                  Live Syncing
                </div>
              </div>
            </div>

            {/* Mock Editor Canvas */}
            <div className="grid min-h-[360px] grid-cols-1 divide-x divide-slate-100 rounded-b-xl bg-white md:grid-cols-4 dark:divide-slate-800 dark:bg-slate-900">
              {/* Document Outline sidebar */}
              <div className="hidden flex-col gap-4 p-4 text-xs md:flex">
                <span className="font-bold tracking-wider text-slate-400 uppercase dark:text-slate-500">
                  Document Outline
                </span>
                <div className="flex flex-col gap-2.5 text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    1. Executive Summary
                  </span>
                  <span className="cursor-pointer pl-3 transition-colors hover:text-slate-900 dark:hover:text-white">
                    1.1 Objectives
                  </span>
                  <span className="cursor-pointer pl-3 transition-colors hover:text-slate-900 dark:hover:text-white">
                    1.2 Scope & Deliverables
                  </span>
                  <span className="cursor-pointer font-semibold transition-colors hover:text-slate-900 dark:hover:text-white">
                    2. Architecture Design
                  </span>
                  <span className="cursor-pointer pl-3 transition-colors hover:text-slate-900 dark:hover:text-white">
                    2.1 Socket Server Protocol
                  </span>
                  <span className="cursor-pointer pl-3 transition-colors hover:text-slate-900 dark:hover:text-white">
                    2.2 CRDT Layer Implementation
                  </span>
                </div>
              </div>

              {/* Rich text body editor area */}
              <div className="col-span-3 p-6 font-serif leading-relaxed text-slate-700 sm:p-8 dark:text-slate-300">
                <h2 className="mb-4 font-sans text-2xl font-bold text-slate-900 dark:text-white">
                  1. Executive Summary
                </h2>
                <p className="mb-4 text-base">
                  Collabdoc is engineered to resolve a classic problem: how to allow multiple team
                  members to edit rich documents synchronously without ever facing sync conflicts or
                  version fragmentation. By using{' '}
                  <span className="rounded bg-indigo-100/70 px-1 py-0.5 font-semibold text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300">
                    Conflict-free Replicated Data Types (CRDTs)
                  </span>
                  , we construct a mathematically guaranteed convergence model.
                </p>
                <div className="relative mb-4 rounded-r-lg border-l-4 border-indigo-500 bg-slate-50 p-4 font-sans text-sm text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                  &quot;The best collaborative experiences feel indistinguishable from editing a
                  local file.&quot;
                </div>

                {/* Simulated Cursors */}
                <p className="relative text-base">
                  Every user interaction is serialized into binary updates and broadcast over secure
                  WebSockets. Cursors represent real-time focus positions. Let&apos;s make sure the
                  {/* Cursor 1: Sarah */}
                  <span className="relative inline-block border-b-2 border-emerald-500 bg-emerald-500/20 px-0.5">
                    sync architecture scales horizontally
                    <span className="absolute -top-6 left-0 inline-flex items-center gap-1 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white shadow-sm">
                      Sarah
                    </span>
                    <span className="absolute top-0 right-0 h-4.5 w-0.5 animate-pulse bg-emerald-500" />
                  </span>{' '}
                  to millions of concurrent rooms. In addition, our offline model guarantees that
                  even when internet connection fluctuates, no content is ever lost.
                  {/* Cursor 2: Alex */}
                  <span className="relative inline-block border-b-2 border-amber-500 bg-amber-500/20 px-0.5">
                    Offline edits are held securely
                    <span className="absolute -top-6 left-0 inline-flex items-center gap-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold whitespace-nowrap text-white shadow-sm">
                      Alex is typing
                    </span>
                    <span className="absolute top-0 right-0 h-4.5 w-0.5 animate-pulse bg-amber-500" />
                  </span>{' '}
                  inside client-side storage (IndexedDB) and automatically unified upon
                  reconnection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Feature Bento Grid */}
      <section
        id="features"
        className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-20 sm:px-6 lg:px-8 dark:border-slate-800"
      >
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Built for High-Performance Collaboration
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600 dark:text-slate-400">
            Every feature is carefully optimized for performance, low latency, and rock-solid data
            integrity.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1: Real-Time Sync */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Zap className="h-6 w-6 animate-pulse" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Real-Time Sync Engine
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Powered by Yjs CRDTs and custom Socket.io providers. Changes merge instantly without
              server locks, assuring 100% data convergence.
            </p>
          </div>

          {/* Feature 2: Active Presence */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Live Presence & Cursors
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Track active collaborators in real time. Live cursor markers, selection overlays, and
              typing indicators make editing together highly interactive.
            </p>
          </div>

          {/* Feature 3: Offline-First */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <CloudOff className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Offline-First Resiliency
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Local document edits are cached immediately to IndexedDB. Once network connectivity
              returns, changes are merged cleanly.
            </p>
          </div>

          {/* Feature 4: Version History */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <History className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Granular Revision History
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Automated document snapshots and differential logs. View highlighted side-by-side
              edits and restore any previous version instantly.
            </p>
          </div>

          {/* Feature 5: Security */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Granular Access Control
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Share securely with custom permissions. Control editing capabilities with fine-grained
              Owner, Editor, or Viewer assignments.
            </p>
          </div>

          {/* Feature 6: Turborepo Monorepo */}
          <div className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/50">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              Modern Monorepo
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Shared schema database abstractions, unified typescript typings, and strict ESLint
              rules enforced across Next.js and socket server.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture Detail Section */}
      <section
        id="architecture"
        className="border-t border-slate-200 bg-slate-100 py-20 dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Performance Architecture
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Engineered for Infinite Scalability
              </h2>
              <p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-400">
                Rather than deploying heavy document server wrappers, Collabdoc uses a optimized
                websocket backend. The socket server handles binary streams of Yjs protocol vectors
                and saves snapshots using a debounced write cycle.
              </p>

              <ul className="mt-8 space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">
                      Debounced Save Strategy:
                    </strong>{' '}
                    Updates write to PostgreSQL with a 2-second hold, protecting your DB from
                    transactional lock exhaustion.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">
                      Room Lifecycle Manager:
                    </strong>{' '}
                    Server rooms teardown immediately when idle, conserving RAM and freeing socket
                    connections.
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓
                  </span>
                  <div>
                    <strong className="text-slate-900 dark:text-white">
                      Sub-50ms Sync Vector:
                    </strong>{' '}
                    Binary synchronization payload guarantees minimal bandwidth overhead and
                    instantaneous UI updates.
                  </div>
                </li>
              </ul>
            </div>

            <div className="relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 font-mono text-xs shadow-inner dark:border-slate-800 dark:bg-slate-950">
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Server Terminal Log
              </span>
              <div className="space-y-1.5 text-slate-600 dark:text-slate-400">
                <p className="text-emerald-600">[info] 🚀 Socket.io server running on port 3001</p>
                <p className="text-slate-500">
                  [debug] connection established - socketId: Ws9x_42la
                </p>
                <p className="text-slate-500">
                  [debug] verifying jwt payload - userId: usr_01jfa721
                </p>
                <p className="text-indigo-500">
                  [info] Room joined: doc_8824f1cf | users online: 3
                </p>
                <p className="text-slate-500">
                  [debug] applied stored state: doc_8824f1cf (2.4 KB)
                </p>
                <p className="text-slate-500">
                  [debug] broadcast Yjs update: 48 bytes &rarr; clients: [Ws9x_42la, As0a_12lo]
                </p>
                <p className="text-slate-500">[debug] schedule save triggered for doc_8824f1cf</p>
                <p className="text-emerald-500">
                  [info] Room state saved to database - doc_8824f1cf (2.5 KB saved)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Ready to experience seamless collaboration?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-slate-600 dark:text-slate-400">
          Sign in now with Google and begin creating documents, editing in real-time, and organizing
          files cleanly.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/signin"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 hover:bg-indigo-500 active:scale-[0.98]"
          >
            Create Your First Document
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Collabdoc Team. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/help" className="hover:underline">
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
