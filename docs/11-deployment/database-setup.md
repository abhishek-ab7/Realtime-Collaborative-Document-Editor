# PostgreSQL Database Provisioning & Setup

This guide documents the PostgreSQL database setup, connection pool configuration, and migration lifecycle for the collabdoc project.

## 1. Hosting Options

We recommend using **Neon PostgreSQL** or **Supabase Database** for hosting:

- **Neon**: Offers serverless architecture, rapid branching, autoscaling compute, and low connection latencies.
- **Supabase**: Offers standard PostgreSQL instance with simple extensions and robust connection pooling tools.

## 2. Connection Pool Configuration

Prisma manages connection pooling through parameters embedded in the `DATABASE_URL` query string. Configure these limits to prevent database connection limits from being exhausted in serverless environments:

- **Transaction URL (Vercel API)**: Connect via PgBouncer or a connection pooler to prevent spikes in connections. Use `pgbouncer=true` and limit connection bounds:
  ```text
  postgresql://user:password@hostname:5432/collabdoc?sslmode=require&pgbouncer=true&connection_limit=10
  ```
- **Session URL (Railway WebSocket Server)**: Since the socket server runs as a persistent container instance, it can connect directly to the database. Ensure the connection limit is bounded (e.g. `connection_limit=5`).

## 3. Migration Lifecycle

All database changes are structured via Prisma migrations (`packages/database/prisma/schema.prisma`).

### Local Migrations

To make changes to the database structure locally:

```bash
npx prisma migrate dev --name your_migration_name
```

### Production Migrations

In production environments (like Vercel CI/CD pipelines), never run `prisma migrate dev`. Use the deployment command to safely apply migrations without interactive prompts:

```bash
npx prisma migrate deploy
```

## 4. Backups and Maintenance

- **Daily Backups**: Enable automated daily backups in your database provider dashboard (Neon / Supabase).
- **Point-in-Time Recovery (PITR)**: For critical collaborative editing, configure PITR if using Neon to restore database state to a specific second in case of data corruption.

**Related Links:**

- [[11-deployment/vercel-setup|Next.js Vercel Setup]]
- [[11-deployment/railway-setup|Socket Server Railway Setup]]
- [[04-architecture/database-schema|Prisma Database Schema]]
