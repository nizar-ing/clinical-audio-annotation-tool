import { DomainException } from '../../../shared/domain/exceptions/domain.exception.js';

export type RecordingStatus =
  | 'UPLOADED'
  | 'REJECTED_TOO_SHORT'
  | 'UNPAIRED'
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'DONE';

const TRANSITIONS: Record<RecordingStatus, RecordingStatus[]> = {
  UPLOADED: ['UNPAIRED', 'QUEUED', 'REJECTED_TOO_SHORT'],
  REJECTED_TOO_SHORT: [],
  UNPAIRED: ['QUEUED'],
  QUEUED: ['IN_PROGRESS'],
  IN_PROGRESS: ['QUEUED', 'DONE'],
  DONE: ['IN_PROGRESS'],
};

export function assertLegalTransition(from: RecordingStatus, to: RecordingStatus): void {
  if (!TRANSITIONS[from].includes(to)) {
    throw new DomainException(`Illegal status transition: ${from} → ${to}`);
  }
}
