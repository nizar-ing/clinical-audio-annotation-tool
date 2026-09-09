export interface SpeechRegion {
  start: number;
  end: number;
}

export interface AudioEnergyPort {
  // Returns the speech regions detected in the recording's audio. May return
  // an empty array when the analysis fails or the audio is unreadable — callers
  // fall back to proportional alignment in that case.
  getSpeechRegions(recordingId: string): Promise<SpeechRegion[]>;
}
