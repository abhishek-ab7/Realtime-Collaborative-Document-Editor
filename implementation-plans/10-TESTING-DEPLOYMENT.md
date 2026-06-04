# Phase 10 — Testing, Observability & Deployment

> **Days:** 40–49  
> **Status:** ⬜ Not Started  
> **Dependencies:** All previous phases  
> **Milestone:** M10-DEPLOY  
> **PRD Sections:** 10 (Testing), 12 (Observability), 14 (Deployment)

---

## 1. Phase Objective

Complete the project with comprehensive testing coverage (200+ tests), production observability (Sentry + OpenTelemetry), performance optimization (Lighthouse 90+), production deployment (Vercel + Railway + Neon), comprehensive documentation, and production validation. After this phase, **the application is production-ready and live.**

---

## 2. Day-by-Day Breakdown

### Day 40: Test Coverage Gaps + Additional Unit Tests

| #    | Task                                                               | Est. Time | Output          |
| ---- | ------------------------------------------------------------------ | --------- | --------------- |
| 40.1 | Audit test coverage with `vitest --coverage`                       | 20 min    | Coverage report |
| 40.2 | Write missing unit tests for shared package (Zod schemas)          | 30 min    | 10 tests        |
| 40.3 | Write missing unit tests for permissions module                    | 20 min    | 5 tests         |
| 40.4 | Write missing unit tests for UI components (empty states, loading) | 45 min    | 10 tests        |
| 40.5 | Write missing unit tests for hooks                                 | 30 min    | 6 tests         |
| 40.6 | Write edge case tests (boundary values, malformed input)           | 45 min    | 10 tests        |

**Day 40 Total: ~3 hours (41 new tests)**

### Day 41: Integration Test Completion

| #    | Task                                                       | Est. Time | Output  |
| ---- | ---------------------------------------------------------- | --------- | ------- |
| 41.1 | Write integration tests for document search (full-text)    | 20 min    | 3 tests |
| 41.2 | Write integration tests for bulk operations                | 20 min    | 3 tests |
| 41.3 | Write integration tests for activity log queries           | 20 min    | 3 tests |
| 41.4 | Write integration tests for concurrent socket operations   | 45 min    | 5 tests |
| 41.5 | Write integration tests for token refresh and expiry       | 30 min    | 4 tests |
| 41.6 | Write integration tests for database constraint violations | 20 min    | 3 tests |

**Day 41 Total: ~2.5 hours (21 new tests)**

### Day 42: E2E Tests (Playwright)

| #    | Task                                                               | Est. Time | Output                      |
| ---- | ------------------------------------------------------------------ | --------- | --------------------------- |
| 42.1 | Configure Playwright with auth fixture (pre-authenticated state)   | 30 min    | `playwright/auth.setup.ts`  |
| 42.2 | Write E2E: complete user journey (sign in → create → edit → share) | 60 min    | `e2e/user-journey.spec.ts`  |
| 42.3 | Write E2E: real-time collaboration with two browser contexts       | 60 min    | `e2e/collaboration.spec.ts` |
| 42.4 | Write E2E: offline editing and reconnection                        | 45 min    | `e2e/offline.spec.ts`       |
| 42.5 | Write E2E: permission enforcement (viewer cannot edit)             | 30 min    | `e2e/permissions.spec.ts`   |
| 42.6 | Write E2E: version history lifecycle                               | 30 min    | `e2e/versions.spec.ts`      |

**Day 42 Total: ~4 hours (15 new E2E tests)**

#### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      command: 'npm run dev -- --filter=@collabdoc/web',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev -- --filter=@collabdoc/socket-server',
      port: 3001,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

### Day 43: Load Tests + Performance Optimization

| #    | Task                                                      | Est. Time | Output                             |
| ---- | --------------------------------------------------------- | --------- | ---------------------------------- |
| 43.1 | Write k6 WebSocket load test (100 concurrent connections) | 45 min    | `tests/load/websocket.js`          |
| 43.2 | Write k6 API load test (1000 RPS on document list)        | 30 min    | `tests/load/api.js`                |
| 43.3 | Write k6 concurrent editors test (20 editors, 1 document) | 30 min    | `tests/load/concurrent-editors.js` |
| 43.4 | Run Lighthouse audit locally                              | 20 min    | Performance report                 |
| 43.5 | Optimize: code splitting, lazy loading editor             | 30 min    | Dynamic imports                    |
| 43.6 | Optimize: preload fonts, optimize images                  | 20 min    | next/font, next/image              |
| 43.7 | Optimize: memoize expensive components                    | 20 min    | React.memo, useMemo                |

**Day 43 Total: ~3.5 hours**

