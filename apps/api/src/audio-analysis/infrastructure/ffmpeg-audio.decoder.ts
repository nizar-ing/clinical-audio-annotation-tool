import { join } from 'path';
import { env } from '../../shared/infrastructure/config/env.js';
import { decodePcm } from '../../shared/infrastructure/audio/pcm-decoder.js';
import type { AudioDecoderPort, DecodedAudio } from '../application/ports/audio-decoder.port.js';

export class FfmpegAudioDecoder implements AudioDecoderPort {
  async decode(storageKey: string): Promise<DecodedAudio> {
    const filePath = join(env.UPLOADS_DIR, storageKey);
    return decodePcm(filePath);
  }
}
