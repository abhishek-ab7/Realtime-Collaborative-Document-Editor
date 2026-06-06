---
title: ANTIGRAVITY CONNECTION PROMPTS — Collabdoc (10 Phases)
description: Complete set of prompts to connect Antigravity with your Obsidian vault
status: Ready to Use
date: 2026-06-04
---

# ANTIGRAVITY CONNECTION & INITIALIZATION PROMPTS

> **For Project:** Collabdoc — Realtime Collaborative Document Editor  
> **Phases:** 10 (Foundation → Deployment)  
> **Days:** 49 total  
> **Status:** Ready to initialize

---

## PROMPT #0 — FIRST TIME SETUP (Run Once)

**This is the very first prompt you paste into Antigravity. Ever.**

```
═══════════════════════════════════════════════════════════════
ANTIGRAVITY INITIALIZATION — COLLABDOC PROJECT
═══════════════════════════════════════════════════════════════

You are about to start a 49-day, 10-phase project to build a production-grade
collaborative document editor. Your knowledge base lives in an Obsidian vault
at docs/ in this repo.

CRITICAL SETUP INSTRUCTIONS:

1. Point this Antigravity session at the repo root (NOT docs/)
   You should see: apps/, packages/, tests/, docs/, CLAUDE.md, GEMINI.md

2. Read these files to load your configuration:
   - GEMINI.md (your instructions for this project)
   - docs/00-VAULT-INDEX.md (navigation hub)

3. Tell me:
   a) What did GEMINI.md tell you about the vault structure?
   b) How many phases are we building?
   c) What's the tech stack?
   d) What are the hard constraints (TypeScript, Next.js, Yjs)?

4. Confirm you understand:
   - You'll read from docs/ for context
   - You'll write new files to docs/ as you work
   - You'll use [[wikilinks]] for internal references
   - Everything will be git-synced at the end of the day

After you answer all 4 questions correctly, we'll initialize the vault structure.
```

---

## PROMPT #1 — INITIALIZE VAULT STRUCTURE

**After Antigravity passes the setup test, run this.**

