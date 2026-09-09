import type {
  AssemblerRecording,
  AssemblerTranscript,
  AssemblerConditions,
  AssemblerSpan,
} from '../../domain/services/gold-standard.assembler.js';

export interface ExportRow {
  recording: AssemblerRecording;
  transcript: AssemblerTranscript;
  conditions: AssemblerConditions;
  spans: AssemblerSpan[];
}

export interface ExportReadPort {
  streamCompleted(): AsyncIterable<ExportRow>;
}
