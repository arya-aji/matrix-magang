import { describe, expect, it } from "vitest";

import { calculateWeightedScore, isValidActiveWeightTotal } from "@/lib/performance";

describe("calculateWeightedScore (PRD §34)", () => {
  const criteria = [
    { score: 4, criterionWeight: 30 },
    { score: 4, criterionWeight: 25 },
    { score: 3, criterionWeight: 15 },
    { score: 4, criterionWeight: 15 },
    { score: 3, criterionWeight: 15 },
  ];

  it("matches the documented example (74 / 100)", () => {
    expect(calculateWeightedScore(criteria)).toBe(74);
  });

  it("returns 100 for a perfect score", () => {
    expect(
      calculateWeightedScore([
        { score: 5, criterionWeight: 30 },
        { score: 5, criterionWeight: 70 },
      ]),
    ).toBe(100);
  });

  it("returns 0 when there are no scores", () => {
    expect(calculateWeightedScore([])).toBe(0);
  });

  it("rounds to two decimals", () => {
    expect(calculateWeightedScore([{ score: 4, criterionWeight: 33 }])).toBe(26.4);
    expect(calculateWeightedScore([{ score: 1, criterionWeight: 33 }])).toBe(6.6);
  });
});

describe("isValidActiveWeightTotal", () => {
  it("only accepts exactly 100", () => {
    expect(isValidActiveWeightTotal(100)).toBe(true);
    expect(isValidActiveWeightTotal(99)).toBe(false);
    expect(isValidActiveWeightTotal(105)).toBe(false);
  });
});
