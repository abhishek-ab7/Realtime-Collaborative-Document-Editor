# Collabdoc — Claude Code Configuration

## Quick Context (read this first)

See: docs/ai-context.md — single file with current status, today's task, blockers

## Project Structure

Turborepo monorepo:

- apps/web — Next.js 16, React 19, Supabase auth
- apps/socket-server — Socket.io, Yjs rooms, Node.js
- packages/database — Prisma + PostgreSQL
- packages/shared — Zod schemas, permissions, utilities
- packages/yjs-utils — Custom Yjs socket provider

## Auth Note

Auth is SUPABASE (not NextAuth). The auth() function in apps/web/src/lib/auth.ts
wraps Supabase sessions. Session cookie is handled by Supabase SSR middleware.
Do NOT import from next-auth — it is not used.

## Hard Rules

- TypeScript strict: NEVER use `any` without a comment explaining why
- All API routes must check session via auth() before any DB query
- Socket events must check room membership before processing
- Tests must pass before committing (npm run test)
- Run npm run type-check after every file change

## Current Phase

See docs/PROJECT-STATUS.md for live phase info

## Key Files for Current Task

See docs/ai-context.md
