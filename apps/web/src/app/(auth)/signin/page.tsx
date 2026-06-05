import Link from 'next/link';
import { AuthForm } from '@/features/auth/components/auth-form';
import type { Metadata } from 'next';
import { RefreshCw, MousePointer, History } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Collabdoc with your account.',
};

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;

  return (
    <div className="flex w-full flex-col items-center gap-8">
      {/* Main Sign In Card */}
      <div className="flex w-full flex-col items-center rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-8 text-center shadow-[var(--shadow-md)]">
        {/* Logo */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)] text-white shadow-[var(--shadow-sm)]">
          <svg
            className="h-9 w-9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>

        {/* Typography */}
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Welcome back
        </h1>
        <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
          Sign in to start collaborating
        </p>

        {/* Error Message */}
        {params.error && (
          <div className="mb-6 w-full rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-3 text-center text-sm text-[var(--color-error)]">
            {params.error === 'OAuthSignin' && 'Could not start Google sign-in. Please try again.'}
            {params.error === 'OAuthCallback' &&
              'Something went wrong during sign-in. Please try again.'}
            {params.error === 'Default' && 'An unexpected error occurred. Please try again.'}
            {params.error !== 'OAuthSignin' &&
              params.error !== 'OAuthCallback' &&
              params.error !== 'Default' &&
              'Authentication failed. Please try again.'}
          </div>
        )}

        {/* Action Button */}
        <AuthForm view="signin" callbackUrl={params.callbackUrl} />

        <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
          Don't have an account?{' '}
          <Link
            href="/signup"
            className="font-medium text-[var(--color-brand-primary)] hover:underline"
          >
            Sign up
          </Link>
        </p>

        {/* Fine Print */}
        <p className="mt-6 text-xs text-[var(--color-text-tertiary)]">
          By signing in, you agree to our{' '}
          <a href="#" className="font-medium text-[var(--color-brand-primary)] hover:underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="font-medium text-[var(--color-brand-primary)] hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>

      {/* Features Row */}
      <div className="flex w-full items-start justify-between px-4 text-center">
        <div className="flex max-w-[110px] flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)] shadow-sm">
            <RefreshCw className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Real-time sync
          </span>
        </div>
        <div className="flex max-w-[110px] flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)] shadow-sm">
            <MousePointer className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Live cursors
          </span>
        </div>
        <div className="flex max-w-[110px] flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)] shadow-sm">
            <History className="h-5 w-5" />
          </div>
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Version history
          </span>
        </div>
      </div>
    </div>
  );
}
