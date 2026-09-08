import type { PrismaClient, RecordingConditions as PrismaConditionsModel } from '@prisma/client';
import type {
  ConditionsOverridePatch,
  ConditionsRow,
  ConditionsSaveInput,
  RecordingConditionsRepositoryPort,
} from '../application/ports/recording-conditions.repository.port.js';

export class PrismaRecordingConditionsRepository implements RecordingConditionsRepositoryPort {
  constructor(private readonly db: PrismaClient) {}

  async findByRecordingId(recordingId: string): Promise<ConditionsRow | null> {
    const row = await this.db.recordingConditions.findUnique({ where: { recordingId } });
    return row ? this.toRow(row) : null;
  }

  async save(input: ConditionsSaveInput): Promise<ConditionsRow> {
    // Upsert keeps re-analysis idempotent — derived values overwrite, overrides are preserved.
    const row = await this.db.recordingConditions.upsert({
      where: { recordingId: input.recordingId },
      create: {
        recordingId: input.recordingId,
        derivedSpeechRateWpm: input.derivedSpeechRateWpm,
        derivedDistanceBucket: input.derivedDistanceBucket,
        distanceMethod: input.distanceMethod,
      },
      update: {
        derivedSpeechRateWpm: input.derivedSpeechRateWpm,
        derivedDistanceBucket: input.derivedDistanceBucket,
        distanceMethod: input.distanceMethod,
      },
    });
    return this.toRow(row);
  }

  async updateOverrides(recordingId: string, patch: ConditionsOverridePatch): Promise<ConditionsRow> {
    const data: Record<string, number | string | null> = {};
    if (patch.overrideSpeechRateWpm !== undefined) data['overrideSpeechRateWpm'] = patch.overrideSpeechRateWpm;
    if (patch.overrideDistanceBucket !== undefined) data['overrideDistanceBucket'] = patch.overrideDistanceBucket;
    const row = await this.db.recordingConditions.update({ where: { recordingId }, data });
    return this.toRow(row);
  }

  private toRow(r: PrismaConditionsModel): ConditionsRow {
    return {
      recordingId: r.recordingId,
      derivedSpeechRateWpm: r.derivedSpeechRateWpm,
      overrideSpeechRateWpm: r.overrideSpeechRateWpm,
      derivedDistanceBucket: r.derivedDistanceBucket,
      overrideDistanceBucket: r.overrideDistanceBucket,
      distanceMethod: r.distanceMethod,
    };
  }
}