```
═══════════════════════════════════════════════════════════════
TASK: Initialize Obsidian Vault Structure
═══════════════════════════════════════════════════════════════

Create the complete folder structure and initial files for the 10-phase build.

Read reference (to see the structure):
- GEMINI.md (section 2)

Create these directories and files in docs/:

00-VAULT-INDEX.md
  Content: Navigation hub linking to all 10 phases, architecture docs, daily logs

01-project-context/
  ├── project-brief.md — What Collabdoc is
  ├── tech-stack.md — Full stack breakdown from PRD
  ├── constraints.md — Hard rules (TypeScript strict, Next.js App Router only, etc)
  └── success-criteria.md — Goals we're tracking

02-phases/
  ├── phase-00-INDEX.md — Overview of all 10 phases with dates
  ├── phase-01-foundation.md — Phase 01 spec (Days 1–3)
  ├── phase-02-authentication.md — Phase 02 spec (Days 4–7)
  ├── phase-03-documents.md — Phase 03 spec (Days 8–11)
  ├── phase-04-editor.md — Phase 04 spec (Days 12–14)
  ├── phase-05-realtime.md — Phase 05 spec (Days 15–21)
  ├── phase-06-presence.md — Phase 06 spec (Days 22–24)
  ├── phase-07-persistence.md — Phase 07 spec (Days 25–28)
  ├── phase-08-versions.md — Phase 08 spec (Days 29–33)
  ├── phase-09-sharing.md — Phase 09 spec (Days 34–39)
  └── phase-10-deploy.md — Phase 10 spec (Days 40–49)

03-daily-logs/
  └── [will be created as we work each day]

04-architecture/
  ├── system-design.md — Overall architecture diagram + layers
  ├── crdt-design.md — Yjs CRDT deep dive
  ├── socket-io-flow.md — Realtime protocol walkthrough
  ├── database-schema.md — Prisma schema with explanations
  ├── api-design.md — All REST endpoints documented
  ├── auth-flow.md — OAuth + session flow diagram
  └── security-model.md — Permissions, auth, data protection

05-reference-code/
  ├── yjs-patterns.md — Yjs code snippets and patterns
  ├── tiptap-patterns.md — TipTap extension patterns
  ├── socket-io-patterns.md — Socket.io handler patterns
  ├── next-js-patterns.md — Next.js best practices
  └── prisma-patterns.md — Prisma query patterns

06-debugging-journal/
  ├── yjs-sync-issues.md — CRDT sync bugs and fixes
  ├── socket-io-errors.md — WebSocket issues log
  ├── typescript-struggles.md — Type safety learnings
  ├── postgres-migration-issues.md — Database issues
  └── deployment-issues.md — Production problems

07-decisions/
  ├── adr-001-yjs-vs-ot.md — Why Yjs over OT
  ├── adr-002-socket-io-vs-y-ws.md — Why Socket.io
  ├── adr-003-postgresql-prisma.md — Why PostgreSQL
  ├── adr-004-next-js-16.md — Why Next.js 16
  └── adr-005-stitch-mcp.md — Why Stitch for UI design

08-stitch-designs/
  ├── DESIGN.md — Design system from Stitch (will populate as we go)
  └── designs/
      └── [one HTML file per major UI page: signin, dashboard, editor, etc]

09-test-strategies/
  ├── unit-test-plan.md — Unit testing strategy
  ├── integration-test-plan.md — Integration testing strategy
  ├── e2e-test-plan.md — E2E testing strategy (Playwright)
  └── performance-test-plan.md — Performance benchmarks

10-observability/
  ├── sentry-setup.md — Error tracking configuration
  ├── opentelemetry-setup.md — Distributed tracing setup
  └── monitoring-dashboards.md — What to monitor in production

11-deployment/
  ├── vercel-setup.md — Frontend deployment on Vercel
  ├── railway-setup.md — Socket.io server on Railway
  ├── database-setup.md — PostgreSQL configuration
  ├── github-actions-ci.md — CI/CD pipeline setup
  └── production-checklist.md — Pre-launch checklist

═══════════════════════════════════════════════════════════════

For EACH file, include:
- A proper # Header
- 3–5 lines of initial summary content
- At least one wikilink to a related file

Example (00-VAULT-INDEX.md):
  # Collabdoc — Obsidian Vault Index

  This is the knowledge base for the 10-phase collaborative document editor.

  **Read these first:**
  - [[01-project-context/project-brief|Project Brief]]
  - [[02-phases/phase-00-INDEX|All 10 Phases]]

  **Reference:**
  - [[04-architecture/system-design|System Architecture]]
  - [[05-reference-code/yjs-patterns|Code Patterns]]

═══════════════════════════════════════════════════════════════

When all files are created:
1. Run: ls -la docs/ (show me the directory structure)
2. Create a summary file: docs/VAULT_INITIALIZED.md
3. Show me the summary

Do not proceed to Phase 01 implementation until vault is initialized.
```

---

## PROMPT #2 — POPULATE PHASE SPECS FROM PRD

**After vault structure is initialized, populate each phase with spec details.**

