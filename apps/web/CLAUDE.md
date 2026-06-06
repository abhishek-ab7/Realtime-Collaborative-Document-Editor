# apps/web — Next.js App

## CRITICAL: Read AGENTS.md for Next.js version warnings

## Auth System

- Provider: Supabase (NOT NextAuth)
- Session: apps/web/src/lib/auth.ts wraps supabase.auth.getSession()
- Client auth state: apps/web/src/components/providers/session-provider.tsx
- Socket tokens: apps/web/src/features/auth/actions/generate-socket-token.ts

## Important Patterns

- Server Components: use auth() and prisma directly
- Client Components: use useTypedSession() hook for user info
- API routes: always check auth() before DB queries
- Server Actions: marked with 'use server', check auth() first

## Do NOT

- Import from next-auth or @auth/\* packages
- Use localStorage for auth state (use Supabase cookies)
- Create new shadcn components without checking existing ones in components/ui/
