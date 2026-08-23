import "server-only";

import { unstable_cache } from "next/cache";
import { fetchGitHubSnapshot, normalizeGitHubUsername } from "@/lib/github";
import { generateRoast } from "@/lib/openai";
import { buildRoastSummary } from "@/lib/stats";
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
  try {
    const snapshot = await fetchGitHubSnapshot(username);
    const summary = buildRoastSummary(snapshot);
    const { report, generatedWith } = await generateRoast(summary);
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

const getCachedRoast = unstable_cache(buildRoast, ["gitroast-v6"], {
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
