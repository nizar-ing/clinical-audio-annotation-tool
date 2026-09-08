import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { DomainException } from '../../domain/exceptions/domain.exception.js';
import { NotFoundException, ConflictException } from '../../domain/exceptions/application.exception.js';

// body-parser (used by express.json) throws an error with this shape when a request body exceeds `limit`.
function isPayloadTooLarge(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { type?: string }).type === 'entity.too.large'
  );
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof DomainException) {
    res.status(422).json({ error: { code: 'domain_rule_violation', message: err.message } });
    return;
  }
  if (err instanceof NotFoundException) {
    res.status(404).json({ error: { code: 'not_found', message: err.message } });
    return;
  }
  if (err instanceof ConflictException) {
    res.status(409).json({ error: { code: 'conflict', message: err.message } });
    return;
  }
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: { code: 'file_too_large', message: 'Audio file exceeds the per-file size limit.' } });
      return;
    }
    res.status(400).json({ error: { code: 'upload_rejected', message: err.message } });
    return;
  }
  if (isPayloadTooLarge(err)) {
    res.status(413).json({ error: { code: 'payload_too_large', message: 'Request body exceeds the size limit.' } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'internal_error', message: 'An unexpected error occurred.' } });
}
