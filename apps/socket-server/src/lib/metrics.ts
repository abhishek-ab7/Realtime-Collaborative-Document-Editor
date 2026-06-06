import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';

const resource = resourceFromAttributes({ 'service.name': 'collabdoc-socket' });
const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter(),
  exportIntervalMillis: 60000, // Export every minute
});

const meterProvider = new MeterProvider({ resource, readers: [metricReader] });
const meter = meterProvider.getMeter('collabdoc-socket');

// ─── Custom Metrics ───
export const activeRoomsGauge = meter.createObservableGauge('collabdoc.active_rooms', {
  description: 'Number of active collaboration rooms',
});

export const activeConnectionsGauge = meter.createObservableGauge('collabdoc.active_connections', {
  description: 'Number of active WebSocket connections',
});

export const yjsSyncLatency = meter.createHistogram('collabdoc.yjs_sync_latency_ms', {
  description: 'Yjs sync operation latency in milliseconds',
  unit: 'ms',
});

export const dbPersistLatency = meter.createHistogram('collabdoc.db_persist_latency_ms', {
  description: 'Database persistence latency in milliseconds',
  unit: 'ms',
});

export const documentSizeBytes = meter.createHistogram('collabdoc.document_size_bytes', {
  description: 'Size of persisted Yjs documents in bytes',
  unit: 'bytes',
});
