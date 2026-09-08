import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createIngestionRouter } from '../ingestion.controller.js';
import { errorHandler } from '../../../shared/infrastructure/http/error-handler.middleware.js';
import { Recording } from '../../domain/entities/recording.entity.js';

const seeded = Recording.create('rec-123', {
  originalFilename: 'demo-01.wav',
  storageKey: 'demo-01.wav',
  mimeType: 'audio/wav',
  sizeBytes: 1024,
  durationSeconds: 42.5,
  sampleRate: 44100,
  channels: 1,
  bitDepth: 16,
  headerMetadata: null,
  status: 'QUEUED',
  annotator: '',
  createdAt: new Date('2024-01-01T00:00:00Z'),
});

const stubs = {
  uploadHandler: { execute: async () => [] },
  importHandler: { execute: async () => ({ imported: 0, errors: [] }) },
  pairHandler: { execute: async () => undefined },
  unpairHandler: { execute: async () => undefined },
  recordings: {
    findAll: async () => [],
    findById: async (id: string) => (id === 'rec-123' ? seeded : null),
  },
  importRows: { findAll: async () => [] },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', createIngestionRouter(stubs));
  app.use(errorHandler);
  return app;
}

describe('GET /recordings/:id', () => {
  it('returns 200 with the recording DTO for a known id', async () => {
    const res = await request(makeApp()).get('/api/v1/recordings/rec-123');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: 'rec-123',
      originalFilename: 'demo-01.wav',
      storageKey: 'demo-01.wav',
      status: 'QUEUED',
      durationSeconds: 42.5,
    });
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(makeApp()).get('/api/v1/recordings/does-not-exist');
    expect(res.status).toBe(404);
  });
});
