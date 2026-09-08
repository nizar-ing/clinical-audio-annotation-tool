import express from 'express';
import { createIngestionModule } from '../ingestion/ingestion.module.js';
import { createAudioAnalysisModule } from '../audio-analysis/audio-analysis.module.js';
import { errorHandler } from '../shared/infrastructure/http/error-handler.middleware.js';

export function createApp() {
  const app = express();
  // Raised from body-parser's 100 KB default: transcript imports may carry a few thousand
  // {path,label} rows. Kept well below the audio limit so a mis-directed audio POST fails fast.
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/v1/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });

  app.use('/api/v1', createIngestionModule());
  app.use('/api/v1', createAudioAnalysisModule());

  app.use(errorHandler);

  return app;
}
