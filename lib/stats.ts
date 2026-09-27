import type { CommitSignal, GitHubRepo, GitHubSnapshot, RoastSummary } from "@/lib/types";
import { clamp } from "@/lib/utils";
import { curateRepositories } from "@/lib/repo-curation";

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

export type ProfileScoreInput = {
  recentActivityCount: number;
  totalContributions: number;
  sampledCommitCount: number;
  totalStars: number;
  totalForks: number;
  followers: number;
  shippingScore: number;
  consistencyScore: number;
  descriptionCoverage: number;
  descriptiveCommitRatio: number;
};

function rootScale(value: number, target: number) {
  return clamp(Math.round(Math.sqrt(clamp(value / target, 0, 1)) * 100), 0, 100);
}

export function calculateProfileScore(input: ProfileScoreInput) {
  const activity = Math.round(
    rootScale(input.recentActivityCount, 300) * 0.5
      + rootScale(input.totalContributions, 1_500) * 0.35
      + rootScale(input.sampledCommitCount, 12) * 0.15
  );
  const impact = Math.round(
    rootScale(input.totalStars, 5_000) * 0.75
      + rootScale(input.totalForks, 1_000) * 0.15
      + rootScale(input.followers, 10_000) * 0.1
  );
  const maintenance = clamp(Math.round(input.shippingScore), 0, 100);
  const consistency = clamp(Math.round(input.consistencyScore), 0, 100);
  const presentation = Math.round(
    clamp(input.descriptionCoverage, 0, 100) * 0.75
      + clamp(input.descriptiveCommitRatio, 0, 1) * 100 * 0.25
  );
  const score = clamp(Math.round(
    activity * 0.45
      + impact * 0.25
      + maintenance * 0.1
      + consistency * 0.12
      + presentation * 0.08
  ), 1, 100);

  return {
    score,
    breakdown: { activity, impact, maintenance, consistency, presentation }
  };
}

export function calculateInactiveRepos(repos: GitHubRepo[]) {
  return repos.filter((repo) => !repo.fork && !repo.archived && repo.pushed_at && Number.isFinite(new Date(repo.pushed_at).getTime()) && daysSince(repo.pushed_at) > 365).length;
}

export function calculateAverageCommitLength(commits: CommitSignal[]) {
  return Math.round(average(commits.map((commit) => commit.message.length)));
}

export function calculateDescriptionCoverage(repos: GitHubRepo[]) {
  const originalRepos = repos.filter((repo) => !repo.fork);
  if (!originalRepos.length) return 0;
  const describedRepos = originalRepos.filter((repo) => Boolean(repo.description?.trim())).length;
  return Math.round((describedRepos / originalRepos.length) * 100);
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
  const finals = commits.filter((commit) => /\b(final|again|really|please)\b/i.test(commit.message)).length;
  const noDescription = repos.filter((repo) => !repo.fork && !repo.description).length;
  const singleLanguage = unique(repos.map((repo) => repo.language).filter(Boolean)).length <= 1;
  const languageBlend = unique(repos.map((repo) => repo.language).filter(Boolean) as string[]).slice(0, 3).join(" + ");

  if (inactive > 3) patterns.push(`${inactive} sampled, unarchived originals have no public push in over a year`);
  if (shortCommits > 3) patterns.push(`${shortCommits} sampled public commit subjects are 12 characters or shorter`);
  if (finals > 1) patterns.push(`${finals} sampled commit subjects contain final, again, really, or please`);
  if (noDescription > 4) patterns.push(`${noDescription} sampled original repositories have no repository description`);
  if (singleLanguage && repos.length > 4 && languageBlend) patterns.push(`The sampled repositories use ${languageBlend} as their only identified language`);

  return patterns.slice(0, 5);
}

