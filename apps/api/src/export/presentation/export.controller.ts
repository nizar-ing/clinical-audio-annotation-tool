import { Router } from 'express';
import { serializeRecord } from '../infrastructure/adapters/jsonl.serializer.js';
import type { ExportGoldStandardHandler } from '../application/use-cases/export-gold-standard/export-gold-standard.handler.js';

export function createExportRouter(handler: ExportGoldStandardHandler): Router {
  const router = Router();

  router.get('/export', async (_req, res) => {
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/x-ndjson');
    res.setHeader('Content-Disposition', `attachment; filename="clinannotate-${date}.jsonl"`);

    try {
      for await (const record of handler.execute()) {
        res.write(serializeRecord(record));
      }
      res.end();
    } catch {
      if (!res.headersSent) {
        res.status(500).json({ error: 'Export failed' });
      } else {
        res.end();
      }
    }
  });

  return router;
}
