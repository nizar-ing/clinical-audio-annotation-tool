import type { PrismaClient } from '@prisma/client';
import type { ExportReadPort, ExportRow } from '../../application/ports/export.read.port.js';

export class PrismaExportReadModel implements ExportReadPort {
  constructor(private readonly db: PrismaClient) {}

  async *streamCompleted(): AsyncIterable<ExportRow> {
    // Cursor-based pagination so large datasets don't buffer in memory.
    let cursor: string | undefined;
    const PAGE = 50;

    while (true) {
      const rows = await this.db.recording.findMany({
        where: { status: 'DONE', transcript: { isNot: null }, conditions: { isNot: null } },
        take: PAGE,
        skip: cursor ? 1 : 0,
        ...(cursor ? { cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        select: {
          id: true,
          originalFilename: true,
          storageKey: true,
          mimeType: true,
          durationSeconds: true,
          sampleRate: true,
          channels: true,
          transcript: {
            select: {
              id: true,
              originalText: true,
              correctedText: true,
              werCached: true,
              alignmentMethod: true,
              wordTimings: true,
              annotations: {
                select: {
                  spanType: true,
                  startOffset: true,
                  endOffset: true,
                  anchorText: true,
                  attributes: true,
                  needsReview: true,
                },
              },
            },
          },
          conditions: {
            select: {
              derivedSpeechRateWpm: true,
              overrideSpeechRateWpm: true,
              derivedDistanceBucket: true,
              overrideDistanceBucket: true,
              distanceMethod: true,
            },
          },
        },
      });

      for (const r of rows) {
        if (!r.transcript || !r.conditions) continue;

        const c = r.conditions;
        const finalSpeechRate = c.overrideSpeechRateWpm ?? c.derivedSpeechRateWpm;
        const finalBucket = c.overrideDistanceBucket ?? c.derivedDistanceBucket;

        const row: ExportRow = {
          recording: {
            originalFilename: r.originalFilename,
            storageKey: r.storageKey,
          },
          transcript: {
            originalText: r.transcript.originalText,
            correctedText: r.transcript.correctedText,
            werCached: r.transcript.werCached ?? 0,
            alignmentMethod: r.transcript.alignmentMethod,
            wordTimings: r.transcript.wordTimings as Array<{ w: string; start: number; end: number }> | null,
          },
          conditions: {
            audio: {
              durationSeconds: r.durationSeconds,
              sampleRate: r.sampleRate,
              channels: r.channels,
            },
            derived: {
              speechRateWpm: c.derivedSpeechRateWpm,
              distanceBucket: c.derivedDistanceBucket,
            },
            override: {
              speechRateWpm: c.overrideSpeechRateWpm,
              distanceBucket: c.overrideDistanceBucket,
            },
            final: {
              speechRateWpm: finalSpeechRate,
              distanceBucket: finalBucket,
            },
            distanceMethod: c.distanceMethod,
          },
          spans: r.transcript.annotations.map((s) => ({
            spanType: s.spanType,
            startOffset: s.startOffset,
            endOffset: s.endOffset,
            anchorText: s.anchorText,
            attributes: s.attributes as Record<string, unknown>,
            needsReview: s.needsReview,
          })),
        };

        yield row;
      }

      if (rows.length < PAGE) break;
      cursor = rows[rows.length - 1]!.id;
    }
  }
}
