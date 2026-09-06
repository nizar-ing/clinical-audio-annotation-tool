export interface AudioMetadata {
  durationSeconds: number;
  sampleRate: number;
  channels: number;
  bitDepth: number | null;
}

export interface AudioProbePort {
  probe(storagePath: string): Promise<AudioMetadata>;
}
