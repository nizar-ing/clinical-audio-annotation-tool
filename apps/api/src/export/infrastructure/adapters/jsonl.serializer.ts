import type { ExportRecord } from '../../domain/value-objects/export-record.vo.js';

export function serializeRecord(record: ExportRecord): string {
  return JSON.stringify(record) + '\n';
}
