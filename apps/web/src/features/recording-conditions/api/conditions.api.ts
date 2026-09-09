export type DistanceBucket = 'close' | 'normal' | 'far';

export interface ConditionsDto {
  recordingId: string;
  headerMetadata: Record<string, unknown> | null;
  audio: {
    mimeType: string;
    durationSeconds: number;
    sampleRate: number;
    channels: number;
    bitDepth: number | null;
  };
  derived: {
    speechRateWpm: number;
    distanceBucket: DistanceBucket;
  };
  override: {
    speechRateWpm: number | null;
    distanceBucket: DistanceBucket | null;
  };
  final: {
    speechRateWpm: number;
    distanceBucket: DistanceBucket;
  };
  distanceMethod: string;
}

async function unpack<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function getConditions(recordingId: string): Promise<{ data: ConditionsDto }> {
  const res = await fetch(`/api/v1/recordings/${recordingId}/conditions`);
  return unpack(res);
}

export async function overrideConditions(
  recordingId: string,
  patch: { speechRateWpm?: number | null; distanceBucket?: DistanceBucket | null },
): Promise<{ data: ConditionsDto }> {
  const res = await fetch(`/api/v1/recordings/${recordingId}/conditions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return unpack(res);
}
