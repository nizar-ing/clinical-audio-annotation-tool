-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('UPLOADED', 'REJECTED_TOO_SHORT', 'UNPAIRED', 'QUEUED', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "SpanType" AS ENUM ('MEDICAL_TERM', 'MEASUREMENT', 'NUMBER', 'FORMATTING_COMMAND', 'NAMED_ENTITY', 'SPELLED_OUT');

-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "durationSeconds" DOUBLE PRECISION NOT NULL,
    "sampleRate" INTEGER NOT NULL,
    "channels" INTEGER NOT NULL,
    "bitDepth" INTEGER,
    "headerMetadata" JSONB,
    "status" "RecordingStatus" NOT NULL DEFAULT 'UPLOADED',
    "annotator" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "originalText" TEXT NOT NULL,
    "correctedText" TEXT NOT NULL,
    "wordTimings" JSONB,
    "alignmentMethod" TEXT NOT NULL DEFAULT 'none',
    "werCached" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnotationSpan" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "spanType" "SpanType" NOT NULL,
    "startOffset" INTEGER NOT NULL,
    "endOffset" INTEGER NOT NULL,
    "anchorText" TEXT NOT NULL,
    "attributes" JSONB NOT NULL,
    "needsReview" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnotationSpan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecordingConditions" (
    "id" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "derivedSpeechRateWpm" DOUBLE PRECISION NOT NULL,
    "overrideSpeechRateWpm" DOUBLE PRECISION,
    "derivedDistanceBucket" TEXT NOT NULL,
    "overrideDistanceBucket" TEXT,
    "distanceMethod" TEXT NOT NULL,

    CONSTRAINT "RecordingConditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportRow" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "matchedRecordingId" TEXT,
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_recordingId_key" ON "Transcript"("recordingId");

-- CreateIndex
CREATE UNIQUE INDEX "RecordingConditions_recordingId_key" ON "RecordingConditions"("recordingId");

-- CreateIndex
CREATE UNIQUE INDEX "ImportRow_matchedRecordingId_key" ON "ImportRow"("matchedRecordingId");

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "Recording"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnotationSpan" ADD CONSTRAINT "AnnotationSpan_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "Transcript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecordingConditions" ADD CONSTRAINT "RecordingConditions_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "Recording"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_matchedRecordingId_fkey" FOREIGN KEY ("matchedRecordingId") REFERENCES "Recording"("id") ON DELETE SET NULL ON UPDATE CASCADE;
