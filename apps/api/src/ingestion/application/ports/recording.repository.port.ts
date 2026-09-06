import type { Recording } from '../../domain/entities/recording.entity.js';
import type { RecordingProps } from '../../domain/entities/recording.entity.js';

export interface RecordingRepositoryPort {
  save(recording: Omit<RecordingProps, 'createdAt'> & { id: string }): Promise<Recording>;
  findById(id: string): Promise<Recording | null>;
  findAll(filters?: { status?: string }): Promise<Recording[]>;
  updateStatus(id: string, status: string): Promise<void>;
}
