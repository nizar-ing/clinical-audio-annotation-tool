import { UnsupportedFormatException } from '../exceptions/unsupported-format.exception.js';

const MAGIC: Record<string, (buf: Buffer) => boolean> = {
  'audio/wav': (b) => b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WAVE',
  'audio/mpeg': (b) => b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33 // ID3
    || (b[0] === 0xff && (b[1]! & 0xe0) === 0xe0),                       // sync word
  'audio/mp4': (b) => b.slice(4, 8).toString() === 'ftyp',
};

export class AudioFormat {
  private constructor(readonly mimeType: string) {}

  static fromMagicBytes(header: Buffer): AudioFormat {
    for (const [mime, check] of Object.entries(MAGIC)) {
      if (check(header)) return new AudioFormat(mime);
    }
    throw new UnsupportedFormatException('unknown');
  }

  static fromMimeType(mime: string): AudioFormat {
    if (mime in MAGIC) return new AudioFormat(mime);
    throw new UnsupportedFormatException(mime);
  }

  get extension(): string {
    return { 'audio/wav': 'wav', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a' }[this.mimeType]!;
  }
}
