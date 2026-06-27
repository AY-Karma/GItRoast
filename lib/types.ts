export type GitHubProfile = {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
  bio: string | null;
};

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  pushed_at: string | null;
  updated_at: string;
  created_at: string;
  size: number;
  open_issues_count: number;
  default_branch: string;
};

export type RepoReadmeSignal = {
  repo: string;
  hasReadme: boolean;
};

export type CommitSignal = {
  repo: string;
  message: string;
  date: string;
};

export type ContributionDay = {
  date: string;
  count: number;
  level: number;
};

export type GitHubSnapshot = {
  profile: GitHubProfile;
  repos: GitHubRepo[];
  commits: CommitSignal[];
  readmes: RepoReadmeSignal[];
  contributions: ContributionDay[];
};

export type RoastSummary = {
  username: string;
  displayName: string | null;
  avatarUrl: string;
  githubUrl: string;
  repoCount: number;
  inactiveRepos: number;
  totalStars: number;
  totalForks: number;
  languages: string[];
  avgCommitLength: number;
  readmeCoverage: number;
  todoDensity: number;
  languageDiversityScore: number;
  shippingScore: number;
  consistencyScore: number;
  chaosScore: number;
  recentActivityCount: number;
  activityTimeline: Array<{
    label: string;
    count: number;
    date: string;
  }>;
  contributions: ContributionDay[];
  totalContributions: number;
  topPatterns: string[];
  commitSamples: string[];
  repos: Array<{
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
    pushedAt: string | null;
  }>;
};

export type RoastReport = {
  developerType: string;
  archetypeDescription: string;
  roastScore: number;
  roast: string;
  strengths: string[];
  weaknesses: string[];
  commitCrimes: Array<{
    message: string;
    commentary: string;
  }>;
};

export type RoastResponse = {
  summary: RoastSummary;
  report: RoastReport;
  generatedWith: "openai" | "fallback";
};
