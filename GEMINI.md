# Antigravity Configuration for Collab Editor

## Obsidian Vault Integration

The project knowledge base lives in `docs/` as an Obsidian vault.
All decisions, architecture notes, debugging logs, and phase progress are here.

### Key Files Agents Should Read First

- [00-index.md](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/docs/00-index.md) — Navigation hub
- [tech-stack.md](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/docs/01-project-overview/tech-stack.md) — Current stack
- [constraints.md](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/docs/01-project-overview/constraints.md) — Hard rules
- [yjs-sync-design.md](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/docs/04-architecture/yjs-sync-design.md) — Core architecture
- [database-schema.md](file:///home/abhi/Downloads/Realtime%20Collaborative%20Document%20Editor/docs/04-architecture/database-schema.md) — Database schema

### When Creating New Notes

1. Always use markdown (.md extension)
2. Place task-specific notes in the correct folder:
   - Phase work → `docs/03-daily-logs/phase-X-logs/`
   - Architecture decisions → `docs/04-architecture/`
   - Bugs/fixes → `docs/06-debugging/`
3. Use wikilinks for internal references: `[[path/to/file|display text]]`
4. Create a summary at the end of each phase in `docs/02-phases/phase-X.md`

### Linking Strategy

- Obsidian auto-creates backlinks. Don't worry about two-way links manually.
- When writing docs, reference related files: e.g., "See [[04-architecture/socket-io-flow]]"
- Use `[[404]]` syntax (broken links shown in red) to mark TODOs

## Parallel Agents Guidelines

- Subagents can write to `docs/` simultaneously (different files only)
- Each subagent should log its progress: `docs/03-daily-logs/phase-X-logs/subagent-A-log.md`
- Final summary merged into phase-specific notes at the end

## No-Go Zones

DO NOT modify:

- CLAUDE.md (Claude Code's config)
- Any files in `/apps/web`, `/apps/server` (those are code)
- `.gitignore` in project root

OK to modify:

- All files in `docs/`
- `PRD.md` (if updating requirements)
- `docs/.gitignore` (Obsidian local settings)
