import { describe, it, expect } from 'vitest';
import { Entity } from '../entity.js';

class ConcreteEntity extends Entity<string> {}

describe('Entity', () => {
  it('exposes its id', () => {
    const e = new ConcreteEntity('abc');
    expect(e.id).toBe('abc');
  });

  it('equals returns true when ids match', () => {
    const a = new ConcreteEntity('id-1');
    const b = new ConcreteEntity('id-1');
    expect(a.equals(b)).toBe(true);
  });

  it('equals returns false when ids differ', () => {
    const a = new ConcreteEntity('id-1');
    const b = new ConcreteEntity('id-2');
    expect(a.equals(b)).toBe(false);
  });
});
