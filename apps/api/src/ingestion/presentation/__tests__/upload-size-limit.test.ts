import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createIngestionRouter } from '../ingestion.controller.js';
import { errorHandler } from '../../../shared/infrastructure/http/error-handler.middleware.js';

// The stubs never fire on the rejection paths (multer/body-parser short-circuit before the route),
// so the shape only needs to satisfy the type of createIngestionRouter's deps.
const stubs = {
  uploadHandler: { execute: async () => [] },
  importHandler: { execute: async () => ({ imported: 0, errors: [] }) },
  pairHandler: { execute: async () => undefined },
  unpairHandler: { execute: async () => undefined },
  recordings: { findAll: async () => [] },
  importRows: { findAll: async () => [] },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

function makeApp() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use('/api/v1', createIngestionRouter(stubs));
  app.use(errorHandler);
  return app;
}

describe('upload size limits', () => {
  it('returns 413 when an audio file exceeds 100 MB', async () => {
    const oversized = Buffer.alloc(101 * 1024 * 1024, 0x41);
    const res = await request(makeApp())
      .post('/api/v1/recordings')
      .attach('files', oversized, 'big.wav');
    expect(res.status).toBe(413);
    expect(res.body).toEqual({
      error: { code: 'file_too_large', message: expect.any(String) },
    });
  });

  it('returns 413 when the transcript import JSON body exceeds 5 MB', async () => {
    const filler = 'x'.repeat(6 * 1024 * 1024);
    const res = await request(makeApp())
      .post('/api/v1/import-rows')
      .set('Content-Type', 'application/json')
      .send(`{"rows":"${filler}"}`);
    expect(res.status).toBe(413);
    expect(res.body).toEqual({
      error: { code: 'payload_too_large', message: expect.any(String) },
    });
  });

  it('does not 413 a small transcript import body just under the limit', async () => {
    const res = await request(makeApp())
      .post('/api/v1/import-rows')
      .set('Content-Type', 'application/json')
      .send('[]');
    expect(res.status).not.toBe(413);
  });
});
