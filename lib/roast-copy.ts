import type { RepositoryRoast, RoastReceipt, RoastSummary } from "@/lib/types";

type RepoFlavorSummary = {
  languages: string[];
  repos: Array<{
    name: string;
    description: string | null;
    language: string | null;
    stars: number;
    pushedAt: string | null;
  }>;
};

function titleCase(input: string) {
  return input
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function cleanSnippet(input: string, maxLength = 88) {
  const clean = input.replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 1)}…` : clean;
}

function isVagueCommit(message: string) {
  const compact = message.trim().toLowerCase();
  return compact.length <= 18 || /^(fix|fixed|update|updated|changes|misc|stuff|wip|temp|final|cleanup)[.!]?$/.test(compact);
}

export function commitReviewStatus(message: string): "approved" | "changes-requested" {
  return isVagueCommit(message) ? "changes-requested" : "approved";
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function roastFingerprint(summary: RoastSummary) {
  return [
    summary.username.toLowerCase(),
    summary.repoCount,
    summary.inactiveRepos,
    summary.descriptionCoverage,
    summary.shippingScore,
    summary.repos.map((repo) => repo.name).join("|"),
    summary.commitSamples.join("|")
  ].join(":");
}

function choose<T>(summary: RoastSummary, salt: string, options: readonly T[]) {
  return options[stableHash(`${roastFingerprint(summary)}:${salt}`) % options.length];
}

function takeRepoNames(summary: RepoFlavorSummary) {
  return summary.repos.map((repo) => repo.name.trim()).filter(Boolean).slice(0, 6);
}

function takeRepoDescriptions(summary: RepoFlavorSummary) {
  return summary.repos
    .map((repo) => repo.description?.trim())
    .filter((description): description is string => Boolean(description))
    .slice(0, 4);
}

function languageBlend(summary: RepoFlavorSummary) {
  if (!summary.languages.length) return "mysterious-stack";
  if (summary.languages.length === 1) return summary.languages[0];
  return summary.languages.slice(0, 3).join(" + ");
}

export function buildRepoFlavor(summary: RepoFlavorSummary) {
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

export function repoAwareDeveloperType(summary: RoastSummary) {
  const flavor = buildRepoFlavor(summary);
  const subject = flavor.primaryRepo === "the public backlog" ? summary.username : flavor.primaryRepo;
  const role = choose(summary, "developer-type", [
    "Branch Whisperer",
    "Release Archaeologist",
    "Side-Quest Maintainer",
    "Diff Cartographer",
    "README Negotiator",
    "Hotfix Historian",
    "Merge Queue Romantic",
    "Refactor Curator"
  ] as const);
  return `${titleCase(subject).slice(0, 34)} ${role}`;
}

export function repoAwareRoast(summary: RoastSummary) {
  const flavor = buildRepoFlavor(summary);
  const repoSetup = summary.inactiveRepos > 0
    ? choose(summary, "inactive-setup", [
        `@${summary.username}'s profile has ${summary.repoCount} public repos, and ${summary.inactiveRepos} of the sampled originals have quietly entered long-term support.`,
        `${summary.repoCount} public repos made the roll call; ${summary.inactiveRepos} answered with an out-of-office message dated over a year ago.`,
        `The repository list is ${summary.repoCount} projects deep, with ${summary.inactiveRepos} sampled repos currently majoring in historical preservation.`
      ] as const)
    : `All ${summary.analyzedRepoCount} sampled original repos still show signs of life, which is suspiciously responsible behavior for GitHub.`;
  const projectLine = choose(summary, "project-line", [
    `${flavor.primaryRepo} is carrying the main plot while ${flavor.secondaryRepo} keeps asking whether this is a product roadmap or a very committed side quest.`,
    `${flavor.primaryRepo} has the confident name; ${flavor.secondaryRepo} has the energy of a tab that has been open since Tuesday.`,
    `Between ${flavor.primaryRepo} and ${flavor.secondaryRepo}, the ${flavor.languageBlend} stack is less a technology choice and more a group chat.`
  ] as const);
  const commit = summary.commitSamples[0];
  const commitLine = commit
    ? choose(summary, "commit-line", [
        `Then the commit subject “${cleanSnippet(commit)}” arrived and declined to provide an alibi.`,
        `The commit log contributed “${cleanSnippet(commit)}”, a complete sentence only in the legal sense.`,
        `A recent push was labelled “${cleanSnippet(commit)}”, which is exactly the amount of context future-you apparently deserved.`
      ] as const)
    : `The public commit trail brought no subjects to the hearing, so the repo names had to do all the comedic labor.`;

  return `${repoSetup} ${projectLine} ${commitLine}`;
}

