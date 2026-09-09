import type { Router } from 'express';
import { prisma } from '../shared/infrastructure/database/postgres/prisma.client.js';
import { PrismaTranscriptRepository } from './infrastructure/prisma-transcript.repository.js';
import { PrismaRecordingReadAdapter } from './infrastructure/prisma-recording-read.adapter.js';
import { FfmpegAudioEnergyAdapter } from './infrastructure/ffmpeg-audio-energy.adapter.js';
import { PrismaAnnotationAnchoringAdapter } from './infrastructure/prisma-annotation-anchoring.adapter.js';
import { GetTranscriptHandler } from './application/use-cases/get-transcript/get-transcript.handler.js';
import { CreateTranscriptHandler } from './application/use-cases/create-transcript/create-transcript.handler.js';
import { UpdateCorrectedTranscriptHandler } from './application/use-cases/update-corrected-transcript/update-corrected-transcript.handler.js';
import { createTranscriptionRouter } from './presentation/transcription.controller.js';

export interface TranscriptionModule {
  router: Router;
  createHandler: CreateTranscriptHandler;
}

export function createTranscriptionModule(): TranscriptionModule {
  const transcripts = new PrismaTranscriptRepository(prisma);
  const recordings = new PrismaRecordingReadAdapter(prisma);
  const energy = new FfmpegAudioEnergyAdapter(prisma);
  const annotations = new PrismaAnnotationAnchoringAdapter(prisma);

  const getHandler = new GetTranscriptHandler(transcripts);
  const createHandler = new CreateTranscriptHandler(transcripts, recordings, energy);
  const updateHandler = new UpdateCorrectedTranscriptHandler(
    transcripts,
    recordings,
    energy,
    annotations,
  );

  const router = createTranscriptionRouter({ getHandler, createHandler, updateHandler });
  return { router, createHandler };
}
