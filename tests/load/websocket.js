import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('ws_errors');
const latency = new Trend('ws_latency');

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up to 50 connections
    { duration: '1m', target: 100 }, // Ramp up to 100 connections
    { duration: '2m', target: 100 }, // Hold at 100
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    ws_errors: ['rate<0.01'], // < 1% error rate
    ws_latency: ['p95<100'], // p95 latency < 100ms
  },
};

export default function () {
  const url = `${__ENV.SOCKET_URL || 'ws://localhost:3001'}`;
  const params = { headers: { Authorization: `Bearer ${__ENV.AUTH_TOKEN}` } };

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', () => {
      // Join a room
      const start = Date.now();
      socket.send(
        JSON.stringify({
          event: 'join-room',
          data: 'test-document-id',
        }),
      );

      socket.on('message', () => {
        latency.add(Date.now() - start);
      });
    });

    socket.on('error', () => {
      errorRate.add(1);
    });

    // Send periodic updates
    for (let i = 0; i < 10; i++) {
      sleep(1);
      socket.send(
        JSON.stringify({
          event: 'yjs-update',
          data: { documentId: 'test', update: 'simulated' },
        }),
      );
    }

    sleep(5);
    socket.close();
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
}
