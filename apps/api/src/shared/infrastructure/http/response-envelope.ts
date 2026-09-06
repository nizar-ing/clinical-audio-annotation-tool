import type { Response } from 'express';

export function ok<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({ data });
}

export function okList<T>(res: Response, data: T[], total: number): void {
  res.status(200).json({ data, meta: { total } });
}
