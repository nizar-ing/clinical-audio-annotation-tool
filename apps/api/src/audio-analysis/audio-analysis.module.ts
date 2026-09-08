import type { Router } from 'express';
import { prisma } from '../shared/infrastructure/database/postgres/prisma.client.js';
import { PrismaRecordingConditionsRepository } from './infrastructure/prisma-recording-conditions.repository.js';
import { PrismaRecordingReadAdapter } from './infrastructure/prisma-recording-read.adapter.js';
import { PrismaRecordingHeaderMetadataWriteAdapter } from './infrastructure/prisma-recording-header-metadata.write.adapter.js';
import { PrismaTranscriptReadAdapter } from './infrastructure/prisma-transcript-read.adapter.js';
import { FfmpegAudioDecoder } from './infrastructure/ffmpeg-audio.decoder.js';
import { RiffAudioHeaderReader } from './infrastructure/riff-audio-header.reader.js';
import { AnalyzeRecordingHandler } from './application/use-cases/analyze-recording/analyze-recording.handler.js';
import { GetConditionsHandler } from './application/use-cases/get-conditions/get-conditions.handler.js';
import { OverrideConditionsHandler } from './application/use-cases/override-conditions/override-conditions.handler.js';
import { createConditionsRouter } from './presentation/conditions.controller.js';

export function createAudioAnalysisModule(): Router {
  const conditions = new PrismaRecordingConditionsRepository(prisma);
  const recordings = new PrismaRecordingReadAdapter(prisma);
  const recordingHeader = new PrismaRecordingHeaderMetadataWriteAdapter(prisma);
  const transcripts = new PrismaTranscriptReadAdapter(prisma);
  const decoder = new FfmpegAudioDecoder();
  const headerReader = new RiffAudioHeaderReader();

  const analyzeHandler = new AnalyzeRecordingHandler(
    recordings,
    recordingHeader,
    transcripts,
    conditions,
    decoder,
    headerReader,
  );
  const getHandler = new GetConditionsHandler(recordings, conditions, analyzeHandler);
  const overrideHandler = new OverrideConditionsHandler(recordings, conditions);

  return createConditionsRouter({ getHandler, overrideHandler });
}
