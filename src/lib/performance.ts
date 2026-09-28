/**
 * Performance scoring helpers.
 *
 * Pure functions with no database dependency so they can be unit tested
 * directly (PRD §77 priority: performance calculation).
 */

export type WeightedScoreInput = { score: number; criterionWeight: number };

/**
 * Weighted score per PRD §34:
 *
 *   weightedScore = sum(criterionScore / 5 * criterionWeight)
 *
 * Example: 4/5*30 + 4/5*25 + 3/5*15 + 4/5*15 + 3/5*15 = 74
 */
export function calculateWeightedScore(scores: WeightedScoreInput[]): number {
  if (scores.length === 0) return 0;

  const total = scores.reduce(
    (sum, entry) => sum + (entry.score / 5) * entry.criterionWeight,
    0,
  );

  return Math.round(total * 100) / 100;
}

/** A criterion weight is only valid for an active review configuration at 100 total. */
export function isValidActiveWeightTotal(total: number): boolean {
  return total === 100;
}
