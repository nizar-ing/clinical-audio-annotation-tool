import { execFile } from 'child_process';
import { promisify } from 'util';
import ffmpegPath from 'ffmpeg-static';

const execFileAsync = promisify(execFile);

export const TARGET_SAMPLE_RATE = 16_000;

export interface DecodedPcm {
  samples: Int16Array;
  sampleRate: number;
}

// Decodes any ffmpeg-readable input into 16 kHz mono s16le PCM. See IMPLEMENTATION_PLAN §7.3:
// one decode powers both the distance estimate (phase 3) and the future word-alignment service (phase 6).
export async function decodePcm(filePath: string): Promise<DecodedPcm> {
  if (!ffmpegPath) {
    throw new Error('ffmpeg-static did not resolve a binary path; PCM decoding is unavailable');
  }

  // Large buffer to fit ~5 minutes at 16 kHz mono s16le (~9.6 MB). Fixtures are 40 s at most.
  const { stdout } = await execFileAsync(
    ffmpegPath,
    ['-i', filePath, '-f', 's16le', '-ac', '1', '-ar', String(TARGET_SAMPLE_RATE), '-'],
    { encoding: 'buffer', maxBuffer: 32 * 1024 * 1024 },
  );

  // Ensure length is a multiple of 2 (Int16 is 2 bytes) before viewing.
  const alignedLength = stdout.length - (stdout.length % 2);
  const samples = new Int16Array(stdout.buffer, stdout.byteOffset, alignedLength / 2);
  return { samples: new Int16Array(samples), sampleRate: TARGET_SAMPLE_RATE };
}