export function buildRoastSummary(snapshot: GitHubSnapshot): RoastSummary {
  const repos = snapshot.repos.filter((repo) => !repo.fork);
  const curated = curateRepositories(repos);
  const languages = unique(repos.map((repo) => repo.language).filter(Boolean) as string[]);
  const inactiveRepos = calculateInactiveRepos(repos);
  const descriptionCoverage = calculateDescriptionCoverage(repos);
  const commitSignals = snapshot.commits;
  const avgCommitLength = calculateAverageCommitLength(commitSignals);
  const todoDensity = estimateTodoDensity(repos, commitSignals);
  const recentContributionDays = snapshot.contributions.filter((day) => daysSince(day.date) <= 90);
  const recentActivityCount = recentContributionDays.reduce((sum, day) => sum + day.count, 0);
  const activeRecentDays = recentContributionDays.filter((day) => day.count > 0).length;
  const totalContributions = snapshot.contributions.reduce((sum, day) => sum + day.count, 0);
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const knownMaintenance = repos.filter((repo) => repo.archived ||
    (repo.pushed_at && Number.isFinite(Date.parse(repo.pushed_at)))).length;
  const shippingScore = repos.length
    ? clamp(Math.round(50 + ((knownMaintenance - 2 * inactiveRepos) / repos.length) * 50), 0, 100)
    : 0;
  const consistencyScore = clamp(Math.round((activeRecentDays / 45) * 100), 0, 100);
  const languageDiversityScore = clamp(Math.round((languages.length / Math.max(repos.length, 1)) * 180), 10, 95);
  const descriptiveCommitRatio = commitSignals.length
    ? commitSignals.filter((commit) => commit.message.trim().length >= 20).length / commitSignals.length
    : 0.5;
  const { score: profileScore, breakdown: scoreBreakdown } = calculateProfileScore({
    recentActivityCount,
    totalContributions,
    sampledCommitCount: snapshot.commits.length,
    totalStars,
    totalForks,
    followers: snapshot.profile.followers,
    shippingScore,
    consistencyScore,
    descriptionCoverage,
    descriptiveCommitRatio
  });
  const chaosScore = clamp(
    Math.round(100 - (descriptionCoverage * 0.28 + shippingScore * 0.34 + consistencyScore * 0.22) + todoDensity * 0.42),
    6,
    99
  );
  const sortedContributions = [...snapshot.contributions].sort((a, b) => a.date.localeCompare(b.date));
  const accountAgeYears = snapshot.source === "github-api"
    ? Math.max(0, Math.floor(daysSince(snapshot.profile.created_at) / 365.25))
    : 0;
  return {
    username: snapshot.profile.login,
    displayName: snapshot.profile.name,
    avatarUrl: snapshot.profile.avatar_url,
    githubUrl: snapshot.profile.html_url,
    followers: snapshot.profile.followers,
    accountAgeYears,
    repoCount: snapshot.profile.public_repos,
    analyzedRepoCount: repos.length,
    sampledCommitCount: snapshot.commits.length,
    dataSource: snapshot.source,
    inactiveRepos,
    totalStars,
    totalForks,
    languages,
    avgCommitLength,
    descriptionCoverage,
    todoDensity,
    languageDiversityScore,
    shippingScore,
    consistencyScore,
    chaosScore,
    profileScore,
    scoreBreakdown,
    recentActivityCount,
    contributions: sortedContributions,
    totalContributions,
    topPatterns: detectPatterns(repos, snapshot.commits),
    commitSamples: commitSignals.map((commit) => commit.message.slice(0, 180)).slice(0, 12),
    commitSignals: commitSignals.slice(0, 12).map((commit) => ({
      repo: commit.repo.slice(0, 100),
      message: commit.message.slice(0, 180),
      date: commit.date
    })),
    repos: curated.map(({ repo, reasons }) => ({
      name: repo.name,
      url: repo.html_url,
      description: repo.description?.slice(0, 240) ?? null,
      language: repo.language,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
      defaultBranch: repo.default_branch,
      archived: repo.archived ?? false,
      topics: repo.topics?.slice(0, 6) ?? [],
      pushedAt: repo.pushed_at,
      createdAt: Number.isFinite(Date.parse(repo.created_at)) ? repo.created_at : null,
      selectionReasons: reasons
    }))
  };
}
