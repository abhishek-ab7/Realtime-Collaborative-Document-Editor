# apps/socket-server/Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/socket-server/package.json ./apps/socket-server/
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/yjs-utils/package.json ./packages/yjs-utils/
RUN NODE_ENV=development npm ci

# Build the project
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN cd packages/database && npx prisma generate
RUN cd apps/socket-server && npm run build
# Prune devDependencies to keep the production image small
RUN npm prune --omit=dev --workspace=@collabdoc/socket-server --include-workspace-root

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

# Copy built files and the hoisted node_modules (containing the generated Prisma Client)
COPY --from=builder /app/apps/socket-server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "dist/index.js"]
