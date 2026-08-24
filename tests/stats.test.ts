import { describe, expect, it } from "vitest";
import { calculateProfileScore, type ProfileScoreInput } from "@/lib/stats";

const baseline: ProfileScoreInput = {
  recentActivityCount: 20,
  totalContributions: 120,
  sampledCommitCount: 4,
  totalStars: 10,
  totalForks: 2,
  followers: 20,
  shippingScore: 50,
  consistencyScore: 25,
  descriptionCoverage: 50,
  descriptiveCommitRatio: 0.5
};

describe("profile scoring", () => {
  it("rewards sustained activity and public impact", () => {
    const quiet = calculateProfileScore({
      ...baseline,
      recentActivityCount: 0,
      totalContributions: 0,
      sampledCommitCount: 0,
      totalStars: 0,
      totalForks: 0,
      followers: 0,
      shippingScore: 10,
      consistencyScore: 0,
      descriptionCoverage: 20,
      descriptiveCommitRatio: 0
    });
    const active = calculateProfileScore({
      ...baseline,
      recentActivityCount: 450,
      totalContributions: 3_000,
      sampledCommitCount: 12,
      totalStars: 10_000,
      totalForks: 2_000,
      followers: 20_000,
      shippingScore: 95,
      consistencyScore: 90,
      descriptionCoverage: 90,
      descriptiveCommitRatio: 0.9
    });

    expect(quiet.score).toBeLessThan(20);
    expect(active.score).toBeGreaterThanOrEqual(90);
    expect(active.score).toBeGreaterThan(quiet.score);
  });

  it("raises the score independently for more activity and more stars", () => {
    const original = calculateProfileScore(baseline);
    const moreActive = calculateProfileScore({
      ...baseline,
      recentActivityCount: 200,
      totalContributions: 900,
      sampledCommitCount: 12,
      consistencyScore: 70
    });
    const moreStars = calculateProfileScore({ ...baseline, totalStars: 2_000 });

    expect(moreActive.score).toBeGreaterThan(original.score);
    expect(moreStars.score).toBeGreaterThan(original.score);
  });

  it("is deterministic and bounded", () => {
    expect(calculateProfileScore(baseline)).toEqual(calculateProfileScore(baseline));
    expect(calculateProfileScore({ ...baseline, recentActivityCount: Number.MAX_SAFE_INTEGER }).score).toBeLessThanOrEqual(100);
  });
});
