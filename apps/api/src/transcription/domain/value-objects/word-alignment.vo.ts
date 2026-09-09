export interface WordAlignment {
  w: string;
  start: number;
  end: number;
}

export type AlignmentMethod = 'proportional' | 'energy-gated' | 'external' | 'none';
