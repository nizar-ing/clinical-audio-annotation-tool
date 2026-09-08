import { describe, it, expect } from 'vitest';
import { SpanAttributesSchema } from '../index.js';

describe('contracts', () => {
  it('SpanAttributesSchema validates a MEASUREMENT span', () => {
    const result = SpanAttributesSchema.safeParse({
      spanType: 'MEASUREMENT',
      value: 1500,
      unit: 'mg',
    });
    expect(result.success).toBe(true);
  });

  it('SpanAttributesSchema rejects an unknown spanType', () => {
    const result = SpanAttributesSchema.safeParse({
      spanType: 'UNKNOWN',
      value: 1,
    });
    expect(result.success).toBe(false);
  });

  it('SpanAttributesSchema validates all six span types', () => {
    const cases = [
      { spanType: 'MEDICAL_TERM', category: 'drug' },
      { spanType: 'MEASUREMENT', value: 500, unit: 'ml' },
      { spanType: 'NUMBER', rendering: 'words', normalized: '6/0' },
      { spanType: 'FORMATTING_COMMAND', command: 'newline', literal: false },
      { spanType: 'NAMED_ENTITY', entityType: 'person' },
      { spanType: 'SPELLED_OUT', resolvedWord: 'Cefuroxim' },
    ];
    for (const input of cases) {
      expect(SpanAttributesSchema.safeParse(input).success).toBe(true);
    }
  });
});
