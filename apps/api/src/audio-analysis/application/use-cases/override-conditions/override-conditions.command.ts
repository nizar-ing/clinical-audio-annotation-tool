export interface OverrideConditionsCommand {
  recordingId: string;
  // `undefined` means "leave unchanged"; explicit `null` clears an existing override.
  speechRateWpm?: number | null;
  distanceBucket?: 'close' | 'normal' | 'far' | null;
}
