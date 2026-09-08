import { NotFoundException } from '../../../../shared/domain/exceptions/application.exception.js';
import type { ConditionsDto } from '../../dtos/conditions.dto.js';
import type { RecordingReadPort } from '../../ports/recording-read.port.js';
import type {
  ConditionsRow,
  RecordingConditionsRepositoryPort,
} from '../../ports/recording-conditions.repository.port.js';
import type { AnalyzeRecordingHandler } from '../analyze-recording/analyze-recording.handler.js';
import type { GetConditionsQuery } from './get-conditions.query.js';

export class GetConditionsHandler {
  constructor(
    private readonly recordings: RecordingReadPort,
    private readonly conditions: RecordingConditionsRepositoryPort,
    private readonly analyze: AnalyzeRecordingHandler,
  ) {}

  async execute(q: GetConditionsQuery): Promise<ConditionsDto> {
    const recording = await this.recordings.findById(q.recordingId);
    if (!recording) throw new NotFoundException(`Recording ${q.recordingId} not found`);

    // Lazy analyse: the first GET runs the pipeline and persists. Subsequent GETs are read-only.
    let row = await this.conditions.findByRecordingId(q.recordingId);
    if (!row) row = await this.analyze.execute({ recordingId: q.recordingId });

    // Re-read the recording after analyse — headerMetadata may have been populated during the pass.
    const refreshed = await this.recordings.findById(q.recordingId);
    return toDto(refreshed ?? recording, row);
  }
}

export function toDto(
  recording: {
    id: string;
    mimeType: string;
    durationSeconds: number;
    sampleRate: number;
    channels: number;
    bitDepth: number | null;
    headerMetadata: unknown | null;
  },
  row: ConditionsRow,
): ConditionsDto {
  const finalSpeechRate = row.overrideSpeechRateWpm ?? row.derivedSpeechRateWpm;
  const finalBucket = row.overrideDistanceBucket ?? row.derivedDistanceBucket;
  return {
    recordingId: recording.id,
    headerMetadata: recording.headerMetadata ?? null,
    audio: {
      mimeType: recording.mimeType,
      durationSeconds: recording.durationSeconds,
      sampleRate: recording.sampleRate,
      channels: recording.channels,
      bitDepth: recording.bitDepth,
    },
    derived: {
      speechRateWpm: row.derivedSpeechRateWpm,
      distanceBucket: row.derivedDistanceBucket,
    },
    override: {
      speechRateWpm: row.overrideSpeechRateWpm,
      distanceBucket: row.overrideDistanceBucket,
    },
    final: {
      speechRateWpm: finalSpeechRate,
      distanceBucket: finalBucket,
    },
    distanceMethod: row.distanceMethod,
  };
}
