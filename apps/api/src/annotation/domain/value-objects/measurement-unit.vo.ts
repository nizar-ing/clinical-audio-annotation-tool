export type Unit = 'g' | 'mg' | 'ug' | 'kg' | 'ml' | 'l' | 'mm' | 'cm' | 'Ch' | 'mmHg' | 'IE';

export interface NormalizationResult {
  value: number;
  unit: string;
}

// mmHg and IE are intentionally absent — see DESIGN.md §4 and CLAUDE.md §5 — they must never be converted (see CLAUDE.md §5 and DESIGN.md §4).
const CONVERSIONS: Partial<Record<Unit, (v: number) => NormalizationResult>> = {
  g:  (v) => ({ value: v, unit: 'g' }),
  mg: (v) => ({ value: v / 1_000, unit: 'g' }),
  ug: (v) => ({ value: v / 1_000_000, unit: 'g' }),
  kg: (v) => ({ value: v * 1_000, unit: 'g' }),
  ml: (v) => ({ value: v, unit: 'ml' }),
  l:  (v) => ({ value: v * 1_000, unit: 'ml' }),
  mm: (v) => ({ value: v, unit: 'mm' }),
  cm: (v) => ({ value: v * 10, unit: 'mm' }),
  Ch: (v) => ({ value: v / 3, unit: 'mm' }),
};

export function normalizeUnit(value: number, unit: Unit): NormalizationResult | null {
  const convert = CONVERSIONS[unit];
  return convert ? convert(value) : null;
}
