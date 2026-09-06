import { describe, it, expect } from 'vitest';
import { ValueObject } from '../value-object.js';

class Amount extends ValueObject<{ value: number; currency: string }> {
  static of(value: number, currency: string) {
    return new Amount({ value, currency });
  }

  get value() {
    return this.props.value;
  }

  get currency() {
    return this.props.currency;
  }
}

describe('ValueObject', () => {
  it('equals returns true when props match', () => {
    expect(Amount.of(10, 'EUR').equals(Amount.of(10, 'EUR'))).toBe(true);
  });

  it('equals returns false when props differ', () => {
    expect(Amount.of(10, 'EUR').equals(Amount.of(20, 'EUR'))).toBe(false);
    expect(Amount.of(10, 'EUR').equals(Amount.of(10, 'USD'))).toBe(false);
  });

  it('props are frozen after construction', () => {
    const vo = Amount.of(5, 'USD');
    expect(Object.isFrozen((vo as unknown as { props: object }).props)).toBe(true);
  });
});
