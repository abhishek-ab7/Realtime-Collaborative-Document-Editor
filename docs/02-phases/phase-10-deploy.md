# Phase 10 — Testing, Observability & Deployment

**Duration:** Days 40–49 (10 days)  
**Status:** Not Started

## Deliverables

- [ ] Complete unit, integration, and Playwright E2E suites passing in CI
- [ ] Next.js app deployed to Vercel
- [ ] Socket.io server deployed to Railway/Render/Fly.io
- [ ] PostgreSQL provisioned on Neon/Supabase
- [ ] Custom domain configured with SSL
- [ ] Environment variables secured
- [ ] Sentry DSN configured for production
- [ ] Database backups configured (daily)
- [ ] Monitoring dashboard (uptime, error rate, latency)
- [ ] README.md with setup instructions

## Files to Create/Modify

**Create:**

- `.github/workflows/ci.yml`
- `tests/e2e/collaboration.spec.ts`
- `apps/web/sentry.client.config.ts`
- `apps/web/src/instrumentation.ts`

**Modify:**

- `package.json`
- `README.md`

## Implementation Order

1. **Step 1:** Configure Sentry error filters and OTel tracing handlers → Files: `apps/web/src/instrumentation.ts`
2. **Step 2:** Write Playwright E2E files verifying room sync states → Files: `tests/e2e/`
3. **Step 3:** Scaffold Git actions workflows and host services settings → Files: `.github/workflows/`

## Acceptance Criteria

- [ ] All files from "Files to Create/Modify" exist
- [ ] TypeScript strict mode passes (0 errors)
- [ ] All tests for this phase pass
- [ ] Code follows patterns from [[05-reference-code/next-js-patterns|Next.js Patterns]]
- [ ] Uptime metrics resolve correctly at demo domain

## Dependencies

- Depends on: [[02-phases/phase-09-sharing|Phase 09 — Sharing & Permissions]]
- Enables: None

## Potential Issues & Mitigations

| Issue                          | Mitigation                                         |
| ------------------------------ | -------------------------------------------------- |
| WebSocket connection blocks    | Enable long-polling fallback inside client options |
| Database connection pool drops | Enforce pooling bounds on prisma URL definitions   |

## Architecture References

- [[04-architecture/system-design|System Design]]
- [[10-observability/sentry-setup|Sentry Setup]]
- [[11-deployment/vercel-setup|Vercel Setup]]
