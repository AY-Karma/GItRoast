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
  const primary = summary.repos[0];
  if (!primary) return `@${summary.username} supplied no original public repositories for inspection. The evidence locker has excellent negative space. Private work remains outside this review's jurisdiction.`;
  const opening = summary.inactiveRepos > 0
    ? `${summary.analyzedRepoCount} sampled originals; ${summary.inactiveRepos} have gone a year without a public push. The review now includes a waiting room.`
    : `${summary.analyzedRepoCount} sampled originals and none counted as quiet for a year. The prosecution would like less responsible source material.`;
  const project = primary.archived
    ? `${primary.name} is archived: a project that actually found the end of its roadmap.`
    : !primary.description?.trim() && primary.stars > 0
      ? `${primary.name} has ${primary.stars} stars and no repository description. The audience arrived before the introduction.`
      : choose(summary, "profile-project", [
          `${primary.name} brings ${primary.language ?? "an unspecified language"} and ${primary.stars} stars to the hearing. The compiler was not available for cross-examination.`,
          `${primary.name}: ${primary.stars} stars, ${primary.forks} forks. Even the metadata has invited witnesses.`
        ] as const);
  const commit = summary.commitSamples[0];
  const closing = commit
    ? isVagueCommit(commit)
      ? `The commit subject "${cleanSnippet(commit)}" has applied for witness protection.`
      : `Then "${cleanSnippet(commit)}" supplied actual context. Very inconvenient for the prosecution.`
    : `No recent public commit subjects were available. The transcript ends before anyone can object.`;
  return `${opening} ${project} ${closing}`;
}

export function repoAwareArchetype(summary: RoastSummary) {
  if (summary.repos.length < 2) return summary.repos.length
    ? `${summary.repos[0].name} is the sole original repository in this sample. The entire portfolio meeting fits in one tab.`
    : `@${summary.username} has supplied no original public repositories. An unusually minimalist submission to a code review.`;
  const flavor = buildRepoFlavor(summary);
  return choose(summary, "archetype", [
    `${flavor.primaryRepo} carries the plot; ${flavor.secondaryRepo} is the side quest still asking for another sprint.`,
    `${flavor.languageBlend} powers the profile, while ${flavor.primaryRepo} bravely pretends the other repos are part of the roadmap.`,
    `${flavor.primaryRepo} is the main character in a profile where every repository auditioned for the role.`
  ] as const);
}

export function repoAwareScoreRoast(summary: RoastSummary) {
  const flavor = buildRepoFlavor(summary);
  const factors = Object.entries(summary.scoreBreakdown) as Array<[keyof RoastSummary["scoreBreakdown"], number]>;
  const [strongest, strongestValue] = factors.reduce((best, factor) => factor[1] > best[1] ? factor : best);
  const [weakest, weakestValue] = factors.reduce((worst, factor) => factor[1] < worst[1] ? factor : worst);
  return choose(summary, "score-roast", [
    `${summary.profileScore}/100. ${flavor.primaryRepo} kept ${strongest} at ${strongestValue}; ${weakest} showed up with ${weakestValue} and no alibi.`,
    `${summary.profileScore}/100: enough signal to merge, enough ${weakest} debt (${weakestValue}) to keep the roast employed.`,
    `${strongest} did the carrying at ${strongestValue}. ${weakest} contributed ${weakestValue} and the confidence of an unreviewed hotfix.`
  ] as const);
}

