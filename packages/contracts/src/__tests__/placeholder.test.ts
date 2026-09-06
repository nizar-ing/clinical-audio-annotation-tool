import { describe, it, expect } from 'vitest';
import { _placeholder } from '../index.js';

describe('contracts', () => {
  it('exports the placeholder export', () => {
    expect(_placeholder).toBe(true);
  });
});
