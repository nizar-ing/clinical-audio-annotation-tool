import { extname, basename } from 'path';

export class AudioFilename {
  readonly full: string;
  readonly base: string;
  readonly baseLower: string;
  readonly stem: string;
  readonly stemLower: string;

  constructor(path: string) {
    this.full = path;
    this.base = basename(path);
    this.baseLower = this.base.toLowerCase();
    this.stem = basename(path, extname(path));
    this.stemLower = this.stem.toLowerCase();
  }
}
