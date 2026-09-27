import { afterEach, describe, expect, it, vi } from "vitest";
import { enrichRepositoryEvidence, parseRecentCommitEvidence, parseRepositoryEvidence } from "@/lib/repository-evidence";
import { summary } from "./fixtures/roast-summary";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("bounded repository evidence", () => {
  it("separates inspected root metadata from unavailable evidence", () => {
    expect(parseRepositoryEvidence(null, null, null)).toEqual({});
    expect(parseRepositoryEvidence(null, "not json", "[]")).toEqual({});
    const result = parseRepositoryEvidence("<!-- hidden --> A tiny API", '{"dependencies":{"one":"1","two":"2"},"devDependencies":{"three":"3"},"scripts":{"build":"echo do not execute"}}', '{"tag_name":"v1","published_at":"2026-08-01"}');
    expect(result).toEqual({ readmeExcerpt: "A tiny API", runtimeDependencies: 2, scriptNames: ["build"], latestRelease: { tag: "v1", publishedAt: "2026-08-01" } });
  });

  it("bounds enrichment requests and discards oversized files", async () => {
    const input = summary("evidence-dev", "tiny-api");
    input.repos.push({ ...input.repos[0], name: "third", selectionReasons: ["Also notable"] });
    const fetcher = vi.fn(async (url: string) => new Response(url.endsWith("readme") ? "x".repeat(40_000) : "{}"));
    vi.stubGlobal("fetch", fetcher);
    const result = await enrichRepositoryEvidence(input);
    expect(fetcher).toHaveBeenCalledTimes(12);
    expect(result.repos[0].evidence?.readmeExcerpt).toBeUndefined();
    expect(result.repos[2].evidence).toEqual({ runtimeDependencies: 0, scriptNames: [] });
    expect(result.repos[1].evidence).toEqual({ runtimeDependencies: 0, scriptNames: [] });
    expect(input.repos[0].evidence).toBeUndefined();
    const signals = fetcher.mock.calls.map((call) => (call as unknown as [string, RequestInit])[1].signal);
    expect(new Set(signals).size).toBe(1);
  });

  it("accepts only matching, reported commit scope and never consumes patch contents", () => {
    const sha = "a".repeat(40);
    const selected = { sha, subject: "fix stuff" };
    const repoUrl = "https://github.com/evidence-dev/tiny-api";
    const detail = JSON.stringify({ sha, stats: { additions: 90, deletions: 11 }, files: [
      { filename: "src/parser.ts", patch: "private content" }, { filename: "tests/parser.test.ts" }
    ] });
    expect(parseRecentCommitEvidence(detail, selected, repoUrl)).toEqual({
      sha, subject: "fix stuff", additions: 90, deletions: 11, filesShown: 2,
      filePaths: ["src/parser.ts", "tests/parser.test.ts"], url: `${repoUrl}/commit/${sha}`
    });
    expect(parseRecentCommitEvidence(detail.replace(sha, "b".repeat(40)), selected, repoUrl)).toBeUndefined();
    expect(parseRecentCommitEvidence(null, selected, repoUrl)).toBeUndefined();
  });

  it("selects an authored vague commit and fetches its detail", async () => {
    const input = summary("evidence-dev", "tiny-api");
    const sha = "a".repeat(40);
    const fetcher = vi.fn(async (url: string) => {
      if (url.includes("/commits?")) return new Response(JSON.stringify([
        { sha: "b".repeat(40), author: { login: "someone-else" }, commit: { message: "fix stuff" } },
        { sha, author: { login: "evidence-dev" }, commit: { message: "fix stuff\nbody" } }
      ]));
      if (url.includes(`/commits/${sha}`)) return new Response(JSON.stringify({ sha, stats: { additions: 52, deletions: 3 }, files: [{ filename: "src/main.ts" }] }));
      return new Response("{}");
    });
    vi.stubGlobal("fetch", fetcher);
    const result = await enrichRepositoryEvidence(input);
    expect(fetcher).toHaveBeenCalledTimes(10);
    expect(result.repos[0].evidence?.recentCommit?.subject).toBe("fix stuff");
    expect(result.repos[0].evidence?.recentCommit?.additions).toBe(52);
    expect(fetcher.mock.calls.some(([url]) => url.includes(`/commits/${"b".repeat(40)}`))).toBe(false);
  });

  it("uses only complete inspected trees for positive work evidence", () => {
    const tree = JSON.stringify({ truncated: false, tree: [
      { path: "tests/parser.test.ts", type: "blob" },
      { path: ".github/workflows/ci.yml", type: "blob" },
      { path: "src/index.ts", type: "blob" }
    ] });
    expect(parseRepositoryEvidence(null, null, null, tree)).toMatchObject({
      testPathCount: 1,
      testPathSamples: ["tests/parser.test.ts"],
      workflowPathSamples: [".github/workflows/ci.yml"]
    });
    expect(parseRepositoryEvidence(null, null, null, tree.replace('"truncated":false', '"truncated":true'))).toEqual({});
  });

  it("keeps the report usable when GitHub enrichment fails or is disabled", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("quota"));
    vi.stubGlobal("fetch", fetcher);
    const input = summary("evidence-dev", "tiny-api");
    expect((await enrichRepositoryEvidence(input)).repos[0].evidence).toEqual({});
    vi.stubEnv("ROAST_REPOSITORY_EVIDENCE", "off");
    fetcher.mockClear();
    expect(await enrichRepositoryEvidence(input)).toBe(input);
    expect(fetcher).not.toHaveBeenCalled();
    vi.stubEnv("ROAST_REPOSITORY_EVIDENCE", "on");
    input.dataSource = "public-profile";
    expect(await enrichRepositoryEvidence(input)).toBe(input);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
