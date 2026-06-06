# Production Monitoring & Dashboards

This document outlines the recommended layouts and indicators for production dashboards observing collabdoc performance.

## 1. Key Performance Indicators (KPIs)

We track three core system zones:

### Next.js Web Application

- **HTTP Error Rates**: Count of `5xx` server actions / API errors. Target: `< 0.1%`.
- **API Latency (p95)**: Average time required to return document list queries or document details. Target: `< 100ms`.
- **Next.js Core Web Vitals**:
  - Largest Contentful Paint (LCP): `< 2.5s`
  - Interaction to Next Paint (INP): `< 200ms`
  - Cumulative Layout Shift (CLS): `< 0.1`

### Socket.io Server

- **Active Connections**: Number of active WebSocket clients connected to the server.
- **Sync Latency (p95)**: Time elapsed during `yjs-update` application in rooms. Target: `< 50ms`.
- **Memory Utilization**: Bounded heap allocation check (monitored to prevent memory leaks from active rooms).

### Database (Neon/Supabase)

- **Active Connection Counts**: Open database handles. Target: `< 80%` of pool bounds.
- **Flushing Times**: Duration of transaction saves flushing Yjs state updates to disk. Target: `< 150ms`.

## 2. Dashboard Layout (SigNoz/Grafana)

We recommend grouping indicators into three rows:

1. **Active Sockets**: Real-time gauge of `collabdoc.active_connections` alongside `collabdoc.active_rooms`.
2. **Sync Speed**: Histogram chart of `collabdoc.yjs_sync_latency_ms` (displays `p50`, `p95`, `p99` latency).
3. **App Exceptions**: Integration panel from Sentry highlighting active issue counts.

## 3. Alerts Configuration

We recommend setting up three critical notifications:

- **High WebSocket Error Rate**: Trigger alert if OTLP reports client handshake socket errors `> 2%` in a 5-minute window.
- **High Database Latency**: Trigger alert if `collabdoc.db_persist_latency_ms` exceeds `500ms` for more than 3 consecutive samples.
- **System Down**: Ping check failures on the socket server's `/health` or web app's `/` endpoints.

**Related Links:**

- [[10-observability/opentelemetry-setup|OpenTelemetry Metrics Setup]]
- [[10-observability/sentry-setup|Sentry Integration Setup]]
