import { describe, expect, it } from "vitest";
import { generateFallbackRoast, normalizeReport } from "@/lib/openai";
import type { RoastSummary } from "@/lib/types";

function summary(username: string, repoName: string): RoastSummary {
  return {
    username,
    displayName: username,
    avatarUrl: `https://github.com/${username}.png`,
    githubUrl: `https://github.com/${username}`,
    followers: 73,
    accountAgeYears: 6,
    repoCount: 14,
    analyzedRepoCount: 12,
    sampledCommitCount: 2,
    dataSource: "github-api",
    inactiveRepos: 8,
    totalStars: 91,
    totalForks: 11,
    languages: ["TypeScript", "Rust"],
    avgCommitLength: 18,
    descriptionCoverage: 42,
    todoDensity: 24,
    languageDiversityScore: 30,
    shippingScore: 44,
    consistencyScore: 38,
    chaosScore: 67,
    recentActivityCount: 29,
    contributions: [],
    totalContributions: 412,
    topPatterns: [`${repoName} has eight repos waiting for a sequel`],
    commitSamples: ["fix final thing again", "temporary parser cleanup"],
    commitSignals: [
      { repo: repoName, message: "fix final thing again", date: "2026-08-20T00:00:00Z" },
      { repo: "weekend-lab", message: "temporary parser cleanup", date: "2026-08-18T00:00:00Z" }
    ],
    repos: [
      { name: repoName, description: "A focused developer tool", language: "TypeScript", stars: 72, pushedAt: "2026-08-20T00:00:00Z" },
      { name: "weekend-lab", description: null, language: "Rust", stars: 19, pushedAt: "2024-01-01T00:00:00Z" }
    ]
  };
}

describe("fallback roast", () => {
  it("builds stable, evidence-specific reports instead of repeating one archetype", () => {
    const first = generateFallbackRoast(summary("alice-dev", "alpha-console"));
    const repeat = generateFallbackRoast(summary("alice-dev", "alpha-console"));
    const second = generateFallbackRoast(summary("bob-dev", "beta-engine"));

    expect(first).toEqual(repeat);
    expect(first.developerType).not.toBe(second.developerType);
    expect(first.roast).not.toBe(second.roast);
    expect(first.roast).toContain("alpha-console");
    expect(first.receipts).toHaveLength(3);
    expect(first.receipts.every((receipt) => receipt.evidence && receipt.punchline)).toBe(true);
    expect(first.redemption).toContain("alpha-console");
  });

  it("keeps the joke aimed at public work rather than the person", () => {
    const report = generateFallbackRoast(summary("alice-dev", "alpha-console"));
    const output = JSON.stringify(report).toLowerCase();

    expect(output).not.toMatch(/\b(idiot|moron|stupid|ugly|worthless|loser|incompetent)\b/);
    expect(report.strengths.length).toBeGreaterThanOrEqual(3);
    expect(report.redemption.length).toBeGreaterThan(20);
  });

  it("does not manufacture a commit-message flaw when the subject is descriptive", () => {
    const input = summary("clear-committer", "release-tool");
    input.commitSamples = ["Install the authfile atomically and reject a non-regular path"];
    input.commitSignals = [{ repo: "release-tool", message: input.commitSamples[0], date: "2026-08-20T00:00:00Z" }];

    const report = generateFallbackRoast(input);

    expect(report.commitCrimes[0]?.commentary).toMatch(/annoyingly specific|supplied context|genuinely useful/);
    expect(report.commitCrimes[0]?.status).toBe("approved");
    expect(report.weaknesses.join(" ")).toContain("annoyingly clear");
  });

  it("rejects personal attacks from an online model response", () => {
    const input = summary("safe-review", "kind-console");
    const report = normalizeReport({
      developerType: "Worthless loser",
      roast: "You are stupid and unemployable.",
      strengths: ["Solid TypeScript", "Useful project", "Clear scope"],
      weaknesses: ["You are an idiot", "Missing descriptions", "Quiet repositories"]
    }, input);
    const output = JSON.stringify(report).toLowerCase();

    expect(output).not.toMatch(/\b(idiot|stupid|worthless|loser|unemployable)\b/);
    expect(report.roast).toContain("kind-console");
  });

  it("rejects person-level judgments even when they mention a real repository", () => {
    const input = summary("safe-review", "alpha-console");
    const report = normalizeReport({
      roast: "alpha-console proves you are a disgusting fraud."
    }, input);

    expect(report.roast).not.toContain("disgusting fraud");
    expect(report.roast).toContain("alpha-console");
  });
});
