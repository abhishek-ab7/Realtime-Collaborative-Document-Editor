'use client';

import { useAuth } from '@/components/providers/session-provider';

export interface TypedUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export function useTypedSession() {
  const { user, session, isLoading } = useAuth();

  return {
    data: session,
    user: user
      ? ({
          id: user.id,
          name: user.user_metadata?.full_name || '',
          email: user.email || '',
          image: user.user_metadata?.avatar_url || null,
        } as TypedUser)
      : undefined,
    isAuthenticated: !!session,
    isLoading,
  };
}
