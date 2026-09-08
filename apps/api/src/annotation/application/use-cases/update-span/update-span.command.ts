export interface UpdateSpanCommand {
  id: string;
  startOffset?: number;
  endOffset?: number;
  anchorText?: string;
  attributes?: unknown;
}
