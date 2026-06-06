# Socket.io Server on Render

This guide outlines how to deploy the WebSocket and collaboration sync server (`apps/socket-server`) to Render as a Web Service using Docker.

## 1. Multi-Stage Dockerfile (Hoisted Workspace Support)

The socket server is deployed inside a lightweight Alpine container. The `Dockerfile` compiles the TypeScript codebase and generates the Prisma client schema to communicate with PostgreSQL.

Because the project is structured as an npm workspace, all dependencies are hoisted to the root `/app/node_modules`. The Dockerfile is configured to support hoisted dependencies correctly:

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
COPY packages/yjs-utils/package.json ./packages/yjs-utils/
RUN NODE_ENV=development npm ci --workspace=@collabdoc/socket-server --include-workspace-root

# Build the project
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN cd packages/database && npx prisma generate
RUN cd apps/socket-server && npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

# Copy built files and the hoisted node_modules (containing the generated Prisma Client)
COPY --from=builder /app/apps/socket-server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "dist/index.js"]
```

## 2. Web Service Configurations in Render

Create a new **Web Service** on Render and configure the following parameters:

- **Runtime**: Select `Docker` as the runtime.
- **Docker Command**: Leave blank to default to `CMD` in Dockerfile.
- **Dockerfile Path**: Set to `apps/socket-server/Dockerfile`.
- **Docker Build Context**: Set to `.` (the root of the repository). _Do not set to `apps/socket-server/` because the build needs files from the monorepo root and the packages workspace._
- **Plan**: Select a plan that supports WebSockets and background execution.

## 3. Environment Variables

Configure the following variables in the Render environment settings:

| Variable             | Description                                       | Value Example                            |
| -------------------- | ------------------------------------------------- | ---------------------------------------- |
| `PORT`               | Listening port for the HTTP/WebSocket server      | `3001`                                   |
| `NODE_ENV`           | Environment flag                                  | `production`                             |
| `DATABASE_URL`       | Transaction connection string for PostgreSQL      | `postgresql://...sslmode=require`        |
| `CORS_ORIGIN`        | Allowed origin for CORS handshakes                | `https://collabdoc-web.vercel.app`       |
| `SOCKET_AUTH_SECRET` | Shared JWT secret key (must match Next.js config) | _Generate a secure 32+ character string_ |
| `SENTRY_DSN`         | Sentry integration DSN                            | `https://key@sentry.io/project`          |

## 4. Scaling and Settings

- **WebSockets / HTTP 1.1 Support**: Render natively supports WebSockets. Make sure your client uses secure socket connections (`wss://your-service.onrender.com`).
- **Health Check Path**: Set to `/health`. Render will send requests to this path to check if the instance is ready before routing traffic.
- **Connections / Auto-Deploy**: You can configure auto-deploys to trigger whenever you push to the `main` branch.

**Related Links:**

- [[11-deployment/vercel-setup|Next.js Vercel Setup]]
- [[11-deployment/database-setup|PostgreSQL Database Setup]]
- [[10-observability/opentelemetry-setup|OpenTelemetry Metrics Setup]]
