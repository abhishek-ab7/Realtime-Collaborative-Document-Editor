# Next.js Deployment on Vercel

This guide outlines how to deploy the frontend Next.js application (`apps/web`) within our Turborepo monorepo structure to Vercel.

## 1. Project Configuration

The project uses a custom `vercel.json` file in the Next.js workspace root (`apps/web/vercel.json`) to redirect the Vercel builder to compile from the monorepo root:

```json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && npx turbo build --filter=web",
  "installCommand": "cd ../.. && npm install",
  "outputDirectory": ".next"
}
```

- **Root Directory Setting**: In the Vercel dashboard project settings, configure the **Root Directory** as `apps/web`.
- **Framework Preset**: Select **Next.js**.
- **Build Command**: Vercel will automatically run the custom build command defined above.

## 2. Environment Variables

Configure the following environment variables in the Vercel dashboard:

| Variable                 | Description                                             | Value Example                                                |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| `DATABASE_URL`           | Direct connection string for PostgreSQL (Neon/Supabase) | `postgresql://user:password@hostname/dbname?sslmode=require` |
| `AUTH_SECRET`            | Secret key used to sign Auth.js session cookies         | _Generate via `npx auth secret`_                             |
| `AUTH_GOOGLE_ID`         | Google OAuth Client ID                                  | `client-id.apps.googleusercontent.com`                       |
| `AUTH_GOOGLE_SECRET`     | Google OAuth Client Secret                              | `secret-key`                                                 |
| `AUTH_URL`               | Canonical URL of the production deployment              | `https://collabdoc-web.vercel.app`                           |
| `NEXT_PUBLIC_SOCKET_URL` | Endpoint of the live Socket.io server                   | `https://collabdoc-socket.railway.app`                       |
| `SOCKET_AUTH_SECRET`     | Shared JWT signing key for WebSockets                   | _Generate a secure 32+ character string_                     |
| `GEMINI_API_KEY`         | API Key for Google Gemini AI integrations               | _Your Gemini API Key_                                        |
| `SENTRY_DSN`             | Sentry DSN for server-side error capturing              | `https://key@sentry.io/project`                              |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for client-side error capturing              | `https://key@sentry.io/project`                              |
| `NEXT_PUBLIC_APP_URL`    | App public address (used for redirect paths)            | `https://collabdoc-web.vercel.app`                           |

## 3. Dynamic Editor Optimization

Because the editor bundle (Tiptap + Yjs + Katex + Mermaid) is large, it is dynamically imported with **Server-Side Rendering disabled** via [editor-wrapper.tsx](apps/web/src/app/d/[documentId]/editor-wrapper.tsx):

```typescript
const DocumentEditorClient = dynamic(
  () => import('./document-editor-client').then((m) => m.DocumentEditorClient),
  { ssr: false, loading: () => <EditorLoading /> }
);
```

This ensures fast initial page load times and prevents SSR compile errors for browser-only canvas APIs.

**Related Links:**

- [[11-deployment/railway-setup|Socket Server Railway Setup]]
- [[11-deployment/render-setup|Socket Server Render Setup]]
- [[11-deployment/database-setup|PostgreSQL Database Setup]]
- [[11-deployment/production-checklist|Production Launch Checklist]]