export function repoAwareArchetype(summary: RoastSummary) {
  const flavor = buildRepoFlavor(summary);
  const activity = summary.recentActivityCount > 0
    ? `${summary.recentActivityCount} visible contributions in the recent window`
    : "a contribution graph practicing minimalism";
  return choose(summary, "archetype", [
    `A ${flavor.languageBlend} builder whose public universe revolves around ${flavor.primaryRepo}, ${flavor.secondaryRepo}, and ${activity}. The work is real; the filing system has improv energy.`,
    `Part maintainer, part side-quest curator: ${flavor.primaryRepo} gets the spotlight, ${flavor.secondaryRepo} gets the sequel tease, and the graph supplies ${activity}.`,
    `A public-work catalog powered by ${flavor.languageBlend}, anchored by ${flavor.primaryRepo}, and held together by the optimistic belief that every repo can become the main repo.`
  ] as const);
}

export function repoAwareStrengths(summary: RoastSummary) {
  const flavor = buildRepoFlavor(summary);
  const primary = summary.repos[0];
  return [
    primary?.stars
      ? `${flavor.primaryRepo} earned ${primary.stars.toLocaleString("en-US")} stars, so the internet has signed at least one approval review`
      : `${flavor.primaryRepo} gives the profile a recognizable main branch`,
    summary.totalContributions > 0
      ? `${summary.totalContributions.toLocaleString("en-US")} visible contributions prove this is shipping history, not just repo-name fan fiction`
      : `Keeps the public work focused enough that the signal is easy to read`,
    summary.languages.length > 1
      ? `Moves between ${summary.languages.slice(0, 3).join(", ")} without making the language list look accidental`
      : `Shows a clear point of view in ${summary.languages[0] ?? "the chosen stack"}`,
    flavor.repoDescriptions[0]
      ? `${flavor.primaryRepo} explains its purpose instead of making visitors reverse-engineer the elevator pitch`
      : `The strongest projects have enough identity to survive a missing tagline`
  ].slice(0, 4);
}

export function repoAwareWeaknesses(summary: RoastSummary) {
  const flavor = buildRepoFlavor(summary);
  const vagueCommit = summary.commitSamples.find(isVagueCommit);
  return [
    summary.inactiveRepos > 0
      ? `${summary.inactiveRepos} sampled repos need an archive badge, a status note, or a very small retirement party`
      : `The active repo list could still use clearer “start here” signposts`,
    summary.descriptionCoverage < 70
      ? `Only ${summary.descriptionCoverage}% of sampled original repos have descriptions; several projects are relying on telepathy`
      : `${summary.descriptionCoverage}% description coverage is solid, but ${flavor.secondaryRepo} can still tell visitors what success looks like`,
    vagueCommit
      ? `“${cleanSnippet(vagueCommit)}” could use one noun explaining what changed and one clue explaining why`
      : summary.commitSamples.length
        ? `The commit subjects are annoyingly clear; mirror that context in the quieter repository descriptions`
        : `No public commit subjects were available, leaving the review timeline dramatically under-captioned`,
    `${flavor.primaryRepo} deserves a crisp status section so the main project does not have to explain the whole profile alone`
  ].slice(0, 4);
}

