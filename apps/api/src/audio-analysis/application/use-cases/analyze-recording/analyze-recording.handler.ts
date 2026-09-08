import { NotFoundException } from '../../../../shared/domain/exceptions/application.exception.js';
import { computeFrameRms, DEFAULT_FRAME_MS } from '../../../../shared/infrastructure/audio/frame-energy.js';
import { EnergyProfile } from '../../../domain/value-objects/energy-profile.vo.js';
import { SpeechRateDomainService } from '../../../domain/services/speech-rate.domain-service.js';
import { DistanceEstimateDomainService } from '../../../domain/services/distance-estimate.domain-service.js';
import type { RecordingReadPort } from '../../ports/recording-read.port.js';
import type { RecordingHeaderMetadataWritePort } from '../../ports/recording-header-metadata.write.port.js';
import type { TranscriptReadPort } from '../../ports/transcript-read.port.js';
import type { AudioDecoderPort } from '../../ports/audio-decoder.port.js';
import type { AudioHeaderReaderPort } from '../../ports/audio-header-reader.port.js';
import type {
  ConditionsRow,
  RecordingConditionsRepositoryPort,
} from '../../ports/recording-conditions.repository.port.js';
import type { AnalyzeRecordingCommand } from './analyze-recording.command.js';

export class AnalyzeRecordingHandler {
  constructor(
    private readonly recordings: RecordingReadPort,
    private readonly recordingHeader: RecordingHeaderMetadataWritePort,
    private readonly transcripts: TranscriptReadPort,
    private readonly conditions: RecordingConditionsRepositoryPort,
    private readonly decoder: AudioDecoderPort,
    private readonly headerReader: AudioHeaderReaderPort,
  ) {}

  async execute(cmd: AnalyzeRecordingCommand): Promise<ConditionsRow> {
    const recording = await this.recordings.findById(cmd.recordingId);
    if (!recording) throw new NotFoundException(`Recording ${cmd.recordingId} not found`);

    // Populate Recording.headerMetadata for fresh WAV uploads. The seed already writes it for demo-01;
    // this branch covers uploads that arrived through /recordings and never had chunks extracted.
    if (recording.headerMetadata == null && recording.mimeType === 'audio/wav') {
      const header = await this.headerReader.read(recording.storageKey, recording.mimeType);
      if (header) await this.recordingHeader.update(recording.id, header);
    }

    const { samples, sampleRate } = await this.decoder.decode(recording.storageKey);
    const frameRms = computeFrameRms(samples, sampleRate, DEFAULT_FRAME_MS);
    const profile = new EnergyProfile(frameRms, DEFAULT_FRAME_MS);

    const distance = DistanceEstimateDomainService.compute(profile);

    // Speech rate requires a transcript. If none exists yet (unpaired recording), record 0 —
    // the estimate is refreshed the next time analyze runs, which is idempotent (upsert).
    const transcript = await this.transcripts.findByRecordingId(recording.id);
    const speechRateWpm = transcript
      ? SpeechRateDomainService.compute(transcript.correctedText, recording.durationSeconds)
      : 0;

    return this.conditions.save({
      recordingId: recording.id,
      derivedSpeechRateWpm: speechRateWpm,
      derivedDistanceBucket: distance.bucket,
      distanceMethod: distance.method,
    });
  }
}
