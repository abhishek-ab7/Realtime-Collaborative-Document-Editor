# ADR-006: AI Context & Vault Automation System

## Context

As the project grows across 10 implementation phases, our Obsidian vault contains extensive context scattered across multiple directories (specifications, architecture, debugging journals, and daily progress logs). Manually feeding these logs to the agent at the start of a session is error-prone, consumes unnecessary context tokens, and leads to stale information about test results or git commit history.

We need a unified, lightweight, and automated system to keep the Obsidian vault in sync with active code status and compile a concise session summary specifically tailored for Google Antigravity.

## Decision

We decided to implement:

1. **Live Vault Sync (`sync-vault.ts`)**: A script that runs in the monorepo root to parse Vitest JUnit outputs, query git history, check local typescript errors, read the current active phase from `phase-00-INDEX.md`, and output a unified `PROJECT-STATUS.md` file. It also appends timestamped progress entries to today's progress log.
2. **Context Aggregator (`build-ai-context.ts`)**: A script that compiles the live project status, active phase specifications, recent daily logs, relevant architecture diagrams, and the last 3 debug journal entries into a single, compact `docs/ai-context.md` file (limited to < 5000 tokens).
3. **Husky post-commit hook**: An automated git hook that triggers vault synchronization automatically on every local commit.
4. **Antigravity Morning Sync**: An improved session startup prompt referencing `docs/ai-context.md` to establish context instantly.

## Status

**Proposed & Accepted** (2026-06-06)

## Consequences

- **Vault Portability**: Relative links replace absolute `file:///` URLs, making the vault portable across machines and CI.
- **Context Speed**: Opening an AI session requires reading only `ai-context.md` (~30 seconds loading time) rather than deep-scanning the vault.
- **Accuracy**: Project health metrics, test pass rates, and typescript compiler error counts are automatically updated.
