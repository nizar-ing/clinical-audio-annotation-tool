import { join } from 'path';
import { env } from '../../shared/infrastructure/config/env.js';
import { readRiffChunks } from '../../shared/infrastructure/audio/riff-chunk.reader.js';
import type {
  AudioHeaderMetadata,
  AudioHeaderReaderPort,
} from '../application/ports/audio-header-reader.port.js';

export class RiffAudioHeaderReader implements AudioHeaderReaderPort {
  async read(storageKey: string, mimeType: string): Promise<AudioHeaderMetadata | null> {
    // RIFF chunks are WAV-only. MP3 and M4A carry metadata in ID3/atoms, which are out of scope here.
    if (mimeType !== 'audio/wav') return null;
    const filePath = join(env.UPLOADS_DIR, storageKey);
    return readRiffChunks(filePath);
  }
}
