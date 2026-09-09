import { describe, expect, it } from "vitest";
import { generateFallbackRoast, normalizeReport } from "@/lib/openai";
import { summary } from "./fixtures/roast-summary";


describe("fallback roast", () => {
  it("keeps artifact-directed second person, novel titles, and score-only evidence", () => {
    const input = summary("alice-dev", "alpha-console");
    const roast = "Your alpha-console has 72 stars. The review committee now needs overflow seating.";
    const scoreRoast = "61/100. The merge button is negotiating terms.";
    const result = normalizeReport({ roast, scoreRoast, developerType: "The Reluctant Release Committee" }, input);
    expect(result.roast).toBe(roast);
    expect(result.scoreRoast).toBe(scoreRoast);
    expect(result.developerType).toBe("The Reluctant Release Committee");
    expect(normalizeReport({ scoreRoast: "Activity at 55; the sprint board requests an explanation." }, input).scoreRoast).toContain("Activity at 55");
    expect(normalizeReport({ scoreRoast: "99/100. Perfect." }, input).scoreRoast).not.toContain("99/100");
    expect(normalizeReport({ scoreRoast: "alpha-console gets 99/100. Perfect." }, input).scoreRoast).not.toContain("99/100");
  });

  it("replaces repeated lines individually while keeping other valid lines", () => {
    const input = summary("alice-dev", "alpha-console");
    const repeated = "alpha-console has 72 stars. The audience has formed a review committee.";
    const unique = "Your TypeScript is taking attendance before allowing the meeting to compile.";
    const rejected: string[] = [];
    const report = normalizeReport({ roast: repeated, strengths: [repeated, unique, "412 contributions have made the calendar eligible for overtime."] }, input, rejected);
    expect(report.roast).toBe(repeated);
    expect(report.strengths).not.toContain(repeated);
    expect(report.strengths).toContain(unique);
    expect(rejected).toContain("strengths.0");
  });

  it("does not classify unknown push dates as inactivity", () => {
    const input = summary("unknown-dates", "alpha-console");
    input.repos[0].pushedAt = null;
    const report = generateFallbackRoast(input);
    expect(report.repositoryRoasts[0].status).not.toBe("changes-requested");
    expect(report.repositoryRoasts[0].commentary).toContain("unavailable");
  });

  it("keeps a clear commit subject defensible in the main roast as well", () => {
    const input = summary("careful-dev", "parser");
    input.commitSamples = ["Reject invalid UTF-8 before parsing headers"];
    const report = generateFallbackRoast(input);
    expect(report.roast).toContain("supplied actual context");
    expect(report.roast).not.toContain("declined to provide an alibi");
  });

  it("does not invent repository defects when no original repos were available", () => {
    const input = summary("new-dev", "none");
    input.repos = [];
    input.commitSamples = [];
    input.commitSignals = [];
    input.repoCount = input.analyzedRepoCount = input.inactiveRepos = 0;
    const report = generateFallbackRoast(input);
    expect(report.repositoryRoasts).toEqual([]);
    expect(report.commitCrimes).toEqual([]);
    expect(report.roast).toContain("no original public repositories");
    expect(report.redemption).toContain("private work");
  });
  it("builds stable, evidence-specific reports instead of repeating one archetype", () => {
    const first = generateFallbackRoast(summary("alice-dev", "alpha-console"));
    const repeat = generateFallbackRoast(summary("alice-dev", "alpha-console"));
    const second = generateFallbackRoast(summary("bob-dev", "beta-engine"));

    expect(first).toEqual(repeat);
    expect(first.developerType).not.toBe(second.developerType);
    expect(first.roast).not.toBe(second.roast);
    expect(first.roast).toContain("alpha-console");
    expect(first.scoreRoast).toContain("61");
    expect(first.archetypeDescription.length).toBeLessThanOrEqual(180);
    expect(first.receipts).toHaveLength(3);
    expect(first.repositoryRoasts).toHaveLength(2);
    expect(new Set(first.repositoryRoasts.map((repo) => repo.commentary)).size).toBe(2);
    expect(first.repositoryRoasts.every((repo) => repo.commentary.includes(repo.name))).toBe(true);
    expect(first.receipts.every((receipt) => receipt.evidence && receipt.punchline)).toBe(true);
    expect(first.redemption).toContain("alpha-console");
  });

  it("keeps the joke aimed at public work rather than the person", () => {
    const report = generateFallbackRoast(summary("alice-dev", "alpha-console"));
    const output = JSON.stringify(report).toLowerCase();

    expect(output).not.toMatch(/\b(idiot|moron|stupid|ugly|worthless|loser|incompetent)\b/);
    expect(report.strengths.length).toBeGreaterThanOrEqual(3);
    expect(report.redemption.length).toBeGreaterThan(20);
  });

  it("does not manufacture a commit-message flaw when the subject is descriptive", () => {
    const input = summary("clear-committer", "release-tool");
    input.commitSamples = ["Install the authfile atomically and reject a non-regular path"];
    input.commitSignals = [{ repo: "release-tool", message: input.commitSamples[0], date: "2026-08-20T00:00:00Z" }];

    const report = generateFallbackRoast(input);

    expect(report.commitCrimes[0]?.commentary).toMatch(/annoyingly specific|supplied context|genuinely useful/);
    expect(report.commitCrimes[0]?.status).toBe("approved");
    expect(report.weaknesses.join(" ")).toContain("annoyingly clear");
  });

  it("rejects personal attacks from an online model response", () => {
    const input = summary("safe-review", "kind-console");
    const report = normalizeReport({
      developerType: "Worthless loser",
      roast: "You are stupid and unemployable.",
      strengths: ["Solid TypeScript", "Useful project", "Clear scope"],
      weaknesses: ["You are an idiot", "Missing descriptions", "Quiet repositories"]
    }, input);
    const output = JSON.stringify(report).toLowerCase();

    expect(output).not.toMatch(/\b(idiot|stupid|worthless|loser|unemployable)\b/);
    expect(report.roast).toContain("kind-console");
  });

  it("rejects person-level judgments even when they mention a real repository", () => {
    const input = summary("safe-review", "alpha-console");
    const report = normalizeReport({
      roast: "alpha-console proves you are a disgusting fraud."
    }, input);

    expect(report.roast).not.toContain("disgusting fraud");
    expect(report.roast).toContain("alpha-console");
  });

  it("keeps profile scoring deterministic instead of accepting a model-provided number", () => {
    const input = summary("score-owner", "score-console");
    const report = normalizeReport({ roastScore: 99 }, input);

    expect(report.roastScore).toBe(input.profileScore);
  });

  it("rejects invented or person-level repository comments", () => {
    const input = summary("safe-review", "alpha-console");
    const report = normalizeReport({
      repositoryRoasts: [
        { name: "invented-repo", commentary: "invented-repo is fine" },
        { name: "alpha-console", commentary: "alpha-console proves you are an idiot" }
      ]
    }, input);

    expect(report.repositoryRoasts.map((repo) => repo.name)).toEqual(["alpha-console", "weekend-lab"]);
    expect(report.repositoryRoasts[0]?.commentary).not.toContain("idiot");
  });

  it("accepts a safe repository comment only when it cites repository evidence", () => {
    const input = summary("safe-review", "alpha-console");
    const grounded = "alpha-console uses TypeScript and has enough context to make this review inconveniently short.";
    const report = normalizeReport({
      repositoryRoasts: [
        { name: "alpha-console", commentary: grounded },
        { name: "weekend-lab", commentary: "weekend-lab exists in public." }
      ]
    }, input);

    expect(report.repositoryRoasts[0]?.commentary).toBe(grounded);
    expect(report.repositoryRoasts[1]?.commentary).not.toBe("weekend-lab exists in public.");
  });

  it("treats archived repositories as a completed lifecycle instead of a failure", () => {
    const input = summary("archive-owner", "active-console");
    input.repos[1].archived = true;

    const report = generateFallbackRoast(input);
    const archived = report.repositoryRoasts.find((repo) => repo.name === "weekend-lab");

    expect(archived?.status).toBe("approved");
    expect(archived?.commentary.toLowerCase()).toMatch(/archiv|finished|ending/);
  });
});
