## Day 40 Plan

**Task:** Integrate Codecov Bundle Analysis, Test Coverage, and Test Analytics
**Phase:** [[02-phases/phase-10-deploy|Phase 10]]

**Files:**

- Modify: [[.gitignore](../../.gitignore)]
- Modify: [[package.json](../../package.json)]
- Modify: [[apps/web/package.json](../../apps/web/package.json)]
- Modify: [[apps/socket-server/package.json](../../apps/socket-server/package.json)]
- Modify: [[packages/database/package.json](../../packages/database/package.json)]
- Modify: [[packages/shared/package.json](../../packages/shared/package.json)]
- Modify: [[apps/web/next.config.ts](../../apps/web/next.config.ts)]
- Modify: [[.github/workflows/ci.yml](../../.github/workflows/ci.yml)]

**Order:**

1. Install root dependencies (`@codecov/nextjs-webpack-plugin` and `@vitest/coverage-v8`).
2. Add `test-report.junit.xml` patterns to `.gitignore`.
3. Add `test:coverage` scripts to workspace `package.json` files and the root `package.json`.
4. Integrate the Webpack plugin into `apps/web/next.config.ts`.
5. Update `.github/workflows/ci.yml` with Codecov env vars and upload steps.
6. Verify compilation and test report generation locally.

**Acceptance Criteria:**

- [x] TypeScript: 0 errors
- [x] Tests: all pass under `npm run test:coverage`
- [x] Bundle builds cleanly with Next.js webpack integration
- [x] No `any` types added
