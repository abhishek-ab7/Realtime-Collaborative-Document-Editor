# Collabdoc — Local Development Guide

Welcome to the Collabdoc codebase! This document outlines package management, database operations, style formatting, and quality checks.

---

## 📦 Package Management Workflows

This project uses npm workspaces to manage monorepo dependencies. Always run npm commands from the root directory.

### Adding Dependencies to a Package

To add a package (e.g. `lodash`) to a specific workspace (e.g. `apps/web`):

```bash
npm install lodash -w apps/web
```

### Adding DevDependencies to a Package

```bash
npm install -D vitest -w packages/shared
```

---

## 🗄️ Database Operations

The `@collabdoc/database` package acts as our data access layer and contains all Prisma schemas, migrations, and seeds.

### 1. Modifying the Schema

Edit `packages/database/prisma/schema.prisma`. Once modified, run the local migration command to update the DB and regenerate the TS definitions:

```bash
npm run db:migrate
```

### 2. Seeding test data

If you reset your database or need fresh mock items, run:

```bash
npm run db:seed
```

### 3. Database visualizer (Prisma Studio)

To inspect database records interactively via a local UI:

```bash
npm run db:studio
```

---

## 🎨 Styling and Design Tokens

Next.js imports the design tokens and variables from `.stitch/DESIGN.md` in `apps/web/src/app/globals.css`.

Key tokens:

- `--color-brand-primary`: `#6366f1` (Indigo accent)
- `--color-bg-primary`: `#ffffff` (White background)
- `--font-sans`: Inter
- `--radius-md`: 8px (0.5rem) base corner rounding

To modify spacing or colors, update `globals.css` and make sure they conform to the Stitch design specifications.

---

## 🪝 Formatting & Pre-Commit Hooks

We enforce rigid linting and code formatting rules to keep the codebase clean.

- **Prettier** format checks:
  ```bash
  npm run format
  ```
- **ESLint** code style verification:
  ```bash
  npm run lint
  ```

### Husky Hooks

When you attempt to make a Git commit, Husky runs `lint-staged` which automates:

1. `eslint --fix` on modified typescript files.
2. `prettier --write` on modified JSON, CSS, and markdown files.

Ensure your code passes lint checks locally before committing to prevent commits from being rejected.