export function repoAwareReceipts(summary: RoastSummary): RoastReceipt[] {
  const flavor = buildRepoFlavor(summary);
  const commit = summary.commitSamples[0];
  return [
    {
      title: "Repository archaeology",
      evidence: `${summary.inactiveRepos} of ${summary.analyzedRepoCount} sampled original repos have been quiet for over a year.`,
      punchline: choose(summary, "receipt-repos", [
        `${flavor.secondaryRepo} is not abandoned; it is preserving the exact moment the weekend ended.`,
        `That is less a backlog and more a carefully indexed fossil record.`,
        `The archive button has started drafting its own pull request.`
      ] as const)
    },
    {
      title: "Commit message exhibit",
      evidence: commit ? `Recent public subject: “${cleanSnippet(commit)}”` : "No recent public commit subjects were exposed by the profile.",
      punchline: commit
        ? isVagueCommit(commit)
          ? choose(summary, "receipt-commit-vague", [
              `Future maintainers have been given a clue, but it is the sort found in an escape room.`,
              `Technically searchable, spiritually a shrug.`,
              `The diff knows what happened and has chosen not to testify.`
            ] as const)
          : choose(summary, "receipt-commit-clear", [
              `Annoyingly defensible. The prosecution has moved on to the repository descriptions.`,
              `This subject brought context, intent, and punctuation. Very inconsiderate to the roast.`,
              `The commit message has receipts; the roast withdraws this charge without prejudice.`
            ] as const)
        : `The activity graph was present, but the commit captions invoked their right to remain silent.`
    },
    {
      title: "Documentation checksum",
      evidence: `${summary.descriptionCoverage}% description coverage across sampled original repositories.`,
      punchline: choose(summary, "receipt-docs", [
        `${flavor.primaryRepo} has a name; the quieter repos are still waiting for their one-sentence origin story.`,
        `Visitors should not need repository forensics before deciding where to click.`,
        `A README is documentation. A mysterious repo name is merely atmosphere.`
      ] as const)
    }
  ];
}

export function repoAwareRedemption(summary: RoastSummary) {
  const flavor = buildRepoFlavor(summary);
  const commitAdvice = summary.commitSamples[0]
    ? `give the next commit subject one clear “what” and one useful “why”`
    : "surface one recent change with a descriptive commit subject";
  return `Start with ${flavor.primaryRepo}: add a crisp status note, label or archive one quiet side quest, and ${commitAdvice}. Same personality, much easier archaeology.`;
}

function isQuietRepo(pushedAt: string | null) {
  if (!pushedAt) return true;
  const pushedTime = new Date(pushedAt).getTime();
  return !Number.isFinite(pushedTime) || Date.now() - pushedTime > 365 * 24 * 60 * 60 * 1000;
}

function repositoryReviewStatus(repo: RoastSummary["repos"][number]): RepositoryRoast["status"] {
  if (repo.archived) return "approved";
  if (!repo.description?.trim() || isQuietRepo(repo.pushedAt)) return "changes-requested";
  if (repo.stars >= 100 || repo.forks >= 10) return "approved";
  return "commented";
}

function repoCommentary(summary: RoastSummary, repo: RoastSummary["repos"][number]) {
  const salt = `repository-roast:${repo.name}`;

  if (repo.archived) {
    return choose(summary, `${salt}:archived`, [
      `${repo.name} is archived with dignity: one side quest that found an ending and remembered to close the tab.`,
      `${repo.name} completed its character arc and earned the Archive badge instead of pretending the roadmap is still loading.`,
      `${repo.name} is a finished exhibit, not an abandoned crime scene. The roast approves this unusually honest lifecycle state.`
    ] as const);
  }

  if (!repo.description?.trim()) {
    return choose(summary, `${salt}:description`, [
      `${repo.name} shipped without a description, so visitors receive a repo name and the confidence to invent the rest.`,
      `${repo.name} left its one-line pitch blank. The README is now doing witness protection for the premise.`,
      `${repo.name} has Public visibility and Private context, an ambitious new GitHub access model.`
    ] as const);
  }

  if (isQuietRepo(repo.pushedAt)) {
    return choose(summary, `${salt}:quiet`, [
      `${repo.name} has been quiet long enough that the latest push qualifies as repository archaeology.`,
      `${repo.name} still has a description, a language, and the unmistakable calm of a branch on sabbatical.`,
      `${repo.name} is not abandoned; it is preserving a historically accurate snapshot of the last productive weekend.`
    ] as const);
  }

  if (repo.stars >= 100) {
    return choose(summary, `${salt}:stars`, [
      `${repo.name} collected ${repo.stars.toLocaleString("en-US")} stars, so the internet has already reviewed this diff and clicked Approve.`,
      `${repo.name} has ${repo.stars.toLocaleString("en-US")} stars. The roast opened a review and immediately discovered it was outnumbered.`,
      `${repo.name} turned ${repo.language ?? "code"} into ${repo.stars.toLocaleString("en-US")} public approvals. Suspiciously competent; leaving one nit for tradition.`
    ] as const);
  }

  if (repo.openIssues >= 10) {
    return choose(summary, `${salt}:issues`, [
      `${repo.name} has ${repo.openIssues.toLocaleString("en-US")} open issues, which is less a queue and more a community-authored sequel plan.`,
      `${repo.name} is actively maintained and ${repo.openIssues.toLocaleString("en-US")} issue tabs would like a quick word with the sprint board.`,
      `${repo.name} keeps ${repo.openIssues.toLocaleString("en-US")} open conversations in flight. The issue tracker has become its own social network.`
    ] as const);
  }

  if (repo.forks > 0) {
    return choose(summary, `${salt}:forks`, [
      `${repo.name} inspired ${repo.forks.toLocaleString("en-US")} forks, proving at least a few developers preferred making a branch to filing a complaint.`,
      `${repo.name} has ${repo.forks.toLocaleString("en-US")} forks and a recent pulse; the side quest has accidentally acquired contributors.`,
      `${repo.name} escaped into ${repo.forks.toLocaleString("en-US")} forks. That is either adoption or a very distributed code review.`
    ] as const);
  }

  if (repo.defaultBranch === "master") {
    return choose(summary, `${salt}:default-branch`, [
      `${repo.name} keeps master on the default-branch sign. The code may be current; the lobby decor is period-correct.`,
      `${repo.name} still enters through master, a vintage branch label maintained with museum-grade consistency.`,
      `${repo.name} uses master as its default branch. No charge filed; the signage simply arrived from an earlier GitHub season.`
    ] as const);
  }

  if (!repo.topics.length) {
    return choose(summary, `${salt}:topics`, [
      `${repo.name} is active and described, but its topics have invoked metadata protection. Discovery is now a click-first experience.`,
      `${repo.name} passed the maintenance check and skipped the topic labels, leaving search to appreciate the mystery.`,
      `${repo.name} has context and recent work; only the topic shelf is empty enough to qualify as minimalist design.`
    ] as const);
  }

  return choose(summary, `${salt}:active`, [
    `${repo.name} is a recently active ${repo.language ?? "code"} repo with enough context to pass review. The roast reluctantly approves this file.`,
    `${repo.name} has a purpose, a recent push, and no obvious crime scene. Leaving a comment so the review still looks billable.`,
    `${repo.name} is quietly shipping in ${repo.language ?? "its chosen stack"}. No spectacle, just the deeply inconvenient presence of maintainable evidence.`
  ] as const);
}

