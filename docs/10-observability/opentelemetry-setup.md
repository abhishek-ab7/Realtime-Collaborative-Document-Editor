# OpenTelemetry Custom Metrics Setup

This document outlines the custom metrics instrumentation set up in our Socket.io server to observe performance indices under load.

## 1. Setup Architecture

The socket server (`apps/socket-server`) uses `@opentelemetry/sdk-metrics` and `@opentelemetry/exporter-metrics-otlp-proto` to track runtime stats.

The metrics setup is implemented in `apps/socket-server/src/lib/metrics.ts` and initialized on boot:

```typescript
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { Resource } from '@opentelemetry/resources';

const resource = new Resource({ 'service.name': 'collabdoc-socket' });
const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter(),
  exportIntervalMillis: 60000, // Export every minute
});

const meterProvider = new MeterProvider({ resource, readers: [metricReader] });
const meter = meterProvider.getMeter('collabdoc-socket');
```

## 2. Configured Metrics

We export five core performance indicators:

### 1. Active Collaboration Rooms

- **Metric Name**: `collabdoc.active_rooms`
- **Type**: Observable Gauge
- **Description**: Tracks the current count of loaded Yjs rooms. Updated via a room manager callback.

### 2. Active Connections

- **Metric Name**: `collabdoc.active_connections`
- **Type**: Observable Gauge
- **Description**: Tracks the total number of connected clients/sockets across all rooms.

### 3. Yjs Synchronization Latency

- **Metric Name**: `collabdoc.yjs_sync_latency_ms`
- **Type**: Histogram
- **Description**: Meaures the duration (in milliseconds) required to apply Yjs client update payloads.

### 4. Database Persistence Latency

- **Metric Name**: `collabdoc.db_persist_latency_ms`
- **Type**: Histogram
- **Description**: Tracks database query execution times when flushing memory changes to the database.

### 5. Document Size

- **Metric Name**: `collabdoc.document_size_bytes`
- **Type**: Histogram
- **Description**: Measures the total size in bytes of the persisted binary Yjs update documents.

## 3. Scraping Metrics

The OpenTelemetry metrics are exported to an OTLP endpoint (e.g. Grafana Tempo, Prometheus, or SigNoz). Ensure your host environment has the endpoint URLs configured:

```text
OTEL_EXPORTER_OTLP_ENDPOINT=http://your-otel-collector:4318
```

**Related Links:**

- [[11-deployment/railway-setup|Socket Server Railway Setup]]
- [[10-observability/monitoring-dashboards|Monitoring Dashboards Guide]]