#### k6 WebSocket Load Test

```javascript
// tests/load/websocket.js
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('ws_errors');
const latency = new Trend('ws_latency');

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 connections
    { duration: '1m', target: 100 }, // Ramp up to 100 connections
    { duration: '2m', target: 100 }, // Hold at 100
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    ws_errors: ['rate<0.01'], // < 1% error rate
    ws_latency: ['p95<100'], // p95 latency < 100ms
  },
};

export default function () {
  const url = `${__ENV.SOCKET_URL || 'ws://localhost:3001'}`;
  const params = { headers: { Authorization: `Bearer ${__ENV.AUTH_TOKEN}` } };

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', () => {
      // Join a room
      const start = Date.now();
      socket.send(
        JSON.stringify({
          event: 'join-room',
          data: 'test-document-id',
        }),
      );

      socket.on('message', (msg) => {
        latency.add(Date.now() - start);
      });
    });

    socket.on('error', (e) => {
      errorRate.add(1);
    });

    // Send periodic updates
    for (let i = 0; i < 10; i++) {
      sleep(1);
      socket.send(
        JSON.stringify({
          event: 'yjs-update',
          data: { documentId: 'test', update: 'simulated' },
        }),
      );
    }

    sleep(5);
    socket.close();
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
}
```

### Day 44: Sentry + OpenTelemetry Integration

| #    | Task                                           | Est. Time | Output                    |
| ---- | ---------------------------------------------- | --------- | ------------------------- |
| 44.1 | Install Sentry SDK for Next.js                 | 15 min    | `@sentry/nextjs`          |
| 44.2 | Configure Sentry client (browser)              | 30 min    | `sentry.client.config.ts` |
| 44.3 | Configure Sentry server (Node.js)              | 30 min    | `sentry.server.config.ts` |
| 44.4 | Configure Next.js instrumentation hook         | 20 min    | `instrumentation.ts`      |
| 44.5 | Add Sentry to Socket.io server                 | 30 min    | Error capture + tracing   |
| 44.6 | Add OpenTelemetry custom metrics               | 45 min    | Gauges + histograms       |
| 44.7 | Add React Error Boundary with Sentry reporting | 20 min    | Global error boundary     |
| 44.8 | Test error capture end-to-end                  | 15 min    | Trigger test error        |

**Day 44 Total: ~3.5 hours**

#### Sentry Configuration (Next.js)

```typescript
// apps/web/sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% of transactions
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
    Sentry.feedbackIntegration({ colorScheme: 'system' }),
  ],
  // Performance tracking
  tracePropagationTargets: ['localhost', /^https:\/\/.*\.vercel\.app/],
});
```

#### OpenTelemetry Custom Metrics

```typescript
// apps/socket-server/src/lib/metrics.ts
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { Resource } from '@opentelemetry/resources';

const resource = new Resource({ 'service.name': 'collabdoc-socket' });
const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter(),
  exportIntervalMillis: 60000, // Export every minute
});

const meterProvider = new MeterProvider({ resource, readers: [metricReader] });
const meter = meterProvider.getMeter('collabdoc-socket');

// ─── Custom Metrics ───
export const activeRoomsGauge = meter.createObservableGauge('collabdoc.active_rooms', {
  description: 'Number of active collaboration rooms',
});

export const activeConnectionsGauge = meter.createObservableGauge('collabdoc.active_connections', {
  description: 'Number of active WebSocket connections',
});

export const yjsSyncLatency = meter.createHistogram('collabdoc.yjs_sync_latency_ms', {
  description: 'Yjs sync operation latency in milliseconds',
  unit: 'ms',
});

export const dbPersistLatency = meter.createHistogram('collabdoc.db_persist_latency_ms', {
  description: 'Database persistence latency in milliseconds',
  unit: 'ms',
});

export const documentSizeBytes = meter.createHistogram('collabdoc.document_size_bytes', {
  description: 'Size of persisted Yjs documents in bytes',
  unit: 'bytes',
});
```

### Day 45: PostgreSQL Provisioning + Vercel Deployment

| #    | Task                                              | Est. Time | Output                   |
| ---- | ------------------------------------------------- | --------- | ------------------------ |
| 45.1 | Create Neon project + production database         | 20 min    | Connection string        |
| 45.2 | Run `prisma migrate deploy` against production DB | 10 min    | Production schema        |
| 45.3 | Connect GitHub repo to Vercel                     | 15 min    | Auto-deploy setup        |
| 45.4 | Configure Vercel environment variables            | 20 min    | All env vars set         |
| 45.5 | Configure Vercel build command for monorepo       | 15 min    | Root dir + build command |
| 45.6 | Deploy and verify Next.js app loads               | 15 min    | Production URL works     |
| 45.7 | Configure custom domain (if available)            | 10 min    | DNS setup                |

