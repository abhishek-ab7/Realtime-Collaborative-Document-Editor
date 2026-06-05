'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AuthFormProps {
  view: 'signin' | 'signup';
  callbackUrl?: string;
}

export function AuthForm({ view, callbackUrl = '/dashboard' }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (view === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback`,
          },
        });
        if (error) throw error;
        // Optionally show success message or redirect
        router.push(callbackUrl);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(callbackUrl);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google sign-in failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-3 text-center text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}
      <form onSubmit={handleEmailAuth} className="w-full space-y-3">
        <Input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          className="w-full"
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          className="w-full"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[var(--color-brand-primary)] text-white hover:bg-[var(--color-brand-primary)]/90"
        >
          {isLoading ? 'Please wait...' : view === 'signin' ? 'Sign In' : 'Sign Up'}
        </Button>
      </form>

      <div className="relative my-4 flex items-center py-2">
        <div className="flex-grow border-t border-[var(--color-border-default)]"></div>
        <span className="mx-4 flex-shrink text-xs text-[var(--color-text-tertiary)] uppercase">
          Or continue with
        </span>
        <div className="flex-grow border-t border-[var(--color-border-default)]"></div>
      </div>

      <Button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        variant="outline"
        className="w-full gap-3 text-base font-medium"
        data-testid="sign-in-google"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google
      </Button>
    </div>
  );
}
