export class WordErrorRateDomainService {
  static compute(reference: string, hypothesis: string): number {
    const ref = reference.trim().split(/\s+/).filter(Boolean);
    const hyp = hypothesis.trim().split(/\s+/).filter(Boolean);

    if (ref.length === 0) return hyp.length;

    const m = ref.length;
    const n = hyp.length;

    // Standard token-level Levenshtein DP table.
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
    );

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (ref[i - 1] === hyp[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    return dp[m][n] / m;
  }
}
