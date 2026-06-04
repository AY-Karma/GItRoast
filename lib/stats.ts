import type { CommitSignal, GitHubRepo, GitHubSnapshot, RoastSummary } from "@/lib/types";
import { clamp } from "@/lib/utils";
import { buildRepoFlavor } from "@/lib/roast-copy";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(date: string | null) {
  if (!date) return Number.POSITIVE_INFINITY;
  return (Date.now() - new Date(date).getTime()) / DAY_MS;
}

function unique<T>(values: T[]) {
  return Array.from(new Set(values));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function calculateInactiveRepos(repos: GitHubRepo[]) {
  return repos.filter((repo) => !repo.fork && daysSince(repo.pushed_at) > 365).length;
}

export function calculateAverageCommitLength(commits: CommitSignal[]) {
  return Math.round(average(commits.map((commit) => commit.message.length)));
}

export function calculateReadmeCoverage(repos: GitHubRepo[], readmes: GitHubSnapshot["readmes"]) {
  const originalRepos = repos.filter((repo) => !repo.fork);
  if (!originalRepos.length) return 0;
  const readmeCount = readmes.filter((readme) => readme.hasReadme).length;
  return Math.round((readmeCount / originalRepos.length) * 100);
}

export function estimateTodoDensity(repos: GitHubRepo[], commits: CommitSignal[]) {
  const haystack = [
    ...repos.map((repo) => `${repo.name} ${repo.description ?? ""}`),
    ...commits.map((commit) => commit.message)
  ].join(" ");
  const todoMentions = (haystack.match(/\b(todo|fixme|wip|later|temporary)\b/gi) ?? []).length;
  return clamp(Math.round((todoMentions / Math.max(repos.length, 1)) * 18), 0, 100);
}

export function detectPatterns(repos: GitHubRepo[], commits: CommitSignal[]) {
  const patterns: string[] = [];
  const inactive = calculateInactiveRepos(repos);
  const shortCommits = commits.filter((commit) => commit.message.length <= 12).length;
  const finals = commits.filter((commit) => /final|again|really|please|fix/i.test(commit.message)).length;
  const noDescription = repos.filter((repo) => !repo.fork && !repo.description).length;
  const singleLanguage = unique(repos.map((repo) => repo.language).filter(Boolean)).length <= 1;
  const flavor = buildRepoFlavor({
    username: "profile",
    displayName: null,
    avatarUrl: "",
    githubUrl: "",
    repoCount: repos.length,
    inactiveRepos: inactive,
    totalStars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0),
    totalForks: repos.reduce((sum, repo) => sum + repo.forks_count, 0),
    languages: unique(repos.map((repo) => repo.language).filter(Boolean) as string[]),
    avgCommitLength: Math.round(average(commits.map((commit) => commit.message.length))),
    readmeCoverage: 0,
    todoDensity: 0,
    languageDiversityScore: 0,
    shippingScore: 0,
    consistencyScore: 0,
    chaosScore: 0,
    recentActivityCount: commits.filter((commit) => daysSince(commit.date) <= 90).length,
    topPatterns: [],
    commitSamples: commits.map((commit) => commit.message).slice(0, 12),
    repos: repos.slice(0, 20).map((repo) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      pushedAt: repo.pushed_at
    }))
  });

  if (inactive > 3) patterns.push(`${flavor.primaryRepo} has enough silence to qualify as a side quest that went on sabbatical`);
  if (shortCommits > 3) patterns.push(`Commit messages are shorter than the repo names, which is a bold editorial choice`);
  if (finals > 1) patterns.push(`"${flavor.secondaryRepo}" appears to have multiple endings and none of them were archived`);
  if (noDescription > 4) patterns.push("Several repos are improvising their own documentation, which is both brave and unwise");
  if (singleLanguage && repos.length > 4) patterns.push(`The ${flavor.languageBlend} era seems to have lasted longer than the planning meeting`);
  if (!patterns.length) patterns.push(`${flavor.primaryRepo} is suspiciously coherent, which is its own plot twist`);

  return patterns.slice(0, 5);
}

export function buildRoastSummary(snapshot: GitHubSnapshot): RoastSummary {
  const repos = snapshot.repos.filter((repo) => !repo.fork);
  const languages = unique(repos.map((repo) => repo.language).filter(Boolean) as string[]);
  const inactiveRepos = calculateInactiveRepos(repos);
  const readmeCoverage = calculateReadmeCoverage(repos, snapshot.readmes);
  const avgCommitLength = calculateAverageCommitLength(snapshot.commits);
  const todoDensity = estimateTodoDensity(repos, snapshot.commits);
  const recentActivityCount = snapshot.commits.filter((commit) => daysSince(commit.date) <= 90).length;
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const shippingScore = clamp(Math.round(100 - (inactiveRepos / Math.max(repos.length, 1)) * 100), 8, 98);
  const consistencyScore = clamp(Math.round((recentActivityCount / Math.max(snapshot.commits.length, 1)) * 100), 8, 96);
  const languageDiversityScore = clamp(Math.round((languages.length / Math.max(repos.length, 1)) * 180), 10, 95);
  const chaosScore = clamp(
    Math.round(100 - (readmeCoverage * 0.28 + shippingScore * 0.34 + consistencyScore * 0.22) + todoDensity * 0.42),
    6,
    99
  );

  return {
    username: snapshot.profile.login,
    displayName: snapshot.profile.name,
    avatarUrl: snapshot.profile.avatar_url,
    githubUrl: snapshot.profile.html_url,
    repoCount: snapshot.profile.public_repos,
    inactiveRepos,
    totalStars,
    totalForks,
    languages,
    avgCommitLength,
    readmeCoverage,
    todoDensity,
    languageDiversityScore,
    shippingScore,
    consistencyScore,
    chaosScore,
    recentActivityCount,
    topPatterns: detectPatterns(repos, snapshot.commits),
    commitSamples: snapshot.commits.map((commit) => commit.message).slice(0, 12),
    repos: repos.slice(0, 20).map((repo) => ({
      name: repo.name,
      description: repo.description,
      language: repo.language,
      stars: repo.stargazers_count,
      pushedAt: repo.pushed_at
    }))
  };
}
