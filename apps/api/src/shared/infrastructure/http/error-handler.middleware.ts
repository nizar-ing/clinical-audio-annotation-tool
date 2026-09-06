import type { Request, Response, NextFunction } from 'express';
import { DomainException } from '../../domain/exceptions/domain.exception.js';
import { NotFoundException, ConflictException } from '../../domain/exceptions/application.exception.js';

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
  console.error(err);
  res.status(500).json({ error: { code: 'internal_error', message: 'An unexpected error occurred.' } });
}
