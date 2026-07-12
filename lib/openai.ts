import OpenAI from "openai";
import type { RoastReport, RoastSummary } from "@/lib/types";
import { clamp } from "@/lib/utils";
import {
  repoAwareArchetype,
  repoAwareCommitCommentary,
  repoAwareRoast,
  repoAwareStrengths,
  repoAwareWeaknesses
} from "@/lib/roast-copy";

const fallbackTypes = [
  "Weekend Wizard",
  "TODO Collector",
  "Startup Alchemist",
  "Refactor Addict",
  "README Influencer"
];

function normalizeReport(report: Partial<RoastReport>, summary: RoastSummary): RoastReport {
  // Without explicit parentheses, `??` binds last so the addition only applies to the
  // fallback value. Parenthesise clearly: use the AI score directly if present, otherwise
  // derive one from chaosScore.
  const score =
    report.roastScore != null
      ? clamp(Math.round(report.roastScore), 1, 100)
      : clamp(Math.round(68 + summary.chaosScore * 0.24), 1, 100);
  return {
    developerType: report.developerType || fallbackTypes[summary.chaosScore % fallbackTypes.length],
    archetypeDescription:
      report.archetypeDescription || repoAwareArchetype(summary),
    roastScore: score,
    roast: report.roast || repoAwareRoast(summary),
    strengths: report.strengths?.slice(0, 4) ?? repoAwareStrengths(summary),
    weaknesses: report.weaknesses?.slice(0, 4) ?? repoAwareWeaknesses(summary),
    commitCrimes:
      report.commitCrimes?.slice(0, 5) ??
      summary.commitSamples.slice(0, 5).map((message) => ({
        message,
        commentary: repoAwareCommitCommentary(summary, message)
      }))
  };
}

export function generateFallbackRoast(summary: RoastSummary): RoastReport {
  if (summary.repoCount <= 1 && summary.recentActivityCount === 0) {
    return normalizeReport(
      {
        developerType: "Silent Shipper",
        roastScore: 42,
        roast: "Your GitHub profile is so quiet that even the tumbleweeds left.",
        archetypeDescription: repoAwareArchetype(summary)
      },
      summary
    );
  }
  return normalizeReport({}, summary);
}

export async function generateRoast(summary: RoastSummary): Promise<{ report: RoastReport; generatedWith: "openai" | "fallback" }> {
  if (!process.env.OPENAI_API_KEY) {
    return { report: generateFallbackRoast(summary), generatedWith: "fallback" };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.9,
    messages: [
      {
        role: "system",
        content:
          "You are a legendary senior engineer and stand-up comedian. Generate witty, clever, highly shareable roasts about coding behavior only. Never attack personal traits, protected classes, identity, appearance, or life circumstances. Be funny, not hateful or cruel. Focus on repositories, commits, unfinished projects, naming choices, TODO comments, architecture habits, documentation habits, repo names, and repo descriptions. Use the supplied repository summary to make the roast feel custom, specific, and unusually observant. Return strict JSON with keys: developerType, archetypeDescription, roastScore, roast, strengths, weaknesses, commitCrimes. commitCrimes must be objects with message and commentary. Make every comment sound like it was written after actually reading the repos."
      },
      {
        role: "user",
        content: JSON.stringify(summary)
      }
    ]
  });

  const raw = completion.choices[0]?.message.content;
  if (!raw) {
    return { report: generateFallbackRoast(summary), generatedWith: "fallback" };
  }

  try {
    return {
      report: normalizeReport(JSON.parse(raw) as Partial<RoastReport>, summary),
      generatedWith: "openai"
    };
  } catch {
    return { report: generateFallbackRoast(summary), generatedWith: "fallback" };
  }
}