export function repoAwareRepositoryRoasts(summary: RoastSummary): RepositoryRoast[] {
  return summary.repos.slice(0, 6).map((repo) => ({
    name: repo.name,
    commentary: repoCommentary(summary, repo),
    status: repositoryReviewStatus(repo)
  }));
}

export function repoAwareCommitCommentary(summary: RoastSummary, message: string) {
  const flavor = buildRepoFlavor(summary);
  const signal = summary.commitSignals.find((commit) => commit.message === message);
  const repo = signal?.repo ?? flavor.primaryRepo;
  const lower = message.toLowerCase();

  if (!isVagueCommit(message) && message.length >= 44) {
    return choose(summary, `commit-specific:${message}`, [
      `This is annoyingly specific. The roast tried to object, but ${repo} brought receipts.`,
      `${repo} supplied context, intent, and a useful noun. The prosecution reluctantly marks this one approved.`,
      `A genuinely useful subject from ${repo}; it has ruined an otherwise promising commit-message allegation.`
    ] as const);
  }

  if (/final/.test(lower)) {
    return `${repo} has accepted “final” as a temporary branch of philosophy. The diff may be done; the title is leaving room for a sequel.`;
  }
  if (/fix/.test(lower)) {
    return choose(summary, `commit-fix:${message}`, [
      `${repo} received a fix with the confidence of an emergency patch and the biography of a sticky note.`,
      `The good news: ${repo} got fixed. The mystery: future-you still has to discover what negotiated the ceasefire.`,
      `${repo} is healthier now; the commit log would like credit without discussing the incident.`
    ] as const);
  }
  if (/todo|wip|later|temp/.test(lower)) {
    return `${repo} has entered the “we will absolutely return to this” chapter, a beloved classic in serialized software.`;
  }
  if (message.length <= 12) {
    return `${repo} got a subject short enough for a badge and vague enough for a detective novel.`;
  }
  return choose(summary, `commit-default:${message}`, [
    `${repo} got a useful clue here; one extra phrase explaining why would turn it into actual evidence.`,
    `A respectable subject for ${repo}, though the diff is still doing most of the narrative heavy lifting.`,
    `${repo} can work with this. Future maintainers may still request subtitles.`
  ] as const);
}
