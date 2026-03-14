import { setupWorker } from 'msw/browser';
import { ws } from 'msw';
import { beforeAll, afterEach, afterAll } from 'vitest';

export const mockWs = ws.link('ws://localhost:3000/ws');
export const worker = setupWorker();

beforeAll(async () => {
  await worker.start({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  worker.resetHandlers();
  localStorage.clear();
});

afterAll(() => {
  worker.stop();
});