**Day 45 Total: ~2 hours**

#### Vercel Configuration

```json
// apps/web/vercel.json
{
  "framework": "nextjs",
  "buildCommand": "cd ../.. && npx turbo build --filter=@collabdoc/web",
  "installCommand": "cd ../.. && npm install",
  "outputDirectory": ".next"
}
```

#### Environment Variables for Vercel

```
DATABASE_URL=postgresql://...@neon-hostname/collabdoc?sslmode=require
AUTH_SECRET=production-secret-from-npx-auth-secret
AUTH_GOOGLE_ID=production-google-client-id
AUTH_GOOGLE_SECRET=production-google-client-secret
AUTH_URL=https://your-domain.com
NEXT_PUBLIC_SOCKET_URL=https://collabdoc-socket.railway.app
SOCKET_AUTH_SECRET=production-shared-jwt-secret
SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Day 46: Socket.io Server Deployment (Railway)

| #    | Task                                              | Est. Time | Output              |
| ---- | ------------------------------------------------- | --------- | ------------------- |
| 46.1 | Create Dockerfile for Socket.io server            | 30 min    | Multi-stage build   |
| 46.2 | Create Railway project from GitHub repo           | 15 min    | Railway project     |
| 46.3 | Configure Railway environment variables           | 15 min    | All env vars set    |
| 46.4 | Configure Railway health check                    | 10 min    | `/health` endpoint  |
| 46.5 | Deploy and verify Socket.io server responds       | 15 min    | Health check passes |
| 46.6 | Test WebSocket connectivity from Vercel → Railway | 15 min    | Cross-origin works  |

**Day 46 Total: ~1.5 hours**

#### Socket.io Server Dockerfile

```dockerfile
# apps/socket-server/Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/socket-server/package.json ./apps/socket-server/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --workspace=@collabdoc/socket-server --include-workspace-root

# Build the project
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/socket-server/node_modules ./apps/socket-server/node_modules
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN cd packages/database && npx prisma generate
RUN cd apps/socket-server && npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

