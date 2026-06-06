# Sentry Error Tracking & Crash Reporting

This document details how collabdoc utilizes Sentry to track exceptions, performance bottlenecks, and session replays across client and server runtimes.

## 1. SDK Integration

We integrate Sentry into both the Next.js frontend application (`apps/web`) and the Node.js Socket.io server (`apps/socket-server`).

### Next.js Integration

Next.js uses `@sentry/nextjs` for tracking. The initialization code resides in:

- `apps/web/sentry.client.config.ts` (browser errors)
- `apps/web/sentry.server.config.ts` (Next.js server-side API routes)
- `apps/web/sentry.edge.config.ts` (edge runtime route captures)

To ensure this configuration is loaded before the Next.js runtime mounts, we hook them into `apps/web/src/instrumentation.ts`:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}
```

### Socket Server Integration

In `apps/socket-server/src/index.ts`, we initialize the Node Sentry SDK if a DSN is provided:

```typescript
import * as Sentry from '@sentry/node';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
  logger.info('Sentry initialized on socket server');
}
```

## 2. Configuration Settings

| Property                   | Value        | Description                                                   |
| -------------------------- | ------------ | ------------------------------------------------------------- |
| `dsn`                      | `SENTRY_DSN` | Destination URL for exception tracking payloads               |
| `tracesSampleRate`         | `0.1`        | Captures 10% of transactions for performance metrics          |
| `replaysSessionSampleRate` | `0.1`        | Records video-like playback for 10% of standard user sessions |
| `replaysOnErrorSampleRate` | `1.0`        | Automatically captures session logs leading up to any error   |

## 3. Production Source Maps

We enable Vercel source map uploads during production builds. This ensures that minified Javascript code compiles back to original TypeScript source code inside your Sentry dashboard, making debug traces instantly readable:

```typescript
// apps/web/next.config.ts (or equivalent Next.js configs)
import { withSentryConfig } from '@sentry/nextjs';

export default withSentryConfig(nextConfig, {
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
});
```

**Related Links:**

- [[11-deployment/vercel-setup|Next.js Vercel Setup]]
- [[10-observability/opentelemetry-setup|OpenTelemetry Metrics Setup]]
