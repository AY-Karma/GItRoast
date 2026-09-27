import type { RoastReport, RoastSummary } from "@/lib/types";

export const ROAST_PROMPT_VERSION = "gitroast-curated-v12";

export type RoastAngle = { id: string; facts: string[]; technique: string };

/** Select contrasts only when both supporting observations are present. */
export function buildRoastAngles(summary: RoastSummary): RoastAngle[] {
  const angles: RoastAngle[] = [];
  for (const repo of summary.repos.slice(0, 6)) {
    if (repo.archived) {
      angles.push({ id: `${repo.name}:finished`, facts: [`${repo.name} is archived; treat this as a lifecycle choice, not abandonment`], technique: "reluctant approval" });
    } else if (repo.stars >= 20 && !repo.description?.trim()) {
      angles.push({ id: `${repo.name}:audience-without-introduction`, facts: [`${repo.name} has ${repo.stars} stars`, "No repository description is supplied; README coverage is a separate fact"], technique: "contradiction" });
    }
    const evidence = repo.evidence;
    if (evidence?.runtimeDependencies !== undefined && evidence.runtimeDependencies >= 20 &&
        /\b(minimal|tiny|lightweight|zero.dependencies)\b/i.test(`${repo.description ?? ""} ${evidence.readmeExcerpt ?? ""}`)) {
      angles.push({ id: `${repo.name}:minimal-with-entourage`, facts: [`${repo.name} describes itself as minimal/tiny/lightweight/zero-dependency`, `Root package.json declares ${evidence.runtimeDependencies} runtime dependencies; this is not bundle size`], technique: "understatement" });
    }
  }
  const factors = Object.entries(summary.scoreBreakdown).sort((a, b) => b[1] - a[1]);
  if (factors[0][1] - factors[factors.length - 1][1] >= 25) {
    angles.push({ id: "score:imbalance", facts: [`${factors[0][0]} score ${factors[0][1]}`, `${factors[factors.length - 1][0]} score ${factors[factors.length - 1][1]}`], technique: "contrast" });
  }
  if (!summary.repos.length) angles.push({ id: "profile:limited-evidence", facts: ["No original public repositories were available; private work is unknown"], technique: "comment on thin evidence without inferring ability" });
  return angles.slice(0, 8);
}

const STOP_WORDS = new Set("the a an is are was were and or to of in on for with this that has have had its it your you as at from by".split(" "));

function obviousPremise(value: string) {
  const text = value.toLowerCase();
  if (/\b(dependenc\w*|packages?)\b/.test(text) && /\b(minimal|tiny|lightweight|zero.dependencies|entourage)\b/.test(text)) return "dependency-promise";
  if (/\b(description|tagline|one.line pitch|introduction)\b/.test(text) && /\b(no|missing|blank|absent|without|empty|forgot|unwritten)\b/.test(text)) return "missing-description";
  if (/\b(push|archive|roadmap|repository|repo)\b/.test(text) && /\b(quiet|inactive|silent|year|historical|abandon\w*|sabbatical|old)\b/.test(text)) return "quiet-repository";
  if (/\b(commit|subject|diff|changelog)\b/.test(text) && /\b(vague|context|explanation|mystery|unclear|guess)\b/.test(text)) return "vague-commit";
  return null;
}

/** Lexical repetition check, not a claim to measure humor or semantic similarity. */
export function repeatsJoke(value: string, previous: string[]) {
  const words = (text: string) => new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word && !STOP_WORDS.has(word)));
  const candidate = words(value);
  const premise = obviousPremise(value);
  return previous.some((text) => {
    if (premise && premise === obviousPremise(text)) return true;
    const other = words(text);
    const overlap = [...candidate].filter((word) => other.has(word)).length;
    const union = new Set([...candidate, ...other]).size;
    return union > 0 && overlap / union >= 0.72;
  });
}

export function reportLines(report: RoastReport): Array<{ path: string; text: string }> {
  return [
    ...(["developerType", "archetypeDescription", "scoreRoast", "roast", "redemption"] as const).map((path) => ({ path, text: report[path] })),
    ...(["strengths", "weaknesses"] as const).flatMap((key) => report[key].map((text, index) => ({ path: `${key}.${index}`, text }))),
    ...(["repositoryRoasts", "commitCrimes"] as const).flatMap((key) => report[key].map((item, index) => ({ path: `${key}.${index}.commentary`, text: item.commentary })))
  ];
}

/** Only existing report text paths can be edited, never scores, subjects, names, or prototype keys. */
export function applyRoastRepairs(report: RoastReport, replacements: unknown, allowed: string[]): RoastReport {
  const patched = structuredClone(report);
  if (!Array.isArray(replacements)) return patched;
  const lines = reportLines(report);
  for (const item of replacements.slice(0, 4)) {
    if (!item || typeof item.path !== "string" || typeof item.text !== "string" || !allowed.includes(item.path) ||
        !lines.some((line) => line.path === item.path) || repeatsJoke(item.text, reportLines(patched).filter((line) => line.path !== item.path).map((line) => line.text))) continue;
    const [key, index] = (item.path as string).split(".");
    if (key === "strengths" || key === "weaknesses") patched[key][Number(index)] = item.text;
    else if (key === "repositoryRoasts" || key === "commitCrimes") patched[key][Number(index)].commentary = item.text;
    else patched[key as "roast" | "developerType" | "archetypeDescription" | "scoreRoast" | "redemption"] = item.text;
  }
  return patched;
}

export const COMEDY_INSTRUCTIONS = [
  "Voice: a severe pull-request reviewer with comic timing. Dry, bold, and rude about the work, never vulgar or personally cruel. A line should make its exact repository or commit recognizable even after removing its name.",
  "Hard character limits: developerType 80, archetypeDescription 180, scoreRoast 220, each strength/weakness 240, each repository commentary 360, each commit commentary 320, redemption 480. Finish every punchline within its limit.",
  "Use sectionPlan and supplied observations. Profile = strongest contradiction; repository = its own local detail; commit = exact subject wording; strength = earned approval; weakness = observed friction; score = factor imbalance; redemption = one practical patch.",
  "Vary understatement, literal interpretation, inversion, and escalation. A fitting film/book allusion may sharpen one verified mismatch; do not reuse dialogue, imitate a living writer, or force a reference. Drop recurrent in-house tropes: prosecution, archaeology, side quest, mystery department, future maintainer, and 'the roast reluctantly approves'. A callback needs a new meaning, not a repeated line.",
  "Before returning JSON, silently replace generic, repeated, unsupported, or merely insulting lines. Prefer a precise short punchline over adjective piles. Never copy example facts or sentences into the report.",
  "Build the punchline from a mismatch the reader can verify: a claim against a manifest count, a vague title against reported commit scope, or a missing introduction against an actual audience. Use the exact observed numbers and artifact names, then stop. Produce a short novel developerType describing the public work pattern; do not simply reuse suggestedUniqueTitle.",
  "Good, archived, new, and sparse profiles need adaptive humor: give earned praise with an edge, respect completed projects, and joke about limited evidence when facts are missing. Missing public activity does not establish inactivity outside GitHub.",
  "Only inspected evidence supports README, dependency, release, test-path, workflow-path, or configuration claims. A test/workflow path does not prove tests pass or CI works. An unavailable fetch is unknown, not an absent file. A missing repository description is NOT a missing README. Counts are not proof of code quality; stars are not users; open issues are not necessarily bugs.",
].join("\n");