export function repoAwareStrengths(summary: RoastSummary) {
  if (!summary.repos.length) return [
    `@${summary.username}'s public profile can be reviewed without pretending private work was inspected`,
    `${summary.totalContributions} visible contributions are recorded separately from the missing repository sample`,
    `No original public repositories means no invented repository defects. The review has discovered restraint`
  ];
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
  if (!summary.repos.length) return [
    `No original public repositories were available; the case against @${summary.username}'s code cannot proceed`,
    `Repository documentation is outside this empty sample. The reviewer has been asked to stop guessing`,
    `Private work is unknown. This review's jurisdiction ends at the public profile`
  ];
  const flavor = buildRepoFlavor(summary);
  const vagueCommit = summary.commitSamples.find(isVagueCommit);
  return [
    summary.inactiveRepos > 0
      ? `${summary.inactiveRepos} sampled repos have been silent for a year; archive them before GitHub starts carbon-dating the default branches`
      : `No sampled originals have a year-long public push gap. The inactivity allegation has been withdrawn`,
    summary.descriptionCoverage < 70
      ? `Only ${summary.descriptionCoverage}% of sampled original repos have descriptions; the rest shipped a guessing game as their onboarding flow`
      : `${summary.descriptionCoverage}% description coverage leaves little room for the usual missing-context allegation`,
    vagueCommit
      ? `“${cleanSnippet(vagueCommit)}” could use one noun explaining what changed and one clue explaining why`
      : summary.commitSamples.length
        ? `The commit subjects are annoyingly clear; mirror that context in the quieter repository descriptions`
        : `No public commit subjects were available, leaving the review timeline dramatically under-captioned`,
    `${flavor.primaryRepo}'s metadata is on the stand; its implementation has not been inspected. The roast cannot subpoena imaginary bugs`
  ].slice(0, 4);
}

export function repoAwareReceipts(summary: RoastSummary): RoastReceipt[] {
  const commit = summary.commitSamples[0];
  return [
    {
      title: "Repository archaeology",
      evidence: `${summary.inactiveRepos} of ${summary.analyzedRepoCount} sampled original repos have been quiet for over a year.`,
      punchline: summary.inactiveRepos === 0 ? "No year-quiet originals counted. The fossil exhibit has been cancelled for lack of exhibits." : choose(summary, "receipt-repos", [
        `The quiet repositories have turned the push calendar into a period piece.`,
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
      punchline: summary.descriptionCoverage >= 90 ? "The descriptions have supplied context. The mystery department has been made redundant." : choose(summary, "receipt-docs", [
        `A blank repository description leaves the premise as an exercise for the reader.`,
        `Visitors should not need repository forensics before deciding where to click.`,
        `Repository descriptions are the trailer. Some projects appear to be saving theirs for the sequel.`
      ] as const)
    }
  ];
}

export function repoAwareRedemption(summary: RoastSummary) {
  const primary = summary.repos[0];
  if (!primary) return `For @${summary.username}, choose a public project to share if appropriate. The review can wait; private work does not owe it an exhibit.`;
  if (!primary.description?.trim()) return `Start with ${primary.name}: add a one-sentence repository description explaining its purpose. Give the audience a premise before commissioning the sequel.`;
  if (summary.commitSamples.some(isVagueCommit)) return `For the next ${primary.name} commit, name the change and the reason. The diff deserves a caption, not a missing-person poster.`;
  if (summary.inactiveRepos > 0) return `Keep ${primary.name} as the starting point and check whether the year-quiet repositories should be marked complete, maintained, or archived. Status is cheaper than suspense.`;
  return `Keep ${primary.name}'s public context current as it evolves. No invented emergency patch: the roast will have to find honest work.`;
}

function isQuietRepo(pushedAt: string | null) {
  if (!pushedAt) return false;
  const pushedTime = new Date(pushedAt).getTime();
  return Number.isFinite(pushedTime) && Date.now() - pushedTime > 365 * 24 * 60 * 60 * 1000;
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

  const dependencies = repo.evidence?.runtimeDependencies;
  if (dependencies !== undefined && dependencies >= 20 && /\b(minimal|tiny|lightweight|zero.dependencies)\b/i.test(`${repo.description ?? ""} ${repo.evidence?.readmeExcerpt ?? ""}`)) {
    return choose(summary, `${salt}:dependencies`, [
      `${repo.name} promises minimalism with ${dependencies} runtime dependencies in package.json. The entourage would like separate billing.`,
      `${repo.name}: ${dependencies} runtime dependencies for the lightweight pitch. Apparently the adjective was measured before installation.`
    ] as const);
  }

  if (!repo.pushedAt || !Number.isFinite(new Date(repo.pushedAt).getTime())) {
    return `${repo.name} has ${repo.stars} stars and an unavailable public push date. The review declines to turn a missing timestamp into a retirement announcement.`;
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
