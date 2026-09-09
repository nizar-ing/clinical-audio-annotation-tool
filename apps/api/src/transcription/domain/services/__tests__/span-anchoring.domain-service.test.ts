import { describe, it, expect } from 'vitest';
import { SpanAnchoringDomainService } from '../span-anchoring.domain-service.js';
import type { AnchoredSpanInput } from '../span-anchoring.domain-service.js';

function span(id: string, start: number, end: number, anchorText: string): AnchoredSpanInput {
  return { id, startOffset: start, endOffset: end, anchorText };
}

describe('SpanAnchoringDomainService.reanchor', () => {
  it('leaves offsets untouched when the text is unchanged', () => {
    const text = 'Cefuroxim 1500 mg intravenoes';
    const spans = [span('a', 0, 9, 'Cefuroxim'), span('b', 10, 17, '1500 mg')];

    const result = SpanAnchoringDomainService.reanchor(text, spans);

    expect(result.updated).toEqual([
      { id: 'a', startOffset: 0, endOffset: 9, needsReview: false },
      { id: 'b', startOffset: 10, endOffset: 17, needsReview: false },
    ]);
    expect(result.reanchored).toBe(2);
    expect(result.flagged).toBe(0);
  });

  it('shifts offsets right when text before the anchor expands', () => {
    // Prefix "OP: " (4 chars) inserted before Cefuroxim
    const newText = 'OP: Cefuroxim 1500 mg intravenoes';
    const spans = [span('a', 0, 9, 'Cefuroxim')];

    const result = SpanAnchoringDomainService.reanchor(newText, spans);

    expect(result.updated[0]).toEqual({ id: 'a', startOffset: 4, endOffset: 13, needsReview: false });
    expect(result.reanchored).toBe(1);
  });

  it('shifts offsets left when text before the anchor shrinks', () => {
    // "Prefix " (7 chars) removed from before Cefuroxim
    const originalStart = 7;
    const newText = 'Cefuroxim 1500 mg';
    const spans = [span('a', originalStart, originalStart + 9, 'Cefuroxim')];

    const result = SpanAnchoringDomainService.reanchor(newText, spans);

    expect(result.updated[0]).toEqual({ id: 'a', startOffset: 0, endOffset: 9, needsReview: false });
  });

  it('flags the span when the anchor text is absent from the new text', () => {
    const newText = 'Prolene 6-0 fortlaufend';
    const spans = [span('a', 0, 9, 'Cefuroxim')];

    const result = SpanAnchoringDomainService.reanchor(newText, spans);

    expect(result.updated[0]).toEqual({ id: 'a', startOffset: 0, endOffset: 9, needsReview: true });
    expect(result.reanchored).toBe(0);
    expect(result.flagged).toBe(1);
  });

  it('picks the occurrence closest to the old offset when the anchor appears twice', () => {
    // "mg" appears at offset 15 and offset 35
    const newText = 'Cefuroxim 1500 mg then Prolene 100 mg';
    // Old offset was 30 → closer to 35 than to 15
    const result = SpanAnchoringDomainService.reanchor(newText, [span('a', 30, 32, 'mg')]);

    expect(result.updated[0]).toEqual({ id: 'a', startOffset: 35, endOffset: 37, needsReview: false });
  });

  it('picks the earlier occurrence when the old offset is closer to it', () => {
    const newText = 'Cefuroxim 1500 mg then Prolene 100 mg';
    // Old offset was 12 → closer to 15 than to 35
    const result = SpanAnchoringDomainService.reanchor(newText, [span('a', 12, 14, 'mg')]);

    expect(result.updated[0]).toEqual({ id: 'a', startOffset: 15, endOffset: 17, needsReview: false });
  });

  it('handles anchors at the very start and very end of the text', () => {
    const newText = 'Cefuroxim intravenoes';
    const startSpan = span('a', 0, 9, 'Cefuroxim');
    const endSpan = span('b', 10, 21, 'intravenoes');

    const result = SpanAnchoringDomainService.reanchor(newText, [startSpan, endSpan]);

    expect(result.updated[0]).toEqual({ id: 'a', startOffset: 0, endOffset: 9, needsReview: false });
    expect(result.updated[1]).toEqual({ id: 'b', startOffset: 10, endOffset: 21, needsReview: false });
  });

  it('returns an empty result for an empty span list', () => {
    const result = SpanAnchoringDomainService.reanchor('anything', []);
    expect(result.updated).toEqual([]);
    expect(result.reanchored).toBe(0);
    expect(result.flagged).toBe(0);
  });

  it('flags spans whose anchor text is empty (defensive)', () => {
    const result = SpanAnchoringDomainService.reanchor('Cefuroxim', [span('a', 0, 0, '')]);
    expect(result.updated[0]?.needsReview).toBe(true);
    expect(result.flagged).toBe(1);
  });

  it('flags every span when the new text is empty', () => {
    const spans = [span('a', 0, 9, 'Cefuroxim'), span('b', 10, 17, '1500 mg')];
    const result = SpanAnchoringDomainService.reanchor('', spans);
    expect(result.updated.every((s) => s.needsReview)).toBe(true);
    expect(result.flagged).toBe(2);
  });
});