# Copy built files
COPY --from=builder /app/apps/socket-server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3001
CMD ["node", "dist/index.js"]
```

### Day 47: Production Validation + OAuth Callback URLs

| #    | Task                                             | Est. Time | Output                |
| ---- | ------------------------------------------------ | --------- | --------------------- |
| 47.1 | Update Google OAuth callback URLs for production | 15 min    | GCP Console update    |
| 47.2 | Smoke test: sign in with Google (production)     | 10 min    | Verify OAuth works    |
| 47.3 | Smoke test: create document and edit             | 10 min    | Verify editor works   |
| 47.4 | Smoke test: two-browser collaboration            | 20 min    | Verify real-time sync |
| 47.5 | Run Lighthouse on production URL                 | 15 min    | Score targets: 90+    |
| 47.6 | Verify security headers (CSP, HSTS)              | 10 min    | Headers check         |
| 47.7 | Verify Sentry receives errors                    | 10 min    | Trigger test error    |
| 47.8 | Verify source maps uploaded to Sentry            | 15 min    | Readable stack traces |

**Day 47 Total: ~2 hours**

### Day 48: Documentation

| #    | Task                                                      | Est. Time | Output             |
| ---- | --------------------------------------------------------- | --------- | ------------------ |
| 48.1 | Write `README.md` (overview, setup in < 10 min)           | 60 min    | Root README        |
| 48.2 | Write `docs/architecture.md` (system design with Mermaid) | 60 min    | Architecture doc   |
| 48.3 | Write `docs/development.md` (local dev setup)             | 30 min    | Dev guide          |
| 48.4 | Write `docs/deployment.md` (deployment guide)             | 30 min    | Deploy guide       |
| 48.5 | Write `docs/api-reference.md` (API endpoint reference)    | 45 min    | API docs           |
| 48.6 | Create `CONTRIBUTING.md`                                  | 15 min    | Contribution guide |

**Day 48 Total: ~4 hours**

### Day 49: Final Polish + Launch

| #    | Task                                            | Est. Time | Output               |
| ---- | ----------------------------------------------- | --------- | -------------------- |
| 49.1 | Fix any bugs found during production validation | 60 min    | Bug fixes            |
| 49.2 | Run full CI pipeline on production branch       | 15 min    | All green            |
| 49.3 | Create production Git tag (`v1.0.0`)            | 5 min     | Tagged release       |
| 49.4 | Final Lighthouse audit (confirm 90+ scores)     | 15 min    | Performance verified |
| 49.5 | Create a demo video / GIF for README            | 30 min    | Visual demo          |
| 49.6 | Write launch announcement / portfolio entry     | 20 min    | Documentation        |
| 49.7 | Verify 24-hour uptime monitoring                | 10 min    | Health checks pass   |

**Day 49 Total: ~2.5 hours**

---

## 3. Complete Test Summary (All Phases)

| Phase            | Unit    | Integration | E2E    | Load  | Total   |
| ---------------- | ------- | ----------- | ------ | ----- | ------- |
| 01 — Foundation  | 5       | 5           | 0      | 0     | 10      |
| 02 — Auth        | 12      | 10          | 0      | 0     | 22      |
| 03 — Documents   | 10      | 19          | 0      | 0     | 29      |
| 04 — Editor      | 14      | 4           | 0      | 0     | 18      |
| 05 — Realtime    | 19      | 15          | 3      | 0     | 37      |
| 06 — Presence    | 12      | 0           | 2      | 0     | 14      |
| 07 — Persistence | 8       | 8           | 3      | 0     | 19      |
| 08 — Versions    | 12      | 10          | 2      | 0     | 24      |
| 09 — Sharing     | 11      | 17          | 3      | 0     | 31      |
| 10 — Testing     | 41      | 21          | 15     | 5     | 82      |
| **TOTAL**        | **144** | **109**     | **28** | **5** | **286** |

**Grand Total: 286 tests** (exceeds the PRD target of 200+)

---

## 4. Lighthouse Score Targets

| Metric         | Target | How to achieve                                      |
| -------------- | ------ | --------------------------------------------------- |
| Performance    | > 90   | Code splitting, lazy editor, optimized fonts/images |
| Accessibility  | > 90   | Semantic HTML, ARIA labels, contrast ratios         |
| Best Practices | > 90   | HTTPS, security headers, error handling             |
| SEO            | > 90   | Meta tags, semantic HTML, sitemap                   |

---

## 5. Security Headers Checklist

| Header                      | Value                                                             |
| --------------------------- | ----------------------------------------------------------------- |
| `X-Frame-Options`           | `DENY`                                                            |
| `X-Content-Type-Options`    | `nosniff`                                                         |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`                                 |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()`                        |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`                             |
| `Content-Security-Policy`   | `default-src 'self'; connect-src 'self' wss://*.railway.app; ...` |

---

## 6. Deployment Architecture

```
                 ┌──────────────────────────────────────┐
                 │            USERS (Browsers)            │
                 └──────────┬───────────────┬─────────────┘
                            │               │
                        HTTPS           WebSocket (WSS)
                            │               │
                 ┌──────────▼────────┐ ┌────▼──────────────┐
                 │                   │ │                    │
                 │   Vercel CDN/Edge │ │  Railway / Render  │
                 │   (Next.js 16)    │ │  (Socket.io)       │
                 │                   │ │                    │
                 │   ┌─────────────┐ │ │  ┌──────────────┐ │
                 │   │ App Router  │ │ │  │ Room Manager │ │
                 │   │ API Routes  │ │ │  │ Yjs Engine   │ │
                 │   │ Auth.js     │ │ │  │ Persistence  │ │
                 │   │ Sentry      │ │ │  │ Sentry       │ │
                 │   └──────┬──────┘ │ │  └──────┬───────┘ │
                 │          │        │ │         │         │
                 └──────────┼────────┘ └─────────┼─────────┘
                            │                    │
                            └─────────┬──────────┘
                                      │
                           ┌──────────▼──────────┐
                           │                     │
                           │   Neon PostgreSQL    │
                           │   (Connection Pool)  │
                           │                     │
                           └─────────────────────┘
```

---

## 7. Acceptance Criteria

| #   | Criterion                                             |
| --- | ----------------------------------------------------- |
| 1   | App accessible at production URL (HTTPS)              |
| 2   | Google OAuth works in production                      |
| 3   | Two users collaborate from different networks         |
| 4   | WebSocket connection stable > 10 minutes              |
| 5   | Sentry receives errors with readable source maps      |
| 6   | Lighthouse Performance ≥ 90                           |
| 7   | Lighthouse Accessibility ≥ 90                         |
| 8   | All 286 tests pass in CI                              |
| 9   | Code coverage > 80%                                   |
| 10  | README enables another dev to run locally in < 10 min |
| 11  | `v1.0.0` tag created                                  |
| 12  | Health check endpoint responds on both services       |
| 13  | No critical Sentry errors in first 24 hours           |
| 14  | Architecture diagram in docs                          |
