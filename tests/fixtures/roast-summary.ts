import type { RoastSummary } from "@/lib/types";

export function summary(username: string, repoName: string): RoastSummary {
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
