export interface AnchoredSpanInput {
  id: string;
  startOffset: number;
  endOffset: number;
  anchorText: string;
}

export interface AnchoredSpanOutput {
  id: string;
  startOffset: number;
  endOffset: number;
  needsReview: boolean;
}

export interface AnchoringResult {
  updated: AnchoredSpanOutput[];
  reanchored: number;
  flagged: number;
}

// Re-points spans onto edited text by locating each span's stored `anchorText`.
// Silent misplacement is not an option (gold-standard invariant); ambiguity is
// resolved by picking the occurrence nearest the span's previous offset, and
// disappearance flips `needsReview` so the annotator sees the badge.
export class SpanAnchoringDomainService {
  static reanchor(newText: string, spans: AnchoredSpanInput[]): AnchoringResult {
    const updated: AnchoredSpanOutput[] = [];
    let reanchored = 0;
    let flagged = 0;

    for (const span of spans) {
      if (span.anchorText.length === 0 || newText.length === 0) {
        updated.push({ id: span.id, startOffset: span.startOffset, endOffset: span.endOffset, needsReview: true });
        flagged++;
        continue;
      }

      const occurrences: number[] = [];
      let searchFrom = 0;
      while (true) {
        const at = newText.indexOf(span.anchorText, searchFrom);
        if (at === -1) break;
        occurrences.push(at);
        searchFrom = at + 1;
      }

      if (occurrences.length === 0) {
        updated.push({ id: span.id, startOffset: span.startOffset, endOffset: span.endOffset, needsReview: true });
        flagged++;
        continue;
      }

      const best = occurrences.reduce((chosen, candidate) =>
        Math.abs(candidate - span.startOffset) < Math.abs(chosen - span.startOffset) ? candidate : chosen,
      );
      updated.push({
        id: span.id,
        startOffset: best,
        endOffset: best + span.anchorText.length,
        needsReview: false,
      });
      reanchored++;
    }

    return { updated, reanchored, flagged };
  }
}
