'use client';

import { useSession as useNextAuthSession } from 'next-auth/react';

export interface TypedUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export function useTypedSession() {
  const session = useNextAuthSession();

  return {
    ...session,
    user: session.data?.user as TypedUser | undefined,
    isAuthenticated: session.status === 'authenticated',
    isLoading: session.status === 'loading',
  };
}
