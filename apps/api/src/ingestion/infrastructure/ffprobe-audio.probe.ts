import { execFile } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import ffprobeStatic from 'ffprobe-static';

// ffprobe-static@3.x exports { path } rather than a bare string.
const ffprobePath = ffprobeStatic.path;
import { env } from '../../shared/infrastructure/config/env.js';
import type { AudioMetadata, AudioProbePort } from '../application/ports/audio-probe.port.js';

const execFileAsync = promisify(execFile);

interface FfprobeStream {
  codec_type: string;
  sample_rate?: string;
  channels?: number;
  bits_per_raw_sample?: string;
  duration?: string;
}

interface FfprobeOutput {
  streams?: FfprobeStream[];
  format?: { duration?: string };
}

export class FfprobeAudioProbe implements AudioProbePort {
  async probe(storageKey: string): Promise<AudioMetadata> {
    const filePath = join(env.UPLOADS_DIR, storageKey);

    const { stdout } = await execFileAsync(ffprobePath, [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_streams',
      '-show_format',
      filePath,
    ]);

    const data = JSON.parse(stdout) as FfprobeOutput;
    const audio = data.streams?.find((s) => s.codec_type === 'audio');

    const durationSeconds = Number(data.format?.duration ?? audio?.duration ?? 0);
    const sampleRate = Number(audio?.sample_rate ?? 0);
    const channels = Number(audio?.channels ?? 1);
    const bitDepth = audio?.bits_per_raw_sample != null ? Number(audio.bits_per_raw_sample) : null;

    return { durationSeconds, sampleRate, channels, bitDepth };
  }
}
