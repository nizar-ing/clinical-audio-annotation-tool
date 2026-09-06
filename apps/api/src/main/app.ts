import express from 'express';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/api/v1/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  return app;
}
