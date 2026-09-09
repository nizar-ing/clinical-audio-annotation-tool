import { NotFoundException } from '../../../../shared/domain/exceptions/application.exception.js';
import { SpanAnchoringDomainService } from '../../../domain/services/span-anchoring.domain-service.js';
import { WordAlignmentDomainService } from '../../../domain/services/word-alignment.domain-service.js';
import { WordErrorRateDomainService } from '../../../domain/services/word-error-rate.domain-service.js';
import type { Transcript } from '../../../domain/entities/transcript.entity.js';
import type { TranscriptRepositoryPort } from '../../ports/transcript.repository.port.js';
import type { RecordingReadPort } from '../../ports/recording-read.port.js';
import type { AudioEnergyPort } from '../../ports/audio-energy.port.js';
import type { AnnotationAnchoringPort } from '../../ports/annotation-anchoring.port.js';
import type { UpdateCorrectedTranscriptCommand } from './update-corrected-transcript.command.js';

export interface UpdateCorrectedResult {
  transcript: Transcript;
  reanchor: { updated: number; flagged: number };
}

export class UpdateCorrectedTranscriptHandler {
  constructor(
    private readonly transcripts: TranscriptRepositoryPort,
    private readonly recordings: RecordingReadPort,
    private readonly energy: AudioEnergyPort,
    private readonly annotations: AnnotationAnchoringPort,
  ) {}

  async execute(cmd: UpdateCorrectedTranscriptCommand): Promise<UpdateCorrectedResult> {
    const transcript = await this.transcripts.findByRecordingId(cmd.recordingId);
    if (!transcript) {
      throw new NotFoundException(`No transcript for recording ${cmd.recordingId}`);
    }
    const recording = await this.recordings.findById(cmd.recordingId);
    if (!recording) {
      throw new NotFoundException(`Recording ${cmd.recordingId} not found`);
    }

    const spans = await this.annotations.findSpansByTranscriptId(transcript.id);
    const anchoring = SpanAnchoringDomainService.reanchor(cmd.correctedText, spans);
    await this.annotations.applyReanchor(anchoring.updated);

    const wer = WordErrorRateDomainService.compute(transcript.originalText, cmd.correctedText);
    transcript.updateCorrected(cmd.correctedText, wer);

    // Re-align against the corrected text so word-click seek stays accurate as edits accrue.
    // Energy regions are cached inside the adapter, so this is O(n) on the token count.
    const tokens = cmd.correctedText.trim().split(/\s+/).filter((t) => t.length > 0);
    const regions = await this.energy.getSpeechRegions(recording.id);
    const alignment = WordAlignmentDomainService.align({
      tokens,
      duration: recording.durationSeconds,
      energyRegions: regions.length > 0 ? regions : undefined,
    });
    transcript.updateAlignment(alignment.words, alignment.method);

    const saved = await this.transcripts.save(transcript);
    return { transcript: saved, reanchor: { updated: anchoring.reanchored, flagged: anchoring.flagged } };
  }
}
