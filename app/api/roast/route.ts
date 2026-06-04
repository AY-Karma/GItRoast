import { NextResponse } from "next/server";
import { fetchGitHubSnapshot } from "@/lib/github";
import { generateRoast } from "@/lib/openai";
import { buildRoastSummary } from "@/lib/stats";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { username?: string };
    if (!body.username) {
      return NextResponse.json({ error: "GitHub username is required." }, { status: 400 });
    }

    const snapshot = await fetchGitHubSnapshot(body.username);
    const summary = buildRoastSummary(snapshot);
    const { report, generatedWith } = await generateRoast(summary);

    return NextResponse.json({ summary, report, generatedWith });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong.";
    return NextResponse.json({ error: message }, { status: message.includes("not found") ? 404 : 500 });
  }
}
