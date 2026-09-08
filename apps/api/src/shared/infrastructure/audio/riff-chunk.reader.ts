import { readFile } from 'fs/promises';

export interface ListInfoTags {
  [tag: string]: string;
}

export interface BroadcastExtension {
  description?: string;
  originator?: string;
  originatorReference?: string;
  originationDate?: string;
  originationTime?: string;
}

export interface RiffMetadata {
  listInfo?: ListInfoTags;
  bext?: BroadcastExtension;
}

// Reads the LIST/INFO tags (INAM, ISFT, ICMT, IART, ICRD…) and the bext chunk (EBU R98 broadcast extension)
// from a WAV file. Returns null for non-WAV or malformed inputs — parsing metadata is best-effort and must
// never break the analysis pipeline.
export async function readRiffChunks(filePath: string): Promise<RiffMetadata | null> {
  let buf: Buffer;
  try {
    buf = await readFile(filePath);
  } catch {
    return null;
  }
  if (buf.length < 12) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buf.toString('ascii', 8, 12) !== 'WAVE') return null;

  const result: RiffMetadata = {};

  // Walk the top-level chunks starting after the 'WAVE' identifier.
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const chunkId = buf.toString('ascii', offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    const bodyStart = offset + 8;
    const bodyEnd = bodyStart + chunkSize;
    if (bodyEnd > buf.length) break;

    if (chunkId === 'LIST') {
      const listType = buf.toString('ascii', bodyStart, bodyStart + 4);
      if (listType === 'INFO') result.listInfo = parseInfoTags(buf, bodyStart + 4, bodyEnd);
    } else if (chunkId === 'bext') {
      result.bext = parseBextChunk(buf, bodyStart, bodyEnd);
    }

    // RIFF chunks are word-aligned: pad by 1 byte when size is odd.
    offset = bodyEnd + (chunkSize % 2);
  }

  return Object.keys(result).length === 0 ? null : result;
}

function parseInfoTags(buf: Buffer, start: number, end: number): ListInfoTags {
  const tags: ListInfoTags = {};
  let p = start;
  while (p + 8 <= end) {
    const id = buf.toString('ascii', p, p + 4);
    const size = buf.readUInt32LE(p + 4);
    const bodyStart = p + 8;
    const bodyEnd = bodyStart + size;
    if (bodyEnd > end) break;
    // Values are null-terminated ASCII/UTF-8 strings.
    const raw = buf.toString('utf8', bodyStart, bodyEnd);
    tags[id] = raw.replace(/\0+$/, '').trim();
    p = bodyEnd + (size % 2);
  }
  return tags;
}

function parseBextChunk(buf: Buffer, start: number, end: number): BroadcastExtension {
  // EBU R98 layout: 256B Description, 32B Originator, 32B OriginatorReference, 10B Date, 8B Time…
  const description = cleanString(buf.toString('utf8', start, Math.min(start + 256, end)));
  const originator = cleanString(buf.toString('utf8', start + 256, Math.min(start + 288, end)));
  const originatorReference = cleanString(buf.toString('utf8', start + 288, Math.min(start + 320, end)));
  const originationDate = cleanString(buf.toString('ascii', start + 320, Math.min(start + 330, end)));
  const originationTime = cleanString(buf.toString('ascii', start + 330, Math.min(start + 338, end)));

  const bext: BroadcastExtension = {};
  if (description) bext.description = description;
  if (originator) bext.originator = originator;
  if (originatorReference) bext.originatorReference = originatorReference;
  if (originationDate) bext.originationDate = originationDate;
  if (originationTime) bext.originationTime = originationTime;
  return bext;
}

function cleanString(s: string): string {
  return s.replace(/\0+.*$/, '').trim();
}
