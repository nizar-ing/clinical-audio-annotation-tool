import express from 'express';
import { createIngestionModule } from '../ingestion/ingestion.module.js';
import { createAudioAnalysisModule } from '../audio-analysis/audio-analysis.module.js';
import { createAnnotationModule } from '../annotation/annotation.module.js';
import { createWorkQueueModule } from '../work-queue/work-queue.module.js';
import { errorHandler } from '../shared/infrastructure/http/error-handler.middleware.js';
import { env } from '../shared/infrastructure/config/env.js';

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
  app.use('/api/v1', createAnnotationModule());
  app.use('/api/v1', createWorkQueueModule());

  // express.static handles Range headers natively; audio seeking works without a custom stream endpoint.
  app.use('/uploads', express.static(env.UPLOADS_DIR));

  app.use(errorHandler);

  return app;
}
