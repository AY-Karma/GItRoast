import { describe, expect, it } from "vitest";
import { applyRoastRepairs, buildRoastAngles, repeatsJoke } from "@/lib/roast-quality";
import { generateFallbackRoast } from "@/lib/openai";
import { commitReviewStatus } from "@/lib/roast-copy";
import { buildEditorialAngles } from "@/lib/roast-fallback";
import { summary } from "./fixtures/roast-summary";

describe("editorial quality controls", () => {
  it("treats repeated filler as vague without punishing a concise specific subject", () => {
    expect(commitReviewStatus("fix final thing again")).toBe("changes-requested");
    expect(commitReviewStatus("fix")).toBe("changes-requested");
    expect(commitReviewStatus("Fix auth timeout")).toBe("approved");
    expect(commitReviewStatus("Add retry test")).toBe("approved");
  });

  it("keeps the main punchline distinct from visible review comments and uses receipts as facts", () => {
    const report = generateFallbackRoast(summary("different-lines", "alpha-console"));
    const comments = [...report.repositoryRoasts.map((item) => item.commentary),
      ...report.commitCrimes.map((item) => item.commentary), ...report.strengths];
    expect(comments.every((line) => !report.roast.includes(line))).toBe(true);
    expect(report.receipts.every((receipt) => receipt.evidence && !receipt.punchline)).toBe(true);
  });

  it("keeps limited-profile repository comments distinct without inventing push dates", () => {
    const input = summary("limited-dev", "first-tool");
    input.dataSource = "public-profile";
    input.repos.forEach((repo) => { repo.pushedAt = null; repo.createdAt = null; repo.evidence = undefined; });
    const report = generateFallbackRoast(input);
    expect(new Set(report.repositoryRoasts.map((repo) => repo.commentary)).size).toBe(report.repositoryRoasts.length);
    const structures = report.repositoryRoasts.map((review) => review.commentary.replaceAll(review.name, "<repo>").replace(/\b\d+\b/g, "<count>"));
    expect(new Set(structures).size).toBe(structures.length);
    expect(report.repositoryRoasts.every((repo) => !/last public push|no public push since/i.test(repo.commentary))).toBe(true);
  });

  it("does not use the same missing-description premise twice in the verdict", () => {
    const input = summary("two-empty-pitches", "first-tool");
    input.repos[0].description = null;
    input.repos[0].stars = 200;
    input.repos[1].description = null;
    input.repos[1].stars = 300;
    input.commitSamples = [];
    input.commitSignals = [];
    const report = generateFallbackRoast(input);
    expect((report.roast.match(/description/gi) ?? []).length).toBeLessThanOrEqual(1);
    expect(report.roast).toContain("public push");
  });

  it("credits inspected work paths without claiming tests or CI pass", () => {
    const input = summary("tested-work", "parser-kit");
    input.repos[0].evidence = { testPathCount: 1, testPathSamples: ["tests/parser.test.ts"], workflowPathSamples: [".github/workflows/ci.yml"] };
    const angles = buildEditorialAngles(input);
    expect(angles.find((angle) => angle.id === "parser-kit:test-path")?.evidence).toContain("tests/parser.test.ts");
    const report = generateFallbackRoast(input);
    expect(JSON.stringify(report)).not.toMatch(/tests pass|CI works|no tests/i);
    expect(report.receipts.some((receipt) => receipt.sourceUrl?.includes("tests/parser.test.ts"))).toBe(true);
  });

  it("criticizes undiscoverable testing only after both tree and manifest are inspected", () => {
    const input = summary("build-dev", "parser-kit");
    input.repos[0].evidence = { testPathCount: 0, testPathSamples: [], scriptNames: ["build", "lint"] };
    expect(buildEditorialAngles(input).find((angle) => angle.id === "parser-kit:test-discoverability")?.evidence).toContain("no conventional test-named paths");
    expect(generateFallbackRoast(input).roast).toContain("test path");
    input.repos[0].evidence = { testPathCount: 0, scriptNames: ["test:unit"] };
    expect(buildEditorialAngles(input).some((angle) => angle.id === "parser-kit:test-discoverability")).toBe(false);
    input.repos[0].evidence = { scriptNames: ["build"] };
    expect(buildEditorialAngles(input).some((angle) => angle.id === "parser-kit:test-discoverability")).toBe(false);
  });

  it("ties a severe commit-title roast to the inspected change scope and exact source", () => {
    const input = summary("scope-dev", "parser-kit");
    const sha = "a".repeat(40);
    input.repos[0].evidence = { recentCommit: { sha, subject: "fix stuff", additions: 90, deletions: 11,
      filesShown: 3, filePaths: ["src/parser.ts", "src/index.ts", "tests/parser.test.ts"],
      url: `https://github.com/scope-dev/parser-kit/commit/${sha}` } };
    const report = generateFallbackRoast(input);
    expect(report.roast).toContain("90 additions");
    expect(report.roast).toContain("fix stuff");
    expect(report.receipts.some((receipt) => receipt.sourceUrl?.endsWith(`/commit/${sha}`))).toBe(true);
    expect(JSON.stringify(report)).not.toMatch(/code is broken|tests pass/i);
  });

  it("requires both a minimalism claim and observed dependency count", () => {
    const input = summary("small-tools", "tiny-api");
    input.repos[0].description = "A tiny API";
    expect(buildRoastAngles(input).some((angle) => angle.id.endsWith("minimal-with-entourage"))).toBe(false);
    input.repos[0].evidence = { runtimeDependencies: 47 };
    expect(buildRoastAngles(input).find((angle) => angle.id.endsWith("minimal-with-entourage"))?.facts.join(" ")).toContain("47");
    expect(generateFallbackRoast(input).roast).toContain("47 runtime dependencies");
    input.repos[0].description = "A comprehensive framework";
    expect(buildRoastAngles(input).some((angle) => angle.id.endsWith("minimal-with-entourage"))).toBe(false);
  });

  it("finds near-duplicates but allows different jokes about the same repo", () => {
    const joke = "tiny-api brought forty dependencies to a meeting for one function.";
    expect(repeatsJoke("Your tiny-api brought forty dependencies to the meeting for one function!", [joke])).toBe(true);
    expect(repeatsJoke("tiny-api has 12 stars; the audience requests a refund policy.", [joke])).toBe(false);
    expect(repeatsJoke("The repository description is blank; visitors get no introduction.", ["No one wrote the one-line pitch, so the repo enters without a name tag."])).toBe(true);
  });

  it("limits repairs to explicitly allowed text fields and protects accepted jokes", () => {
    const original = generateFallbackRoast(summary("editor", "tiny-api"));
    const result = applyRoastRepairs(original, [
      { path: "roastScore", text: "100" },
      { path: "__proto__.polluted", text: "yes" },
      { path: "roast", text: original.scoreRoast },
      { path: "redemption", text: "tiny-api needs a one-sentence repository description. Let the premise merge first." }
    ], ["roastScore", "__proto__.polluted", "roast", "redemption"]);
    expect(result.roastScore).toBe(original.roastScore);
    expect(result.roast).toBe(original.roast);
    expect(result.redemption).not.toBe(original.redemption);
    expect(result.repositoryRoasts).toEqual(original.repositoryRoasts);
    expect(original.redemption).not.toBe(result.redemption);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  });
});
