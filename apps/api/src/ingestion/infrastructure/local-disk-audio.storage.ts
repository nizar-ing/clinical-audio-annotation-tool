import { mkdirSync } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { env } from '../../shared/infrastructure/config/env.js';
import type { AudioStoragePort } from '../application/ports/audio-storage.port.js';

export class LocalDiskAudioStorage implements AudioStoragePort {
  private readonly uploadsDir: string;

  constructor() {
    this.uploadsDir = env.UPLOADS_DIR;
    mkdirSync(this.uploadsDir, { recursive: true });
  }

  async put(filename: string, data: Buffer): Promise<string> {
    await writeFile(join(this.uploadsDir, filename), data);
    return filename;
  }

  getPath(storageKey: string): string {
    return join(this.uploadsDir, storageKey);
  }

  async delete(storageKey: string): Promise<void> {
    await unlink(join(this.uploadsDir, storageKey));
  }
}