```
═══════════════════════════════════════════════════════════════
TASK: Populate Phase Specs from PRD
═══════════════════════════════════════════════════════════════

You have the project PRD. Now populate each phase file with:

Phase 01 — Foundation & Infrastructure (Days 1–3)
  Read PRD section: "Implementation Roadmap" + "Phase 01"
  Write to: docs/02-phases/phase-01-foundation.md

  Include:
  - Duration: 3 days
  - Deliverables: [checklist of what Phase 01 ships]
  - Key files created: [list from project structure]
  - Key files modified: [list from project structure]
  - Tech decisions: [why we chose each tech]
  - Acceptance criteria: [how we know Phase 01 is done]
  - Integration with Phase 02: [what Phase 02 depends on]

[Repeat for ALL 10 phases, reading the PRD each time]

For each phase file, use this template:

═══════════════════════════════════════════════════════════════

# Phase XX — [Phase Name]

**Duration:** Days X–Y (Z days)
**Status:** Not Started

## Deliverables

- [ ] Deliverable 1: [description]
- [ ] Deliverable 2: [description]
- [ ] Deliverable 3: [description]
...

## Files to Create/Modify

**Create:**
- apps/web/src/...
- apps/socket-server/src/...

**Modify:**
- apps/web/src/...
- package.json (if dependencies change)

## Implementation Order

1. **Step 1:** [description] → Files: [list]
2. **Step 2:** [description] → Files: [list]
3. **Step 3:** [description] → Files: [list]

## Acceptance Criteria

- [ ] All files from "Files to Create/Modify" exist
- [ ] TypeScript strict mode passes (0 errors)
- [ ] All tests for this phase pass
- [ ] Code follows patterns from [[05-reference-code/[relevant]]]
- [ ] [custom criteria specific to phase]

## Dependencies

- Depends on: [[02-phases/phase-XX-before|Previous Phase]]
- Enables: [[02-phases/phase-XX-after|Next Phase]]

## Potential Issues & Mitigations

| Issue | Mitigation |
|-------|-----------|
| [Issue 1] | [How we'll avoid it] |
| [Issue 2] | [How we'll avoid it] |

## Architecture References

- [[04-architecture/system-design|System Design]]
- [[04-architecture/crdt-design|CRDT Design]] (if applicable)
- [[05-reference-code/[relevant]|Code Patterns]]

═══════════════════════════════════════════════════════════════

When all 10 phase files are populated:
1. Create docs/02-phases/PHASES_POPULATED.md (timestamp + summary)
2. Show me the phase-00-INDEX.md file (it should link to all 10 phases)
3. Confirm: "All 10 phase specs are ready"

After this, we're ready to START PHASE 01 IMPLEMENTATION.
```

---

## PROMPT #3 — DAILY MORNING SYNC

**Paste this every morning before starting work.**

```
═══════════════════════════════════════════════════════════════
MORNING SYNC
═══════════════════════════════════════════════════════════════

Read THESE SPECIFIC files (in this order, no others):

docs/ai-context.md — contains current status, phase, today's task
docs/PROJECT-STATUS.md — live build health
docs/03-daily-logs/current-day.md — what's in progress

Then answer:

What phase are we in and what is the percentage complete?
What is today's specific task (one sentence)?
Are there any TypeScript errors or failing tests?
What was the last thing built (from git log in PROJECT-STATUS)?
What files will we need to touch today?

After answering, check docs/ai-context.md for any blockers.
Only THEN ask if I'm ready to proceed.
Do NOT read any other docs files unless I ask you to.
Total reading time should be < 30 seconds.
```

---

## PROMPT #4 — DAILY IMPLEMENTATION

**After morning sync, paste this to execute the day's work.**

```
═══════════════════════════════════════════════════════════════
IMPLEMENT TODAY'S TASK — [Task Name]
═══════════════════════════════════════════════════════════════

Read context:
- docs/02-phases/phase-XX-[name].md (full phase spec)
- docs/04-architecture/[relevant].md (design reference)
- docs/05-reference-code/[relevant].md (code patterns)

Today's Task:
[Describe what we're building today — one clear task]

Step 1 — PLAN (no code yet):
1. What files need to be created?
2. What files need to be modified?
3. What's the implementation order?
4. Where are integration points with previous phases?

Create: docs/03-daily-logs/day-N-plan.md

Format:
## Day N Plan

**Task:** [what we're building]
**Phase:** [[02-phases/phase-XX|Phase XX]]

**Files:**
- Create: [path/to/file1.ts]
- Create: [path/to/file2.ts]
- Modify: [path/to/file3.ts]

**Order:**
1. [step 1]
2. [step 2]
3. [step 3]

**Acceptance Criteria:**
- [ ] TypeScript: 0 errors
- [ ] Tests: all pass
- [ ] Code follows [[05-reference-code/[pattern]]]
- [ ] No `any` types

When the plan is written, STOP. Do not code yet.
```

**After you review the plan, paste:**

