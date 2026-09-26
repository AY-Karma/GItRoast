import type { RoastReport, RoastSummary } from "@/lib/types";

export const ROAST_PROMPT_VERSION = "gitroast-comedy-v2";

// Original editorial examples. Facts in these examples are fictional, not evidence.
export const COMEDY_EXAMPLES = [
  ["tiny-api: README calls it minimal; 47 runtime dependencies", "Lots of dependencies.", "tiny-api has 47 dependencies. Minimalism apparently ships separately."],
  ["commit subjects: fix, fix again, final fix", "Bad commit messages.", "fix, fix again, final fix: a trilogy that keeps renewing itself."],
  ["orbit: 900 stars; no repository description", "Add a description.", "orbit has 900 stars and no description. The audience has arrived; the premise is still in review."],
  ["cache-kit: archived, last release v2.0", "Abandoned project.", "cache-kit archived after v2.0. A repository that knows when to stop: deeply off-brand for this website."],
  ["profile: zero public repos; no visible commits", "You never code.", "Zero public repositories. The evidence locker is immaculate; the prosecution has requested read access."],
  ["parser: commit 'Reject invalid UTF-8 before parsing headers'", "Unclear commit.", "Reject invalid UTF-8 before parsing headers: parser brought both the change and the reason. Very inconsiderate to the roast department."],
  ["profile: 61/100, activity 90, presentation 20", "Improve documentation.", "61/100. Activity brought 90; presentation sent a placeholder on its behalf."],
  ["deploy-kit: README says zero configuration; setup lists 8 environment variables", "Too much setup.", "deploy-kit promises zero configuration, followed by eight environment variables. Zero has entered its experimental phase."],
  ["docs-tool: 100% repository description coverage", "Descriptions still need work.", "100% description coverage. docs-tool has closed the mystery department before this review could expense a detective."],
  ["one repository, Rust, 12 stars; nothing else inspected", "No tests or CI.", "Twelve stars for the Rust repository. A small review committee, but at least the compiler already left its comments."],
] as const;

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
    angles.push({ id: "score:imbalance", facts: [`${factors[0][0]} score ${factors[0][1]}`, `${factors[factors.length - 1][0]} score ${factors[factors.length - 1][1]}`], technique: "mock review ruling" });
  }
  if (!summary.repos.length) angles.push({ id: "profile:limited-evidence", facts: ["No original public repositories were available; private work is unknown"], technique: "roast the empty evidence locker, never infer ability" });
  return angles.slice(0, 8);
}

const STOP_WORDS = new Set("the a an is are was were and or to of in on for with this that has have had its it your you as at from by".split(" "));

/** Lexical repetition check, not a claim to measure humor or semantic similarity. */
export function repeatsJoke(value: string, previous: string[]) {
  const words = (text: string) => new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word && !STOP_WORDS.has(word)));
  const candidate = words(value);
  return previous.some((text) => {
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
  "Voice: gitroast[bot], a sharp pull-request reviewer with excellent comic timing. Dry, wicked, specific, never vulgar. Addressing 'your repository' is welcome; judging the human is not.",
  "Hard character limits: developerType 80, archetypeDescription 180, scoreRoast 220, each strength/weakness 240, each repository commentary 360, each commit commentary 320, redemption 480. Finish every punchline within its limit.",
  "Use supplied comedyAngles when useful. Each section owns a DIFFERENT fact/premise: profile = overall contradiction; repository = local detail; commit = wording; strength = reluctant approval; weakness = observable friction; score = score imbalance; redemption = one practical patch with at most one fresh callback.",
  "Vary understatement, misdirection, mock review rulings, absurd analogy, and escalation. Do not reuse the same setup, punchline, graveyard/archaeology metaphor, or missing-description joke across sections. A callback must add a new twist, not repeat a sentence.",
  "Before returning JSON, silently replace generic, repeated, unsupported, or merely insulting lines. Prefer a precise short punchline over adjective piles. Never copy example facts or sentences into the report.",
  "Use the original examples below as demonstrations of taste, not templates. Produce a short novel developerType describing the PUBLIC WORK pattern; do not simply reuse suggestedUniqueTitle.",
  "Good, archived, new, and sparse profiles need adaptive humor: reluctantly praise good work, respect completed projects, and joke about limited evidence when facts are missing. Missing public activity does not establish inactivity outside GitHub.",
  "Only inspected evidence supports README, dependency, release, test, CI, or configuration claims. An unavailable fetch is unknown, not an absent file. A missing repository description is NOT a missing README. Counts are not proof of code quality; stars are not users; open issues are not necessarily bugs.",
  `Original examples [facts, bland/incorrect, sharper]: ${JSON.stringify(COMEDY_EXAMPLES)}`,
].join("\n");
