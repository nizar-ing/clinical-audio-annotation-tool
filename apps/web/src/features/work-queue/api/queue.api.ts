export type RecordingStatus =
  | 'UPLOADED'
  | 'REJECTED_TOO_SHORT'
  | 'UNPAIRED'
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'DONE';

export interface QueueItem {
  id: string;
  originalFilename: string;
  storageKey: string;
  status: RecordingStatus;
  durationSeconds: number;
  annotator: string;
  werCached: number | null;
  createdAt: string;
}

export interface ListQueueParams {
  status?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  minDuration?: number;
  maxDuration?: number;
}

export async function listQueue(
  params: ListQueueParams,
): Promise<{ data: QueueItem[]; meta: { total: number } }> {
  const qs = new URLSearchParams();
  if (params.status)      qs.set('status', params.status);
  if (params.sort)        qs.set('sort', params.sort);
  if (params.limit !== undefined)  qs.set('limit', String(params.limit));
  if (params.offset !== undefined) qs.set('offset', String(params.offset));
  if (params.minDuration !== undefined) qs.set('minDuration', String(params.minDuration));
  if (params.maxDuration !== undefined) qs.set('maxDuration', String(params.maxDuration));

  const res = await fetch(`/api/v1/queue?${qs.toString()}`);
  if (!res.ok) throw new Error(`Queue fetch failed: HTTP ${res.status}`);
  return res.json() as Promise<{ data: QueueItem[]; meta: { total: number } }>;
}

export async function updateQueueStatus(
  id: string,
  status: RecordingStatus,
): Promise<{ data: QueueItem }> {
  const res = await fetch(`/api/v1/queue/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<{ data: QueueItem }>;
}

export async function getRecording(id: string): Promise<{ data: QueueItem & {
  mimeType: string;
  sizeBytes: number;
  sampleRate: number;
  channels: number;
  bitDepth: number | null;
  headerMetadata: Record<string, unknown> | null;
} }> {
  const res = await fetch(`/api/v1/recordings/${id}`);
  if (!res.ok) throw new Error(`Recording fetch failed: HTTP ${res.status}`);
  return res.json();
}
