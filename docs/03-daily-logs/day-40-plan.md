## Day 40 Plan

**Task:** Integrate Codecov Bundle Analysis, Test Coverage, and Test Analytics
**Phase:** [[02-phases/phase-10-deploy|Phase 10]]

**Files:**

- Modify: [[.gitignore](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/.gitignore)]
- Modify: [[package.json](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/package.json)]
- Modify: [[apps/web/package.json](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/apps/web/package.json)]
- Modify: [[apps/socket-server/package.json](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/apps/socket-server/package.json)]
- Modify: [[packages/database/package.json](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/packages/database/package.json)]
- Modify: [[packages/shared/package.json](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/packages/shared/package.json)]
- Modify: [[apps/web/next.config.ts](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/apps/web/next.config.ts)]
- Modify: [[.github/workflows/ci.yml](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/.github/workflows/ci.yml)]

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
