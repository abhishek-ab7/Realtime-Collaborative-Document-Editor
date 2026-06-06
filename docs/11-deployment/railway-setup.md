# Socket.io Server on Railway

This guide outlines how to deploy the WebSocket and collaboration sync server (`apps/socket-server`) to Railway using the multi-stage `Dockerfile`.

## 1. Multi-Stage Dockerfile

The socket server is deployed inside a lightweight Alpine container. The `Dockerfile` compiles the TypeScript codebase and generates the Prisma client schema to communicate with PostgreSQL:

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

## 2. Service Settings in Railway

Set up the following configurations in your Railway service settings panel:

- **Source Directory**: Set to `/` or keep default.
- **Build Command**: Set to `docker build -f apps/socket-server/Dockerfile -t collabdoc-socket .` (Railway automatically detects the Dockerfile when configured).
- **Port**: Configure `3001` as the internal port.
- **Health Check Path**: Set the health check URL path to `/health`. The server will respond with status `200 OK` and active connection metrics.

## 3. Environment Variables

Configure the following variables in the Railway variables panel:

| Variable             | Description                                       | Value Example                            |
| -------------------- | ------------------------------------------------- | ---------------------------------------- |
| `PORT`               | Listening port for the HTTP/WebSocket server      | `3001`                                   |
| `NODE_ENV`           | Environment flag                                  | `production`                             |
| `DATABASE_URL`       | Transaction connection string for PostgreSQL      | `postgresql://...sslmode=require`        |
| `CORS_ORIGIN`        | Allowed origin for CORS handshakes                | `https://collabdoc-web.vercel.app`       |
| `SOCKET_AUTH_SECRET` | Shared JWT secret key (must match Next.js config) | _Generate a secure 32+ character string_ |
| `SENTRY_DSN`         | Sentry integration DSN                            | `https://key@sentry.io/project`          |

## 4. Scaling and Observability

- **Sticky Sessions**: Ensure that sticky sessions are enabled if scaling beyond 1 replica, as Socket.io connections rely on handshake handovers.
- **OTel Prometheus Exporter**: The server exposes custom OpenTelemetry metrics (`collabdoc.active_rooms`, `collabdoc.active_connections`, `collabdoc.yjs_sync_latency_ms`) that can be scraped or queried via observability integrations.

**Related Links:**

- [[11-deployment/vercel-setup|Next.js Vercel Setup]]
- [[11-deployment/database-setup|PostgreSQL Database Setup]]
- [[10-observability/opentelemetry-setup|OpenTelemetry Metrics Setup]]
