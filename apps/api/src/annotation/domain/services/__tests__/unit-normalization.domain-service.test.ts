import { describe, it, expect } from 'vitest';
import { UnitNormalizationDomainService } from '../unit-normalization.domain-service.js';

describe('UnitNormalizationDomainService.normalize', () => {
  it.each([
    ['g',   500,       { value: 500,     unit: 'g'  }],
    ['mg',  1500,      { value: 1.5,     unit: 'g'  }],
    ['ug',  500_000,   { value: 0.5,     unit: 'g'  }],
    ['kg',  2,         { value: 2_000,   unit: 'g'  }],
    ['ml',  250,       { value: 250,     unit: 'ml' }],
    ['l',   1.5,       { value: 1_500,   unit: 'ml' }],
    ['mm',  10,        { value: 10,      unit: 'mm' }],
    ['cm',  5,         { value: 50,      unit: 'mm' }],
    ['Ch',  12,        { value: 4,       unit: 'mm' }],
  ] as const)('converts %s correctly', (unit, value, expected) => {
    const result = UnitNormalizationDomainService.normalize(value, unit);
    expect(result).not.toBeNull();
    expect(result!.value).toBeCloseTo(expected.value, 10);
    expect(result!.unit).toBe(expected.unit);
  });

  it('does not convert mmHg — no other pressure unit is in scope', () => {
    expect(UnitNormalizationDomainService.normalize(120, 'mmHg')).toBeNull();
  });

  it('does not convert IE — substance-specific potency has no fixed mass equivalent', () => {
    expect(UnitNormalizationDomainService.normalize(5000, 'IE')).toBeNull();
  });

  it('normalises the worked example: 1500 mg → 1.5 g', () => {
    const result = UnitNormalizationDomainService.normalize(1500, 'mg');
    expect(result).toEqual({ value: 1.5, unit: 'g' });
  });
});
