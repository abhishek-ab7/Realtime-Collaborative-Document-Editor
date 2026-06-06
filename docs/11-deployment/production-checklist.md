# Production Launch Checklist

This checklist documents the required validation steps before launching the collabdoc application to production.

## 1. Security & Credentials

- [ ] **SSL/TLS Enforced**: Ensure all URLs (API, WebSockets, main domain) run exclusively over HTTPS (`https://`) and WSS (`wss://`).
- [ ] **Environment Variables Sealed**: Double check that no credentials or secrets are committed to git.
- [ ] **JWT Key Strength**: Verify that `SOCKET_AUTH_SECRET` and `AUTH_SECRET` are securely generated keys (minimum 32+ characters).
- [ ] **CORS Origin Boundaries**: Restrict the WebSocket server's `CORS_ORIGIN` to match your Vercel production domain.
- [ ] **Database Connection Sizing**: Connection pool parameters set correctly (`connection_limit` adjusted to prevent exhaustion).
- [ ] **Gemini AI Integration**: Confirm that `GEMINI_API_KEY` is set on Vercel to activate the writing assistant in production.

## 2. Testing & Quality Gates

- [ ] **Unit and Integration Suites**: All 272/272 tests compile and pass successfully.
- [ ] **E2E Playwright Flows**: Verify that the main user flows (authentication, doc creation, editing, and sharing link redeems) pass successfully.
- [ ] **TypeScript Compile**: Ensure the type checking command `npm run type-check` returns zero compiler errors.
- [ ] **Lint and Formatting**: Ensure all code formatting guidelines pass.

## 3. Observability & Monitoring

- [ ] **Sentry integration**: Trigger a test exception in production and confirm that it resolves cleanly in your Sentry issue tracker.
- [ ] **Source Maps Uploaded**: Ensure Next.js webpack builds upload source maps to Sentry for readable stack traces.
- [ ] **Uptime Pings**: Set up automated uptime ping checks (e.g. Better Uptime, Uptime Robot) targeting `/health` on the socket server and `/` on the web app.

## 4. Performance Optimization

- [ ] **Lighthouse Targets**: Audit the home page and verify score indices:
  - Performance: ≥ 90
  - Accessibility: ≥ 90
  - Best Practices: ≥ 90
  - SEO: ≥ 90
- [ ] **Bundle Split checks**: Confirm dynamic imports block dynamic bundle load requirements on initial mounts.

**Related Links:**

- [[11-deployment/vercel-setup|Next.js Vercel Setup]]
- [[11-deployment/railway-setup|Socket Server Railway Setup]]
- [[11-deployment/render-setup|Socket Server Render Setup]]
- [[10-observability/sentry-setup|Sentry Integration Setup]]
