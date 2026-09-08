export interface CreateSpanCommand {
  recordingId: string;
  spanType: string;
  startOffset: number;
  endOffset: number;
  anchorText: string;
  attributes: unknown;
}
