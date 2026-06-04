import { expect, test, beforeAll, afterAll } from 'vitest';
import { httpServer } from '../src/index';

const TEST_PORT = 3012;

beforeAll(() => {
  return new Promise<void>((resolve) => {
    if (httpServer.listening) {
      resolve();
    } else {
      httpServer.listen(TEST_PORT, () => {
        resolve();
      });
    }
  });
});

afterAll(() => {
  return new Promise<void>((resolve) => {
    httpServer.close(() => {
      resolve();
    });
  });
});

test('health endpoint returns 200 ok', async () => {
  const response = await fetch(`http://localhost:${TEST_PORT}/health`);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.status).toBe('ok');
  expect(typeof data.uptime).toBe('number');
});