```
═══════════════════════════════════════════════════════════════
EXECUTE DAY N PLAN
═══════════════════════════════════════════════════════════════

Plan is approved. Implement exactly as described in:
docs/03-daily-logs/day-N-plan.md

RULES:
- TypeScript strict mode ALWAYS
- Zero `any` types — EVER
- Follow patterns from [[05-reference-code/[relevant]]]
- Test as you go
- Run npm run typecheck after each file → fix any errors
- Add comments for complex logic

As you complete each major component:
1. Run: npm run typecheck (fix any TS errors)
2. Run: npm run test (run relevant tests)
3. Update: docs/03-daily-logs/day-N-progress.md

Progress format:
## Day N — Progress Update

**Completed:**
- ✓ Component A: [description]
- ✓ Component B: [description]

**Current Status:** X% of plan complete
**Issues:** [any blockers?]
**Next:** [what's the next component]

When ALL components from the plan are complete:
1. Run: npm run typecheck → must be 0 errors
2. Run: npm run test → must be 100% pass
3. Create: docs/03-daily-logs/day-N-summary.md

Summary format:
## Day N — Summary

**Phase:** [[02-phases/phase-XX|Phase XX]]
**Date:** YYYY-MM-DD
**Status:** 100% complete ✓

**Built Today:**
- [feature 1]
- [feature 2]
- [feature 3]

**Code Quality:**
- TypeScript errors: 0
- Tests passing: X/X
- Test coverage: XX%

**Issues:** [any issues encountered?]
**Lessons:** [anything we learned?]

Then wait for my go-ahead to commit and close the day.
```

---

## PROMPT #5 — DEBUG TEMPLATE

**When something breaks, use this.**

```
═══════════════════════════════════════════════════════════════
DEBUG: [Issue Name]
═══════════════════════════════════════════════════════════════

Problem: [What's broken?]
Error: [Error message if applicable]
When it started: [which day / commit]

Read from vault:
- docs/06-debugging-journal/[similar-issue].md (if we've seen this before)
- docs/04-architecture/[relevant].md (design reference)
- docs/05-reference-code/[relevant].md (code patterns)

Diagnose:
1. Root cause: [What's actually wrong?]
2. Have we solved similar issues? [check journal]
3. Why did this slip through? [QA question]
4. Quick fix vs proper fix: [which approach?]

Fix:
1. [Code changes to implement]
2. Add logging/assertions for future
3. Run: npm run typecheck → npm run test

Document:
Create: docs/06-debugging-journal/[issue-type]-[date].md

## [Issue Type] — Debug Log

**Date:** YYYY-MM-DD
**Phase:** [[02-phases/phase-XX|Phase XX]]
**Time to Fix:** X minutes

**Symptom:** [what broke]
**Root Cause:** [why]
**Solution:** [what we did]

**Code Changed:**
- [file 1]
- [file 2]

**How to Avoid:**
- New rule: [pattern we'll follow]
- Reference: [[05-reference-code/[pattern]|Pattern Name]]

Then wait for my approval before closing.
```

---

## PROMPT #6 — WEEKLY REVIEW

**Every Friday evening, paste this.**

```
═══════════════════════════════════════════════════════════════
WEEKLY REVIEW — Summarize This Week
═══════════════════════════════════════════════════════════════

Read all daily logs from this week:
docs/03-daily-logs/day-1-logs.md through day-5-logs.md

Create: docs/02-phases/phase-XX-week-N-summary.md

Format:
## Phase XX — Week N Summary

**Phase:** [[02-phases/phase-XX|Phase XX Name]]
**Days:** 1–5 of phase
**Status:** X% complete

**What We Built:**
- [Feature A]: [[04-architecture/[ref]|Architecture ref]] — [brief description]
- [Feature B]: [description]
- [Feature C]: [description]

**Technical Achievements:**
- Implemented [pattern] from [[05-reference-code/[ref]]]
- Solved [issue] (documented in [[06-debugging-journal/[issue]]])
- Achieved [metric] (e.g., "sub-50ms sync latency")

**Code Quality This Week:**
- TypeScript errors: 0
- Test coverage: XX%
- Linting: 0 errors
- Commits: N (with conventional messages)

**Issues Encountered & Fixed:**
- Issue 1: [[06-debugging-journal/[issue]|Link to debug log]]
- Issue 2: [description]

**Decisions Made:**
- [[07-decisions/adr-00X|ADR-00X: Why we chose X over Y]]

**Next Week Preview:**
- [[02-phases/phase-XX|Current phase]] continues with: [tasks]
- Or: Move to [[02-phases/phase-YY|Phase YY]] with: [tasks]

**Reflection:**
- What went well?
- What was hard?
- What would we do differently?

Then wait for my review before moving to next week.
```

