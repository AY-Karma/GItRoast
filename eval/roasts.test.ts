import { mkdir, writeFile } from "node:fs/promises";
import { randomInt } from "node:crypto";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { generateFallbackRoast, generateRoast, type GenerationTelemetry } from "@/lib/openai";
import { reportLines, ROAST_PROMPT_VERSION } from "@/lib/roast-quality";
import { evaluationCases } from "./cases";

it("exports twenty reviewable cases without pretending to score subjective humor", async () => {
  const live = process.env.ROAST_EVAL_LIVE === "1";
  if (live && !process.env.OPENAI_API_KEY) throw new Error("Live evaluation requires OPENAI_API_KEY. Offline mode makes no API calls.");
  const models = live ? (process.env.ROAST_EVAL_MODELS ?? process.env.OPENAI_MODEL ?? "gpt-6-sol").split(",").map((model) => model.trim()).filter(Boolean).slice(0, 3) : [];
  const packets = [];
  const key: Array<{ case: string; label: string; model: string; generatedWith: string; telemetry: GenerationTelemetry | null }> = [];
  for (const { name, input } of evaluationCases) {
    const candidates = [{ model: "deterministic-fallback", result: { report: generateFallbackRoast(input), generatedWith: "fallback" }, telemetry: null as GenerationTelemetry | null }];
    for (const model of models) {
      let telemetry: GenerationTelemetry | null = null;
      const result = await generateRoast(input, { model, onTelemetry: (event) => { telemetry = event; } });
      candidates.push({ model, result, telemetry });
    }
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const blind = candidates.map(({ model, result, telemetry }, index) => {
      expect(result.report.roastScore).toBe(input.profileScore);
      expect(result.report.repositoryRoasts.map((repo) => repo.name)).toEqual(input.repos.slice(0, 6).map((repo) => repo.name));
      expect(result.report.commitCrimes.every((crime) => input.commitSamples.includes(crime.message) ||
        input.repos.some((repo) => repo.evidence?.recentCommit?.subject === crime.message))).toBe(true);
      expect(reportLines(result.report).every((line) => line.text.trim().length > 0)).toBe(true);
      const label = String.fromCharCode(65 + index);
      key.push({ case: name, label, model, generatedWith: result.generatedWith, telemetry });
      return { label, report: result.report };
    });
    packets.push({ case: name, facts: input, candidates: blind });
  }
  const destination = resolve("artifacts/roast-evaluation");
  await mkdir(destination, { recursive: true });
  await writeFile(resolve(destination, "blind-reports.json"), JSON.stringify(packets, null, 2));
  await writeFile(resolve(destination, "answer-key.json"), JSON.stringify({ promptVersion: ROAST_PROMPT_VERSION, live, generatedAt: new Date().toISOString(), candidates: key }, null, 2));
  const rows = packets.flatMap((packet) => packet.candidates.map((candidate) => `${packet.case},${candidate.label},,,,,,,,`));
  await writeFile(resolve(destination, "ratings.csv"), `case,candidate,grounding_1_to_5,specificity_1_to_5,punch_1_to_5,originality_1_to_5,repetition_1_to_5,taste_1_to_5,shareability_1_to_5,notes\n${rows.join("\n")}\n`);
  await writeFile(resolve(destination, "README.md"), `# Roast evaluation\n\n${packets.length} synthetic profiles; ${key.length} reports. Mode: ${live ? "live model comparison" : "offline fallback smoke check (no model comparison)"}.\n\nRead blind-reports.json and fill ratings.csv before opening answer-key.json. Rate each dimension 1 (poor), 3 (acceptable), 5 (excellent). Check punch, repetition across all visible sections, taste, and whether the exact work artifact behind the joke is identifiable. Disqualify invented facts and personal attacks regardless of score. Missing evidence is unknown; model output is not proof of a fact.\n\nHuman ratings are intentionally blank. Compare model pairwise wins across the same cases, then inspect latency, token usage, provider failures, and repaired/fallback fields in the key. No measured humor winner exists until this review is done.\n`);
  expect(packets).toHaveLength(20);
}, 1_200_000);
