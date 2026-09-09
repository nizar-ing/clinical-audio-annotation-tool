// Token-level LCS diff between two strings, tokenising on whitespace.
// Returns a sequence of segments the two panes can render side-by-side:
//   equal       — token unchanged
//   inserted    — token present in `corrected` but not in `original`
//   deleted     — token present in `original` but not in `corrected`
//
// Small (~40 lines), zero dependencies. Good enough for a per-recording view.

export type DiffKind = 'equal' | 'inserted' | 'deleted';

export interface DiffSegment {
  kind: DiffKind;
  token: string;
}

export function tokenDiff(original: string, corrected: string): DiffSegment[] {
  const a = tokenise(original);
  const b = tokenise(corrected);

  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i]![j] = a[i - 1] === b[j - 1] ? dp[i - 1]![j - 1]! + 1 : Math.max(dp[i - 1]![j]!, dp[i]![j - 1]!);
    }
  }

  const out: DiffSegment[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      out.unshift({ kind: 'equal', token: a[i - 1]! });
      i--; j--;
    } else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) {
      out.unshift({ kind: 'deleted', token: a[i - 1]! });
      i--;
    } else {
      out.unshift({ kind: 'inserted', token: b[j - 1]! });
      j--;
    }
  }
  while (i > 0) { out.unshift({ kind: 'deleted', token: a[i - 1]! }); i--; }
  while (j > 0) { out.unshift({ kind: 'inserted', token: b[j - 1]! }); j--; }
  return out;
}

function tokenise(text: string): string[] {
  return text.trim().split(/\s+/).filter((t) => t.length > 0);
}
