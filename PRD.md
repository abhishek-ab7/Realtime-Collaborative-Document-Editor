# Realtime Collaborative Document Editor — Product Requirements Document

> **Version:** 1.0.0  
> **Date:** 2026-06-04  
> **Status:** Draft — Pending Review  
> **Author:** Principal Product & Engineering  
> **Classification:** Internal / Portfolio

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Market Context](#2-problem-statement--market-context)
3. [Product Vision & Goals](#3-product-vision--goals)
4. [Tech Stack](#4-tech-stack)
5. [Core Features](#5-core-features)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [System Design](#7-system-design)
8. [CRDT Design Deep-Dive](#8-crdt-design-deep-dive)
9. [Database Design](#9-database-design)
10. [API Design](#10-api-design)
11. [Security Design](#11-security-design)
12. [Testing Strategy](#12-testing-strategy)
13. [Project Structure](#13-project-structure)
14. [Implementation Roadmap](#14-implementation-roadmap)
15. [Observability & Operations](#15-observability--operations)
16. [Resume Impact](#16-resume-impact)

---

## 1. Executive Summary

**Collabdoc** is a modern, real-time collaborative document editing platform that enables multiple users to simultaneously create, edit, and share rich-text documents with conflict-free synchronization, live presence awareness, granular permissions, and full version history.

The system is architected around **CRDTs (Conflict-free Replicated Data Types)** via the **Yjs** library, delivering **offline-first** editing with **eventual consistency** guarantees. Real-time communication is powered by **Socket.io** with a room-based architecture. The platform supports **Google OAuth** authentication, **role-based access control**, and **audit-grade version history** with diff-based storage.

### Key Engineering Differentiators

| Dimension           | Approach                                                      |
| ------------------- | ------------------------------------------------------------- |
| Conflict resolution | CRDT (Yjs) — not OT                                           |
| Sync model          | Offline-first with automatic merge                            |
| Transport           | WebSocket (Socket.io) with HTTP fallback                      |
| Persistence         | Debounced binary snapshot + incremental updates               |
| Auth                | OAuth 2.0 + session tokens (Auth.js)                          |
| Data model          | Relational (PostgreSQL) with JSONB for metadata               |
| Observability       | Distributed tracing (OpenTelemetry) + error tracking (Sentry) |

---

## 2. Problem Statement & Market Context

### The Problem

Existing collaborative editors fall into two categories:

1. **Monolithic SaaS** (Google Docs, Notion) — powerful but opaque; impossible to learn from or extend.
2. **Toy demos** — functional for two users in a browser tab, but collapse under real-world conditions: no auth, no persistence, no permissions, no offline support, no version history.

There is no open, well-architected reference implementation that demonstrates **production-grade collaborative editing** with the full stack of concerns: distributed state, presence, permissions, persistence, and operations.

### Target Users

| Persona                                | Need                                                                                                |
| -------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Software Engineers building portfolios | A project that demonstrates distributed systems, real-time architecture, and production engineering |
| Small teams (2–20)                     | Lightweight, fast collaborative editing without vendor lock-in                                      |
| Technical hiring managers              | A candidate artifact that proves system design competence beyond CRUD                               |

### Success Criteria

| Metric                          | Target                      |
| ------------------------------- | --------------------------- |
| Concurrent editors per document | ≥ 20                        |
| Total concurrent documents      | ≥ 500                       |
| Total registered users          | ≥ 10,000                    |
| Edit propagation latency (p95)  | < 50ms                      |
| Document load time (p95)        | < 2s                        |
| Zero data loss incidents        | 0 over 30 days of operation |

---

## 3. Product Vision & Goals

### Vision Statement

> A collaborative document editor that is as fast as local editing, as reliable as a database, and as transparent as open-source.

### Primary Goals

1. **Zero-conflict collaboration** — multiple users edit the same paragraph simultaneously with no data loss and no manual conflict resolution.
2. **Offline resilience** — users can edit without a network connection; changes merge automatically on reconnect.
3. **Production trust** — the system handles crashes, disconnects, and partial failures without silent data loss.
4. **Architectural clarity** — every design decision is explicit, documented, and defensible in a system design interview.

### Non-Goals (v1)

- Real-time commenting / suggestion mode (deferred to v2)
- Embedded media (images, tables, embeds) beyond basic rich text (deferred to v2)
- Mobile-native applications
- End-to-end encryption
- Multi-tenant organization hierarchy

---

## 4. Tech Stack

### Mandatory Stack

| Layer                      | Technology                | Version             | Rationale                                                 |
| -------------------------- | ------------------------- | ------------------- | --------------------------------------------------------- |
| **Frontend Framework**     | Next.js                   | 16+ (latest stable) | App Router, Server Components, Server Actions, edge-ready |
| **UI Library**             | React                     | 19                  | Concurrent features, `use()`, improved Suspense           |
| **Language**               | TypeScript                | 5.5+                | Type safety across the full stack                         |
| **Styling**                | Tailwind CSS              | 4.x                 | Utility-first, design-system-friendly                     |
| **Component Library**      | shadcn/ui                 | latest              | Accessible, composable, unstyled primitives               |
| **Rich Text Editor**       | TipTap                    | 2.x                 | ProseMirror-based; first-class Yjs integration            |
| **CRDT Engine**            | Yjs                       | 13.x                | Battle-tested CRDT for collaborative text                 |
| **Realtime Transport**     | Socket.io                 | 4.x                 | WebSocket with automatic fallback, rooms, namespaces      |
| **Database**               | PostgreSQL                | 16+                 | ACID, JSONB, full-text search, row-level security         |
| **ORM**                    | Prisma                    | 6.x                 | Type-safe queries, migrations, introspection              |
| **Authentication**         | Auth.js (NextAuth)        | 5.x                 | OAuth 2.0 providers, session management                   |
| **OAuth Provider**         | Google                    | —                   | Widely available, frictionless sign-in                    |
| **Error Tracking**         | Sentry                    | latest              | Source maps, breadcrumbs, performance monitoring          |
| **Tracing**                | OpenTelemetry             | latest              | Vendor-neutral distributed tracing                        |
| **Unit/Integration Tests** | Vitest                    | latest              | Fast, ESM-native, watch mode                              |
| **Component Tests**        | React Testing Library     | latest              | User-centric DOM testing                                  |
| **E2E Tests**              | Playwright                | latest              | Cross-browser, network interception, multi-tab            |
| **Deployment**             | Vercel + PostgreSQL Cloud | —                   | Zero-config frontend; managed database                    |

### Architecture Decision Records (ADRs)

#### ADR-001: CRDT (Yjs) over Operational Transformation (OT)

**Context:** Collaborative editing requires a conflict-resolution strategy.

**Decision:** Use Yjs (CRDT) instead of OT.

**Rationale:**

| Factor              | OT                                                  | CRDT (Yjs)                                            |
| ------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| Server requirement  | Requires a central transformation server            | Peer-to-peer capable; server is optional relay        |
| Offline support     | Poor — operations must be serialized through server | Excellent — local edits are valid, merge on reconnect |
| Complexity          | O(n²) transformation functions                      | O(1) merge via unique IDs                             |
| Proven at scale     | Google Docs (proprietary)                           | Yjs, Automerge, Liveblocks                            |
| Open source quality | Few production-grade libraries                      | Yjs is mature, well-documented, actively maintained   |

**Consequences:** Binary document state (Yjs encoded) must be stored; not human-readable in DB.

#### ADR-002: Socket.io over raw WebSocket

**Context:** Need bidirectional real-time transport.

**Decision:** Socket.io.

**Rationale:** Automatic reconnection, room abstraction, fallback to long-polling, multiplexing, built-in ack/retry. Raw WebSocket requires reimplementing all of these.

#### ADR-003: Separate Socket.io Server Process

**Context:** Next.js on Vercel does not support long-lived WebSocket connections natively.

**Decision:** Run Socket.io as a standalone Node.js server (deployed to Railway/Render/Fly.io) alongside the Next.js frontend on Vercel.

**Rationale:** Vercel's serverless functions are stateless and short-lived. WebSocket connections require a persistent process. The Socket.io server handles real-time sync and presence; the Next.js app handles HTTP, SSR, auth, and API routes.

**Consequences:** Two deployment targets; CORS configuration required; auth tokens must be validated on both surfaces.

---

## 5. Core Features

### 5.1 Authentication

#### User Stories

| ID      | Story                                                                                        | Priority |
| ------- | -------------------------------------------------------------------------------------------- | -------- |
| AUTH-01 | As a visitor, I can sign in with my Google account so I don't need to create a new password. | P0       |
| AUTH-02 | As a signed-in user, I can sign out from any device.                                         | P0       |
| AUTH-03 | As a signed-in user, I can view and update my display name and avatar.                       | P1       |
| AUTH-04 | As a signed-in user, my session persists across browser restarts.                            | P0       |
| AUTH-05 | As a signed-in user, my session expires after 30 days of inactivity.                         | P1       |

#### Auth Flow

```
┌─────────┐     ┌───────────┐     ┌────────────┐     ┌──────────┐
│  Client  │────▶│  Next.js   │────▶│  Google     │────▶│  Google   │
│  Browser │     │  Auth.js   │     │  OAuth 2.0  │     │  Account  │
└─────────┘     └───────────┘     └────────────┘     └──────────┘
     │                │                                      │
     │                │◀──── Authorization Code ─────────────┘
     │                │
     │                │───▶ Exchange for tokens
     │                │───▶ Upsert user in PostgreSQL
     │                │───▶ Create session (JWT or DB session)
     │                │
     │◀─── Set session cookie (httpOnly, secure, sameSite=lax) ──│
     │
     │───▶ Subsequent requests include cookie automatically
```

#### Session Strategy

| Property        | Value                                |
| --------------- | ------------------------------------ |
| Session store   | Database (Prisma adapter)            |
| Cookie flags    | `httpOnly`, `secure`, `sameSite=lax` |
| Session max age | 30 days                              |
| Token refresh   | Sliding window on activity           |
| CSRF protection | Double-submit cookie via Auth.js     |

---

### 5.2 Document Management

#### User Stories

| ID     | Story                                                            | Priority |
| ------ | ---------------------------------------------------------------- | -------- |
| DOC-01 | As a user, I can create a new blank document from the dashboard. | P0       |
| DOC-02 | As a user, I can rename a document inline.                       | P0       |
| DOC-03 | As a user, I can soft-delete a document (move to trash).         | P0       |
| DOC-04 | As a user, I can permanently delete a trashed document.          | P1       |
| DOC-05 | As a user, I can restore a trashed document.                     | P1       |
| DOC-06 | As a user, I can duplicate a document (including content).       | P1       |
| DOC-07 | As a user, I can search my documents by title.                   | P1       |
| DOC-08 | As a user, I can star/unstar documents.                          | P2       |
| DOC-09 | As a user, I see my recent documents sorted by last accessed.    | P0       |
| DOC-10 | As a user, I see a list/grid view of all my documents.           | P1       |

#### Dashboard UI States

```
┌──────────────────────────────────────────────────────┐
│  Collabdoc                          [Avatar] Sign Out │
├──────────────────────────────────────────────────────┤
│  [+ New Document]      [🔍 Search documents...]      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ★ Starred                                           │
│  ┌─────────┐  ┌─────────┐                           │
│  │ Q3 Plan │  │ API Spec│                           │
│  │ 2h ago  │  │ 1d ago  │                           │
│  └─────────┘  └─────────┘                           │
│                                                      │
│  ⏱ Recent                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐             │
│  │ Meeting │  │ Design  │  │ Roadmap │             │
│  │ Notes   │  │ Doc     │  │ v2      │             │
│  │ 30m ago │  │ 3h ago  │  │ 1d ago  │             │
│  └─────────┘  └─────────┘  └─────────┘             │
│                                                      │
│  📁 All Documents                                    │
│  ...                                                 │
└──────────────────────────────────────────────────────┘
```

#### Document Lifecycle State Machine

```
                ┌──────────┐
    create ────▶│  ACTIVE  │◀──── restore
                └────┬─────┘
                     │ soft-delete
                     ▼
                ┌──────────┐
                │ TRASHED  │
                └────┬─────┘
                     │ permanent-delete
                     ▼
                ┌──────────┐
                │ DELETED  │  (hard delete from DB after 30 days)
                └──────────┘
```

---

### 5.3 Realtime Collaborative Editing

#### User Stories

| ID        | Story                                                                                                | Priority |
| --------- | ---------------------------------------------------------------------------------------------------- | -------- |
| COLLAB-01 | As a user, I can open a document and see its current content in < 2s.                                | P0       |
| COLLAB-02 | As a user, when another user types in the same document, I see their changes appear within 50ms.     | P0       |
| COLLAB-03 | As a user, I can edit a document while offline, and my changes merge automatically when I reconnect. | P0       |
| COLLAB-04 | As a user, I never see a conflict dialog — all merges are automatic.                                 | P0       |
| COLLAB-05 | As a user, if my browser crashes, I lose at most the last 2 seconds of edits.                        | P0       |
| COLLAB-06 | As a user, I can see how many people are currently editing.                                          | P1       |

#### Collaboration Architecture

```
  User A (Browser)              Socket.io Server              User B (Browser)
  ┌─────────────┐              ┌──────────────────┐           ┌─────────────┐
  │  TipTap     │              │                  │           │  TipTap     │
  │  Editor     │              │  Room: doc_xyz   │           │  Editor     │
  │     │       │              │                  │           │       │     │
  │  Yjs Doc    │──── ws ────▶│  Yjs Provider    │◀── ws ───│  Yjs Doc    │
  │  (local)    │              │  (relay + persist)│           │  (local)    │
  │     │       │              │       │          │           │       │     │
  │  IndexedDB  │              │       ▼          │           │  IndexedDB  │
  │  (offline)  │              │  PostgreSQL      │           │  (offline)  │
  └─────────────┘              │  (snapshots)     │           └─────────────┘
                               └──────────────────┘
```

#### Sync Protocol

1. **Client connects** → sends `join-room` with `documentId` + auth token.
2. **Server validates** token, checks permissions.
3. **Server sends** latest Yjs document state (binary snapshot) to client.
4. **Client merges** server state with local state (IndexedDB).
5. **Client sends** Yjs update (binary diff) on every local edit.
6. **Server broadcasts** update to all other clients in the room.
7. **Server debounce-persists** accumulated updates to PostgreSQL every 2 seconds (or on room empty).

#### Offline Recovery Protocol

```
┌──────────────────────────────────────────────────────┐
│                  OFFLINE EDITING FLOW                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  1. Connection lost                                  │
│     ├── Socket.io fires 'disconnect' event           │
│     ├── UI shows "Offline — changes saved locally"   │
│     └── Yjs continues accepting local edits          │
│                                                      │
│  2. Edits are buffered                               │
│     ├── Yjs updates stored in IndexedDB              │
│     └── Pending update queue grows                   │
│                                                      │
│  3. Connection restored                              │
│     ├── Socket.io auto-reconnects (backoff)          │
│     ├── Client sends full Yjs state vector           │
│     ├── Server responds with missing updates         │
│     ├── Client applies remote updates (CRDT merge)   │
│     ├── Client sends its pending local updates       │
│     └── Server broadcasts to other clients           │
│                                                      │
│  4. Sync confirmed                                   │
│     ├── UI shows "All changes saved"                 │
│     └── IndexedDB cleared of pending queue           │
│                                                      │
│  GUARANTEE: Zero data loss. CRDT merge is            │
│  commutative, associative, and idempotent.           │
└──────────────────────────────────────────────────────┘
```

#### Performance Budgets

| Metric                                | Target            | Measurement                         |
| ------------------------------------- | ----------------- | ----------------------------------- |
| Keystroke-to-remote-render (p50)      | < 30ms            | Instrumented via OpenTelemetry span |
| Keystroke-to-remote-render (p95)      | < 50ms            | Same                                |
| Document open (cold, p95)             | < 2s              | Navigation timing API               |
| Reconnection time (p95)               | < 3s              | Socket.io reconnect event           |
| Max concurrent editors (per document) | 20                | Load test with Playwright           |
| Max document size                     | 5 MB (Yjs binary) | Reject larger documents at server   |

---

### 5.4 Live Presence

#### User Stories

| ID      | Story                                                                         | Priority |
| ------- | ----------------------------------------------------------------------------- | -------- |
| PRES-01 | As a user, I see avatars of all users currently viewing the document.         | P0       |
| PRES-02 | As a user, I see colored cursors showing where each collaborator is editing.  | P0       |
| PRES-03 | As a user, each cursor has a name label with the collaborator's display name. | P0       |
| PRES-04 | As a user, each collaborator is assigned a unique, consistent color.          | P1       |
| PRES-05 | As a user, I see a subtle notification when someone joins or leaves.          | P2       |
| PRES-06 | As a user, I see a typing indicator when a collaborator is actively editing.  | P2       |

#### Presence Architecture (Yjs Awareness)

The **Yjs Awareness API** manages ephemeral per-user state that is NOT persisted to the document.

```typescript
// Awareness state shape per user
interface AwarenessState {
  user: {
    id: string;
    name: string;
    avatar: string;
    color: string; // assigned from a palette of 12 distinct colors
  };
  cursor: {
    anchor: number; // Yjs relative position
    head: number; // Yjs relative position
  } | null;
  isTyping: boolean;
  lastActive: number; // Unix timestamp
}
```

#### Presence Lifecycle

```
  User joins document
       │
       ▼
  Set local awareness state
  (name, color, cursor=null)
       │
       ▼
  Socket.io broadcasts awareness
  to all room members
       │
       ▼
  ┌─── On cursor move ───┐
  │  Update cursor in     │
  │  awareness state      │──▶ Throttled broadcast (60fps cap → 16ms)
  │  (relative position)  │
  └───────────────────────┘
       │
  ┌─── On typing ────────┐
  │  Set isTyping=true    │──▶ Broadcast
  │  Auto-clear after 2s  │
  └───────────────────────┘
       │
  ┌─── On disconnect ────┐
  │  Awareness removes    │──▶ Other clients remove cursor + avatar
  │  user after 30s       │
  │  timeout              │
  └───────────────────────┘
```

#### Color Assignment Strategy

A palette of 12 high-contrast, colorblind-friendly colors. Assigned by hashing `userId` to an index. If two users in the same room collide, increment index.

```
#E57373  #F06292  #BA68C8  #9575CD
#64B5F6  #4FC3F7  #4DB6AC  #81C784
#FFD54F  #FFB74D  #A1887F  #90A4AE
```

---

### 5.5 Document Sharing & Permissions

#### User Stories

| ID       | Story                                                                             | Priority |
| -------- | --------------------------------------------------------------------------------- | -------- |
| SHARE-01 | As a document owner, I can generate a shareable link.                             | P0       |
| SHARE-02 | As a document owner, I can invite collaborators by email.                         | P1       |
| SHARE-03 | As a document owner, I can set a collaborator's role (Editor, Viewer).            | P0       |
| SHARE-04 | As a document owner, I can revoke a collaborator's access.                        | P0       |
| SHARE-05 | As a viewer, I can read the document but cannot edit it.                          | P0       |
| SHARE-06 | As a document owner, I can transfer ownership.                                    | P2       |
| SHARE-07 | As a document owner, I can set a share link to "anyone with link" (view or edit). | P1       |

#### Permission Matrix

| Action               | Owner | Editor | Viewer | Anonymous (link)                |
| -------------------- | ----- | ------ | ------ | ------------------------------- |
| View document        | ✅    | ✅     | ✅     | ✅ (if link allows)             |
| Edit document        | ✅    | ✅     | ❌     | ❌ (view link) / ✅ (edit link) |
| Rename document      | ✅    | ❌     | ❌     | ❌                              |
| Delete document      | ✅    | ❌     | ❌     | ❌                              |
| Share document       | ✅    | ❌     | ❌     | ❌                              |
| View version history | ✅    | ✅     | ✅     | ❌                              |
| Restore version      | ✅    | ✅     | ❌     | ❌                              |
| Manage collaborators | ✅    | ❌     | ❌     | ❌                              |
| Transfer ownership   | ✅    | ❌     | ❌     | ❌                              |

#### Share Link Design

```
https://collabdoc.app/d/{documentId}?token={shareToken}

shareToken: base64url(random 32 bytes)
Stored in `share_links` table with:
  - document_id
  - token (hashed with SHA-256 for storage)
  - permission (VIEW | EDIT)
  - created_by
  - expires_at (nullable)
  - is_active
```

---

### 5.6 Version History

#### User Stories

| ID     | Story                                                                     | Priority |
| ------ | ------------------------------------------------------------------------- | -------- |
| VER-01 | As a user, I can open a version history panel showing all saved versions. | P0       |
| VER-02 | As a user, I see who made each version and when.                          | P0       |
| VER-03 | As a user, I can click a version to preview it (read-only).               | P0       |
| VER-04 | As an editor, I can restore a previous version.                           | P0       |
| VER-05 | As a user, I can see a diff between two versions.                         | P1       |

#### Version Storage Strategy

```
┌───────────────────────────────────────────────────────────┐
│                 VERSION STORAGE MODEL                     │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Two complementary storage mechanisms:                    │
│                                                           │
│  1. SNAPSHOTS (full state)                                │
│     ├── Stored every 100 updates or every 5 minutes       │
│     ├── Binary Yjs document state (Y.encodeStateAsUpdate) │
│     ├── Enables fast loading (no replay needed)           │
│     └── Stored in `document_snapshots` table              │
│                                                           │
│  2. VERSIONS (user-facing milestones)                     │
│     ├── Created explicitly or on significant events:      │
│     │   ├── Manual "Save version" by user                 │
│     │   ├── Before a restore operation                    │
│     │   ├── Every 30 minutes of continuous editing        │
│     │   └── When last editor leaves the document          │
│     ├── Contains:                                         │
│     │   ├── Full Yjs snapshot (for restore)               │
│     │   ├── Plain-text content (for diff/search)          │
│     │   ├── Editor attribution (userId)                   │
│     │   └── Timestamp                                     │
│     └── Stored in `document_versions` table               │
│                                                           │
│  DIFF COMPUTATION:                                        │
│  ├── Computed on-the-fly from plain-text content          │
│  ├── Uses Myers diff algorithm (via `diff` npm package)   │
│  └── NOT pre-computed (storage cost vs compute tradeoff)  │
│                                                           │
│  RETENTION POLICY:                                        │
│  ├── Snapshots: Keep last 50, GC older ones               │
│  ├── Versions: Keep all (audit trail)                     │
│  └── Trashed documents: Hard-delete after 30 days         │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

### 5.7 Persistence Layer

#### Auto-Save Strategy

```
  User types in editor
       │
       ▼
  Yjs generates binary update (Uint8Array)
       │
       ├──▶ Immediately: Saved to IndexedDB (client-side)
       │
       └──▶ Immediately: Sent to Socket.io server
                  │
                  ├──▶ Immediately: Broadcast to room peers
                  │
                  └──▶ Debounced (2s): Persist to PostgreSQL
                            │
                            ├── Merge accumulated updates
                            ├── Store merged snapshot
                            └── Update `updated_at` timestamp
```

#### Persistence Guarantees

| Scenario                       | Data Safety                                          |
| ------------------------------ | ---------------------------------------------------- |
| User types and stays connected | Saved to DB within 2s                                |
| User types and closes tab      | Saved to IndexedDB immediately; synced on next open  |
| User types and browser crashes | IndexedDB persists; Yjs recovers on reload           |
| Server crashes mid-sync        | Client retries; CRDT merge is idempotent             |
| Database write fails           | Server retries with exponential backoff (3 attempts) |
| All clients disconnect         | Server persists final state before room cleanup      |

#### Save Status Indicator

```
  "Saving..."  →  "All changes saved"  →  "Offline — saved locally"
       │                  │                         │
  (debounce             (DB write               (no connection;
   timer active)         confirmed)              IndexedDB only)
```

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric                           | Target  | How Measured              |
| -------------------------------- | ------- | ------------------------- |
| Editor load (p50)                | < 1s    | Lighthouse, Web Vitals    |
| Editor load (p95)                | < 2s    | Lighthouse, Web Vitals    |
| Time to first collaboration      | < 1s    | Custom OpenTelemetry span |
| Keystroke-to-remote render (p95) | < 50ms  | Custom OpenTelemetry span |
| Dashboard load (p95)             | < 1.5s  | Lighthouse                |
| API response time (p95)          | < 200ms | Server-side metrics       |
| WebSocket reconnect (p95)        | < 3s    | Socket.io metrics         |
| Largest Contentful Paint         | < 2.5s  | Core Web Vitals           |
| Interaction to Next Paint        | < 200ms | Core Web Vitals           |
| Cumulative Layout Shift          | < 0.1   | Core Web Vitals           |

### 6.2 Scalability

| Dimension                    | Target            | Strategy                                |
| ---------------------------- | ----------------- | --------------------------------------- |
| Concurrent users (total)     | 5,000             | Horizontal scaling of Socket.io servers |
| Concurrent editors (per doc) | 20                | Room-based isolation                    |
| Concurrent documents         | 500               | Independent rooms                       |
| Document size                | 5 MB (Yjs binary) | Reject larger; suggest splitting        |
| Total documents              | 100,000           | PostgreSQL with proper indexing         |
| Socket.io servers            | 1–4               | Redis adapter for multi-server rooms    |

#### Horizontal Scaling Architecture

```
                    ┌──────────────┐
                    │  Load        │
                    │  Balancer    │
                    │  (sticky)    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌───────────┐ ┌───────────┐ ┌───────────┐
        │ Socket.io │ │ Socket.io │ │ Socket.io │
        │ Server 1  │ │ Server 2  │ │ Server 3  │
        └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
              │              │              │
              └──────────────┼──────────────┘
                             │
                      ┌──────▼──────┐
                      │    Redis    │  (Socket.io adapter
                      │   Pub/Sub   │   for cross-server
                      │             │   message routing)
                      └──────┬──────┘
                             │
                      ┌──────▼──────┐
                      │ PostgreSQL  │
                      │  (Primary)  │
                      └─────────────┘
```

### 6.3 Reliability

| Requirement                    | Target                                       |
| ------------------------------ | -------------------------------------------- |
| Uptime                         | 99.9% (< 8.76 hours downtime/year)           |
| Data durability                | 99.999% (no silent data loss)                |
| Recovery Point Objective (RPO) | 2 seconds (debounce window)                  |
| Recovery Time Objective (RTO)  | < 30 seconds (auto-reconnect)                |
| Graceful degradation           | Offline editing continues; sync on reconnect |

### 6.4 Security

| Requirement          | Implementation                                     |
| -------------------- | -------------------------------------------------- |
| Authentication       | OAuth 2.0 (Google) via Auth.js                     |
| Session management   | Secure httpOnly cookies, 30-day expiry             |
| Authorization        | Role-based per-document permission checks          |
| Transport encryption | TLS 1.3 for all connections                        |
| Data at rest         | PostgreSQL with encrypted volumes (cloud provider) |
| Input validation     | Zod schemas on all API inputs                      |
| XSS prevention       | React's default escaping + CSP headers             |
| CSRF prevention      | Auth.js built-in CSRF tokens                       |
| Rate limiting        | Per-IP and per-user limits on API + WebSocket      |
| Dependency security  | Automated vulnerability scanning (npm audit, Snyk) |

### 6.5 Accessibility

| Requirement         | Standard                                   |
| ------------------- | ------------------------------------------ |
| WCAG compliance     | 2.1 AA                                     |
| Keyboard navigation | Full editor and dashboard keyboard support |
| Screen reader       | ARIA labels on all interactive elements    |
| Color contrast      | Minimum 4.5:1 ratio                        |
| Focus management    | Visible focus indicators                   |
| Reduced motion      | `prefers-reduced-motion` respected         |

### 6.6 SEO

| Requirement             | Implementation                              |
| ----------------------- | ------------------------------------------- |
| Landing/marketing pages | Server-rendered with proper meta tags       |
| Document pages          | `noindex` (private content)                 |
| Open Graph              | Dynamic OG images for shared document links |
| Sitemap                 | Auto-generated for public pages             |

### 6.7 Observability

| Dimension              | Tool                          | What's Tracked                                                 |
| ---------------------- | ----------------------------- | -------------------------------------------------------------- |
| Error tracking         | Sentry                        | Unhandled exceptions, React error boundaries, Socket errors    |
| Performance monitoring | Sentry                        | Transaction traces, Web Vitals, API latency                    |
| Distributed tracing    | OpenTelemetry                 | Request traces across Next.js → Socket.io → PostgreSQL         |
| Structured logging     | Pino                          | JSON logs with correlation IDs                                 |
| Metrics                | OpenTelemetry                 | Room count, active connections, sync latency, DB write latency |
| Alerting               | Sentry + PagerDuty (optional) | Error spike, latency degradation, connection drops             |

---

## 7. System Design

### 7.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│                                                                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────────┐ │
│  │  Next.js   │  │  TipTap    │  │  Yjs       │  │  Socket.io   │ │
│  │  App Shell │  │  Editor    │  │  Document   │  │  Client      │ │
│  │  (React)   │  │  (ProseMirror)│  │  (CRDT)    │  │              │ │
│  └──────┬─────┘  └──────┬─────┘  └──────┬─────┘  └──────┬───────┘ │
│         │               │               │               │         │
│         │               └───────┬───────┘               │         │
│         │                       │                       │         │
│  ┌──────▼───────────────────────▼───────────────────────▼───────┐ │
│  │                    IndexedDB (y-indexeddb)                    │ │
│  │              Local persistence for offline support            │ │
│  └──────────────────────────────────────────────────────────────┘ │
└───────────────┬─────────────────────────────────┬────────────────┘
                │ HTTPS                           │ WSS
                ▼                                 ▼
┌───────────────────────────┐   ┌──────────────────────────────────┐
│    Next.js (Vercel)       │   │    Socket.io Server              │
│                           │   │    (Railway / Render / Fly.io)   │
│  ┌─────────────────────┐  │   │                                  │
│  │  App Router         │  │   │  ┌────────────────────────────┐  │
│  │  (Server Components)│  │   │  │  Room Manager              │  │
│  │  (Server Actions)   │  │   │  │  ├── join/leave             │  │
│  │  (Route Handlers)   │  │   │  │  ├── Yjs sync provider     │  │
│  └─────────┬───────────┘  │   │  │  ├── Awareness relay       │  │
│            │              │   │  │  └── Persistence scheduler  │  │
│  ┌─────────▼───────────┐  │   │  └────────────┬───────────────┘  │
│  │  Auth.js            │  │   │               │                  │
│  │  (NextAuth v5)      │  │   │  ┌────────────▼───────────────┐  │
│  └─────────┬───────────┘  │   │  │  Auth Middleware           │  │
│            │              │   │  │  (validate session token)  │  │
│  ┌─────────▼───────────┐  │   │  └────────────────────────────┘  │
│  │  Prisma Client      │  │   │                                  │
│  └─────────┬───────────┘  │   └──────────────┬───────────────────┘
│            │              │                  │
└────────────┼──────────────┘                  │
             │                                 │
             ▼                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                        PostgreSQL                                │
│                  (Neon / Supabase / RDS)                         │
│                                                                  │
│  ┌──────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │  users   │ │  documents   │ │ collabs    │ │  versions    │ │
│  └──────────┘ └──────────────┘ └────────────┘ └──────────────┘ │
│  ┌──────────────┐ ┌────────────────┐ ┌──────────────────────┐  │
│  │  snapshots   │ │  share_links   │ │  activity_logs       │  │
│  └──────────────┘ └────────────────┘ └──────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### 7.2 Data Flow: User Joins a Document

```
  Step 1: Navigation
  ───────────────────────────────────────────────────
  Browser navigates to /d/{documentId}
  Next.js App Router renders the page (Server Component)
  Server Action: getDocument(documentId) →
    ├── Verify session (Auth.js)
    ├── Check permission (collaborators table)
    ├── Fetch document metadata from PostgreSQL
    └── Return metadata to client (NOT content — that's via Yjs)

  Step 2: Editor Initialization
  ───────────────────────────────────────────────────
  Client Component mounts TipTap editor
  Yjs document (Y.Doc) created in memory
  y-indexeddb loads any local state from IndexedDB
  Socket.io client connects to wss://rt.collabdoc.app

  Step 3: Socket Authentication
  ───────────────────────────────────────────────────
  Client sends: { event: 'authenticate', token: sessionToken }
  Server validates token against Auth.js session store
  Server responds: { event: 'authenticated', userId: '...' }

  Step 4: Join Room
  ───────────────────────────────────────────────────
  Client sends: { event: 'join-room', documentId: '...' }
  Server:
    ├── Verify user has permission for this document
    ├── Add socket to Socket.io room `doc:{documentId}`
    ├── Load latest Yjs snapshot from PostgreSQL (if exists)
    ├── Send snapshot to client: { event: 'sync-init', state: Uint8Array }
    └── Broadcast to room: { event: 'user-joined', user: {...} }

  Step 5: State Merge
  ───────────────────────────────────────────────────
  Client receives server state
  Yjs merges server state with local state (CRDT merge)
    ├── If local has newer edits (offline) → they survive
    ├── If server has newer edits (other users) → they survive
    └── Both survive — CRDT is union-based
  TipTap re-renders the merged document

  Step 6: Awareness Sync
  ───────────────────────────────────────────────────
  Client sets awareness state:
    { user: { name, color, avatar }, cursor: null }
  Server relays awareness to all room members
  Client renders remote cursors in TipTap

  Step 7: Ongoing Editing
  ───────────────────────────────────────────────────
  On each local edit:
    ├── Yjs generates update (Uint8Array diff)
    ├── Update saved to IndexedDB
    ├── Update sent to server via Socket.io
    └── Server broadcasts to room + schedules DB persist

  On each remote update received:
    ├── Yjs applies update to local doc (CRDT merge)
    └── TipTap re-renders affected nodes
```

### 7.3 Room Management

```
┌──────────────────────────────────────────────────────────────┐
│                     ROOM LIFECYCLE                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Room Creation (lazy):                                       │
│  ├── First user joins a document                             │
│  ├── Server creates room `doc:{documentId}`                  │
│  ├── Loads Yjs snapshot from PostgreSQL                       │
│  ├── Initializes in-memory Y.Doc                             │
│  └── Starts persistence scheduler (2s debounce)              │
│                                                              │
│  Room Active:                                                │
│  ├── Users join/leave freely                                 │
│  ├── Yjs updates relayed between all members                 │
│  ├── Awareness (cursors) relayed between all members         │
│  ├── Persistence scheduler writes to PostgreSQL              │
│  └── Version snapshots created on schedule                   │
│                                                              │
│  Room Teardown (on last user leaves):                        │
│  ├── Wait 30 seconds (grace period for reconnect)            │
│  ├── Persist final Yjs state to PostgreSQL                   │
│  ├── Create version snapshot if significant changes          │
│  ├── Destroy in-memory Y.Doc                                 │
│  └── Remove room from server                                 │
│                                                              │
│  Memory Management:                                          │
│  ├── Max rooms per server: 200 (configurable)                │
│  ├── Max memory per room: ~10 MB (5 MB doc + overhead)       │
│  ├── Idle rooms (no edits for 10 min) → reduced interval     │
│  └── OOM protection: reject new rooms if > 80% memory        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 7.4 Socket.io Lifecycle

```
  Client                          Server
    │                                │
    │── connect ──────────────────▶  │  TCP + WebSocket handshake
    │                                │  Assign socket.id
    │                                │
    │── authenticate(token) ──────▶  │  Validate session
    │◀─ authenticated(userId) ─────  │  or disconnect(401)
    │                                │
    │── join-room(docId) ─────────▶  │  Permission check
    │◀─ sync-init(state) ──────────  │  Send Yjs snapshot
    │◀─ awareness-init(states) ────  │  Send current awareness
    │                                │
    │                                │  ┌── STEADY STATE ──┐
    │── yjs-update(binary) ───────▶  │  │                  │
    │                        broadcast│  │  Relay updates   │
    │◀─ yjs-update(binary) ────────  │  │  Relay awareness │
    │── awareness-update(state) ──▶  │  │  Debounce persist│
    │◀─ awareness-update(state) ───  │  │                  │
    │                                │  └──────────────────┘
    │                                │
    │── disconnect ───────────────▶  │  Remove from room
    │                                │  Broadcast user-left
    │                                │  If room empty → teardown timer
    │                                │
    │── reconnect (automatic) ────▶  │  Re-authenticate
    │── join-room(docId) ─────────▶  │  Re-sync state
    │                                │
```

---

## 8. CRDT Design Deep-Dive

### 8.1 Why CRDT Instead of OT

| Dimension                | OT (Operational Transformation)                     | CRDT (Conflict-free Replicated Data Type)          |
| ------------------------ | --------------------------------------------------- | -------------------------------------------------- |
| **Central server**       | Required — server transforms operations             | Not required — peers merge independently           |
| **Algorithm complexity** | O(n²) transformation pairs for n operation types    | O(1) merge — each element has a globally unique ID |
| **Offline editing**      | Extremely difficult — operations must be linearized | Native — local edits are always valid              |
| **Convergence proof**    | Hard — must prove TP1/TP2 properties                | Built into the data structure mathematically       |
| **Implementation**       | Google Docs (proprietary), ShareDB                  | Yjs, Automerge, Diamond Types                      |
| **Undo**                 | Complex — must inverse-transform                    | Tracked via Yjs UndoManager                        |
| **Document size**        | Text only (operation log)                           | Entire document state (binary, larger)             |
| **Garbage collection**   | N/A (operation logs can be trimmed)                 | Yjs GC removes tombstones periodically             |

**Decision: CRDT (Yjs)** — superior offline support, simpler merge semantics, no central server bottleneck, proven in production.

### 8.2 How Yjs Resolves Conflicts

Yjs uses a **YATA (Yet Another Transformation Approach)** CRDT algorithm:

```
┌──────────────────────────────────────────────────────────────┐
│                  YATA CONFLICT RESOLUTION                    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Core principle: Every character has a globally unique ID    │
│  composed of (clientId, clock).                              │
│                                                              │
│  Insert at position P:                                       │
│  ├── Yjs finds the item at position P                        │
│  ├── Creates a new item with ID (myClientId, myClock++)      │
│  ├── Links it between left-neighbor and right-neighbor       │
│  └── If two users insert at the same position:               │
│      ├── Both items are kept (no conflict!)                  │
│      ├── Order is deterministic: lower clientId goes first   │
│      └── All replicas converge to the same order             │
│                                                              │
│  Delete at position P:                                       │
│  ├── Yjs marks the item as "deleted" (tombstone)             │
│  ├── Item is NOT removed from the internal list              │
│  ├── Tombstones are garbage-collected periodically           │
│  └── If two users delete the same item:                      │
│      ├── Both deletions are idempotent                       │
│      └── No conflict                                         │
│                                                              │
│  Mathematical properties:                                    │
│  ├── Commutative: A merge B = B merge A                      │
│  ├── Associative: (A merge B) merge C = A merge (B merge C)  │
│  ├── Idempotent: A merge A = A                               │
│  └── Therefore: eventual consistency is guaranteed            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 8.3 Yjs Document Structure

```typescript
// In-memory Yjs document structure for our editor
const ydoc = new Y.Doc();

// The main rich-text content (ProseMirror XML fragment)
const yXmlFragment = ydoc.getXmlFragment('prosemirror');

// Metadata stored in a Yjs Map (also CRDT-synced)
const yMeta = ydoc.getMap('meta');
yMeta.set('title', 'Untitled Document');
yMeta.set('updatedAt', Date.now());

// The internal structure of a paragraph:
// Y.XmlElement('paragraph')
//   └── Y.XmlText('Hello world')
//         └── Internally: linked list of items
//             ├── Item(clientId=1, clock=0, content='H')
//             ├── Item(clientId=1, clock=1, content='e')
//             ├── Item(clientId=1, clock=2, content='llo ')
//             ├── Item(clientId=2, clock=0, content='w')  ← from another user
//             └── Item(clientId=1, clock=5, content='orld')
```

### 8.4 Awareness Protocol

```
┌──────────────────────────────────────────────────────────────┐
│                  AWARENESS PROTOCOL                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Awareness is SEPARATE from document state:                  │
│  ├── NOT persisted to database                               │
│  ├── NOT part of the Yjs document                            │
│  ├── Ephemeral, per-connection state                         │
│  └── Managed by Yjs Awareness API                            │
│                                                              │
│  Protocol:                                                   │
│  1. On connect: client sets local awareness state            │
│  2. Server broadcasts awareness state to room                │
│  3. On cursor move: client updates awareness → broadcast     │
│  4. On disconnect: server sets awareness to null             │
│  5. Other clients remove the disconnected user's cursor      │
│                                                              │
│  Throttling:                                                 │
│  ├── Cursor position updates: max 30 per second              │
│  ├── Typing indicator: debounced (set on keystroke,          │
│  │   clear after 2s idle)                                    │
│  └── Full awareness sync: on connect only                    │
│                                                              │
│  Bandwidth estimate per user:                                │
│  ├── Awareness update: ~200 bytes                            │
│  ├── At 30 Hz: ~6 KB/s per active user                       │
│  ├── For 20 users in a room: ~120 KB/s total                 │
│  └── Acceptable for modern connections                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 8.5 Snapshot Strategy

```
  Timeline:
  ─────────────────────────────────────────────────▶
  │                                               │
  ▼ t=0                                           ▼ t=now
  [SNAPSHOT_0]──updates──[SNAPSHOT_1]──updates──[SNAPSHOT_2]──updates──[current]
                                                                        │
                                                                   in-memory
                                                                   Y.Doc

  Loading a document:
  1. Load most recent SNAPSHOT from PostgreSQL
  2. Apply any updates since that snapshot
  3. Result: current document state

  Creating a snapshot:
  1. Encode full Y.Doc state: Y.encodeStateAsUpdate(ydoc)
  2. Store as BYTEA in PostgreSQL
  3. Record state vector: Y.encodeStateVector(ydoc)

  Snapshot triggers:
  ├── Every 100 Yjs updates received
  ├── Every 5 minutes of active editing
  ├── When last user leaves the room
  └── Before version restore operation
```

---

## 9. Database Design

### 9.1 Entity-Relationship Diagram

```
  ┌──────────────┐        ┌──────────────────┐        ┌──────────────────┐
  │    users     │        │    documents     │        │  collaborators   │
  ├──────────────┤        ├──────────────────┤        ├──────────────────┤
  │ PK id        │───┐    │ PK id            │───┐    │ PK id            │
  │    email     │   │    │ FK owner_id      │   │    │ FK document_id   │──▶ documents
  │    name      │   ├───▶│    title         │   ├───▶│ FK user_id       │──▶ users
  │    avatar_url│   │    │    status        │   │    │    role          │
  │    created_at│   │    │    is_starred    │   │    │    invited_by    │
  │    updated_at│   │    │    created_at    │   │    │    created_at    │
  └──────────────┘   │    │    updated_at    │   │    │    updated_at    │
                     │    │    deleted_at    │   │    └──────────────────┘
                     │    └──────────────────┘   │
                     │                           │
                     │    ┌──────────────────┐   │    ┌──────────────────┐
                     │    │document_versions │   │    │document_snapshots│
                     │    ├──────────────────┤   │    ├──────────────────┤
                     │    │ PK id            │   │    │ PK id            │
                     │    │ FK document_id   │───┘    │ FK document_id   │──▶ documents
                     │    │ FK created_by    │──▶users│    yjs_state     │
                     │    │    version_num   │        │    state_vector  │
                     │    │    yjs_snapshot  │        │    byte_size     │
                     │    │    plain_text   │        │    created_at    │
                     │    │    title_at_time│        └──────────────────┘
                     │    │    created_at   │
                     │    └──────────────────┘
                     │
                     │    ┌──────────────────┐        ┌──────────────────┐
                     │    │   share_links   │        │  activity_logs   │
                     │    ├──────────────────┤        ├──────────────────┤
                     │    │ PK id            │        │ PK id            │
                     │    │ FK document_id   │──▶docs │ FK document_id   │──▶ documents
                     └───▶│ FK created_by    │        │ FK user_id       │──▶ users
                          │    token_hash   │        │    action        │
                          │    permission   │        │    metadata      │
                          │    is_active    │        │    ip_address    │
                          │    expires_at   │        │    created_at    │
                          │    created_at   │        └──────────────────┘
                          └──────────────────┘
```

### 9.2 Complete Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  avatarUrl     String?   @map("avatar_url")
  emailVerified DateTime? @map("email_verified")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Auth.js relations
  accounts Account[]
  sessions Session[]

  // Application relations
  ownedDocuments  Document[]       @relation("DocumentOwner")
  collaborations  Collaborator[]
  createdVersions DocumentVersion[]
  createdLinks    ShareLink[]
  activityLogs    ActivityLog[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

// ─────────────────────────────────────────────
// DOCUMENTS
// ─────────────────────────────────────────────

enum DocumentStatus {
  ACTIVE
  TRASHED
}

model Document {
  id        String         @id @default(cuid())
  ownerId   String         @map("owner_id")
  title     String         @default("Untitled Document")
  status    DocumentStatus @default(ACTIVE)
  isStarred Boolean        @default(false) @map("is_starred")
  wordCount Int            @default(0) @map("word_count")

  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
  lastAccessedAt DateTime? @map("last_accessed_at")

  // Relations
  owner         User                @relation("DocumentOwner", fields: [ownerId], references: [id])
  collaborators Collaborator[]
  versions      DocumentVersion[]
  snapshots     DocumentSnapshot[]
  shareLinks    ShareLink[]
  activityLogs  ActivityLog[]

  // Indexes
  @@index([ownerId, status])
  @@index([ownerId, isStarred])
  @@index([ownerId, updatedAt])
  @@index([ownerId, lastAccessedAt])
  @@map("documents")
}

// ─────────────────────────────────────────────
// COLLABORATORS
// ─────────────────────────────────────────────

enum CollaboratorRole {
  EDITOR
  VIEWER
}

model Collaborator {
  id         String           @id @default(cuid())
  documentId String           @map("document_id")
  userId     String           @map("user_id")
  role       CollaboratorRole @default(VIEWER)
  invitedBy  String?          @map("invited_by")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([documentId, userId])
  @@index([userId])
  @@map("collaborators")
}

// ─────────────────────────────────────────────
// DOCUMENT VERSIONS (user-facing history)
// ─────────────────────────────────────────────

model DocumentVersion {
  id          String @id @default(cuid())
  documentId  String @map("document_id")
  createdBy   String @map("created_by")
  versionNum  Int    @map("version_num")
  yjsSnapshot Bytes  @map("yjs_snapshot")    // Full Yjs state for restore
  plainText   String @map("plain_text") @db.Text  // For diff computation
  titleAtTime String @map("title_at_time")
  byteSize    Int    @map("byte_size")

  createdAt DateTime @default(now()) @map("created_at")

  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  creator  User     @relation(fields: [createdBy], references: [id])

  @@unique([documentId, versionNum])
  @@index([documentId, createdAt])
  @@map("document_versions")
}

// ─────────────────────────────────────────────
// DOCUMENT SNAPSHOTS (internal persistence)
// ─────────────────────────────────────────────

model DocumentSnapshot {
  id          String @id @default(cuid())
  documentId  String @map("document_id")
  yjsState    Bytes  @map("yjs_state")       // Y.encodeStateAsUpdate(ydoc)
  stateVector Bytes  @map("state_vector")    // Y.encodeStateVector(ydoc)
  byteSize    Int    @map("byte_size")

  createdAt DateTime @default(now()) @map("created_at")

  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([documentId, createdAt])
  @@map("document_snapshots")
}

// ─────────────────────────────────────────────
// SHARE LINKS
// ─────────────────────────────────────────────

enum SharePermission {
  VIEW
  EDIT
}

model ShareLink {
  id         String          @id @default(cuid())
  documentId String          @map("document_id")
  createdBy  String          @map("created_by")
  tokenHash  String          @unique @map("token_hash")  // SHA-256 of actual token
  permission SharePermission @default(VIEW)
  isActive   Boolean         @default(true) @map("is_active")
  expiresAt  DateTime?       @map("expires_at")

  createdAt DateTime @default(now()) @map("created_at")

  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  creator  User     @relation(fields: [createdBy], references: [id])

  @@index([documentId])
  @@map("share_links")
}

// ─────────────────────────────────────────────
// ACTIVITY LOGS (audit trail)
// ─────────────────────────────────────────────

enum ActivityAction {
  DOCUMENT_CREATED
  DOCUMENT_RENAMED
  DOCUMENT_TRASHED
  DOCUMENT_RESTORED
  DOCUMENT_DELETED
  DOCUMENT_DUPLICATED
  COLLABORATOR_ADDED
  COLLABORATOR_REMOVED
  COLLABORATOR_ROLE_CHANGED
  SHARE_LINK_CREATED
  SHARE_LINK_REVOKED
  VERSION_CREATED
  VERSION_RESTORED
  DOCUMENT_OPENED
}

model ActivityLog {
  id         String         @id @default(cuid())
  documentId String         @map("document_id")
  userId     String         @map("user_id")
  action     ActivityAction
  metadata   Json?          // Additional context (e.g., old/new title, role change)
  ipAddress  String?        @map("ip_address")

  createdAt DateTime @default(now()) @map("created_at")

  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id])

  @@index([documentId, createdAt])
  @@index([userId, createdAt])
  @@map("activity_logs")
}
```

### 9.3 Key Indexes & Query Patterns

| Query                        | Index Used                                    | Expected Latency |
| ---------------------------- | --------------------------------------------- | ---------------- |
| Get user's active documents  | `documents(owner_id, status)`                 | < 5ms            |
| Get user's starred documents | `documents(owner_id, is_starred)`             | < 5ms            |
| Get user's recent documents  | `documents(owner_id, last_accessed_at)`       | < 5ms            |
| Get document collaborators   | `collaborators(document_id)` (PK prefix)      | < 2ms            |
| Get user's collaborations    | `collaborators(user_id)`                      | < 5ms            |
| Get latest snapshot          | `document_snapshots(document_id, created_at)` | < 5ms            |
| Get version history          | `document_versions(document_id, created_at)`  | < 10ms           |
| Validate share link          | `share_links(token_hash)` (unique)            | < 2ms            |
| Get activity log             | `activity_logs(document_id, created_at)`      | < 10ms           |

### 9.4 Data Size Estimates

| Entity             | Estimated Rows (10K users) | Row Size   | Total   |
| ------------------ | -------------------------- | ---------- | ------- |
| users              | 10,000                     | ~500 B     | ~5 MB   |
| documents          | 100,000                    | ~200 B     | ~20 MB  |
| collaborators      | 200,000                    | ~100 B     | ~20 MB  |
| document_snapshots | 500,000                    | ~50 KB avg | ~25 GB  |
| document_versions  | 1,000,000                  | ~30 KB avg | ~30 GB  |
| share_links        | 50,000                     | ~200 B     | ~10 MB  |
| activity_logs      | 5,000,000                  | ~300 B     | ~1.5 GB |

**Total estimated storage: ~57 GB** — well within PostgreSQL capabilities with proper vacuuming and archival.

---

## 10. API Design

### 10.1 Authentication APIs

#### POST `/api/auth/[...nextauth]`

Auth.js handles all OAuth flows automatically. Endpoints include:

| Route                           | Purpose             |
| ------------------------------- | ------------------- |
| `GET /api/auth/signin`          | Sign-in page        |
| `GET /api/auth/callback/google` | OAuth callback      |
| `POST /api/auth/signout`        | Sign out            |
| `GET /api/auth/session`         | Get current session |

#### GET `/api/users/me`

Returns the current user's profile.

**Response (200):**

```json
{
  "id": "clx1abc...",
  "email": "user@example.com",
  "name": "Jane Doe",
  "avatarUrl": "https://lh3.googleusercontent.com/...",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

**Error Cases:**
| Status | Condition |
|---|---|
| 401 | No valid session |

#### PATCH `/api/users/me`

Updates the current user's profile.

**Request:**

```json
{
  "name": "Jane Smith"
}
```

**Validation (Zod):**

```typescript
const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});
```

**Response (200):** Updated user object.

**Error Cases:**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 422 | Validation error |

---

### 10.2 Document APIs

#### POST `/api/documents`

Creates a new document.

**Request:**

```json
{
  "title": "Q3 Planning" // optional, defaults to "Untitled Document"
}
```

**Validation:**

```typescript
const createDocumentSchema = z.object({
  title: z.string().max(255).optional(),
});
```

**Response (201):**

```json
{
  "id": "clx2def...",
  "title": "Q3 Planning",
  "ownerId": "clx1abc...",
  "status": "ACTIVE",
  "isStarred": false,
  "createdAt": "2026-06-04T10:00:00Z",
  "updatedAt": "2026-06-04T10:00:00Z"
}
```

**Side Effects:**

- Creates activity log entry `DOCUMENT_CREATED`
- Creates initial empty Yjs snapshot

**Error Cases:**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 429 | Rate limit exceeded (max 50 documents/hour) |

---

#### GET `/api/documents`

Lists the current user's documents.

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| `status` | `ACTIVE` \| `TRASHED` | `ACTIVE` | Filter by status |
| `starred` | `boolean` | — | Filter starred only |
| `search` | `string` | — | Search by title (case-insensitive) |
| `sort` | `updated` \| `created` \| `title` \| `accessed` | `accessed` | Sort field |
| `order` | `asc` \| `desc` | `desc` | Sort order |
| `page` | `number` | `1` | Page number |
| `limit` | `number` | `20` | Items per page (max 50) |

**Response (200):**

```json
{
  "documents": [
    {
      "id": "clx2def...",
      "title": "Q3 Planning",
      "status": "ACTIVE",
      "isStarred": true,
      "wordCount": 1523,
      "ownerId": "clx1abc...",
      "owner": { "name": "Jane Doe", "avatarUrl": "..." },
      "collaboratorCount": 3,
      "updatedAt": "2026-06-04T12:00:00Z",
      "lastAccessedAt": "2026-06-04T12:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 47,
    "totalPages": 3
  }
}
```

**Error Cases:**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 422 | Invalid query parameters |

---

#### GET `/api/documents/:id`

Gets a single document's metadata.

**Response (200):**

```json
{
  "id": "clx2def...",
  "title": "Q3 Planning",
  "status": "ACTIVE",
  "isStarred": false,
  "wordCount": 1523,
  "owner": { "id": "clx1abc...", "name": "Jane Doe", "avatarUrl": "..." },
  "myRole": "EDITOR",
  "collaborators": [
    { "id": "clx3ghi...", "name": "John Smith", "avatarUrl": "...", "role": "EDITOR" },
    { "id": "clx4jkl...", "name": "Alice Lee", "avatarUrl": "...", "role": "VIEWER" }
  ],
  "createdAt": "2026-06-04T10:00:00Z",
  "updatedAt": "2026-06-04T12:00:00Z"
}
```

**Error Cases:**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | No permission to view this document |
| 404 | Document not found |

---

#### PATCH `/api/documents/:id`

Updates document metadata (rename, star, trash).

**Request:**

```json
{
  "title": "Q3 Planning — Final",
  "isStarred": true,
  "status": "TRASHED"
}
```

**Validation:**

```typescript
const updateDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  isStarred: z.boolean().optional(),
  status: z.enum(['ACTIVE', 'TRASHED']).optional(),
});
```

**Authorization:** Owner only for `title` and `status`. Owner or Editor for `isStarred`.

**Error Cases:**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | Insufficient permissions |
| 404 | Document not found |
| 422 | Validation error |

---

#### DELETE `/api/documents/:id`

Permanently deletes a trashed document.

**Authorization:** Owner only. Document must be in `TRASHED` status.

**Response (204):** No content.

**Error Cases:**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | Not the owner |
| 404 | Document not found |
| 409 | Document is not trashed (must trash first) |

---

#### POST `/api/documents/:id/duplicate`

Duplicates a document including content.

**Request:**

```json
{
  "title": "Q3 Planning — Copy" // optional
}
```

**Response (201):** New document object.

**Side Effects:**

- Copies latest Yjs snapshot to new document
- Creates activity log `DOCUMENT_DUPLICATED`

---

### 10.3 Version APIs

#### GET `/api/documents/:id/versions`

Lists version history for a document.

**Query Parameters:**
| Param | Type | Default |
|---|---|---|
| `page` | number | 1 |
| `limit` | number | 20 |

**Response (200):**

```json
{
  "versions": [
    {
      "id": "clx5mno...",
      "versionNum": 12,
      "createdBy": { "id": "clx1abc...", "name": "Jane Doe", "avatarUrl": "..." },
      "titleAtTime": "Q3 Planning",
      "byteSize": 34521,
      "createdAt": "2026-06-04T12:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 12, "totalPages": 1 }
}
```

**Authorization:** Owner, Editor, or Viewer.

---

#### GET `/api/documents/:id/versions/:versionId`

Gets a specific version's content for preview.

**Response (200):**

```json
{
  "id": "clx5mno...",
  "versionNum": 12,
  "plainText": "Q3 Planning\n\nObjectives:\n1. ...",
  "titleAtTime": "Q3 Planning",
  "createdBy": { "name": "Jane Doe" },
  "createdAt": "2026-06-04T12:00:00Z"
}
```

---

#### GET `/api/documents/:id/versions/:versionId/diff?compareWith=:otherVersionId`

Computes diff between two versions.

**Response (200):**

```json
{
  "baseVersion": { "versionNum": 11, "createdAt": "..." },
  "compareVersion": { "versionNum": 12, "createdAt": "..." },
  "diff": [
    { "type": "equal", "value": "Q3 Planning\n\n" },
    { "type": "removed", "value": "Old objective" },
    { "type": "added", "value": "New objective" },
    { "type": "equal", "value": "\n2. ..." }
  ]
}
```

---

#### POST `/api/documents/:id/versions/:versionId/restore`

Restores a document to a previous version.

**Side Effects:**

- Creates a new version of the current state (backup before restore)
- Loads the target version's Yjs snapshot
- Broadcasts the restored state to all connected clients
- Creates activity log `VERSION_RESTORED`

**Response (200):**

```json
{
  "restoredVersion": 12,
  "backupVersion": 13,
  "message": "Document restored to version 12. Current state saved as version 13."
}
```

**Authorization:** Owner or Editor only.

---

### 10.4 Sharing APIs

#### POST `/api/documents/:id/share/link`

Creates a share link.

**Request:**

```json
{
  "permission": "VIEW",
  "expiresIn": 604800 // seconds (7 days), optional
}
```

**Response (201):**

```json
{
  "shareUrl": "https://collabdoc.app/d/clx2def...?token=abc123...",
  "permission": "VIEW",
  "expiresAt": "2026-06-11T10:00:00Z"
}
```

**Authorization:** Owner only.

---

#### POST `/api/documents/:id/collaborators`

Adds a collaborator.

**Request:**

```json
{
  "email": "john@example.com",
  "role": "EDITOR"
}
```

**Error Cases:**
| Status | Condition |
|---|---|
| 401 | Not authenticated |
| 403 | Not the owner |
| 404 | User with that email not found |
| 409 | User is already a collaborator |

---

#### PATCH `/api/documents/:id/collaborators/:userId`

Changes a collaborator's role.

**Request:**

```json
{
  "role": "VIEWER"
}
```

---

#### DELETE `/api/documents/:id/collaborators/:userId`

Removes a collaborator.

**Response (204):** No content.

---

### 10.5 Socket.io Events (Realtime Protocol)

#### Client → Server Events

| Event              | Payload                  | Description                 |
| ------------------ | ------------------------ | --------------------------- |
| `authenticate`     | `{ token: string }`      | Validate session token      |
| `join-room`        | `{ documentId: string }` | Join a document room        |
| `leave-room`       | `{ documentId: string }` | Leave a document room       |
| `yjs-update`       | `Uint8Array`             | Send Yjs document update    |
| `awareness-update` | `Uint8Array`             | Send awareness state update |

#### Server → Client Events

| Event              | Payload                                      | Description             |
| ------------------ | -------------------------------------------- | ----------------------- |
| `authenticated`    | `{ userId: string }`                         | Auth success            |
| `auth-error`       | `{ message: string }`                        | Auth failure            |
| `sync-init`        | `{ state: Uint8Array }`                      | Initial document state  |
| `yjs-update`       | `Uint8Array`                                 | Remote Yjs update       |
| `awareness-update` | `Uint8Array`                                 | Remote awareness update |
| `user-joined`      | `{ user: UserInfo }`                         | User entered the room   |
| `user-left`        | `{ userId: string }`                         | User left the room      |
| `room-error`       | `{ code: string, message: string }`          | Room-level error        |
| `save-status`      | `{ status: 'saving' \| 'saved' \| 'error' }` | Persistence status      |

---

## 11. Security Design

### 11.1 Threat Model

```
┌──────────────────────────────────────────────────────────────┐
│                     THREAT ANALYSIS                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  THREAT 1: Unauthorized document access                      │
│  ├── Attack: User guesses document ID in URL                 │
│  ├── Mitigation: CUID IDs (not sequential), permission       │
│  │   check on every API call and socket event                │
│  └── Severity: HIGH                                          │
│                                                              │
│  THREAT 2: Session hijacking                                 │
│  ├── Attack: Steal session cookie via XSS or network sniff   │
│  ├── Mitigation: httpOnly + secure + sameSite cookies,       │
│  │   TLS everywhere, CSP headers                             │
│  └── Severity: HIGH                                          │
│                                                              │
│  THREAT 3: WebSocket injection                               │
│  ├── Attack: Send malformed Yjs updates to corrupt doc       │
│  ├── Mitigation: Validate binary format on server,           │
│  │   reject oversized payloads (>1MB per message)            │
│  └── Severity: MEDIUM                                        │
│                                                              │
│  THREAT 4: Share link brute-force                             │
│  ├── Attack: Enumerate share tokens                          │
│  ├── Mitigation: 32 bytes of randomness (2^256 space),       │
│  │   rate limit share link validation                        │
│  └── Severity: LOW (infeasible)                              │
│                                                              │
│  THREAT 5: Denial of service via room flooding               │
│  ├── Attack: Open many socket connections to same room       │
│  ├── Mitigation: Max 20 connections per room,                │
│  │   max 5 connections per user per room,                    │
│  │   rate limit connection attempts                          │
│  └── Severity: MEDIUM                                        │
│                                                              │
│  THREAT 6: CSRF on state-changing APIs                       │
│  ├── Attack: Trick user into making API requests             │
│  ├── Mitigation: Auth.js CSRF token, sameSite cookies        │
│  └── Severity: MEDIUM                                        │
│                                                              │
│  THREAT 7: XSS via document content                          │
│  ├── Attack: Inject script via rich text editor              │
│  ├── Mitigation: TipTap/ProseMirror sanitize all content,   │
│  │   CSP script-src 'self', no dangerouslySetInnerHTML       │
│  └── Severity: MEDIUM                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 11.2 Security Controls

| Control                 | Implementation                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| **OAuth Security**      | Auth.js handles PKCE, state parameter, nonce validation                                  |
| **Session Security**    | Database sessions, httpOnly/secure/sameSite cookies, 30-day sliding expiry               |
| **Rate Limiting**       | Per-IP: 100 req/min (API), 10 connections/min (WebSocket). Per-user: 50 doc creates/hour |
| **Input Validation**    | Zod schemas on all API inputs; binary validation on Yjs updates                          |
| **XSS Protection**      | React escaping, CSP headers (`script-src 'self'`), TipTap sanitization                   |
| **CSRF Protection**     | Auth.js CSRF tokens, sameSite cookies                                                    |
| **Permission Checks**   | Middleware on every API route; event handler on every socket event                       |
| **Share Link Security** | 32-byte random tokens, stored as SHA-256 hash, optional expiry                           |
| **Transport Security**  | TLS 1.3 enforced on all endpoints                                                        |
| **Dependency Security** | `npm audit` in CI, Snyk integration, Dependabot                                          |

### 11.3 Content Security Policy

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://lh3.googleusercontent.com data:;
  font-src 'self';
  connect-src 'self' wss://rt.collabdoc.app https://rt.collabdoc.app;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

### 11.4 Permission Check Middleware

```typescript
// Pseudocode for authorization middleware
async function requireDocumentAccess(
  documentId: string,
  userId: string,
  requiredRole: 'OWNER' | 'EDITOR' | 'VIEWER',
): Promise<void> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: { collaborators: true },
  });

  if (!document) throw new NotFoundError('Document not found');

  // Owner has all permissions
  if (document.ownerId === userId) return;

  // Check collaborator role
  const collab = document.collaborators.find((c) => c.userId === userId);
  if (!collab) throw new ForbiddenError('No access to this document');

  const roleHierarchy = { OWNER: 3, EDITOR: 2, VIEWER: 1 };
  if (roleHierarchy[collab.role] < roleHierarchy[requiredRole]) {
    throw new ForbiddenError('Insufficient permissions');
  }
}
```

---

## 12. Testing Strategy

### 12.1 Testing Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲           Playwright: 15–20 tests
                 ╱  Tests╲         Multi-browser, multi-tab collab
                ╱──────────╲
               ╱ Integration╲      Vitest + Prisma + Socket.io
              ╱    Tests     ╲     API routes, socket events: 40–60 tests
             ╱────────────────╲
            ╱    Unit Tests    ╲   Vitest + RTL
           ╱                    ╲  Components, hooks, utils: 100–150 tests
          ╱──────────────────────╲
         ╱     Type Checking      ╲  TypeScript strict mode: continuous
        ╱──────────────────────────╲
```

### 12.2 Unit Tests (Vitest + React Testing Library)

| Category          | Examples                                            | Count    |
| ----------------- | --------------------------------------------------- | -------- |
| React Components  | DocumentCard, PresenceAvatars, VersionHistory panel | 30–40    |
| Custom Hooks      | `useDocument`, `useCollaboration`, `usePresence`    | 15–20    |
| Utility Functions | Permission checks, color assignment, debounce       | 20–30    |
| Zod Schemas       | All API input validation schemas                    | 15–20    |
| State Management  | Document list store, editor state                   | 10–15    |
| **Total**         |                                                     | **~120** |

**Example:**

```typescript
// __tests__/utils/permissions.test.ts
describe('canEditDocument', () => {
  it('allows owner to edit', () => {
    expect(canEditDocument({ role: 'OWNER' })).toBe(true);
  });

  it('allows editor to edit', () => {
    expect(canEditDocument({ role: 'EDITOR' })).toBe(true);
  });

  it('prevents viewer from editing', () => {
    expect(canEditDocument({ role: 'VIEWER' })).toBe(false);
  });

  it('prevents unauthenticated users', () => {
    expect(canEditDocument(null)).toBe(false);
  });
});
```

### 12.3 Integration Tests

| Category            | Examples                                | Count   |
| ------------------- | --------------------------------------- | ------- |
| API Route Handlers  | CRUD documents, share links, versions   | 25–30   |
| Server Actions      | Create/update/delete documents          | 10–15   |
| Socket Events       | join-room, yjs-update, awareness-update | 10–15   |
| Database Operations | Prisma queries, migrations              | 5–10    |
| Auth Flows          | Session validation, permission checks   | 5–10    |
| **Total**           |                                         | **~60** |

**Example:**

```typescript
// __tests__/api/documents.integration.test.ts
describe('POST /api/documents', () => {
  it('creates a document and returns 201', async () => {
    const res = await testClient.post('/api/documents', {
      body: { title: 'Test Doc' },
      headers: { cookie: mockSessionCookie },
    });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Doc');
    expect(res.body.ownerId).toBe(testUser.id);

    // Verify in database
    const doc = await prisma.document.findUnique({ where: { id: res.body.id } });
    expect(doc).not.toBeNull();
    expect(doc!.title).toBe('Test Doc');
  });

  it('returns 401 without authentication', async () => {
    const res = await testClient.post('/api/documents', {
      body: { title: 'Test' },
    });
    expect(res.status).toBe(401);
  });
});
```

### 12.4 Realtime Collaboration Tests

| Test                                | Description                                               | Type        |
| ----------------------------------- | --------------------------------------------------------- | ----------- |
| Two-user sync                       | Both users type; both see each other's changes            | E2E         |
| Concurrent edit same paragraph      | Two users type in the same line; CRDT merges correctly    | E2E         |
| Offline edit and reconnect          | User A goes offline, edits, comes back; changes merge     | E2E         |
| Presence cursors                    | User A moves cursor; User B sees it                       | E2E         |
| Room cleanup                        | Last user leaves; server persists and cleans up room      | Integration |
| Reconnection                        | Kill socket connection; verify auto-reconnect and re-sync | E2E         |
| Version restore during live editing | Restore a version while other users are editing           | Integration |
| Large document performance          | 50KB document with 10 concurrent editors                  | Load        |

### 12.5 E2E Tests (Playwright)

```typescript
// e2e/collaboration.spec.ts
test('two users can edit simultaneously', async ({ browser }) => {
  // Create two browser contexts (separate sessions)
  const contextA = await browser.newContext({ storageState: 'user-a.json' });
  const contextB = await browser.newContext({ storageState: 'user-b.json' });

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  // User A creates a document
  await pageA.goto('/dashboard');
  await pageA.click('[data-testid="create-document"]');
  const docUrl = pageA.url(); // /d/{documentId}

  // User B opens the same document (pre-shared)
  await pageB.goto(docUrl);

  // User A types
  await pageA.locator('.tiptap').type('Hello from A');

  // User B should see it within 1 second
  await expect(pageB.locator('.tiptap')).toContainText('Hello from A', {
    timeout: 1000,
  });

  // User B types
  await pageB.locator('.tiptap').press('End');
  await pageB.locator('.tiptap').type(' and B');

  // User A should see the combined text
  await expect(pageA.locator('.tiptap')).toContainText('Hello from A and B', {
    timeout: 1000,
  });
});
```

### 12.6 Load Tests

| Scenario                             | Tool                     | Target                         |
| ------------------------------------ | ------------------------ | ------------------------------ |
| 100 concurrent WebSocket connections | k6 + WebSocket           | No errors, < 100ms latency     |
| 20 editors in one document           | Playwright (20 contexts) | All edits sync within 200ms    |
| 500 concurrent documents             | k6                       | Server memory < 4GB            |
| API endpoint throughput              | k6                       | > 1000 RPS on document list    |
| Database connection pool             | pgbench                  | 100 concurrent queries, < 50ms |

### 12.7 Failure Recovery Tests

| Scenario                       | Expected Behavior                                           |
| ------------------------------ | ----------------------------------------------------------- |
| Server process killed mid-edit | Clients reconnect; edits resume from IndexedDB              |
| Database connection dropped    | Server retries with backoff; edits buffered in memory       |
| Client browser crash           | On reopen, IndexedDB state loads; sync with server          |
| Network partition (5 minutes)  | Both sides edit independently; merge on reconnect           |
| Corrupted Yjs update received  | Server rejects; client logs error; document state preserved |

---

## 13. Project Structure

```
collabdoc/
├── .env.example                      # Environment variable template
├── .env.local                        # Local dev secrets (gitignored)
├── .eslintrc.cjs                     # ESLint config
├── .prettierrc                       # Prettier config
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS config
├── tsconfig.json                     # TypeScript config
├── vitest.config.ts                  # Vitest configuration
├── playwright.config.ts              # Playwright E2E config
├── docker-compose.yml                # Local PostgreSQL + Redis
├── package.json
│
├── prisma/
│   ├── schema.prisma                 # Database schema
│   ├── migrations/                   # Migration history
│   └── seed.ts                       # Development seed data
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (providers, fonts)
│   │   ├── page.tsx                  # Landing page
│   │   ├── globals.css               # Global styles
│   │   │
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── signin/page.tsx       # Sign-in page
│   │   │   └── layout.tsx            # Auth layout (centered)
│   │   │
│   │   ├── (app)/                    # Authenticated app route group
│   │   │   ├── layout.tsx            # App shell (sidebar, nav)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Document dashboard
│   │   │   ├── d/
│   │   │   │   └── [documentId]/
│   │   │   │       ├── page.tsx      # Document editor page
│   │   │   │       └── loading.tsx   # Loading skeleton
│   │   │   ├── settings/
│   │   │   │   └── page.tsx          # User settings
│   │   │   └── trash/
│   │   │       └── page.tsx          # Trash view
│   │   │
│   │   └── api/                      # Route Handlers
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts      # Auth.js catch-all
│   │       ├── documents/
│   │       │   ├── route.ts          # GET (list), POST (create)
│   │       │   └── [id]/
│   │       │       ├── route.ts      # GET, PATCH, DELETE
│   │       │       ├── duplicate/
│   │       │       │   └── route.ts  # POST
│   │       │       ├── versions/
│   │       │       │   ├── route.ts  # GET (list)
│   │       │       │   └── [versionId]/
│   │       │       │       ├── route.ts      # GET
│   │       │       │       ├── diff/
│   │       │       │       │   └── route.ts  # GET
│   │       │       │       └── restore/
│   │       │       │           └── route.ts  # POST
│   │       │       ├── collaborators/
│   │       │       │   ├── route.ts  # GET, POST
│   │       │       │   └── [userId]/
│   │       │       │       └── route.ts  # PATCH, DELETE
│   │       │       └── share/
│   │       │           └── link/
│   │       │               └── route.ts  # POST, GET, DELETE
│   │       └── users/
│   │           └── me/
│   │               └── route.ts      # GET, PATCH
│   │
│   ├── components/                   # Shared UI components
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   └── tooltip.tsx
│   │   ├── layout/
│   │   │   ├── app-shell.tsx         # Main app layout
│   │   │   ├── sidebar.tsx           # Navigation sidebar
│   │   │   └── header.tsx            # Top header bar
│   │   └── common/
│   │       ├── user-avatar.tsx       # User avatar with fallback
│   │       ├── loading-spinner.tsx
│   │       └── error-boundary.tsx
│   │
│   ├── features/                     # Feature-based modules
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── sign-in-button.tsx
│   │   │   │   ├── user-menu.tsx
│   │   │   │   └── auth-guard.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-session.ts
│   │   │   └── lib/
│   │   │       └── auth-options.ts   # Auth.js configuration
│   │   │
│   │   ├── documents/
│   │   │   ├── components/
│   │   │   │   ├── document-card.tsx
│   │   │   │   ├── document-list.tsx
│   │   │   │   ├── document-grid.tsx
│   │   │   │   ├── create-document-button.tsx
│   │   │   │   ├── document-context-menu.tsx
│   │   │   │   └── search-documents.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-documents.ts
│   │   │   │   └── use-document.ts
│   │   │   ├── actions/
│   │   │   │   └── document-actions.ts  # Server Actions
│   │   │   └── lib/
│   │   │       └── document-utils.ts
│   │   │
│   │   ├── editor/
│   │   │   ├── components/
│   │   │   │   ├── editor.tsx           # Main TipTap editor
│   │   │   │   ├── editor-toolbar.tsx   # Formatting toolbar
│   │   │   │   ├── editor-bubble-menu.tsx
│   │   │   │   ├── save-status.tsx      # Save indicator
│   │   │   │   └── word-count.tsx
│   │   │   ├── extensions/
│   │   │   │   ├── collaboration.ts     # Yjs collaboration extension
│   │   │   │   ├── collaboration-cursor.ts
│   │   │   │   └── custom-extensions.ts
│   │   │   ├── hooks/
│   │   │   │   ├── use-editor.ts
│   │   │   │   └── use-editor-config.ts
│   │   │   └── lib/
│   │   │       └── editor-config.ts
│   │   │
│   │   ├── collaboration/
│   │   │   ├── components/
│   │   │   │   ├── presence-avatars.tsx  # Online user avatars
│   │   │   │   ├── cursor-overlay.tsx    # Remote cursors
│   │   │   │   └── connection-status.tsx # Online/offline badge
│   │   │   ├── hooks/
│   │   │   │   ├── use-collaboration.ts  # Yjs + Socket.io hook
│   │   │   │   ├── use-presence.ts       # Awareness hook
│   │   │   │   └── use-connection.ts     # Socket status hook
│   │   │   ├── providers/
│   │   │   │   └── collaboration-provider.tsx  # React context
│   │   │   └── lib/
│   │   │       ├── socket-client.ts      # Socket.io client singleton
│   │   │       ├── yjs-provider.ts       # Custom Yjs provider
│   │   │       └── awareness-colors.ts   # Color assignment
│   │   │
│   │   ├── versions/
│   │   │   ├── components/
│   │   │   │   ├── version-history-panel.tsx
│   │   │   │   ├── version-item.tsx
│   │   │   │   ├── version-diff.tsx
│   │   │   │   └── restore-dialog.tsx
│   │   │   └── hooks/
│   │   │       └── use-versions.ts
│   │   │
│   │   └── sharing/
│   │       ├── components/
│   │       │   ├── share-dialog.tsx
│   │       │   ├── collaborator-list.tsx
│   │       │   ├── invite-form.tsx
│   │       │   └── share-link-manager.tsx
│   │       └── hooks/
│   │           └── use-sharing.ts
│   │
│   ├── lib/                          # Shared utilities
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── auth.ts                   # Auth.js config export
│   │   ├── api-utils.ts              # API response helpers
│   │   ├── errors.ts                 # Custom error classes
│   │   ├── validations.ts            # Shared Zod schemas
│   │   ├── rate-limit.ts             # Rate limiting utility
│   │   ├── permissions.ts            # Permission check helpers
│   │   └── constants.ts              # App-wide constants
│   │
│   ├── hooks/                        # Global shared hooks
│   │   ├── use-debounce.ts
│   │   ├── use-local-storage.ts
│   │   └── use-media-query.ts
│   │
│   └── types/                        # Shared TypeScript types
│       ├── document.ts
│       ├── user.ts
│       ├── collaboration.ts
│       └── api.ts
│
├── server/                           # Standalone Socket.io server
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                  # Server entry point
│   │   ├── socket-server.ts          # Socket.io server setup
│   │   ├── middleware/
│   │   │   ├── auth.ts               # Socket auth middleware
│   │   │   └── rate-limit.ts         # Socket rate limiting
│   │   ├── rooms/
│   │   │   ├── room-manager.ts       # Room lifecycle management
│   │   │   ├── yjs-room.ts           # Yjs document per room
│   │   │   └── persistence.ts        # Debounced DB writes
│   │   ├── handlers/
│   │   │   ├── collaboration.ts      # yjs-update, sync events
│   │   │   ├── awareness.ts          # awareness events
│   │   │   └── room.ts              # join/leave room events
│   │   └── lib/
│   │       ├── prisma.ts             # Prisma client
│   │       ├── logger.ts             # Pino logger
│   │       └── metrics.ts            # OpenTelemetry metrics
│   └── Dockerfile                    # Container for deployment
│
├── tests/
│   ├── unit/                         # Vitest unit tests
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── schemas/
│   ├── integration/                  # Vitest integration tests
│   │   ├── api/
│   │   ├── socket/
│   │   └── database/
│   ├── e2e/                          # Playwright E2E tests
│   │   ├── auth.spec.ts
│   │   ├── documents.spec.ts
│   │   ├── collaboration.spec.ts
│   │   ├── sharing.spec.ts
│   │   └── fixtures/
│   └── load/                         # k6 load tests
│       ├── websocket.js
│       └── api.js
│
├── docs/                             # Documentation
│   ├── architecture.md
│   ├── deployment.md
│   ├── development.md
│   └── api-reference.md
│
└── scripts/                          # Development scripts
    ├── setup.sh                      # Initial setup
    ├── db-reset.sh                   # Reset database
    └── generate-test-data.ts         # Generate test fixtures
```

---

## 14. Implementation Roadmap

### Overview

```
  Week 1-2     Week 3      Week 4      Week 5-6    Week 7
  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
  │  M1+M2 │  │  M3+M4 │  │  M5+M6 │  │  M7+M8 │  │ M9+M10 │
  │ Found. │──│ Editor │──│ Collab │──│History │──│ Polish │
  │ + Auth │  │ + RT   │  │ + Perf │  │+ Share │  │+ Deploy│
  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘
```

---

### Milestone 1: Foundation (Week 1, Days 1–3)

**Deliverables:**

- [x] Next.js 16 project initialized with TypeScript strict mode
- [x] Tailwind CSS + shadcn/ui configured
- [x] PostgreSQL running locally (Docker Compose)
- [x] Prisma schema created and initial migration applied
- [x] Project structure scaffolded (all folders)
- [x] ESLint, Prettier, Husky pre-commit hooks
- [x] Vitest and Playwright configured
- [x] CI pipeline (GitHub Actions): lint + type-check + test
- [x] Environment variable management (.env.example)

**Dependencies:** None

**Risks:**
| Risk | Mitigation |
|---|---|
| Next.js 16 breaking changes | Pin exact version; follow release notes |
| Prisma migration issues | Test migration up/down in CI |

**Acceptance Criteria:**

- `npm run dev` starts the app on localhost:3000
- `npm run test` passes with 0 failures
- `npx prisma db push` succeeds against local PostgreSQL
- CI pipeline runs green on push

---

### Milestone 2: Authentication (Week 1, Days 4–7)

**Deliverables:**

- [x] Auth.js (NextAuth v5) configured with Google OAuth
- [x] Sign-in page with Google button
- [x] Session persistence (database sessions)
- [x] Auth middleware protecting `/app/*` routes
- [x] User profile page (name, avatar)
- [x] Sign-out functionality
- [x] Auth guard component for protected routes

**Dependencies:** M1 (database, project structure)

**Risks:**
| Risk | Mitigation |
|---|---|
| Google OAuth credential setup complexity | Step-by-step setup guide in docs/development.md |
| Auth.js v5 API instability | Pin version; follow migration guide |

**Acceptance Criteria:**

- User can sign in with Google and see dashboard
- Unauthenticated access to `/dashboard` redirects to sign-in
- Session persists across browser restarts
- User can sign out
- Unit tests for auth guard component
- Integration test for session validation

---

### Milestone 3: Editor (Week 2, Days 1–4)

**Deliverables:**

- [x] TipTap editor integrated with rich-text formatting
- [x] Editor toolbar (bold, italic, headings, lists, links, code blocks)
- [x] Document page (`/d/[documentId]`)
- [x] Document creation from dashboard
- [x] Document renaming (inline edit)
- [x] Document deletion (soft delete + trash)
- [x] Dashboard with document grid/list view
- [x] Document search
- [x] Star/favorite documents
- [x] Recent documents sorted by last accessed

**Dependencies:** M2 (auth, user context)

**Risks:**
| Risk | Mitigation |
|---|---|
| TipTap customization complexity | Start with default extensions; customize incrementally |
| Document list performance (many documents) | Pagination from day one; indexed queries |

**Acceptance Criteria:**

- User can create, open, edit, rename, delete documents
- Editor renders rich text correctly
- Dashboard shows documents with search and filtering
- All CRUD operations have integration tests
- Editor component has unit tests

---

### Milestone 4: Realtime Collaboration (Week 2–3, Days 5–10)

**Deliverables:**

- [x] Socket.io server set up (standalone Node.js process)
- [x] Yjs integration with TipTap (`y-prosemirror`)
- [x] Custom Yjs provider over Socket.io
- [x] Room management (join, leave, cleanup)
- [x] Two-user real-time editing working end-to-end
- [x] Socket authentication (validate session token)
- [x] Connection status indicator (connected, connecting, disconnected)
- [x] Auto-reconnection with exponential backoff

**Dependencies:** M3 (editor, documents)

**Risks:**
| Risk | Mitigation |
|---|---|
| Yjs + Socket.io integration complexity | Follow y-websocket reference implementation |
| Cross-origin WebSocket (Vercel ↔ Socket server) | Configure CORS properly; test in staging |
| Socket.io memory leaks | Room cleanup timer; monitor memory in staging |

**Acceptance Criteria:**

- Two users can edit the same document simultaneously
- Changes appear on remote client within 50ms
- Connection drop → reconnect → sync works correctly
- E2E test: two-browser collaborative editing passes
- Integration tests for socket events pass
- No memory leaks after 100 room create/destroy cycles

---

### Milestone 5: Live Presence (Week 3, Days 11–13)

**Deliverables:**

- [x] Yjs Awareness API integrated
- [x] Online user avatars shown in editor header
- [x] Remote cursors rendered in editor with user name labels
- [x] User color assignment (deterministic, colorblind-friendly)
- [x] Typing indicators
- [x] Join/leave notifications (toast)
- [x] Cursor position throttling (30 Hz max)

**Dependencies:** M4 (Socket.io, Yjs)

**Risks:**
| Risk | Mitigation |
|---|---|
| Cursor rendering performance with many users | Throttle to 30 Hz; virtualize cursor DOM elements |
| Awareness update bandwidth | Measure; implement delta compression if needed |

**Acceptance Criteria:**

- User A sees User B's cursor with name and color
- Cursor updates render smoothly at 30 fps
- Presence avatars update within 500ms of join/leave
- E2E test: cursor visibility across two browsers

---

### Milestone 6: Persistence (Week 3–4, Days 14–17)

**Deliverables:**

- [x] Debounced auto-save (2-second debounce)
- [x] Yjs snapshot storage in PostgreSQL (BYTEA)
- [x] Document loading from snapshot
- [x] IndexedDB local persistence (`y-indexeddb`)
- [x] Offline editing + merge on reconnect
- [x] Save status indicator (Saving... → Saved → Offline)
- [x] Recovery after browser crash / refresh
- [x] Room teardown → final persist on last user leave

**Dependencies:** M4 (Yjs, Socket.io)

**Risks:**
| Risk | Mitigation |
|---|---|
| Large Yjs snapshots causing slow DB writes | Monitor byte sizes; implement GC; set 5 MB limit |
| IndexedDB quota exceeded | Implement LRU eviction for old documents |
| Data loss on server crash | Write-ahead to memory; persist on clean shutdown |

**Acceptance Criteria:**

- Refresh browser → document state fully recovered
- Edit offline for 5 minutes → reconnect → all edits preserved
- Database snapshot matches in-memory Yjs state
- Load test: 1000 rapid edits → all persisted
- Integration test: crash recovery simulation

---

### Milestone 7: Version History (Week 4–5, Days 18–22)

**Deliverables:**

- [x] Automatic version creation (every 30 min of editing, on room empty)
- [x] Version history panel (sidebar)
- [x] Version preview (read-only render)
- [x] Version restore with confirmation dialog
- [x] Backup-before-restore mechanism
- [x] Diff view between two versions (Myers diff)
- [x] Editor attribution on versions
- [x] Snapshot garbage collection (keep last 50)

**Dependencies:** M6 (persistence, snapshots)

**Risks:**
| Risk | Mitigation |
|---|---|
| Diff computation for large documents | Diff on plain text (not Yjs binary); limit to 100 KB |
| Version restore while others are editing | Broadcast restored state to all connected clients |

**Acceptance Criteria:**

- Version history shows chronological list with authors
- Restore reverts document and creates backup version
- Diff view correctly highlights additions/deletions
- E2E test: create version → restore → verify content

---

### Milestone 8: Sharing & Permissions (Week 5–6, Days 23–28)

**Deliverables:**

- [x] Share dialog UI
- [x] Add collaborator by email
- [x] Remove collaborator
- [x] Change collaborator role
- [x] Share link generation (view/edit)
- [x] Share link access (anonymous viewing/editing)
- [x] Permission enforcement on all API routes
- [x] Permission enforcement on Socket.io events
- [x] Permission enforcement in UI (disable edit for viewers)
- [x] Activity log recording for all sharing actions

**Dependencies:** M2 (auth), M3 (documents), M4 (sockets)

**Risks:**
| Risk | Mitigation |
|---|---|
| Permission bypass via direct API calls | Middleware-level enforcement; penetration tests |
| Share link token security | 32-byte random, hashed storage, rate limiting |

**Acceptance Criteria:**

- Owner can share document; collaborator can access with correct role
- Viewer cannot type in editor (read-only mode)
- Share link grants correct access level
- Permission test suite: all role combinations covered
- Security test: direct API calls with wrong role return 403

---

### Milestone 9: Testing & Quality (Week 6, Days 29–32)

**Deliverables:**

- [x] Complete unit test suite (120+ tests, >80% coverage)
- [x] Complete integration test suite (60+ tests)
- [x] Complete E2E test suite (15+ tests)
- [x] Load test suite (k6)
- [x] Failure recovery test suite
- [x] Sentry integration (error tracking + performance)
- [x] OpenTelemetry integration (distributed tracing)
- [x] Structured logging (Pino)
- [x] Performance audit (Lighthouse, Web Vitals)
- [x] Security audit (CSP headers, dependency scan)
- [x] Accessibility audit (axe-core, keyboard nav)

**Dependencies:** All previous milestones

**Risks:**
| Risk | Mitigation |
|---|---|
| Test flakiness in E2E (timing-dependent) | Use Playwright's auto-waiting; retry flaky tests up to 2x |
| Observability integration overhead | Measure latency impact; disable detailed tracing in hot paths |

**Acceptance Criteria:**

- All tests pass in CI
- Code coverage > 80%
- Lighthouse score > 90 (Performance, Accessibility)
- No critical Sentry errors in 24 hours of usage
- Load test: 20 concurrent editors with < 50ms sync latency

---

### Milestone 10: Production Deployment (Week 7, Days 33–35)

**Deliverables:**

- [x] Next.js app deployed to Vercel
- [x] Socket.io server deployed to Railway/Render/Fly.io
- [x] PostgreSQL provisioned on Neon/Supabase
- [x] Custom domain configured with SSL
- [x] Environment variables secured
- [x] Sentry DSN configured for production
- [x] Database backups configured (daily)
- [x] Monitoring dashboard (uptime, error rate, latency)
- [x] README.md with setup instructions
- [x] Architecture documentation
- [x] Demo video / walkthrough

**Dependencies:** M9 (testing, observability)

**Risks:**
| Risk | Mitigation |
|---|---|
| WebSocket connectivity issues in production | Test with multiple ISPs; implement long-polling fallback |
| Database connection limits | Connection pooling (PgBouncer or Prisma Data Proxy) |
| Cold start latency on serverless | Warm-up strategy; critical paths in edge runtime |

**Acceptance Criteria:**

- Application accessible at production URL
- Google OAuth works in production
- Two users can collaboratively edit from different networks
- Uptime > 99% over first week
- Error rate < 0.1%
- README enables another developer to run locally in < 10 minutes

---

## 15. Observability & Operations

### 15.1 Monitoring Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     OBSERVABILITY STACK                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ERRORS (Sentry)                                                 │
│  ├── Client: React error boundaries → Sentry.captureException   │
│  ├── Server: API route errors → Sentry middleware                │
│  ├── Socket: Connection/sync errors → Sentry.captureException   │
│  └── Alerts: Slack notification on new error                     │
│                                                                  │
│  TRACES (OpenTelemetry → Sentry or Jaeger)                       │
│  ├── HTTP request traces (Next.js → Prisma)                      │
│  ├── WebSocket event traces (Socket.io → Prisma)                 │
│  ├── Custom spans: yjs-sync, awareness-broadcast, db-persist     │
│  └── Correlation IDs across HTTP + WebSocket                     │
│                                                                  │
│  METRICS (OpenTelemetry → Prometheus/Grafana or Sentry)          │
│  ├── active_rooms (gauge)                                        │
│  ├── active_connections (gauge)                                  │
│  ├── yjs_updates_per_second (counter)                            │
│  ├── yjs_sync_latency_ms (histogram)                             │
│  ├── db_persist_latency_ms (histogram)                           │
│  ├── db_persist_byte_size (histogram)                            │
│  ├── room_lifetime_seconds (histogram)                           │
│  └── socket_reconnections (counter)                              │
│                                                                  │
│  LOGS (Pino → stdout → cloud log aggregator)                     │
│  ├── Structured JSON format                                      │
│  ├── Request ID correlation                                      │
│  ├── Log levels: debug, info, warn, error                        │
│  └── Sensitive data redacted (tokens, emails in errors)          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 15.2 Key Alerts

| Alert                          | Condition                              | Severity |
| ------------------------------ | -------------------------------------- | -------- |
| Error rate spike               | > 5% of requests error in 5 min window | P1       |
| Sync latency degradation       | p95 sync latency > 200ms for 5 min     | P2       |
| Database connection exhaustion | < 5 idle connections in pool           | P1       |
| Room memory usage              | Server memory > 80%                    | P1       |
| WebSocket disconnection spike  | > 50 disconnects in 1 min              | P2       |
| Zero active rooms for > 1 hour | (during business hours)                | P3       |

### 15.3 Runbook

| Incident                    | Steps                                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **All users disconnecting** | 1. Check Socket.io server health. 2. Check Redis (if using adapter). 3. Check network/TLS certificate. 4. Restart Socket.io server.               |
| **Data not persisting**     | 1. Check PostgreSQL connectivity. 2. Check Prisma connection pool. 3. Check server logs for persist errors. 4. Manual persist via admin endpoint. |
| **Document loading slowly** | 1. Check snapshot size (> 5 MB?). 2. Check PostgreSQL query latency. 3. Check network latency to DB. 4. Consider snapshot GC.                     |

---

## 16. Resume Impact

### 16.1 Engineering Concepts Demonstrated

| Concept                            | Where in Project                                                    |
| ---------------------------------- | ------------------------------------------------------------------- |
| **Distributed Systems**            | CRDT-based conflict resolution, eventual consistency, offline-first |
| **Real-time Systems**              | WebSocket communication, presence awareness, sub-50ms sync          |
| **System Design**                  | Room architecture, persistence strategy, horizontal scaling         |
| **Database Design**                | Normalized schema, indexing strategy, binary data storage           |
| **Authentication & Authorization** | OAuth 2.0, RBAC, session management, share links                    |
| **API Design**                     | RESTful APIs, validation, error handling, pagination                |
| **Frontend Architecture**          | React Server Components, state management, optimistic UI            |
| **Testing**                        | TDD, unit/integration/E2E/load testing, failure recovery            |
| **DevOps**                         | CI/CD, deployment, monitoring, observability                        |
| **Security**                       | Threat modeling, CSP, CSRF, rate limiting, input validation         |

### 16.2 Interview Topics Covered

| Interview Type          | Topics This Project Prepares                                                           |
| ----------------------- | -------------------------------------------------------------------------------------- |
| **System Design**       | Design a collaborative editor, design a real-time system, design a notification system |
| **Backend**             | WebSocket architecture, database schema design, API design, caching strategies         |
| **Frontend**            | React performance, state management, offline-first, optimistic updates                 |
| **Distributed Systems** | CRDTs vs OT, eventual consistency, conflict resolution, state synchronization          |
| **Database**            | Indexing, query optimization, binary storage, migration strategy                       |
| **Security**            | OAuth flow, RBAC, CSRF/XSS prevention, threat modeling                                 |
| **DevOps**              | CI/CD pipelines, monitoring, alerting, incident response                               |
| **Behavioral**          | Complex project ownership, cross-system debugging, tradeoff discussions                |

### 16.3 System Design Interview Mappings

| Common Interview Question                                 | Directly Relevant Experience                             |
| --------------------------------------------------------- | -------------------------------------------------------- |
| "Design Google Docs"                                      | This IS the project                                      |
| "Design a real-time chat application"                     | WebSocket room architecture, presence, message ordering  |
| "Design a notification system"                            | Real-time events, fan-out, delivery guarantees           |
| "Design a collaborative whiteboard"                       | CRDT state management, cursor tracking, room management  |
| "How would you handle conflicts in a distributed system?" | CRDT theory, Yjs implementation, merge semantics         |
| "Design a permission system"                              | RBAC, share links, permission matrix, middleware         |
| "How do you ensure data consistency?"                     | Eventual consistency, offline sync, snapshot persistence |

### 16.4 Resume Bullet Points

> Assuming the project has been completed successfully:

---

**Realtime Collaborative Document Editor** — _Full-Stack Engineer & Architect_

- **Architected and built a production-grade collaborative document editor** supporting 20+ concurrent editors per document with sub-50ms edit propagation using CRDTs (Yjs), Socket.io, and a custom WebSocket sync protocol.

- **Designed a conflict-free real-time synchronization engine** using CRDT (Yjs YATA algorithm) with offline-first editing, achieving zero data-loss across network partitions and automatic three-way merges on reconnect.

- **Engineered a WebSocket room management system** handling 500+ concurrent document sessions with debounced persistence, graceful teardown, and automatic snapshot-based recovery — reducing database writes by 95% vs. naive per-keystroke persistence.

- **Implemented a role-based access control system** with Owner/Editor/Viewer roles, cryptographic share links (256-bit tokens), and middleware-level permission enforcement across REST APIs and WebSocket events.

- **Built a version history system** with diff-based comparison, one-click restore with automatic backup, and editor attribution — enabling full audit trails across 1M+ document versions.

- **Achieved 99.9% uptime** with comprehensive observability: OpenTelemetry distributed tracing, Sentry error tracking, structured logging, and custom metrics for sync latency, room lifecycle, and persistence throughput.

- **Delivered 90+ Lighthouse score** with Next.js 16 App Router, React 19 Server Components, and optimized WebSocket connection lifecycle — editor load time < 2s at p95.

- **Established a rigorous testing culture** with 120+ unit tests (Vitest), 60+ integration tests, 15+ Playwright E2E tests including multi-tab collaborative editing scenarios, and k6 load tests validating 20-user concurrent editing.

- **Tech stack:** Next.js 16, React 19, TypeScript, TipTap, Yjs, Socket.io, PostgreSQL, Prisma, Auth.js, Tailwind CSS, Sentry, OpenTelemetry, Vitest, Playwright.

---

### 16.5 How to Talk About This Project in Interviews

**Opening (30 seconds):**

> "I built a real-time collaborative document editor — think Google Docs — that supports 20+ simultaneous editors with conflict-free merging using CRDTs. The architecture handles offline editing, automatic reconnection, version history with diff comparison, and role-based access control. It's deployed on Vercel with a separate Socket.io server for WebSocket connections."

**Technical depth (when probed):**

> "I chose CRDTs over Operational Transformation because CRDTs give us offline-first editing for free — the local document state is always valid, and merges are commutative and idempotent. Specifically, I used Yjs, which implements the YATA algorithm. Each character has a globally unique ID based on (clientId, lamport clock), so even concurrent inserts at the same position produce a deterministic ordering across all replicas."

**Architecture decision (when asked about tradeoffs):**

> "The biggest tradeoff was persistence strategy. Yjs documents are stored as binary blobs — you can't query the content with SQL. I solved this by storing both the Yjs binary state (for fast loading and restoration) and a plain-text extraction (for search and diff computation). For persistence frequency, I debounce writes to every 2 seconds and create full snapshots every 100 updates, which reduced database write volume by 95% compared to per-keystroke saves."

**Scale discussion:**

> "For horizontal scaling, the Socket.io server uses Redis as a pub/sub adapter so multiple server instances can relay messages across rooms. Each room is an independent unit with its own Yjs document, persistence timer, and cleanup lifecycle. I've load-tested with 20 concurrent editors in a single document and 500 active rooms, with p95 sync latency under 50ms."

---

> **End of PRD — Version 1.0.0**
>
> This document should be treated as a living specification. Updates should be versioned and reviewed by the engineering team before implementation changes.