---

## PROMPT #7 — PHASE COMPLETION

**When you finish a phase, use this to wrap it up.**

```
═══════════════════════════════════════════════════════════════
COMPLETE PHASE XX
═══════════════════════════════════════════════════════════════

Phase XX is complete. Time to finalize and document.

Read:
- docs/02-phases/phase-XX-[name].md (phase spec)
- All daily logs from this phase
- docs/04-architecture/[relevant].md

Create final summary: docs/02-phases/phase-XX-COMPLETE.md

Format:
## Phase XX — Final Summary

**Phase Name:** [name]
**Duration:** X days (scheduled) vs Y days (actual)
**Status:** ✓ COMPLETE

**Deliverables:**
- ✓ [deliverable 1]
- ✓ [deliverable 2]
- ✓ [deliverable 3]

**Files Created:** [count] new files
**Files Modified:** [count] existing files
**Commits:** [count] commits

**Key Achievements:**
- [achievement 1]
- [achievement 2]
- [achievement 3]

**Test Coverage:**
- Unit tests: XX passing
- Integration tests: XX passing
- E2E tests: XX passing

**Code Quality:**
- TypeScript: 0 errors
- Linting: 0 errors
- Coverage: XX%

**Issues Encountered:**
- [[06-debugging-journal/[issue-1]|Issue 1]]
- [[06-debugging-journal/[issue-2]|Issue 2]]

**What Phase XX Enables:**
- [[02-phases/phase-[N+1]|Next phase]] can now: [what's unblocked]

**Technical Debt (if any):**
- [item 1]: [why, when to fix]
- [item 2]: [why, when to fix]

**Lessons Learned:**
- [lesson 1]
- [lesson 2]

Then create a PR (if not already done):
- Title: "Phase XX: [phase name]"
- Description: Copy the summary above
- Reviewers: Yourself (you'll merge it)
- Branch name: phase-XX-complete

Wait for my approval to merge and move to Phase XX+1.
```

---

## PROMPT #8 — STUDY & REFERENCE

**Before building something with a new library, study it first.**

```
═══════════════════════════════════════════════════════════════
STUDY: [Technology Name]
═══════════════════════════════════════════════════════════════

Technology: [Yjs / Socket.io / TipTap / Prisma / Auth.js]
Why we need it: [Phase XX requires ...]
Official source: [GitHub/Docs link]

Study this library:
1. Read the official docs (sections X–Y)
2. Read the source code (files X–Y)
3. Find examples that are most relevant to our use case
4. Identify key patterns and pitfalls

Document in: docs/05-reference-code/[technology]-deep-dive.md

Format:
## [Technology] Deep Dive

**Version:** X.X.X
**Official Docs:** [link]
**Source:** [GitHub link]

**Purpose:** [what this library does in our project]

**Core Concepts:**
1. **Concept A:** [explanation] — Code: [snippet]
2. **Concept B:** [explanation] — Code: [snippet]
3. **Concept C:** [explanation] — Code: [snippet]

**How We'll Use It:**
- In [[02-phases/phase-XX|Phase XX]]
- For: [specific feature]
- Key APIs: [list]

**Common Pitfalls:**
- Pitfall 1: [description] → Avoid by: [solution]
- Pitfall 2: [description] → Avoid by: [solution]

**Performance Considerations:**
- [consideration 1]
- [consideration 2]

**Code Example:**
[Copy a real example from source that matches our use case]

Then wait for my okay before implementing with this library.
```

---

## PROMPT #9 — END OF DAY CLOSE

**Paste this at the end of every day before committing.**

