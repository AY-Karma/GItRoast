import { describe, expect, it } from "vitest";
import { curateRepositories } from "@/lib/repo-curation";
import { buildRoastSummary } from "@/lib/stats";
import type { GitHubRepo, GitHubSnapshot } from "@/lib/types";

const repo = (name: string, created: string, pushed: string, stars: number): GitHubRepo => ({
  id: Number(name.replace(/\D/g, "")) || name.length, name, full_name: `author/${name}`,
  html_url: `https://github.com/author/${name}`, description: "A project", fork: false,
  stargazers_count: stars, forks_count: 0, language: "TypeScript", pushed_at: pushed,
  updated_at: pushed, created_at: created, size: 1, open_issues_count: 0, default_branch: "main"
});

describe("repository curation", () => {
  it("reserves distinct star, hot, newest, and oldest slots before filling", () => {
    const repos = [
      repo("repo1", "2020-01-01", "2021-01-01", 900),
      repo("repo2", "2025-01-01", "2026-09-20", 110),
      repo("repo3", "2026-09-25", "2026-09-25", 2),
      repo("repo4", "2012-01-01", "2013-01-01", 0),
      repo("repo5", "2024-01-01", "2026-09-15", 40),
      repo("repo6", "2023-01-01", "2026-07-01", 60)
    ];
    const selected = curateRepositories(repos, 6, Date.parse("2026-09-27"));
    expect(selected.slice(0, 4).map(({ repo }) => repo.name)).toEqual(["repo1", "repo2", "repo3", "repo4"]);
    expect(selected.slice(0, 4).map(({ reasons }) => reasons[0])).toEqual(["Most starred", "Hot right now", "Newest", "Oldest"]);
    expect(new Set(selected.map(({ repo }) => repo.id)).size).toBe(6);
    const snapshot: GitHubSnapshot = { profile: { login: "author", name: null, avatar_url: "", html_url: "", public_repos: 6,
      followers: 0, following: 0, created_at: "2010-01-01", updated_at: "2026-09-27", bio: null },
      repos, commits: [], contributions: [], source: "github-api" };
    expect(buildRoastSummary(snapshot).repos.slice(0, 4).map((item) => item.name)).toEqual(["repo1", "repo2", "repo3", "repo4"]);
  });

  it("excludes forks and never invents oldest/newest from absent dates", () => {
    const repos = [repo("repo1", "", "2026-09-20", 2), repo("repo2", "", "2026-09-19", 1)];
    repos[1].fork = true;
    const selected = curateRepositories(repos, 6, Date.parse("2026-09-27"));
    expect(selected).toHaveLength(1);
    expect(selected[0].reasons).toEqual(["Most starred", "Hot right now"]);
  });

  it("calls the freshest old repository latest push instead of hot", () => {
    const selected = curateRepositories([
      repo("repo1", "2014-01-01", "2022-01-01", 2000),
      repo("repo2", "2018-01-01", "2024-08-01", 30)
    ], 6, Date.parse("2026-09-27"));
    expect(selected.find((item) => item.reasons.includes("Latest push"))?.repo.name).toBe("repo2");
    expect(selected.some((item) => item.reasons.includes("Hot right now"))).toBe(false);
  });
});
