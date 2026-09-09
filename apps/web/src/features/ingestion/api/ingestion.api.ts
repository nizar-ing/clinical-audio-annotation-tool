export interface UploadResult {
  id: string;
  originalFilename: string;
  status: string;
  durationSeconds: number;
  error?: string;
}

export interface ImportResult {
  matched: { recordingId: string; importRowId: string; path: string }[];
  unmatchedAudio: { recordingId: string; originalFilename: string }[];
  unmatchedRows: { importRowId: string; path: string }[];
  errors: { index: number; path?: string; reason: string }[];
}

export interface UnpairedRecording {
  id: string;
  originalFilename: string;
  status: string;
  durationSeconds: number;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface UnmatchedRow {
  id: string;
  path: string;
  label: string;
  matchedRecordingId: null;
  errorCode: string | null;
}

export async function uploadAudio(files: File[]): Promise<UploadResult[]> {
  const formData = new FormData();
  for (const f of files) formData.append('files', f);
  const res = await fetch('/api/v1/recordings', { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);
  const body = await res.json() as { data: UploadResult[] };
  return body.data;
}

export async function importTranscripts(json: string): Promise<ImportResult> {
  const parsed = JSON.parse(json) as unknown;
  const res = await fetch('/api/v1/import-rows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed),
  });
  if (!res.ok) throw new Error(`Import failed: HTTP ${res.status}`);
  const body = await res.json() as { data: ImportResult };
  return body.data;
}

export async function listUnpaired(): Promise<{ recordings: UnpairedRecording[]; rows: UnmatchedRow[] }> {
  const [uploadedRes, unpairedRes, rowRes] = await Promise.all([
    fetch('/api/v1/recordings?status=UPLOADED'),
    fetch('/api/v1/recordings?status=UNPAIRED'),
    fetch('/api/v1/import-rows?matched=false'),
  ]);
  if (!uploadedRes.ok) throw new Error(`Fetch failed: HTTP ${uploadedRes.status}`);
  if (!unpairedRes.ok) throw new Error(`Fetch failed: HTTP ${unpairedRes.status}`);
  if (!rowRes.ok) throw new Error(`Fetch failed: HTTP ${rowRes.status}`);
  const uploadedBody = await uploadedRes.json() as { data: UnpairedRecording[] };
  const unpairedBody = await unpairedRes.json() as { data: UnpairedRecording[] };
  const rowBody = await rowRes.json() as { data: UnmatchedRow[] };
  return {
    recordings: [...uploadedBody.data, ...unpairedBody.data],
    rows: rowBody.data,
  };
}

export async function pairRow(rowId: string, recordingId: string): Promise<void> {
  const res = await fetch(`/api/v1/import-rows/${rowId}/pairing`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recordingId }),
  });
  if (!res.ok) throw new Error(`Pairing failed: HTTP ${res.status}`);
}

export async function unpairRow(rowId: string): Promise<void> {
  const res = await fetch(`/api/v1/import-rows/${rowId}/pairing`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Unpairing failed: HTTP ${res.status}`);
}
