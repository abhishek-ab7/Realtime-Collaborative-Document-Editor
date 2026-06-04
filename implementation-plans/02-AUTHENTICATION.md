# Phase 02 — Authentication & Session Management

> **Days:** 4–7  
> **Status:** ⬜ Not Started  
> **Dependencies:** Phase 01 (Foundation)  
> **Milestone:** M2-AUTHENTICATION  
> **PRD Sections:** 5.1 (Authentication), 11 (Security Design)

---

## Table of Contents

1. [Phase Objective](#1-phase-objective)
2. [Day-by-Day Breakdown](#2-day-by-day-breakdown)
3. [Architecture Decisions](#3-architecture-decisions)
4. [Detailed File Specifications](#4-detailed-file-specifications)
5. [Stitch MCP — Sign-In Page Design](#5-stitch-mcp--sign-in-page-design)
6. [OAuth Flow — Complete Walkthrough](#6-oauth-flow--complete-walkthrough)
7. [Socket.io Auth Token Strategy](#7-socketio-auth-token-strategy)
8. [Testing Requirements](#8-testing-requirements)
9. [Acceptance Criteria](#9-acceptance-criteria)
10. [Security Checklist](#10-security-checklist)

---

## 1. Phase Objective

Implement complete Google OAuth authentication using Auth.js v5 with:

- Prisma adapter for database-backed sessions
- Protected routes via Next.js middleware
- User profile display (avatar, name, email)
- Sign-in / sign-out flow
- JWT-based auth token for Socket.io cross-origin authentication
- Stitch MCP-designed sign-in page

**After this phase, all routes under `/dashboard` and `/d/*` are protected behind Google OAuth.**

---

## 2. Day-by-Day Breakdown

### Day 4: Auth.js Core Setup + Google OAuth

| #   | Task                                                    | Est. Time | Output                             |
| --- | ------------------------------------------------------- | --------- | ---------------------------------- |
| 4.1 | Install Auth.js + Prisma adapter dependencies           | 10 min    | Updated `package.json`             |
| 4.2 | Create Auth.js configuration (`src/lib/auth.ts`)        | 60 min    | Full Auth.js config                |
| 4.3 | Create Auth.js API route handler                        | 10 min    | `api/auth/[...nextauth]/route.ts`  |
| 4.4 | Set up Google OAuth credentials in GCP Console          | 30 min    | Client ID + Secret in `.env.local` |
| 4.5 | Generate `AUTH_SECRET`                                  | 5 min     | `npx auth secret`                  |
| 4.6 | Test sign-in flow end-to-end (manual)                   | 20 min    | Successful Google sign-in          |
| 4.7 | Verify user created in PostgreSQL                       | 10 min    | Check `users` + `accounts` tables  |
| 4.8 | Configure Auth.js session callbacks for userId exposure | 30 min    | Session includes `userId`          |

**Day 4 Total: ~3 hours**

#### Commands

```bash
cd apps/web
npm install next-auth@beta @auth/prisma-adapter
npm install jsonwebtoken
npm install -D @types/jsonwebtoken

# Generate AUTH_SECRET
npx auth secret
```

### Day 5: Middleware + Protected Routes + User Menu

| #   | Task                                            | Est. Time | Output                          |
| --- | ----------------------------------------------- | --------- | ------------------------------- |
| 5.1 | Create Next.js middleware for route protection  | 45 min    | `src/middleware.ts`             |
| 5.2 | Create auth feature module directory structure  | 10 min    | `src/features/auth/`            |
| 5.3 | Build `SignInButton` component (Google branded) | 30 min    | `components/sign-in-button.tsx` |
| 5.4 | Build `UserMenu` component (avatar dropdown)    | 45 min    | `components/user-menu.tsx`      |
| 5.5 | Build `AuthGuard` wrapper component             | 20 min    | `components/auth-guard.tsx`     |
| 5.6 | Create `useSession` typed hook                  | 15 min    | `hooks/use-session.ts`          |
| 5.7 | Install shadcn/ui components needed for auth UI | 15 min    | Button, Avatar, DropdownMenu    |
| 5.8 | Test middleware redirects unauthenticated users | 15 min    | Manual verification             |

**Day 5 Total: ~3.5 hours**

#### Commands

```bash
# Install shadcn/ui components
cd apps/web
npx shadcn@latest add button
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add separator
npx shadcn@latest add skeleton
```

### Day 6: Sign-In Page (Stitch MCP Design) + Sign-Out + Profile

| #   | Task                                           | Est. Time | Output                                 |
| --- | ---------------------------------------------- | --------- | -------------------------------------- |
| 6.1 | **Stitch MCP**: Generate sign-in page design   | 30 min    | `.stitch/designs/signin.html` + `.png` |
| 6.2 | Build sign-in page matching Stitch design      | 60 min    | `src/app/(auth)/signin/page.tsx`       |
| 6.3 | Create auth layout (centered, minimal)         | 20 min    | `src/app/(auth)/layout.tsx`            |
| 6.4 | Implement sign-out functionality               | 15 min    | Server Action + redirect               |
| 6.5 | Create user settings page (basic profile view) | 30 min    | `src/app/(app)/settings/page.tsx`      |
| 6.6 | Add error handling for auth failures           | 30 min    | Error pages, toast notifications       |
| 6.7 | Create auth loading states                     | 15 min    | Skeleton components                    |

**Day 6 Total: ~3.5 hours**

### Day 7: Socket.io Auth Token + Tests + Polish

| #   | Task                                                | Est. Time | Output                                      |
| --- | --------------------------------------------------- | --------- | ------------------------------------------- |
| 7.1 | Create Socket.io JWT token generation Server Action | 45 min    | `actions/generate-socket-token.ts`          |
| 7.2 | Create token validation utility for socket server   | 30 min    | `apps/socket-server/src/middleware/auth.ts` |
| 7.3 | Write unit tests for auth components                | 45 min    | 8–10 tests                                  |
| 7.4 | Write integration tests for auth API routes         | 45 min    | 5–8 tests                                   |
| 7.5 | Write integration test for session validation       | 20 min    | 2–3 tests                                   |
| 7.6 | Polish sign-in page animations/transitions          | 20 min    | CSS transitions                             |
| 7.7 | Git commit: "M2: Authentication complete"           | 5 min     | Clean commit                                |

**Day 7 Total: ~3.5 hours**

---

## 3. Architecture Decisions

### Session Strategy: Database Sessions (not JWT)

| Factor      | JWT Sessions                           | Database Sessions (chosen)                 |
| ----------- | -------------------------------------- | ------------------------------------------ |
| Revocation  | Cannot revoke individual sessions      | Instant revocation by deleting from DB     |
| Server load | Stateless, no DB hit                   | Requires DB query per request              |
| Size        | Large cookies (1-2 KB)                 | Small session token cookie                 |
| Security    | Token theft = full access until expiry | Can invalidate stolen sessions immediately |
| Scalability | Better for high-traffic                | Acceptable with connection pooling         |

**Decision:** Database sessions via Prisma adapter. Security benefits outweigh the minor DB overhead.

### Cross-Origin Socket.io Auth: Short-Lived JWT

The Socket.io server is on a different origin than the Next.js app. The Auth.js session cookie cannot be read cross-origin. Solution:

```
Next.js App                           Socket.io Server
┌──────────────┐                      ┌──────────────────┐
│              │                      │                  │
│  1. Client   │  ── fetch token ──▶  │                  │
│     calls    │                      │                  │
│     Server   │  ◀── JWT (5min) ───  │                  │
│     Action   │                      │                  │
│              │                      │                  │
│  2. Client   │  ── connect(jwt) ──▶ │  3. Validate JWT │
│     opens    │                      │     with shared  │
│     socket   │                      │     secret       │
│              │  ◀── authenticated ─ │                  │
└──────────────┘                      └──────────────────┘
```

**JWT payload:**

```typescript
{
  userId: string;
  email: string;
  name: string;
  avatarUrl: string;
  iat: number; // issued at
  exp: number; // expires in 5 minutes
}
```

---

## 4. Detailed File Specifications

### 4.1 Auth.js Configuration

#### `apps/web/src/lib/auth.ts`

```typescript
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@collabdoc/database';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      // Request profile and email scopes
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  pages: {
    signIn: '/signin',
    error: '/signin', // Redirect auth errors to sign-in page
  },
  callbacks: {
    // Expose userId in the session object
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    // Control access — return true to allow sign-in
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        return !!profile?.email_verified;
      }
      return true;
    },
  },
  events: {
    async createUser({ user }) {
      // Log new user creation (optional: send welcome email)
      console.log(`New user created: ${user.email}`);
    },
  },
});
```

#### `apps/web/src/lib/auth.d.ts` — Type Augmentation

```typescript
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
```

### 4.2 API Route Handler

#### `apps/web/src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '@/lib/auth';
export const { GET, POST } = handlers;
```

### 4.3 Middleware

#### `apps/web/src/middleware.ts`

```typescript
import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Public routes — no auth required
  const publicRoutes = ['/', '/signin', '/api/auth'];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  if (isPublicRoute) return NextResponse.next();

  // Protected routes — require auth
  const protectedRoutes = ['/dashboard', '/d/', '/settings', '/trash'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !req.auth) {
    const signInUrl = new URL('/signin', req.nextUrl.origin);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - Public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
};
```

### 4.4 Auth Components

#### `apps/web/src/features/auth/components/sign-in-button.tsx`

```tsx
'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SignInButtonProps {
  callbackUrl?: string;
}

export function SignInButton({ callbackUrl = '/dashboard' }: SignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch (error) {
      console.error('Sign-in error:', error);
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      variant="outline"
      size="lg"
      className="w-full gap-3 text-base font-medium"
      data-testid="sign-in-google"
    >
      {/* Google SVG icon */}
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
      {isLoading ? 'Signing in...' : 'Continue with Google'}
    </Button>
  );
}
```

#### `apps/web/src/features/auth/components/user-menu.tsx`

```tsx
'use client';

import { signOut, useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';
import Link from 'next/link';

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const initials =
    session.user.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '??';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full ring-2 ring-transparent transition-all hover:ring-[var(--color-brand-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-brand-primary)] focus-visible:outline-none"
          data-testid="user-menu-trigger"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ''} />
            <AvatarFallback className="bg-[var(--color-brand-primary)] text-xs text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">{session.user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/signin' })}
          className="cursor-pointer text-[var(--color-error)]"
          data-testid="sign-out-button"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### `apps/web/src/features/auth/hooks/use-session.ts`

```typescript
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
```

### 4.5 Sign-In Page

#### `apps/web/src/app/(auth)/layout.tsx`

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] px-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

#### `apps/web/src/app/(auth)/signin/page.tsx`

```tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { SignInButton } from '@/features/auth/components/sign-in-button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to Collabdoc with your Google account.',
};

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  const params = await searchParams;

  // If already authenticated, redirect to dashboard
  if (session) {
    redirect(params.callbackUrl ?? '/dashboard');
  }

  return (
    <div className="space-y-8">
      {/* Logo + Title */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-primary)]">
          <svg
            className="h-8 w-8 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Welcome to Collabdoc
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Sign in to start collaborating on documents in real time.
        </p>
      </div>

      {/* Error Message */}
      {params.error && (
        <div className="rounded-lg border border-[var(--color-error)]/20 bg-[var(--color-error)]/5 p-3 text-center text-sm text-[var(--color-error)]">
          {params.error === 'OAuthSignin' && 'Could not start Google sign-in. Please try again.'}
          {params.error === 'OAuthCallback' &&
            'Something went wrong during sign-in. Please try again.'}
          {params.error === 'Default' && 'An unexpected error occurred. Please try again.'}
        </div>
      )}

      {/* Sign-In Card */}
      <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-6 shadow-[var(--shadow-lg)]">
        <SignInButton callbackUrl={params.callbackUrl} />
        <p className="mt-4 text-center text-xs text-[var(--color-text-tertiary)]">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>

      {/* Features hint */}
      <div className="grid grid-cols-3 gap-4 text-center text-xs text-[var(--color-text-tertiary)]">
        <div>
          <div className="mb-1 text-lg">⚡</div>
          Real-time sync
        </div>
        <div>
          <div className="mb-1 text-lg">👥</div>
          Live cursors
        </div>
        <div>
          <div className="mb-1 text-lg">📜</div>
          Version history
        </div>
      </div>
    </div>
  );
}
```

### 4.6 Session Provider Wrapper

#### `apps/web/src/components/providers/session-provider.tsx`

```tsx
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

Update root layout to include the provider:

```tsx
// In apps/web/src/app/layout.tsx, wrap {children} with:
import { SessionProvider } from '@/components/providers/session-provider';

// ... inside <body>:
<SessionProvider>{children}</SessionProvider>;
```

---

## 5. Stitch MCP — Sign-In Page Design

### Stitch Generation Prompt

```
Generate a sign-in page for 'Collabdoc', a collaborative document editor.
Centered card layout on a subtle gray background (#f8fafc). The card has:
- A branded icon (document icon in indigo #6366f1 rounded square)
- "Welcome to Collabdoc" heading in 24px semibold dark text
- "Sign in to start collaborating" subtitle in 14px gray text
- A large "Continue with Google" button with Google logo, outlined style
- Fine print "By signing in, you agree to our Terms" below the button
Below the card: 3 small feature icons (real-time sync, live cursors, version history)
Modern, clean, professional. Indigo accent color. Inter font.
```

### Process

1. Call Stitch `generate_screen_from_text` with above prompt
2. Download HTML to `.stitch/designs/signin.html`
3. Download screenshot to `.stitch/designs/signin.png`
4. Use as pixel-perfect reference for `signin/page.tsx`
5. Update `.stitch/SITE.md` sitemap: `[x] Sign-In Page`

---

## 6. OAuth Flow — Complete Walkthrough

```
┌─────────────────────────────────────────────────────────────────────┐
│                    GOOGLE OAUTH FLOW (DETAILED)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Step 1: User clicks "Continue with Google"                         │
│  ├── Browser calls: POST /api/auth/signin/google                    │
│  ├── Auth.js generates:                                             │
│  │   ├── state parameter (CSRF protection)                          │
│  │   ├── PKCE code_verifier + code_challenge                        │
│  │   └── nonce for ID token validation                              │
│  └── Redirects to: https://accounts.google.com/o/oauth2/v2/auth     │
│       ├── client_id={AUTH_GOOGLE_ID}                                │
│       ├── redirect_uri=http://localhost:3000/api/auth/callback/google│
│       ├── scope=openid email profile                                │
│       ├── response_type=code                                        │
│       ├── state={csrf_state}                                        │
│       └── code_challenge={pkce_challenge}                           │
│                                                                     │
│  Step 2: User authenticates with Google                             │
│  ├── Google shows consent screen                                    │
│  ├── User approves access                                          │
│  └── Google redirects to:                                           │
│       /api/auth/callback/google?code={auth_code}&state={csrf_state} │
│                                                                     │
│  Step 3: Auth.js handles callback                                   │
│  ├── Validates state parameter (CSRF check)                         │
│  ├── Exchanges auth_code for tokens:                                │
│  │   ├── POST https://oauth2.googleapis.com/token                   │
│  │   ├── Body: { code, client_id, client_secret, redirect_uri }     │
│  │   └── Response: { access_token, id_token, refresh_token }        │
│  ├── Validates id_token (signature, expiry, audience)               │
│  ├── Extracts user profile from id_token:                           │
│  │   ├── email, name, picture, email_verified                       │
│  │   └── sub (Google user ID)                                       │
│  └── Calls signIn callback → verifies email_verified === true       │
│                                                                     │
│  Step 4: Prisma Adapter creates/updates database records            │
│  ├── Upserts into `users` table:                                    │
│  │   └── { email, name, avatar_url, email_verified }                │
│  ├── Upserts into `accounts` table:                                 │
│  │   └── { provider: 'google', providerAccountId: sub, tokens... }  │
│  └── Creates `sessions` record:                                     │
│       └── { sessionToken: random, userId, expires: now + 30 days }  │
│                                                                     │
│  Step 5: Set session cookie                                         │
│  ├── Cookie name: authjs.session-token                              │
│  ├── Cookie value: sessionToken from DB                             │
│  ├── Flags: httpOnly, secure (in prod), sameSite=lax                │
│  └── Max-Age: 30 days                                               │
│                                                                     │
│  Step 6: Redirect to callbackUrl (default: /dashboard)              │
│                                                                     │
│  SUBSEQUENT REQUESTS:                                               │
│  ├── Browser sends session cookie automatically                     │
│  ├── Middleware calls auth() → queries sessions table                │
│  ├── Joins with users table → returns { user: { id, name, email } } │
│  └── Session object available in Server Components + API routes     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Socket.io Auth Token Strategy

### Token Generation (Server Action)

#### `apps/web/src/features/auth/actions/generate-socket-token.ts`

```typescript
'use server';

import jwt from 'jsonwebtoken';
import { auth } from '@/lib/auth';

const SOCKET_AUTH_SECRET = process.env.SOCKET_AUTH_SECRET!;
const TOKEN_EXPIRY = '5m'; // Short-lived for security

export interface SocketAuthPayload {
  userId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export async function generateSocketToken(): Promise<string | null> {
  const session = await auth();
  if (!session?.user) return null;

  const payload: SocketAuthPayload = {
    userId: session.user.id,
    email: session.user.email!,
    name: session.user.name!,
    avatarUrl: session.user.image ?? null,
  };

  return jwt.sign(payload, SOCKET_AUTH_SECRET, {
    expiresIn: TOKEN_EXPIRY,
    issuer: 'collabdoc-web',
    audience: 'collabdoc-socket',
  });
}
```

### Token Validation (Socket.io Server Middleware)

#### `apps/socket-server/src/middleware/auth.ts`

```typescript
import jwt from 'jsonwebtoken';
import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';

const SOCKET_AUTH_SECRET = process.env.SOCKET_AUTH_SECRET!;

export interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
  userName: string;
  userAvatarUrl: string | null;
}

export function socketAuthMiddleware(socket: Socket, next: (err?: ExtendedError) => void) {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    return next(new Error('Authentication required: no token provided'));
  }

  try {
    const payload = jwt.verify(token, SOCKET_AUTH_SECRET, {
      issuer: 'collabdoc-web',
      audience: 'collabdoc-socket',
    }) as jwt.JwtPayload & {
      userId: string;
      email: string;
      name: string;
      avatarUrl: string | null;
    };

    // Attach user info to socket
    (socket as AuthenticatedSocket).userId = payload.userId;
    (socket as AuthenticatedSocket).userEmail = payload.email;
    (socket as AuthenticatedSocket).userName = payload.name;
    (socket as AuthenticatedSocket).userAvatarUrl = payload.avatarUrl;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error('Authentication failed: token expired'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error('Authentication failed: invalid token'));
    }
    return next(new Error('Authentication failed'));
  }
}
```

---

## 8. Testing Requirements

### Unit Tests

| Test File                                         | Tests | Description                                                         |
| ------------------------------------------------- | ----- | ------------------------------------------------------------------- |
| `features/auth/__tests__/sign-in-button.test.tsx` | 3     | Renders button, shows loading state, handles click                  |
| `features/auth/__tests__/user-menu.test.tsx`      | 4     | Renders avatar, shows dropdown, displays name/email, sign-out works |
| `features/auth/__tests__/auth-guard.test.tsx`     | 2     | Shows children when authenticated, redirects when not               |
| `features/auth/__tests__/use-session.test.ts`     | 3     | Returns typed user, handles loading, handles unauthenticated        |

### Integration Tests

| Test File                             | Tests | Description                                                                                      |
| ------------------------------------- | ----- | ------------------------------------------------------------------------------------------------ |
| `__tests__/api/auth.test.ts`          | 3     | Session endpoint returns user, returns 401 when unauthenticated, handles expired session         |
| `__tests__/auth/socket-token.test.ts` | 4     | Generates valid JWT, rejects without session, token expires in 5 min, validates on socket server |
| `__tests__/auth/middleware.test.ts`   | 3     | Redirects unauthenticated to /signin, allows authenticated requests, passes callbackUrl          |

**Phase 2 Test Total: ~22 tests**

---

## 9. Acceptance Criteria

| #   | Criterion                                                    | Verification                              |
| --- | ------------------------------------------------------------ | ----------------------------------------- |
| 1   | User can click "Continue with Google" and authenticate       | Manual: complete OAuth flow               |
| 2   | After sign-in, user is redirected to `/dashboard`            | Observe redirect                          |
| 3   | Unauthenticated visit to `/dashboard` redirects to `/signin` | Open incognito, visit `/dashboard`        |
| 4   | Session persists after browser restart                       | Close browser, reopen, visit `/dashboard` |
| 5   | User menu shows name, email, and avatar                      | Visual inspection                         |
| 6   | Sign-out redirects to `/signin` and clears session           | Click sign-out, try visiting `/dashboard` |
| 7   | Socket.io auth token generates successfully                  | Call Server Action, inspect JWT           |
| 8   | Socket.io server validates token correctly                   | Connect with valid/invalid tokens         |
| 9   | Sign-in page matches Stitch design reference                 | Compare screenshot to implementation      |
| 10  | All 22 tests pass                                            | `npm run test`                            |
| 11  | Auth error states display correctly                          | Test with invalid OAuth callback          |

---

## 10. Security Checklist

- [ ] Session cookie has `httpOnly` flag
- [ ] Session cookie has `secure` flag (in production)
- [ ] Session cookie has `sameSite=lax`
- [ ] CSRF protection enabled (Auth.js default)
- [ ] Email verification checked before sign-in (`email_verified === true`)
- [ ] Socket.io JWT has short expiry (5 minutes)
- [ ] Socket.io JWT uses separate secret from Auth.js
- [ ] Auth middleware covers all protected routes
- [ ] No user PII logged in server logs
- [ ] Google OAuth redirect URI matches exactly
- [ ] `AUTH_SECRET` generated with sufficient entropy
- [ ] No credentials committed to Git
