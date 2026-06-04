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

export function repoAwareEndorsements(summary: RoastSummary) {
  const flavor = buildRepoFlavor(summary);
  return [
    flavor.repoNames[0] ? `Naming a repo ${flavor.primaryRepo} and somehow making it stick` : "Starting side quests with confidence",
    flavor.repoNames[1] ? `Letting ${flavor.secondaryRepo} live rent-free in the contribution graph` : "Turning curiosity into public repos",
    summary.todoDensity > 0 ? "Writing TODO comments with emotional range" : "Keeping the codebase chronically optimistic",
    `Demonstrating ${flavor.languageBlend}`
  ].slice(0, 4);
}

export function repoAwareTestimonials(summary: RoastSummary) {
  const flavor = buildRepoFlavor(summary);
  return [
    {
      quote: flavor.repoNames[0]
        ? `I opened ${flavor.primaryRepo} expecting a README and found a whole personality crisis instead.`
        : "I clicked one repo and somehow inherited a philosophy.",
      by: "Future Teammates"
    },
    {
      quote: flavor.repoDescriptions[0]
        ? `The description was confident. The codebase was still in beta emotionally.`
        : "The repo names are doing more work than the commits.",
      by: "A Reluctant Reviewer"
    },
    {
      quote: summary.inactiveRepos > 0
        ? `There are enough quiet repos here to start a museum exhibit.`
        : "At least the repos are alive enough to gossip.",
      by: "Release Engineering"
    }
  ].slice(0, 4);
}

export function repoAwareCommitCommentary(summary: RoastSummary, message: string) {
  const flavor = buildRepoFlavor(summary);
  const lower = message.toLowerCase();

  if (/final/.test(lower)) {
    return flavor.repoNames[0]
      ? `${flavor.primaryRepo} is carrying the emotional weight of this "final" version, which looks suspiciously like version 4.`
      : "The word final is doing way too much freelance work here.";
  }

  if (/fix/.test(lower)) {
    return `A tiny emergency patch from the ${flavor.languageBlend} era, where the repo was still winning arguments with itself.`;
  }

  if (/todo|wip|later|temp/.test(lower)) {
    return flavor.repoNames[1]
      ? `${flavor.secondaryRepo} has clearly entered the "we will definitely come back to this" chapter.`
      : "This commit is a sticky note with Git credentials.";
  }

  if (message.length <= 12) {
    return flavor.repoNames[0]
      ? `Short enough to fit on a screenshot, vague enough to keep ${flavor.primaryRepo} legally mysterious.`
      : "Minimal text, maximal unreadable energy.";
  }

  return flavor.repoDescriptions[0]
    ? `This reads like it was written in the same mood as "${flavor.repoDescriptions[0]}".`
    : `A commit that feels native to the repo's personality, which is somehow the funniest part.`;
}

