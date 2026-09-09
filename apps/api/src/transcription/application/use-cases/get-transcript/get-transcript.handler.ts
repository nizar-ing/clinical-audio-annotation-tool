import { NotFoundException } from '../../../../shared/domain/exceptions/application.exception.js';
import type { Transcript } from '../../../domain/entities/transcript.entity.js';
import type { TranscriptRepositoryPort } from '../../ports/transcript.repository.port.js';
import type { GetTranscriptQuery } from './get-transcript.query.js';

export class GetTranscriptHandler {
  constructor(private readonly transcripts: TranscriptRepositoryPort) {}

  async execute(query: GetTranscriptQuery): Promise<Transcript> {
    const transcript = await this.transcripts.findByRecordingId(query.recordingId);
    if (!transcript) {
      throw new NotFoundException(`No transcript for recording ${query.recordingId}`);
    }
    return transcript;
  }
}
