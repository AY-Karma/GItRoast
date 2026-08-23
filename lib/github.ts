import "server-only";

import type {
  ContributionDay,
  GitHubProfile,
  GitHubRepo,
  GitHubSnapshot
} from "@/lib/types";

const GITHUB_API = "https://api.github.com";
const REQUEST_TIMEOUT_MS = 10_000;

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
    next: { revalidate },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });

  if ((response.status === 403 || response.status === 429) && process.env.GITHUB_TOKEN) {
    response = await fetch(`${GITHUB_API}${path}`, {
      headers: headers(false),
      next: { revalidate },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
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

export function normalizeGitHubUsername(username: string) {
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

function highResolutionAvatarUrl(value: string | undefined, username: string) {
  const fallback = `https://github.com/${username}.png?size=600`;
  if (!value) return fallback;

  try {
    const url = new URL(decodeHtml(value));
    if (url.hostname === "avatars.githubusercontent.com") {
      url.searchParams.set("s", "600");
      return url.toString();
    }
    if (url.hostname === "github.com" && url.pathname.endsWith(".png")) {
      url.searchParams.set("size", "600");
      return url.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
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
  let response: Response;
  try {
    response = await fetch(`https://github.com/users/${username}/contributions`, {
      headers: { "User-Agent": "GitRoast" },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
  } catch {
    return [];
  }

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

async function fetchWebSnapshot(
  username: string,
  contributionsPromise = fetchContributionDays(username),
  commitsPromise = fetchPublicCommitSignals(username)
): Promise<GitHubSnapshot> {
  const response = await fetch(`https://github.com/${username}?tab=repositories`, {
    headers: { "User-Agent": "GitRoast" },
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
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
      avatar_url: highResolutionAvatarUrl(avatarUrl, username),
      html_url: `https://github.com/${username}`,
      public_repos: repoCount || repos.length,
      followers: followerCount,
      following: followingCount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      bio
    },
    repos,
    commits: await commitsPromise,
    contributions: await contributionsPromise,
    source: "public-profile"
  };
}

async function fetchPublicCommitSignals(username: string) {
  try {
    const response = await fetch(`https://github.com/${username}.atom`, {
      headers: { Accept: "application/atom+xml", "User-Agent": "GitRoast" },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    if (!response.ok) return [];
    const xml = await response.text();
    const seen = new Set<string>();
    const commits = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)).flatMap((match) => {
      const entry = match[1];
      const title = textBetween(entry, /<title[^>]*>([\s\S]*?)<\/title>/) ?? "";
      const pushMatch = title.match(/\bpushed\s+(.+)$/i);
      if (!pushMatch) return [];

      const content = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1];
      if (!content) return [];
      const decodedContent = decodeHtml(content);
      const date = textBetween(entry, /<published>([\s\S]*?)<\/published>/) ?? new Date().toISOString();
      const repo = decodeHtml(pushMatch[1]).split("/").at(-1) ?? decodeHtml(pushMatch[1]);

      return Array.from(decodedContent.matchAll(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/g))
        .map((messageMatch) => decodeHtml(messageMatch[1].replace(/<[^>]*>/g, "")).split("\n")[0].trim())
        .filter((message) => {
          const key = `${repo}\0${message}`;
          if (!message || seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .map((message) => ({ repo, message, date }));
    });

    return commits.slice(0, 50);
  } catch {
    return [];
  }
}

export async function fetchGitHubSnapshot(rawUsername: string): Promise<GitHubSnapshot> {
  const username = normalizeGitHubUsername(rawUsername);
  const contributionsPromise = fetchContributionDays(username);
  const commitsPromise = fetchPublicCommitSignals(username);
  let profile: GitHubProfile;
  let repos: GitHubRepo[];

  try {
    [profile, repos] = await Promise.all([
      githubFetch<GitHubProfile>(`/users/${username}`),
      githubFetch<GitHubRepo[]>(`/users/${username}/repos?per_page=100&sort=updated`)
    ]);
  } catch (error) {
    if (error instanceof Error && /\b(?:403|429)\b/.test(error.message)) {
      return fetchWebSnapshot(username, contributionsPromise, commitsPromise);
    }
    throw error;
  }

  const [commits, contributions] = await Promise.all([commitsPromise, contributionsPromise]);

  return {
    profile: { ...profile, avatar_url: highResolutionAvatarUrl(profile.avatar_url, username) },
    repos,
    commits,
    contributions,
    source: "github-api"
  };
}
