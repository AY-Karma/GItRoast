import type { RoastSummary } from "@/lib/types";

function titleCase(input: string) {
  return input
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function takeRepoNames(summary: RoastSummary) {
  return summary.repos
    .map((repo) => repo.name)
    .filter(Boolean)
    .slice(0, 6)
    .map(titleCase);
}

function takeRepoDescriptions(summary: RoastSummary) {
  return summary.repos
    .map((repo) => repo.description?.trim())
    .filter((description): description is string => Boolean(description))
    .slice(0, 4);
}

function languageBlend(summary: RoastSummary) {
  if (!summary.languages.length) return "mysterious stack discipline";
  if (summary.languages.length === 1) return `${summary.languages[0]} tunnel vision`;
  return `${summary.languages.slice(0, 3).join(", ")} fluency with zero respect for boundaries`;
}

export function buildRepoFlavor(summary: RoastSummary) {
  const repoNames = takeRepoNames(summary);
  const repoDescriptions = takeRepoDescriptions(summary);
  const primaryRepo = repoNames[0] ?? "the public backlog";
  const secondaryRepo = repoNames[1] ?? primaryRepo;
  const tertiaryRepo = repoNames[2] ?? secondaryRepo;

  return {
    primaryRepo,
    secondaryRepo,
    tertiaryRepo,
    repoNames,
    repoDescriptions,
    languageBlend: languageBlend(summary)
  };
}

export function repoAwareRoast(summary: RoastSummary) {
  const flavor = buildRepoFlavor(summary);
  return `${summary.username} has a GitHub that reads like a split personality between ${flavor.primaryRepo}, ${flavor.secondaryRepo}, and ${flavor.languageBlend}. The repos are doing the talking, and most of them are asking for a cleanup PR that never arrived.`;
}

export function repoAwareArchetype(summary: RoastSummary) {
  const flavor = buildRepoFlavor(summary);
  return `A developer whose public universe revolves around ${flavor.primaryRepo} and whatever side quest became ${flavor.secondaryRepo}. The stack choices are bold, the naming is personal, and the repo list has the energy of a very committed draft folder.`;
}

export function repoAwareStrengths(summary: RoastSummary) {
  const flavor = buildRepoFlavor(summary);
  const repoNames = flavor.repoNames;
  return [
    repoNames[0] ? `Gives ${repoNames[0]} real main-character energy` : "Starts with enough conviction to create momentum",
    repoNames[1] ? `Can make ${repoNames[1]} sound like a product instead of a weekend decision` : "Explores ideas quickly and with confidence",
    flavor.repoDescriptions[0]
      ? `Some repos actually explain themselves: "${flavor.repoDescriptions[0]}"`
      : "Knows when a repo needs a name with actual personality",
    `Comfortable shipping across ${summary.languages.length ? summary.languages.join(" and ") : "whatever language showed up"}`
  ].slice(0, 4);
}

export function repoAwareWeaknesses(summary: RoastSummary) {
  const flavor = buildRepoFlavor(summary);
  return [
    flavor.repoNames[0]
      ? `${flavor.primaryRepo} sounds like it was renamed at least twice in a moment of optimism`
      : "Names occasionally feel like they were chosen under duress",
    summary.inactiveRepos > 0
      ? `${summary.inactiveRepos} repos are still waiting for a sequel nobody scheduled`
      : "A few more finish lines would make the whole story louder",
    summary.readmeCoverage < 60
      ? "Several repos are running on vibes where documentation should be"
      : "The READMEs are trying, but the repos still have secrets",
    summary.avgCommitLength <= 14
      ? "Commit messages sometimes behave like texted apologies"
      : "Commit messages explain just enough to be suspicious"
  ].slice(0, 4);
}

// Deterministic rotation helper — picks a stable index from a string so two commits
// of the same vibe category don't always land on the exact same line.
function stableIndex(seed: string, poolSize: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % poolSize;
}

export function repoAwareCommitCommentary(summary: RoastSummary, message: string) {
  const flavor = buildRepoFlavor(summary);
  const lower = message.toLowerCase();
  const trimmed = message.trim();

  // ── 1. README / docs ──────────────────────────────────────────────────────
  if (/readme|docs?(?!\w)|documentation|changelog|licence|license/.test(lower)) {
    const lines = [
      `Updating the README without touching the code is the literary equivalent of rearranging furniture while ${flavor.primaryRepo} is on fire.`,
      `A documentation commit. The bravest thing ${flavor.primaryRepo} has seen all week, and simultaneously the least load-bearing.`,
      `Someone remembered the README existed. This happens roughly as often as a solar eclipse.`,
      `The docs changed. The code did not. ${flavor.primaryRepo} is now better described and equally broken.`
    ];
    return lines[stableIndex(message, lines.length)];
  }

  // ── 2. Typo / spelling ────────────────────────────────────────────────────
  if (/typo|speling|speeling|misspell|grammer|gramm?ati|wording|phrasing/.test(lower)) {
    return flavor.repoNames[0]
      ? `The grammar police raided ${flavor.primaryRepo} and this commit is the plea deal. The code still has no comment.`
      : "Fixing a typo is a valid contribution. Whether it was the most urgent issue is a whole separate trial.";
  }

  // ── 3. "final" version ────────────────────────────────────────────────────
  if (/final/.test(lower)) {
    return flavor.repoNames[0]
      ? `${flavor.primaryRepo} is carrying the emotional weight of this "final" version, which looks suspiciously like version 4.`
      : "The word final is doing way too much freelance work here.";
  }

  // ── 4. Revert ─────────────────────────────────────────────────────────────
  if (/^revert/.test(lower)) {
    return flavor.repoNames[0]
      ? `Reverting a commit in ${flavor.primaryRepo} is the engineering equivalent of saying "never mind" in a very loud room full of very patient colleagues.`
      : "A revert. The git log's way of admitting the previous commit had unresolved feelings.";
  }

  // ── 5. Merge commit ───────────────────────────────────────────────────────
  if (/^merge(?:d|ing)?[\s:]/.test(lower) || /merge (branch|pull request|pr)\b/.test(lower)) {
    return flavor.repoNames[1]
      ? `Two branches walk into ${flavor.secondaryRepo}. One of them had conflicts. They both pretend they didn't.`
      : "A merge commit. Two timelines collided and agreed to split the blame evenly.";
  }

  // ── 6. Init / first commit ────────────────────────────────────────────────
  if (/^init(?:ial)?(?:\s|$)|initial commit|first commit|^start(?:\s|$)|^bootstrap/.test(lower)) {
    return summary.repoCount > 10
      ? `Commit number one of what ${summary.repoCount} public repos suggest is a very ambitious ongoing series.`
      : flavor.repoNames[0]
        ? `Every empire starts with a single commit. ${flavor.primaryRepo} started here. The README came much, much later.`
        : "The origin story. Whether chapter two arrived on schedule is a different kind of question.";
  }

  // ── 7. Hotfix / emergency ─────────────────────────────────────────────────
  if (/hotfix|hot[\s-]?fix|urgent|asap|emergency|critical|broke(?:n)?(?!\w)|on\s?fire/.test(lower)) {
    return flavor.repoNames[0]
      ? `"${flavor.primaryRepo} — hotfix deployed." No context, no changelog, maximum adrenaline. Classic.`
      : "The word hotfix carries the same energy as running in flip-flops. Gets there, but at what cost.";
  }

  // ── 8. Desperation / emotion ──────────────────────────────────────────────
  if (/please|finally|why(?:\s|$)|oh\s?no|it\s?works|worked|🙏|🤞|bruh|lol\b|wtf|omg|ugh|sigh|help/.test(lower)) {
    const lines = [
      `This commit message has the emotional fingerprint of a developer negotiating with their own laptop at 1 am.`,
      `A single "finally" in a commit message contains more trauma than an entire post-mortem document.`,
      `The excitement of "it works" followed by no explanation of what "it" is or why it stopped working previously.`,
      `When the commit message sounds like a text to a therapist, the codebase has entered its main character era.`
    ];
    return lines[stableIndex(message, lines.length)];
  }

  // ── 9. TODO / WIP / temp ──────────────────────────────────────────────────
  if (/\btodo\b|wip\b|later\b|\btemp\b|temporary|placeholder|stub\b/.test(lower)) {
    return flavor.repoNames[1]
      ? `${flavor.secondaryRepo} has clearly entered the "we will definitely come back to this" chapter. The chapter has no estimated publication date.`
      : "This commit is a sticky note with Git credentials and absolutely no follow-up scheduled.";
  }

  // ── 10. Refactor ──────────────────────────────────────────────────────────
  if (/refactor|restructur|reorgani[sz]e?|rework|rewrite|overhaul/.test(lower)) {
    return flavor.repoNames[0]
      ? `A refactor commit in ${flavor.primaryRepo} with no tests mentioned. That's not cleaning up — that's redecorating the cockpit mid-flight.`
      : `Refactoring without a test suite is just moving the bugs into a cleaner directory structure.`;
  }

  // ── 11. Style / lint / format ─────────────────────────────────────────────
  if (/\blint\b|style\b|format(?:ting)?|prettier|eslint|whitespace|spacing|indent|trailing/.test(lower)) {
    return `Lint and formatting fixes committed alone, unaccompanied by any logic changes. A spiritual cleanse — ${flavor.languageBlend} purified of its sins, at least syntactically.`;
  }

  // ── 12. Tests ─────────────────────────────────────────────────────────────
  if (/\btest(?:s|ing)?\b|spec\b|coverage|jest|vitest|unit\s?test|e2e|cypress/.test(lower)) {
    return summary.todoDensity > 20
      ? `Tests added! ${flavor.primaryRepo} is growing up. The TODO count suggests the tests are currently outnumbered, but it's a start.`
      : flavor.repoNames[0]
        ? `Actual tests in ${flavor.primaryRepo}. Not a TODO comment about writing tests someday. Actual tests. Respect.`
        : "Tests committed. The test coverage metric is now a real number instead of a philosophical concept.";
  }

  // ── 13. Version bump / release ────────────────────────────────────────────
  if (/^v\d|bump\s+version|version\s+bump|release\s+\d|\bchore[:\s].*version|^chore.*bump/.test(lower)) {
    return `Version bumped. The number went up. The CHANGELOG did not follow. ${summary.shippingScore < 60 ? "Par for the course." : "At least it shipped."}`;
  }

  // ── 14. Config / env / settings ───────────────────────────────────────────
  if (/config(?:ure)?|\.env\b|settings|dotenv|\.ya?ml|\.json\b|environment\b|env\s+var/.test(lower)) {
    return `A config commit. The diff nobody reads and everyone inherits. The ${flavor.languageBlend} stack now has one more undocumented environment variable and nobody knows what it does.`;
  }

  // ── 15. Add / new feature ─────────────────────────────────────────────────
  if (/^add(?:ed|s)?[\s:]|^feat(?:ure)?[\s(:]|^new[\s:]|^implement(?:ed)?/.test(lower)) {
    return flavor.repoNames[0]
      ? `New feature landed in ${flavor.primaryRepo}. Whether it survived the next three commits is a separate archaeological question.`
      : "A feature commit. Brimming with optimism, unburdened by a matching test file.";
  }

  // ── 16. Remove / delete / clean ───────────────────────────────────────────
  if (/^remov(?:e|ed|ing)|^delet(?:e|ed|ing)|^drop[\s:]|^strip[\s:]|dead\s?code|unused/.test(lower)) {
    return flavor.repoNames[0]
      ? `Something was removed from ${flavor.primaryRepo}. The codebase is slightly lighter now — emotionally and technically.`
      : "Deleting code is the only programming activity that makes a codebase unconditionally better. This is brave.";
  }

  // ── 17. Fix (general) ─────────────────────────────────────────────────────
  if (/\bfix(?:e[sd]|ing)?\b|bugfix|patch\b|resolve[sd]?\b|repair/.test(lower)) {
    return `A fix from the ${flavor.languageBlend} era, where the repo was still winning arguments with itself. The bug is gone. The root cause is now a comment that says "not sure why this works."`;
  }

  // ── 18. Vague single-word or ≤10 chars ───────────────────────────────────
  if (!trimmed.includes(" ") && trimmed.length <= 10) {
    return flavor.repoNames[0]
      ? `One word. No context. "${trimmed}" is keeping ${flavor.primaryRepo}'s secrets safer than any private repo ever could.`
      : "One word. No context. The git log equivalent of leaving a sticky note that just says 'you know.'";
  }

  // ── 19. Update spam (catches typos like "upfate" too) ─────────────────────
  if (/^updat[ei]|^upfat[ei]|^updte|^update[sd]?[\s:]/.test(lower)) {
    const lines = [
      `"Update" — the commit message that technically says everything and specifically says nothing. ${flavor.primaryRepo} deserved better.`,
      `Twelve words in the message and the only meaningful one is "update". The diff was the only witness.`,
      `Update commits are the git equivalent of replying "noted" to an email. Acknowledged. Unexplained. Moving on.`,
      `The commit starts with "update" which is the developer's way of saying "I changed stuff and I'm at peace with the ambiguity."`
    ];
    return lines[stableIndex(message, lines.length)];
  }

  // ── 20. Short message ─────────────────────────────────────────────────────
  if (message.length <= 12) {
    return flavor.repoNames[0]
      ? `Short enough to fit on a screenshot, vague enough to keep ${flavor.primaryRepo} legally mysterious.`
      : "Minimal text, maximal unreadable energy.";
  }

  // ── Catch-all: rotating pool of 4 distinct witty lines ────────────────────
  const catchAll = [
    flavor.repoNames[0]
      ? `This commit arrived in ${flavor.primaryRepo} without a roadmap, a rationale, or a reviewer. Just vibes and a timestamp.`
      : `A commit that exists. That's the whole story. The diff has more personality than the message.`,
    summary.inactiveRepos > 0
      ? `Filed quietly between ${summary.inactiveRepos} other repos that also have unfinished business. ${flavor.primaryRepo} is in good company.`
      : `The commit message raises more questions than the diff answers. ${flavor.languageBlend} continues.`,
    flavor.repoNames[1]
      ? `Somewhere between ${flavor.primaryRepo} and ${flavor.secondaryRepo}, a commit happened. This is that commit.`
      : `A commit that feels native to the repo's personality — which is somehow the most unsettling part.`,
    summary.repoCount > 5
      ? `Across ${summary.repoCount} public repos, this commit stands out for being impossible to categorise, which is its own kind of achievement.`
      : `The commit message is keeping its intentions private. The ${flavor.languageBlend} stack nods knowingly.`
  ];
  return catchAll[stableIndex(message, catchAll.length)];
}

