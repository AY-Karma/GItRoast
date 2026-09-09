import { afterEach, describe, expect, it, vi } from "vitest";
import { enrichRepositoryEvidence, parseRepositoryEvidence } from "@/lib/repository-evidence";
import { summary } from "./fixtures/roast-summary";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("bounded repository evidence", () => {
  it("separates inspected root metadata from unavailable evidence", () => {
    expect(parseRepositoryEvidence(null, null, null)).toEqual({});
    expect(parseRepositoryEvidence(null, "not json", "[]")).toEqual({});
    const result = parseRepositoryEvidence("<!-- hidden --> A tiny API", '{"dependencies":{"one":"1","two":"2"},"devDependencies":{"three":"3"},"scripts":{"build":"echo do not execute"}}', '{"tag_name":"v1","published_at":"2026-08-01"}');
    expect(result).toEqual({ readmeExcerpt: "A tiny API", runtimeDependencies: 2, scriptNames: ["build"], latestRelease: { tag: "v1", publishedAt: "2026-08-01" } });
  });

  it("caps enrichment at six parallel requests and discards oversized files", async () => {
    const input = summary("evidence-dev", "tiny-api");
    input.repos.push({ ...input.repos[0], name: "third" });
    const fetcher = vi.fn(async (url: string) => new Response(url.endsWith("readme") ? "x".repeat(40_000) : "{}"));
    vi.stubGlobal("fetch", fetcher);
    const result = await enrichRepositoryEvidence(input);
    expect(fetcher).toHaveBeenCalledTimes(6);
    expect(result.repos[0].evidence?.readmeExcerpt).toBeUndefined();
    expect(result.repos[2].evidence).toBeUndefined();
    expect(input.repos[0].evidence).toBeUndefined();
    const signals = fetcher.mock.calls.map((call) => (call as unknown as [string, RequestInit])[1].signal);
    expect(new Set(signals).size).toBe(1);
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
