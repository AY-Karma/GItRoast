import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGitHubSnapshot } from "@/lib/github";
import { buildRoastSummary } from "@/lib/stats";
import type { GitHubProfile, GitHubRepo } from "@/lib/types";

const profile: GitHubProfile = {
  login: "testuser",
  name: "Test User",
  avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
  html_url: "https://github.com/testuser",
  public_repos: 12,
  followers: 42,
  following: 4,
  created_at: "2020-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  bio: null
};

const repos: GitHubRepo[] = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `repo-${index + 1}`,
  full_name: `testuser/repo-${index + 1}`,
  html_url: `https://github.com/testuser/repo-${index + 1}`,
  description: `Repository ${index + 1}`,
  fork: false,
  stargazers_count: index,
  forks_count: 0,
  language: "TypeScript",
  pushed_at: "2026-08-01T00:00:00Z",
  updated_at: "2026-08-01T00:00:00Z",
  created_at: "2025-01-01T00:00:00Z",
  size: 100,
  open_issues_count: 0,
  default_branch: "main"
}));

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

const publicAtomFeed = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <published>2026-08-20 12:00:00 UTC</published>
    <title type="html">testuser pushed fallback-repo</title>
    <content type="html">&lt;blockquote&gt;fix the empty commit review&lt;/blockquote&gt;</content>
  </entry>
</feed>`;

describe("fetchGitHubSnapshot", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("collects a useful profile without exhausting the public REST request budget", async () => {
    const requestUrls: string[] = [];
    const mockFetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      requestUrls.push(`${init?.method ?? "GET"} ${url}`);

      if (url === "https://api.github.com/users/testuser") return json(profile);
      if (url.includes("/users/testuser/repos")) return json(repos);
      if (url === "https://github.com/testuser.atom") return new Response(publicAtomFeed, { status: 200 });
      if (url === "https://github.com/users/testuser/contributions") return new Response("", { status: 200 });
      if (url.includes("/commits?")) return json([]);
      return json({ message: "not found" }, 404);
    });
    vi.stubGlobal("fetch", mockFetch);

    const snapshot = await fetchGitHubSnapshot("testuser");
    const apiRequests = requestUrls.filter((url) => url.includes("api.github.com"));

    expect(apiRequests.length).toBeLessThanOrEqual(2);
    expect(snapshot.commits[0]?.message).toBe("fix the empty commit review");
    expect(snapshot.profile.login).toBe("testuser");
  });

  it("adds star and creation lanes when recent results cannot cover the account", async () => {
    const requests: string[] = [];
    const mockFetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      requests.push(url);
      if (url === "https://api.github.com/users/testuser") return json({ ...profile, public_repos: 500 });
      if (url.includes("sort=pushed")) return json([repos[0]]);
      if (url.includes("sort=created&direction=asc")) return json([{ ...repos[1], created_at: "2010-01-01T00:00:00Z" }]);
      if (url.includes("sort=created&direction=desc")) return json([{ ...repos[2], created_at: "2026-09-26T00:00:00Z" }]);
      if (url.includes("/search/repositories")) return json({ items: [{ ...repos[3], stargazers_count: 2000 }] });
      if (url === "https://github.com/testuser.atom") return new Response(publicAtomFeed);
      if (url.includes("/users/testuser/contributions")) return new Response("");
      return json({ message: "not found" }, 404);
    });
    vi.stubGlobal("fetch", mockFetch);
    const snapshot = await fetchGitHubSnapshot("testuser");
    const selected = buildRoastSummary(snapshot).repos;
    expect(requests.filter((url) => url.includes("api.github.com"))).toHaveLength(5);
    expect(selected[0].name).toBe("repo-4");
    expect(selected.find((item) => item.selectionReasons?.includes("Oldest"))?.name).toBe("repo-2");
    expect(selected.find((item) => item.selectionReasons?.includes("Newest"))?.name).toBe("repo-3");
  });

  it("falls back to the public profile page when the REST quota is exhausted", async () => {
    const mockFetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("api.github.com")) return json({ message: "rate limit exceeded" }, 403);
      if (url.includes("/users/testuser/contributions")) return new Response("", { status: 200 });
      if (url === "https://github.com/testuser.atom") return new Response(publicAtomFeed, { status: 200 });
      if (url === "https://github.com/testuser?tab=repositories") {
        return new Response(`
          <span class="p-name vcard-fullname" itemprop="name">Quota User</span>
          <img class="avatar-user" src="https://avatars.githubusercontent.com/u/1?s=64&amp;v=4" />
          Repositories <span class="Counter">2</span>
          <li itemprop="owns">
            <a itemprop="name codeRepository">fallback-repo</a>
            <p itemprop="description">Still useful without REST quota</p>
            <span itemprop="programmingLanguage">TypeScript</span>
            <relative-time datetime="2026-08-01T00:00:00Z"></relative-time>
          </li>
        `, { status: 200, headers: { "Content-Type": "text/html" } });
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", mockFetch);

    const snapshot = await fetchGitHubSnapshot("testuser");

    expect(snapshot.source).toBe("public-profile");
    expect(snapshot.profile.name).toBe("Quota User");
    expect(snapshot.repos[0]?.name).toBe("fallback-repo");
    expect(snapshot.repos[0]?.pushed_at).toBeNull();
    expect(snapshot.repos[0]?.created_at).toBe("");
    expect(buildRoastSummary(snapshot).shippingScore).toBe(50);
    expect(snapshot.commits[0]?.message).toBe("fix the empty commit review");
    expect(snapshot.profile.avatar_url).toContain("s=600");
  });

  it("uses the public profile fallback for GitHub 429 responses", async () => {
    const mockFetch = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("api.github.com")) return json({ message: "too many requests" }, 429);
      if (url.includes("/users/testuser/contributions")) return new Response("", { status: 200 });
      if (url === "https://github.com/testuser.atom") return new Response(publicAtomFeed, { status: 200 });
      if (url === "https://github.com/testuser?tab=repositories") {
        return new Response(`
          <span class="p-name vcard-fullname" itemprop="name">Throttled User</span>
          <img class="avatar-user" src="https://avatars.githubusercontent.com/u/1?s=64&amp;v=4" />
          <li itemprop="owns"><a itemprop="name codeRepository">fallback-repo</a></li>
        `, { status: 200, headers: { "Content-Type": "text/html" } });
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", mockFetch);

    const snapshot = await fetchGitHubSnapshot("testuser");

    expect(snapshot.source).toBe("public-profile");
    expect(snapshot.profile.name).toBe("Throttled User");
  });
});
