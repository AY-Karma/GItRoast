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
    profileScore: 61,
    scoreBreakdown: {
      activity: 55,
      impact: 24,
      maintenance: 44,
      consistency: 38,
      presentation: 54
    },
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
      { name: repoName, url: `https://github.com/${username}/${repoName}`, description: "A focused developer tool", language: "TypeScript", stars: 72, forks: 3, openIssues: 2, defaultBranch: "main", archived: false, topics: ["developer-tools"], pushedAt: "2026-08-20T00:00:00Z" },
      { name: "weekend-lab", url: `https://github.com/${username}/weekend-lab`, description: null, language: "Rust", stars: 19, forks: 0, openIssues: 12, defaultBranch: "master", archived: false, topics: [], pushedAt: "2024-01-01T00:00:00Z" }
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
    expect(first.repositoryRoasts).toHaveLength(2);
    expect(new Set(first.repositoryRoasts.map((repo) => repo.commentary)).size).toBe(2);
    expect(first.repositoryRoasts.every((repo) => repo.commentary.includes(repo.name))).toBe(true);
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

  it("keeps profile scoring deterministic instead of accepting a model-provided number", () => {
    const input = summary("score-owner", "score-console");
    const report = normalizeReport({ roastScore: 99 }, input);

    expect(report.roastScore).toBe(input.profileScore);
  });

  it("rejects invented or person-level repository comments", () => {
    const input = summary("safe-review", "alpha-console");
    const report = normalizeReport({
      repositoryRoasts: [
        { name: "invented-repo", commentary: "invented-repo is fine" },
        { name: "alpha-console", commentary: "alpha-console proves you are an idiot" }
      ]
    }, input);

    expect(report.repositoryRoasts.map((repo) => repo.name)).toEqual(["alpha-console", "weekend-lab"]);
    expect(report.repositoryRoasts[0]?.commentary).not.toContain("idiot");
  });

  it("accepts a safe repository comment only when it cites repository evidence", () => {
    const input = summary("safe-review", "alpha-console");
    const grounded = "alpha-console uses TypeScript and has enough context to make this review inconveniently short.";
    const report = normalizeReport({
      repositoryRoasts: [
        { name: "alpha-console", commentary: grounded },
        { name: "weekend-lab", commentary: "weekend-lab exists in public." }
      ]
    }, input);

    expect(report.repositoryRoasts[0]?.commentary).toBe(grounded);
    expect(report.repositoryRoasts[1]?.commentary).not.toBe("weekend-lab exists in public.");
  });

  it("treats archived repositories as a completed lifecycle instead of a failure", () => {
    const input = summary("archive-owner", "active-console");
    input.repos[1].archived = true;

    const report = generateFallbackRoast(input);
    const archived = report.repositoryRoasts.find((repo) => repo.name === "weekend-lab");

    expect(archived?.status).toBe("approved");
    expect(archived?.commentary.toLowerCase()).toMatch(/archiv|finished|ending/);
  });
});
