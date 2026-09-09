import type { SpanAttributes } from 'contracts';

export type SpanType =
  | 'MEDICAL_TERM'
  | 'MEASUREMENT'
  | 'NUMBER'
  | 'FORMATTING_COMMAND'
  | 'NAMED_ENTITY'
  | 'SPELLED_OUT';

export interface SpanDto {
  id: string;
  transcriptId: string;
  spanType: SpanType;
  startOffset: number;
  endOffset: number;
  anchorText: string;
  attributes: SpanAttributes;
  needsReview: boolean;
  createdAt: string;
}

export interface CreateSpanInput {
  spanType: SpanType;
  startOffset: number;
  endOffset: number;
  anchorText: string;
  attributes: SpanAttributes;
}

async function unpack<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function listSpans(recordingId: string): Promise<{ data: SpanDto[]; meta: { total: number } }> {
  const res = await fetch(`/api/v1/recordings/${recordingId}/annotations`);
  return unpack(res);
}

export async function createSpan(
  recordingId: string,
  input: CreateSpanInput,
): Promise<{ data: SpanDto }> {
  const res = await fetch(`/api/v1/recordings/${recordingId}/annotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return unpack(res);
}

export async function updateSpan(
  id: string,
  patch: Partial<Pick<CreateSpanInput, 'startOffset' | 'endOffset' | 'anchorText' | 'attributes'>>,
): Promise<{ data: SpanDto }> {
  const res = await fetch(`/api/v1/annotations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  return unpack(res);
}

export async function deleteSpan(id: string): Promise<void> {
  const res = await fetch(`/api/v1/annotations/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(body.error?.message ?? `HTTP ${res.status}`);
  }
}