```
═══════════════════════════════════════════════════════════════
END OF DAY CLOSE
═══════════════════════════════════════════════════════════════

Summarize what we accomplished today:

1. **What was built:**
   [List the features/components implemented]

2. **Files modified:**
   [Count: N new files, M files modified]

3. **Code quality:**
   - TypeScript errors: [count]
   - Tests passing: [count/total]
   - Coverage: [%]

4. **Current phase progress:**
   - Phase: [number - name]
   - Status: X% complete

5. **Blockers for tomorrow:**
   [Any issues to pick up tomorrow?]

Update: docs/03-daily-logs/current-day.md

Format:
## Current Day Progress

**Phase:** [[02-phases/phase-XX|Phase XX Name]]
**Date:** YYYY-MM-DD
**Status:** XX% complete

**Built Today:**
- [feature 1]
- [feature 2]
- [feature 3]

**Files:**
- Created: [count]
- Modified: [count]

**Code Quality:**
- TypeScript: 0 errors
- Tests: X/X passing
- Coverage: XX%

**Issues:** [any blockers?]
**Next:** [what happens tomorrow]

Then show me the git commit message to use:
git commit -m "docs(phase-XX): day N — [2-3 word summary]"

After I approve the message, run:
git add docs/
git commit -m "[message]"
git push

Do not commit until I approve the message.
```

---

## QUICK REFERENCE TABLE

| When               | Prompt | Purpose                              |
| ------------------ | ------ | ------------------------------------ |
| Very first time    | #0     | Initialize Antigravity configuration |
| After setup        | #1     | Create vault folder structure        |
| After structure    | #2     | Populate all 10 phase specs          |
| Every morning      | #3     | Read vault, understand context       |
| After morning sync | #4     | Execute the day's implementation     |
| When debugging     | #5     | Diagnose & document issues           |
| Every Friday       | #6     | Summarize the week                   |
| End of phase       | #7     | Final phase summary & move to next   |
| New library        | #8     | Study & document tech before using   |
| End of day         | #9     | Close day, prepare commit            |

---

## MASTER VAULT READING ORDER

When opening Obsidian vault, read in this order:

1. **00-VAULT-INDEX.md** (1 min) — What is this vault?
2. **02-phases/phase-00-INDEX.md** (2 min) — What are all 10 phases?
3. **02-phases/phase-XX-[current].md** (3 min) — What's the current phase?
4. **03-daily-logs/current-day.md** (1 min) — What's in progress?
5. **04-architecture/[relevant].md** (5 min) — Design for what you're building
6. **05-reference-code/[relevant].md** (3 min) — Patterns for what you're building
7. **CLAUDE.md** (2 min) — Architecture constraints to remember

**Total:** ~16 minutes to fully load context. Worth it.

---

## TROUBLESHOOTING

### "Antigravity can't find docs/ files"

**Check:**

1. Are you pointing Antigravity at repo ROOT? (not docs/)
2. Run: `ls -la docs/` in terminal → confirm files exist
3. In Antigravity, run: `ls docs/00-VAULT-INDEX.md` → confirm it can list

### "Obsidian isn't showing new files Antigravity created"

**Fix:**

1. In Obsidian: Cmd+Shift+P → "Reload App"
2. Or: Close Obsidian, wait 5 sec, reopen
3. Check Settings → Files & Links → "Automatically update internal links" is ON

### "Wikilinks are broken (red text in Obsidian)"

**Fix:**

1. The file doesn't exist yet (it's in the plan)
2. Or: The path is wrong (check GEMINI.md section 2 for correct paths)
3. Hover over red link → click "Create" if you want to make the file now

### "I lost context between sessions"

**Recovery:**

1. Open new Antigravity session
2. Immediately paste Prompt #3 (MORNING SYNC)
3. Antigravity reads the vault and re-establishes context
4. Continue from where you left off

---

## FINAL CHECKLIST BEFORE STARTING

- [ ] You've read GEMINI.md (all 14 sections)
- [ ] You've run Prompt #0 (initialization check)
- [ ] You've run Prompt #1 (vault structure created)
- [ ] You've run Prompt #2 (all 10 phase specs populated)
- [ ] Obsidian is open to docs/00-VAULT-INDEX.md
- [ ] You understand the 10-phase timeline
- [ ] You understand the tech stack constraints
- [ ] You know what Phase 01 deliverables are

If all checked: **You are ready to start Phase 01 implementation.**

Paste **Prompt #3 (MORNING SYNC)** to begin.

---

**Status:** Ready to Use  
**Total Prompts:** 9 production-ready  
**Estimated Build Time:** 49 days  
**Portfolio Value:** High (full distributed systems project)

Start with **Prompt #0** when you open Antigravity for the first time.
