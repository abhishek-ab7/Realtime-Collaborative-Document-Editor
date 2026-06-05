import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // Ramp up
    { duration: '1m', target: 200 }, // Ramp up to 200 virtual users
    { duration: '1m', target: 200 }, // Hold
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p95<200'], // 95% of requests must complete within 200ms
    http_req_failed: ['rate<0.01'], // less than 1% failure rate
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${__ENV.AUTH_TOKEN}`,
  };

  // 1. List documents
  const listRes = http.get(`${baseUrl}/api/documents`, { headers });
  check(listRes, {
    'list status is 200': (r) => r.status === 200,
  });

  sleep(1);

  // 2. Fetch specific document details
  const docId = 'test-document-id';
  const detailRes = http.get(`${baseUrl}/api/documents/${docId}`, { headers });
  check(detailRes, {
    'detail status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });

  sleep(1);
}
