import { describe, expect, it } from "vitest";
import { applyRoastRepairs, buildRoastAngles, repeatsJoke } from "@/lib/roast-quality";
import { generateFallbackRoast } from "@/lib/openai";
import { summary } from "./fixtures/roast-summary";

describe("editorial quality controls", () => {
  it("requires both a minimalism claim and observed dependency count", () => {
    const input = summary("small-tools", "tiny-api");
    input.repos[0].description = "A tiny API";
    expect(buildRoastAngles(input).some((angle) => angle.id.endsWith("minimal-with-entourage"))).toBe(false);
    input.repos[0].evidence = { runtimeDependencies: 47 };
    expect(buildRoastAngles(input).find((angle) => angle.id.endsWith("minimal-with-entourage"))?.facts.join(" ")).toContain("47");
    expect(generateFallbackRoast(input).repositoryRoasts[0].commentary).toContain("47 runtime dependencies");
    input.repos[0].description = "A comprehensive framework";
    expect(buildRoastAngles(input).some((angle) => angle.id.endsWith("minimal-with-entourage"))).toBe(false);
  });

  it("finds near-duplicates but allows different jokes about the same repo", () => {
    const joke = "tiny-api brought forty dependencies to a meeting for one function.";
    expect(repeatsJoke("Your tiny-api brought forty dependencies to the meeting for one function!", [joke])).toBe(true);
    expect(repeatsJoke("tiny-api has 12 stars; the audience requests a refund policy.", [joke])).toBe(false);
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
