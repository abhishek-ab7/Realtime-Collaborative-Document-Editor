import { createClient } from '@/utils/supabase/server';
import { prisma } from '@collabdoc/database';

export async function auth() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  // Auto-sync user to local database
  try {
    await prisma.user.upsert({
      where: { id: session.user.id },
      update: {
        email: session.user.email!,
        name: session.user.user_metadata?.full_name || null,
        avatarUrl: session.user.user_metadata?.avatar_url || null,
      },
      create: {
        id: session.user.id,
        email: session.user.email!,
        name: session.user.user_metadata?.full_name || null,
        avatarUrl: session.user.user_metadata?.avatar_url || null,
      },
    });
  } catch (err) {
    console.error('Failed to sync user to local database:', err);
  }

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
