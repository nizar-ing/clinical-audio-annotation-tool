export interface DecodedAudio {
  samples: Int16Array;
  sampleRate: number;
}

export interface AudioDecoderPort {
  decode(storageKey: string): Promise<DecodedAudio>;
}
