import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('ws_errors');

export const options = {
  vus: 20, // 20 concurrent editors
  duration: '1m', // Run for 1 minute
  thresholds: {
    ws_errors: ['rate<0.01'],
  },
};

export default function () {
  const url = `${__ENV.SOCKET_URL || 'ws://localhost:3001'}`;
  const params = { headers: { Authorization: `Bearer ${__ENV.AUTH_TOKEN}` } };
  const documentId = 'shared-load-test-doc';

  const res = ws.connect(url, params, function (socket) {
    socket.on('open', () => {
      // Join shared document room
      socket.send(
        JSON.stringify({
          event: 'join-room',
          data: documentId,
        }),
      );
    });

    socket.on('error', () => {
      errorRate.add(1);
    });

    // Simulate active typing updates
    for (let i = 0; i < 30; i++) {
      sleep(1);
      socket.send(
        JSON.stringify({
          event: 'yjs-update',
          data: {
            documentId: documentId,
            update: `editor-vu-${__VU}-edit-${i}`,
          },
        }),
      );
    }

    sleep(2);
    socket.close();
  });

  check(res, { 'status is 101': (r) => r && r.status === 101 });
}
