import { randomUUID } from 'crypto';
import { DomainException } from '../../../../shared/domain/exceptions/domain.exception.js';
import { NotFoundException } from '../../../../shared/domain/exceptions/application.exception.js';
import { Transcript } from '../../../domain/entities/transcript.entity.js';
import { WordAlignmentDomainService } from '../../../domain/services/word-alignment.domain-service.js';
import type { TranscriptRepositoryPort } from '../../ports/transcript.repository.port.js';
import type { RecordingReadPort } from '../../ports/recording-read.port.js';
import type { AudioEnergyPort } from '../../ports/audio-energy.port.js';
import type { CreateTranscriptCommand } from './create-transcript.command.js';

export class CreateTranscriptHandler {
  constructor(
    private readonly transcripts: TranscriptRepositoryPort,
    private readonly recordings: RecordingReadPort,
    private readonly energy: AudioEnergyPort,
  ) {}

  async execute(cmd: CreateTranscriptCommand): Promise<Transcript> {
    if (cmd.originalText.trim().length === 0) {
      throw new DomainException('originalText cannot be empty');
    }

    const existing = await this.transcripts.findByRecordingId(cmd.recordingId);
    if (existing) {
      throw new DomainException(`Transcript already exists for recording ${cmd.recordingId}`);
    }

    const recording = await this.recordings.findById(cmd.recordingId);
    if (!recording) {
      throw new NotFoundException(`Recording ${cmd.recordingId} not found`);
    }

    const tokens = cmd.originalText.trim().split(/\s+/).filter((t) => t.length > 0);
    const regions = await this.energy.getSpeechRegions(recording.id);
    const alignment = WordAlignmentDomainService.align({
      tokens,
      duration: recording.durationSeconds,
      energyRegions: regions.length > 0 ? regions : undefined,
    });

    const transcript = Transcript.create(randomUUID(), {
      recordingId: recording.id,
      originalText: cmd.originalText,
      correctedText: cmd.originalText,
      wordTimings: alignment.words,
      alignmentMethod: alignment.method,
      werCached: 0,
      updatedAt: new Date(),
    });

    return this.transcripts.save(transcript);
  }
}
