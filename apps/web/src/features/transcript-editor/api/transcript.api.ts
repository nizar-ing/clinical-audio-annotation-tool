export interface WordTiming {
  w: string;
  start: number;
  end: number;
}

export type AlignmentMethod = 'proportional' | 'energy-gated' | 'external' | 'none';

export interface TranscriptDto {
  id: string;
  recordingId: string;
  originalText: string;
  correctedText: string;
  wordTimings: WordTiming[] | null;
  alignmentMethod: AlignmentMethod;
  werCached: number;
  updatedAt: string;
}

export interface ReanchorReport {
  updated: number;
  flagged: number;
}

async function unpack<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function getTranscript(recordingId: string): Promise<{ data: TranscriptDto }> {
  const res = await fetch(`/api/v1/recordings/${recordingId}/transcript`);
  return unpack(res);
}

export async function updateCorrected(
  recordingId: string,
  correctedText: string,
): Promise<{ data: TranscriptDto; meta: { reanchor: ReanchorReport } }> {
  const res = await fetch(`/api/v1/recordings/${recordingId}/transcript/corrected`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correctedText }),
  });
  return unpack(res);
}
