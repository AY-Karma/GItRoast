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
  contributions: ContributionDay[];
  source: "github-api" | "public-profile";
};

export type RoastSummary = {
  username: string;
  displayName: string | null;
  avatarUrl: string;
  githubUrl: string;
  followers: number;
  accountAgeYears: number;
  repoCount: number;
  analyzedRepoCount: number;
  sampledCommitCount: number;
  dataSource: GitHubSnapshot["source"];
  inactiveRepos: number;
  totalStars: number;
  totalForks: number;
  languages: string[];
  avgCommitLength: number;
  descriptionCoverage: number;
  todoDensity: number;
  languageDiversityScore: number;
  shippingScore: number;
  consistencyScore: number;
  chaosScore: number;
  recentActivityCount: number;
  contributions: ContributionDay[];
  totalContributions: number;
  topPatterns: string[];
  commitSamples: string[];
  commitSignals: CommitSignal[];
  repos: Array<{
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
    pushedAt: string | null;
  }>;
};

export type RoastReceipt = {
  title: string;
  evidence: string;
  punchline: string;
};

export type RoastReport = {
  developerType: string;
  archetypeDescription: string;
  roastScore: number;
  roast: string;
  strengths: string[];
  weaknesses: string[];
  receipts: RoastReceipt[];
  redemption: string;
  commitCrimes: Array<{
    message: string;
    commentary: string;
    status: "approved" | "changes-requested";
  }>;
};

export type RoastResponse = {
  summary: RoastSummary;
  report: RoastReport;
  generatedWith: "openai" | "fallback";
};
