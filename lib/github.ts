import type {
  CommitSignal,
  ContributionDay,
  GitHubProfile,
  GitHubRepo,
  GitHubSnapshot,
  RepoReadmeSignal
} from "@/lib/types";

const GITHUB_API = "https://api.github.com";

function headers(includeAuth = true) {
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "GitRoast",
    ...(includeAuth && process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
  };
}

async function githubFetch<T>(path: string, revalidate = 1800): Promise<T> {
  let response = await fetch(`${GITHUB_API}${path}`, {
    headers: headers(true),
    next: { revalidate }
  });

  if (response.status === 403 && process.env.GITHUB_TOKEN) {
    response = await fetch(`${GITHUB_API}${path}`, {
      headers: headers(false),
      next: { revalidate }
    });
  }

  if (response.status === 404) {
    throw new Error("GitHub profile not found.");
  }

  if (!response.ok) {
    throw new Error(`GitHub API failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

function safeUsername(username: string) {
  const cleaned = username.trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(cleaned)) {
    throw new Error("Enter a valid GitHub username.");
  }
  return cleaned;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parseCount(value: string | undefined) {
  if (!value) return 0;
  const clean = value.replace(/,/g, "").trim().toLowerCase();
  const multiplier = clean.endsWith("k") ? 1000 : clean.endsWith("m") ? 1000000 : 1;
  const number = Number.parseFloat(clean.replace(/[km]/g, ""));
  return Number.isFinite(number) ? Math.round(number * multiplier) : 0;
}

function textBetween(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ? decodeHtml(match[1].replace(/<[^>]*>/g, "")) : null;
}

async function fetchContributionDays(username: string): Promise<ContributionDay[]> {
  const response = await fetch(`https://github.com/users/${username}/contributions`, {
    headers: { "User-Agent": "GitRoast" },
    next: { revalidate: 900 }
  });

  if (!response.ok) {
    return [];
  }

  const html = await response.text();

  const rectMatches = Array.from(html.matchAll(/data-date="([^"]+)"[^>]*data-level="(\d+)"/g))
    .map((m) => ({ date: m[1], level: Number(m[2]) }));

  if (!rectMatches.length) return [];

  const tooltipMatches = Array.from(html.matchAll(/<tool-tip[^>]*>([\s\S]*?)<\/tool-tip>/g))
    .map((m) => decodeHtml(m[1]));

  const ESTIMATES: Record<number, number> = { 1: 2, 2: 5, 3: 8, 4: 15 };

  return rectMatches
    .map((rect, i) => {
      const tooltip = tooltipMatches[i] ?? "";
      const count = tooltip
        ? (tooltip.startsWith("No contributions")
          ? 0
          : Number(tooltip.match(/^(\d+)/)?.[1] ?? 0))
        : (ESTIMATES[rect.level] ?? 0);
      return { date: rect.date, count, level: rect.level };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchWebSnapshot(username: string): Promise<GitHubSnapshot> {
  const response = await fetch(`https://github.com/${username}?tab=repositories`, {
    headers: { "User-Agent": "GitRoast" },
    next: { revalidate: 900 }
  });

  if (response.status === 404) {
    throw new Error("GitHub profile not found.");
  }

  if (!response.ok) {
    throw new Error(`GitHub profile page failed with ${response.status}.`);
  }

  const html = await response.text();
  const displayName = textBetween(html, /<span[^>]*class="[^"]*\bp-name\b[^"]*"[^>]*>([\s\S]*?)<\/span>/);
  const bio = textBetween(html, /<div[^>]*class="[^"]*\bp-note\b[^"]*"[^>]*>([\s\S]*?)<\/div>/);
  const avatarUrl = html.match(/<img[^>]+class="[^"]*\bavatar-user\b[^"]*"[^>]+src="([^"]+)"/)?.[1] ?? `https://github.com/${username}.png`;
  const repoCount = parseCount(html.match(/Repositories\s*<span[^>]*Counter[^>]*>([^<]+)<\/span>/)?.[1]);
  const followerCount = parseCount(html.match(/([0-9.,kmKM]+)\s+followers/)?.[1]);
  const followingCount = parseCount(html.match(/([0-9.,kmKM]+)\s+following/)?.[1]);

  const repoBlocks = html.match(/<li[^>]*itemprop="owns"[\s\S]*?<\/li>/g) ?? [];
  const repos: GitHubRepo[] = repoBlocks.slice(0, 40).map((block, index) => {
    const name = textBetween(block, /itemprop="name codeRepository"[^>]*>([\s\S]*?)<\/a>/) ?? `repo-${index + 1}`;
    const description = textBetween(block, /itemprop="description"[^>]*>([\s\S]*?)<\/p>/);
    const language = textBetween(block, /itemprop="programmingLanguage"[^>]*>([\s\S]*?)<\/span>/);
    const stars = parseCount(block.match(/\/stargazers"[^>]*>[\s\S]*?<svg[\s\S]*?<\/svg>\s*([^<\s]+)/)?.[1]);
    const updatedAt = block.match(/<relative-time datetime="([^"]+)"/)?.[1] ?? new Date().toISOString();
    const isFork = /\bfork\b/.test(block.match(/<li[^>]*class="([^"]+)"/)?.[1] ?? "");

    return {
      id: index + 1,
      name,
      full_name: `${username}/${name}`,
      html_url: `https://github.com/${username}/${name}`,
      description,
      fork: isFork,
      stargazers_count: stars,
      forks_count: 0,
      language,
      pushed_at: updatedAt,
      updated_at: updatedAt,
      created_at: updatedAt,
      size: 0,
      open_issues_count: 0,
      default_branch: "main"
    };
  });

  return {
    profile: {
      login: username,
      name: displayName,
      avatar_url: decodeHtml(avatarUrl),
      html_url: `https://github.com/${username}`,
      public_repos: repoCount || repos.length,
      followers: followerCount,
      following: followingCount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bio
    },
    repos,
    commits: [],
    readmes: repos.map((repo) => ({ repo: repo.name, hasReadme: Boolean(repo.description) })),
    contributions: await fetchContributionDays(username)
  };
}

async function fetchCommits(username: string, repos: GitHubRepo[]): Promise<CommitSignal[]> {
  const candidates = repos
    .filter((repo) => !repo.fork)
    .sort((a, b) => new Date(b.pushed_at ?? b.updated_at).getTime() - new Date(a.pushed_at ?? a.updated_at).getTime())
    .slice(0, 8);

  const batches = await Promise.allSettled(
    candidates.map(async (repo) => {
      const commits = await githubFetch<Array<{ commit: { message: string; author: { date: string } } }>>(
        `/repos/${repo.full_name}/commits?per_page=8`,
        900
      );
      return commits.map((commit) => ({
        repo: repo.name,
        message: commit.commit.message.split("\n")[0].trim(),
        date: commit.commit.author.date
      }));
    })
  );

  return batches
    .flatMap((batch) => (batch.status === "fulfilled" ? batch.value : []))
    .filter((commit) => commit.message)
    .slice(0, 50);
}

async function fetchReadmes(repos: GitHubRepo[]): Promise<RepoReadmeSignal[]> {
  const candidates = repos.filter((repo) => !repo.fork).slice(0, 16);
  const batches = await Promise.allSettled(
    candidates.map(async (repo) => {
      try {
        await githubFetch(`/repos/${repo.full_name}/readme`, 3600);
        return { repo: repo.name, hasReadme: true };
      } catch {
        return { repo: repo.name, hasReadme: false };
      }
    })
  );

  return batches.map((batch, index) =>
    batch.status === "fulfilled" ? batch.value : { repo: candidates[index]?.name ?? "unknown", hasReadme: false }
  );
}

export async function fetchGitHubSnapshot(rawUsername: string): Promise<GitHubSnapshot> {
  const username = safeUsername(rawUsername);
  let profile: GitHubProfile;
  let repos: GitHubRepo[];

  try {
    [profile, repos] = await Promise.all([
      githubFetch<GitHubProfile>(`/users/${username}`),
      githubFetch<GitHubRepo[]>(`/users/${username}/repos?per_page=100&sort=updated`)
    ]);
  } catch (error) {
    if (error instanceof Error && error.message.includes("403")) {
      return fetchWebSnapshot(username);
    }
    throw error;
  }

  const [commits, readmes, contributions] = await Promise.all([
    fetchCommits(username, repos),
    fetchReadmes(repos),
    fetchContributionDays(username)
  ]);

  return {
    profile,
    repos,
    commits,
    readmes,
    contributions
  };
}
