import "server-only";

import { unstable_cache } from "next/cache";
import { fetchGitHubSnapshot, normalizeGitHubUsername } from "@/lib/github";
import { generateRoast } from "@/lib/openai";
import { buildRoastSummary } from "@/lib/stats";
import { enrichRepositoryEvidence } from "@/lib/repository-evidence";
import { ROAST_PROMPT_VERSION } from "@/lib/roast-quality";
import type { RoastResponse } from "@/lib/types";

export class RoastRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "RoastRequestError";
  }
}

async function buildRoast(username: string): Promise<RoastResponse> {
  const started = Date.now();
  try {
    const snapshot = await fetchGitHubSnapshot(username);
    const summary = await enrichRepositoryEvidence(buildRoastSummary(snapshot));
    const { report, generatedWith } = await generateRoast(summary, { budgetMs: Math.max(0, 27_000 - (Date.now() - started)) });
    return { summary, report, generatedWith };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not found")) {
      throw new RoastRequestError("That GitHub profile does not exist or is not public.", 404);
    }
    if (message.includes("valid GitHub username")) {
      throw new RoastRequestError(message, 400);
    }
    if (message.includes("403") || message.includes("429")) {
      throw new RoastRequestError("GitHub is rate-limiting profile lookups. Try again in a minute.", 503);
    }
    throw new RoastRequestError("GitHub did not return a usable profile. Please try again.", 502);
  }
}

const getCachedRoast = unstable_cache(buildRoast, [ROAST_PROMPT_VERSION, process.env.OPENAI_MODEL ?? "gpt-6-sol", process.env.ROAST_REPOSITORY_EVIDENCE ?? "on", process.env.OPENAI_API_KEY ? "ai" : "fallback"], {
  revalidate: 60 * 60
});

/** The single server seam for turning a public GitHub username into a roast. */
export async function roastGitHubProfile(rawUsername: string) {
  let username: string;
  try {
    username = normalizeGitHubUsername(rawUsername);
  } catch (error) {
    throw new RoastRequestError(error instanceof Error ? error.message : "Enter a valid GitHub username.", 400);
  }
  return getCachedRoast(username.toLowerCase());
}
