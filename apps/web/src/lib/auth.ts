import { createClient } from '@/utils/supabase/server';

export async function auth() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  return {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.full_name,
      image: session.user.user_metadata?.avatar_url,
    },
    expires: new Date(session.expires_at! * 1000).toISOString(),
    sessionToken: session.access_token,
  };
}
