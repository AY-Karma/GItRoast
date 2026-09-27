import type { RoastReceipt, RoastReport, RoastSummary } from "@/lib/types";
import { commitReviewStatus } from "@/lib/roast-copy";

type Repo = RoastSummary["repos"][number];
type Angle = {
  id: string;
  subject: string;
  evidence: string;
  line: string;
  headline?: string;
  reference?: string;
  fix?: string;
  priority: number;
  tone: "charge" | "credit";
  sourceUrl?: string;
};

const quote = (value: string) => `“${value.replace(/\s+/g, " ").slice(0, 72)}”`;
const variant = <T,>(seed: string, options: T[]): T => {
  let hash = 2166136261;
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return options[(hash >>> 0) % options.length];
};
const quiet = (repo: Repo) => !repo.archived && repo.pushedAt !== null &&
  Number.isFinite(Date.parse(repo.pushedAt)) && Date.now() - Date.parse(repo.pushedAt) > 365 * 86400_000;
const smallClaim = (repo: Repo) => /\b(minimal|tiny|lightweight|zero.dependencies)\b/i.test(`${repo.description ?? ""} ${repo.evidence?.readmeExcerpt ?? ""}`);

export function selectCommitSubjects(summary: RoastSummary) {
  const subjects = [...new Set([
    ...summary.repos.map((repo) => repo.evidence?.recentCommit?.subject).filter((subject): subject is string => Boolean(subject)),
    ...summary.commitSamples
  ])];
  const selected: string[] = [];
  const add = (subject: string | undefined) => { if (subject && !selected.includes(subject)) selected.push(subject); };
  add(subjects.find((subject) => commitReviewStatus(subject) === "changes-requested"));
  add(subjects.find((subject) => commitReviewStatus(subject) === "approved"));
  const repoFor = (subject: string) => summary.repos.find((repo) => repo.evidence?.recentCommit?.subject === subject)?.name ??
    summary.commitSignals.find((signal) => signal.message === subject)?.repo;
  const firstRepo = selected[0] ? repoFor(selected[0]) : undefined;
  add(subjects.find((subject) => repoFor(subject) !== firstRepo));
  for (const subject of subjects) { if (selected.length === 3) break; add(subject); }
  return selected.slice(0, 3);
}

/** Observations are deliberately narrower than claims about source quality or private work. */
export function buildEditorialAngles(summary: RoastSummary): Angle[] {
  const angles: Angle[] = [];
  for (const repo of summary.repos.slice(0, 6)) {
    const inspectedCommit = repo.evidence?.recentCommit;
    if (inspectedCommit && commitReviewStatus(inspectedCommit.subject) === "changes-requested" &&
        (inspectedCommit.additions + inspectedCommit.deletions >= 40 || inspectedCommit.filesShown >= 3)) {
      const scope = `${inspectedCommit.additions} additions, ${inspectedCommit.deletions} deletions, and ${inspectedCommit.filesShown} file${inspectedCommit.filesShown === 1 ? "" : "s"} shown`;
      angles.push({
        id: `${repo.name}:commit-scope`, subject: repo.name, priority: 110, tone: "charge",
        sourceUrl: inspectedCommit.url,
        evidence: `${repo.name}'s inspected commit ${inspectedCommit.sha.slice(0, 7)} is titled ${quote(inspectedCommit.subject)}; GitHub reports ${scope}. The patch contents were not reviewed.`,
        line: variant(`${summary.username}:${repo.name}:scope-line`, [
          `${repo.name} put ${scope} under ${quote(inspectedCommit.subject)}. That's a headline written with the lights off.`,
          `${quote(inspectedCommit.subject)} covered ${scope} in ${repo.name}. The subject is withholding the plot from its own change log.`
        ]),
        headline: variant(`${summary.username}:${repo.name}:scope-head`, [
          `${repo.name} filed ${scope} under ${quote(inspectedCommit.subject)}. That's not a summary; that's a blackout notice.`,
          `${quote(inspectedCommit.subject)} is how ${repo.name} explains ${scope}. The commit title did less work than any file in the change.`
        ]),
        reference: `${repo.name} called ${scope} ${quote(inspectedCommit.subject)}. A heist film could get away with that title; a commit log cannot.`,
        fix: `Give ${repo.name}'s next commit subject the actual change and reason; ${quote(inspectedCommit.subject)} hides both.`
      });
    }
    const dependencies = repo.evidence?.runtimeDependencies;
    if (dependencies !== undefined && dependencies >= 20 && smallClaim(repo)) angles.push({
      id: `${repo.name}:minimal-dependencies`, subject: repo.name, priority: 100, tone: "charge",
      sourceUrl: `${repo.url}/blob/${encodeURIComponent(repo.defaultBranch)}/package.json`,
      evidence: `${repo.name} describes itself as minimal or lightweight; root package.json declares ${dependencies} runtime dependencies.`,
      line: variant(`${summary.username}:${repo.name}:deps-line`, [
        `${repo.name} calls itself lightweight while declaring ${dependencies} runtime dependencies. The only thing minimal is the disclosure.`,
        `${dependencies} runtime dependencies in ${repo.name}'s minimal pitch. The marketing copy weighs less than the install.`
      ]),
      headline: variant(`${summary.username}:${repo.name}:deps-head`, [
        `${repo.name} promises minimalism and brings ${dependencies} runtime dependencies. That claim didn't survive opening package.json.`,
        `${dependencies} runtime dependencies in ${repo.name}'s "lightweight" project. The adjective needs a fact-checker.`
      ]),
      reference: `${repo.name} calls itself minimal with ${dependencies} runtime dependencies. Tolkien would have called that a fellowship, not a footprint.`,
      fix: `For ${repo.name}, trim the runtime dependency list or make the scope claim honest.`
    });
    if (dependencies !== undefined && dependencies <= 2 && smallClaim(repo)) angles.push({
      id: `${repo.name}:minimal-delivered`, subject: repo.name, priority: 76, tone: "credit",
      sourceUrl: `${repo.url}/blob/${encodeURIComponent(repo.defaultBranch)}/package.json`,
      evidence: `${repo.name} describes itself as minimal or lightweight; its inspected root package.json declares ${dependencies} runtime dependencies.`,
      line: `${repo.name} calls itself minimal and lists ${dependencies} runtime dependencies. Annoyingly, the manifest backs up the pitch.`,
      headline: `${repo.name} promised minimalism and declared ${dependencies} runtime dependencies. This review opened package.json expecting a lie and found restraint.`
    });
    if (!repo.description?.trim()) angles.push({
      id: `${repo.name}:missing-description`, subject: repo.name, priority: repo.stars >= 20 ? 80 : repo.selectionReasons?.includes("Newest") ? 55 : 32, tone: "charge",
      sourceUrl: repo.url,
      evidence: `${repo.name} has ${repo.stars} stars and no repository description.`,
      line: repo.stars >= 20
        ? variant(`${summary.username}:${repo.name}:desc-line`, [
          `${repo.name} has ${repo.stars} stars and no description. An audience showed up; the project still refuses to introduce itself.`,
          `${repo.name} convinced ${repo.stars} people to star it and couldn't spare one sentence for the next visitor.`
        ])
        : `${repo.name} went public without a description. The URL is apparently expected to give the pitch.`,
      headline: repo.stars >= 20
        ? variant(`${summary.username}:${repo.name}:desc-head`, [
          `${repo.name} has ${repo.stars} stars and no description. Popular enough for an audience, too mysterious for one sentence.`,
          `${repo.name} collected ${repo.stars} stars while leaving its description blank. The project has fans and still won't say what it does.`
        ])
        : `${repo.name} is public with a blank description. That's a launch announcement made entirely of silence.`,
      reference: repo.stars >= 20 ? `${repo.name} has ${repo.stars} stars and no description. Even a blockbuster puts something on the poster besides the title.` : undefined,
      fix: `Add a one-sentence repository description to ${repo.name} that says what it does.`
    });
    if (quiet(repo)) angles.push({
      id: `${repo.name}:quiet`, subject: repo.name, priority: repo.selectionReasons?.includes("Oldest") ? 48 : 36, tone: "charge",
      sourceUrl: repo.url,
      evidence: `${repo.name} is unarchived; its last public push was ${repo.pushedAt!.slice(0, 10)}.`,
      line: variant(`${summary.username}:${repo.name}:quiet-line`, [
        `${repo.name} has no public push since ${repo.pushedAt!.slice(0, 10)} and remains unarchived. Its status says "ongoing"; its calendar filed a dissent.`,
        `${repo.name} last had a public push on ${repo.pushedAt!.slice(0, 10)}. Leaving it unarchived is a very long way to avoid writing "finished."`
      ]),
      headline: variant(`${summary.username}:${repo.name}:quiet-head`, [
        `${repo.name} is unarchived, but its last public push was ${repo.pushedAt!.slice(0, 10)}. The lifecycle story needs an ending.`,
        `${repo.name} has been unarchived since a ${repo.pushedAt!.slice(0, 10)} public push. The archive button isn't an admission of defeat; this silence might be.`
      ]),
      reference: `${repo.name}'s last public push was ${repo.pushedAt!.slice(0, 10)}, yet it remains unarchived. Rip Van Winkle had a shorter status update.`,
      fix: `Mark ${repo.name} as complete, archive it, or update its maintenance status.`
    });
    if (quiet(repo) && repo.stars >= 50) angles.push({
      id: `${repo.name}:popular-stale`, subject: repo.name, priority: 98, tone: "charge",
      sourceUrl: repo.url,
      evidence: `${repo.name} has ${repo.stars} stars, remains unarchived, and last had a public push on ${repo.pushedAt!.slice(0, 10)}.`,
      line: `${repo.name} has ${repo.stars} stars and no public push since ${repo.pushedAt!.slice(0, 10)}. The audience is still here; the project status left without saying goodbye.`,
      headline: `${repo.name} earned ${repo.stars} stars and last saw a public push on ${repo.pushedAt!.slice(0, 10)}. An audience deserves a maintenance answer, not a permanently open tab.`,
      fix: `Publish a maintenance status for ${repo.name}, or archive it if its work is complete.`
    });
    if (repo.selectionReasons?.includes("Oldest") && repo.createdAt && repo.pushedAt && !quiet(repo) &&
        Date.now() - Date.parse(repo.createdAt) > 5 * 365 * 86_400_000 && !repo.archived) angles.push({
      id: `${repo.name}:old-survivor`, subject: repo.name, priority: 55, tone: "credit",
      sourceUrl: repo.url,
      evidence: `${repo.name} was created ${repo.createdAt.slice(0, 10)} and had a public push ${repo.pushedAt.slice(0, 10)}; commit authorship was not inferred.`,
      line: variant(`${summary.username}:${repo.name}:old-line`, [
        `${repo.name} dates to ${repo.createdAt.slice(0, 4)} and still had a public push ${repo.pushedAt.slice(0, 10)}. The old project is outlasting the excuses made for newer ones.`,
        `${repo.name} survived from ${repo.createdAt.slice(0, 4)} to a ${repo.pushedAt.slice(0, 10)} public push. The legacy label isn't an excuse here; it's a challenge.`
      ]),
      headline: variant(`${summary.username}:${repo.name}:old-head`, [
        `${repo.name} started in ${repo.createdAt.slice(0, 4)} and still had a public push ${repo.pushedAt.slice(0, 10)}. The oldest project refuses to become a museum exhibit.`,
        `${repo.name} dates back to ${repo.createdAt.slice(0, 4)} and still saw a public push ${repo.pushedAt.slice(0, 10)}. The oldest project is embarrassing the disposable ones.`
      ])
    });
    if (repo.selectionReasons?.includes("Newest") && repo.createdAt &&
        Date.now() - Date.parse(repo.createdAt) < 90 * 86_400_000 && repo.stars >= 10 && repo.description?.trim()) angles.push({
      id: `${repo.name}:fresh-traction`, subject: repo.name, priority: 73, tone: "credit",
      sourceUrl: repo.url,
      evidence: `${repo.name} was created ${repo.createdAt.slice(0, 10)}, has ${repo.stars} stars, and includes a repository description.`,
      line: `${repo.name} is new, already has ${repo.stars} stars, and explains itself. The launch did the unfashionable thing: made sense.`,
      headline: `${repo.name} was created ${repo.createdAt.slice(0, 10)} and already has ${repo.stars} stars plus a description. A fresh project with an actual introduction—how inconsiderate.`
    });
    if (repo.selectionReasons?.includes("Newest") && repo.createdAt &&
        Date.now() - Date.parse(repo.createdAt) > 365 * 86_400_000) angles.push({
      id: `${repo.name}:newest-age`, subject: repo.name, priority: 57, tone: "charge",
      sourceUrl: repo.url,
      evidence: `${repo.name} is the newest created original in the bounded repository sample; it was created ${repo.createdAt.slice(0, 10)}. Private or unsampled work is unknown.`,
      line: `${repo.name} is the newest selected original, created ${repo.createdAt.slice(0, 10)}. The "new work" shelf needs a newer label.`,
      headline: `${repo.name} is the newest selected original and dates to ${repo.createdAt.slice(0, 10)}. The public portfolio's latest chapter already qualifies for a reprint.`,
      fix: `Publish newer public work when ready, or keep ${repo.name}'s current purpose and status clear.`
    });
    if (repo.openIssues >= 30) angles.push({
      id: `${repo.name}:issues`, subject: repo.name, priority: 59, tone: "charge",
      sourceUrl: `${repo.url}/issues`,
      evidence: `GitHub reports ${repo.openIssues} open issue/PR items for ${repo.name}; their contents were not inspected.`,
      line: `${repo.name} has ${repo.openIssues} open issue/PR items. The queue has outgrown the one-line promise that everything is under control.`,
      headline: `${repo.name} has ${repo.openIssues} open issue/PR items. The tracker is becoming the product's most active feature.`,
      fix: `Triage the open issue/PR queue in ${repo.name} so its status is visible.`
    });
    if (repo.archived) angles.push({
      id: `${repo.name}:archived`, subject: repo.name, priority: 72, tone: "credit",
      sourceUrl: repo.url,
      evidence: `${repo.name} is marked archived.`,
      line: `${repo.name} is archived. A clean ending is more credible than an eternal "coming soon."`,
      headline: `${repo.name} is archived. Finally, a project that knows a finished story doesn't need a fake cliffhanger.`,
      reference: `${repo.name} is archived. Not every project needs the Fast & Furious release schedule.`,
    });
    if (repo.evidence?.latestRelease) angles.push({
      id: `${repo.name}:release`, subject: repo.name, priority: 76, tone: "credit",
      sourceUrl: `${repo.url}/releases`,
      evidence: `${repo.name} has an inspected latest release tagged ${repo.evidence.latestRelease.tag}.`,
      line: variant(`${summary.username}:${repo.name}:release-line`, [
        `${repo.name} shipped ${repo.evidence.latestRelease.tag}. The tag did something rare here: it brought a receipt.`,
        `${repo.name} published ${repo.evidence.latestRelease.tag}. The release page has more follow-through than most roadmaps.`
      ]),
      headline: variant(`${summary.username}:${repo.name}:release-head`, [
        `${repo.name} published ${repo.evidence.latestRelease.tag}. An actual release is a terrible inconvenience for a reviewer hunting vaporware.`,
        `${repo.name} shipped ${repo.evidence.latestRelease.tag}. The review came ready to mock an endless beta and found a finished version instead.`
      ]),
    });
    if (repo.stars >= 100 && repo.description?.trim()) angles.push({
      id: `${repo.name}:audience`, subject: repo.name, priority: 43, tone: "credit",
      sourceUrl: repo.url,
      evidence: `${repo.name} has ${repo.stars} stars and a repository description.`,
      line: `${repo.name} has ${repo.stars} stars and a description. It made people care and bothered to tell newcomers why. Annoyingly competent.`,
      headline: `${repo.name} has ${repo.stars} stars and a description. The public pitch can actually withstand being read.`,
    });
    const testPath = repo.evidence?.testPathSamples?.[0];
    if (repo.evidence?.testPathCount === 0 && repo.evidence.scriptNames &&
        !repo.evidence.scriptNames.some((name) => /^(?:test(?::|$)|check$)/i.test(name))) angles.push({
      id: `${repo.name}:test-discoverability`, subject: repo.name, priority: 83, tone: "charge",
      sourceUrl: `${repo.url}/blob/${encodeURIComponent(repo.defaultBranch)}/package.json`,
      evidence: `${repo.name}'s complete default-branch tree showed no conventional test-named paths, and its inspected root package.json has no test or check script. This does not establish that the project has no tests.`,
      line: `${repo.name} hides its testing story from both the file tree and root package scripts. A contributor gets a scavenger hunt without a map.`,
      headline: `${repo.name}'s inspected tree has no conventional test path and its root package has no test command. The testing story needs an address before anyone can verify it.`,
      fix: `Give ${repo.name} a discoverable test path or document and expose its test command.`
    });
    if (testPath) angles.push({
      id: `${repo.name}:test-path`, subject: repo.name, priority: 69, tone: "credit",
      sourceUrl: `${repo.url}/blob/${encodeURIComponent(repo.defaultBranch)}/${testPath.split("/").map(encodeURIComponent).join("/")}`,
      evidence: `${repo.name}'s inspected default-branch tree includes ${testPath}; file contents were not inspected.`,
      line: `${repo.name} includes ${testPath}. A test path exists, so the cheap accusation loses its exhibit.`,
      headline: `${repo.name}'s tree includes ${testPath}. Even this review has to admit the test path is real.`,
    });
    const workflow = repo.evidence?.workflowPathSamples?.[0];
    if (workflow) angles.push({
      id: `${repo.name}:workflow`, subject: repo.name, priority: 53, tone: "credit",
      sourceUrl: `${repo.url}/blob/${encodeURIComponent(repo.defaultBranch)}/${workflow.split("/").map(encodeURIComponent).join("/")}`,
      evidence: `${repo.name}'s inspected default-branch tree includes ${workflow}; workflow results were not inspected.`,
      line: `${repo.name} includes ${workflow}. Automation has a place in the tree; the run history is another question.`,
      headline: `${repo.name} has ${workflow}. The workflow exists, which is more than a screenshot of a green badge would prove.`,
    });
  }
  for (const [index, message] of selectCommitSubjects(summary).entries()) {
    const signal = summary.commitSignals.find((commit) => commit.message === message);
    const inspectedRepo = summary.repos.find((repo) => repo.evidence?.recentCommit?.subject === message);
    const subject = inspectedRepo?.name ?? signal?.repo ?? summary.repos[0]?.name ?? "the public commit log";
    const vague = commitReviewStatus(message) === "changes-requested";
    const inspected = inspectedRepo?.evidence?.recentCommit;
    const scope = inspected ? `${inspected.additions} additions and ${inspected.deletions} deletions across ${inspected.filesShown} shown file${inspected.filesShown === 1 ? "" : "s"}` : null;
    angles.push({
      id: `commit:${index}`, subject, priority: vague ? (inspected ? 74 : 42) : 24, tone: vague ? "charge" : "credit",
      sourceUrl: inspected?.url,
      evidence: inspected ? `${subject}'s commit ${inspected.sha.slice(0, 7)} is titled ${quote(message)}; GitHub reports ${scope}. Patch contents were not reviewed.` :
        `Public commit subject in ${subject}: ${quote(message)}. The diff was not inspected.`,
      line: vague
        ? inspected && scope ? `${quote(message)} for ${scope} in ${subject}. The commit title is a blackout of useful context.` :
          `${subject} has a commit titled ${quote(message)}. The subject refuses to say what changed; the reader gets homework.`
        : `${subject} got ${quote(message)}. An actual change description; the review has to give that one a pass.`,
      headline: vague
        ? inspected && scope ? `${subject} called ${scope} ${quote(message)}. The title is smaller than the excuse for it.` :
          `${quote(message)} is a public commit subject in ${subject}. A change log should explain the change, not dare the reader to guess.`
        : `${quote(message)} gives ${subject}'s commit an actual plot. Painful as it is, that's a clean subject.`,
      reference: vague && /\b(final|again|fix)\b/i.test(message) ? `${quote(message)} in ${subject}: Groundhog Day got a clearer explanation for the repetition.` : undefined,
      fix: vague ? `In ${subject}, title the next commit with the change and a reason, not ${quote(message)}.` : undefined
    });
  }
  const vagueSubjects = selectCommitSubjects(summary).filter((message) => commitReviewStatus(message) === "changes-requested");
  if (vagueSubjects.length >= 2) angles.push({
    id: "profile:commit-pattern", subject: `@${summary.username}`, priority: 77, tone: "charge",
    evidence: `${vagueSubjects.length} selected public commit subjects are vague: ${vagueSubjects.map(quote).join(", ")}. Diffs were not inspected.`,
    line: `${vagueSubjects.map(quote).join(" and ")} don't form a change log. They form a guessing game with version control.`,
    headline: `${vagueSubjects.map(quote).join(" and ")} keep asking the reader to reconstruct the plot from diffs. A change log shouldn't need a detective.`,
    reference: `${vagueSubjects.map(quote).join(" and ")} are the Groundhog Day cut of this commit log: the same missing explanation on repeat.`,
    fix: `Rewrite the next public commit subject with the changed behavior and reason.`
  });
  if (summary.totalContributions > 0) angles.push({
    id: "profile:contributions", subject: `@${summary.username}`, priority: 44, tone: "credit",
    evidence: `The public contribution calendar reports ${summary.totalContributions} contributions in the sampled period.`,
    line: `${summary.totalContributions} visible contributions. The activity graph arrived with evidence instead of a motivational quote.`,
    headline: `${summary.totalContributions} visible contributions. The public graph can defend its own calendar.`
  });
  if (summary.languages.length > 1) angles.push({
    id: "profile:languages", subject: `@${summary.username}`, priority: 31, tone: "credit",
    evidence: `The sampled original repositories list ${summary.languages.slice(0, 3).join(", ")} as languages.`,
    line: `${summary.languages.slice(0, 3).join(" and ")} both show up in the public repos. The stack has range; the review had to widen its desk.`,
    headline: `${summary.languages.slice(0, 3).join(" and ")} share this portfolio. At least the stack refused to be a single-note performance.`
  });
  const popular = summary.repos.find((repo) => repo.selectionReasons?.includes("Most starred"));
  const oldest = summary.repos.find((repo) => repo.selectionReasons?.includes("Oldest"));
  if (popular && oldest && popular.name !== oldest.name && popular.stars >= 20 && quiet(oldest)) angles.push({
    id: "profile:portfolio-split", subject: `@${summary.username}`, priority: 68, tone: "charge",
    sourceUrl: oldest.url,
    evidence: `${popular.name} is the most-starred sampled original at ${popular.stars} stars; ${oldest.name} is the oldest selected original, remains unarchived, and last had a public push ${oldest.pushedAt!.slice(0, 10)}.`,
    line: variant(`${summary.username}:portfolio-line`, [
      `${popular.name} drew ${popular.stars} stars while ${oldest.name} has waited since ${oldest.pushedAt!.slice(0, 10)} for another public push. This portfolio knows how to start a story and how to leave one hanging.`,
      `${popular.name} has ${popular.stars} stars; ${oldest.name} hasn't seen a public push since ${oldest.pushedAt!.slice(0, 10)}. The account can attract an audience but owes one project an ending.`
    ]),
    headline: variant(`${summary.username}:portfolio-head`, [
      `${popular.name} earned ${popular.stars} stars; your oldest selected repo, ${oldest.name}, is still unarchived after a ${oldest.pushedAt!.slice(0, 10)} public push. That's a portfolio with a hit and an unresolved finale.`,
      `${popular.name} pulled in ${popular.stars} stars while the unarchived ${oldest.name} hasn't had a public push since ${oldest.pushedAt!.slice(0, 10)}. The portfolio has an audience and an unclosed subplot.`,
      `${popular.name} has ${popular.stars} stars; ${oldest.name} is still unarchived after its ${oldest.pushedAt!.slice(0, 10)} public push. One repo got the premiere; the other never got a closing scene.`
    ]),
    fix: `Give ${oldest.name} an explicit maintenance status or archive it if complete.`
  });
  if (summary.repos.length >= 4 && summary.repos.every((repo) => repo.description?.trim() &&
      (repo.archived || (repo.pushedAt && Number.isFinite(Date.parse(repo.pushedAt)) && !quiet(repo)))) &&
      !angles.some((angle) => angle.tone === "charge" && angle.priority >= 55)) angles.push({
    id: "profile:clean-sample", subject: `@${summary.username}`, priority: 67, tone: "credit",
    evidence: `All ${summary.repos.length} selected public originals have descriptions and none has an old unarchived public push in this sample.`,
    line: `${summary.repos.length} selected repos, all introduced, none visibly left to fossilize. The review came looking for negligence and found basic project hygiene.`,
    headline: `${summary.repos.length} selected repos all have descriptions and no old unarchived public push. Rude of this portfolio to make the lazy jokes inaccurate.`
  });
  if (summary.repos.length && !angles.some((angle) => angle.tone === "charge" && angle.priority >= 55) &&
      !angles.some((angle) => angle.tone === "credit" && angle.priority >= 60)) {
    const repo = summary.repos[0];
    angles.push({
      id: "profile:thin-evidence", subject: repo.name, priority: 50, tone: "credit", sourceUrl: repo.url,
      evidence: `${repo.name} has ${repo.stars} stars and ${repo.description?.trim() ? "a repository description" : "no repository description"}; no strong work-level contradiction was observed in this bounded sample.`,
      line: `${repo.name} gives this review a real public project, but no evidenced scandal. Inventing one would be the worst engineering in the report.`,
      headline: `${repo.name} has ${repo.stars} stars, and this public sample doesn't reveal a strong work-level contradiction. A manufactured takedown would be cheaper than the repo deserves.`
    });
  }
  if (!summary.repos.length) angles.push({
    id: "profile:no-public-originals", subject: `@${summary.username}`, priority: 99, tone: "credit",
    evidence: `No original public repositories were available in this sample; private work is unknown.`,
    line: `@${summary.username} has no original public repositories in this sample. The review has an empty diff and the good sense not to invent one.`,
    headline: `@${summary.username} supplied no original public repositories for this review. The only thing to roast is the empty evidence tray.`
  });
  return angles.sort((a, b) => b.priority - a.priority);
}

function family(angle: Angle) {
  if (angle.id.endsWith(":popular-stale") || angle.id === "profile:portfolio-split") return "quiet";
  return angle.id.startsWith("commit:") ? `commit-${angle.tone}` : angle.id.split(":").slice(1).join(":");
}

function bestDistinct(angles: Angle[], count: number, fill = false) {
  const selected: Angle[] = [];
  const families = new Set<string>();
  const subjects = new Set<string>();
  for (const angle of angles) {
    if (families.has(family(angle))) continue;
    selected.push(angle);
    families.add(family(angle));
    subjects.add(angle.subject);
    if (selected.length === count) break;
  }
  if (!fill) return selected;
  for (const angle of angles) {
    if (selected.length === count) break;
    if (!selected.includes(angle) && !subjects.has(angle.subject)) {
      selected.push(angle);
      subjects.add(angle.subject);
    }
  }
  for (const angle of angles) {
    if (selected.length === count) break;
    if (!selected.includes(angle)) selected.push(angle);
  }
  return selected;
}

export function selectDistinctEditorialAngles(angles: ReturnType<typeof buildEditorialAngles>, count: number) {
  return bestDistinct(angles, count);
}

function repoLine(repo: Repo, angles: Angle[], usedFamilies: Set<string>, index: number) {
  if (repo.archived) return `${repo.name} is archived. A completed lifecycle is one decision this review can actually verify.`;
  const local = angles.filter((angle) => angle.subject === repo.name && !angle.id.startsWith("commit:"));
  const selected = local.find((angle) => !usedFamilies.has(family(angle))) ?? local[0];
  if (selected && usedFamilies.has(family(selected))) return repoContext(repo, index);
  if (selected) usedFamilies.add(family(selected));
  if (selected?.tone === "charge") return selected.line;
  if (selected?.id.endsWith(":test-path")) return `${repo.name} exposes ${repo.evidence!.testPathSamples![0]} in its default-branch tree. Its contents remain unreviewed, but the file has a seat at the table.`;
  if (selected?.id.endsWith(":release")) return `${repo.name} has a ${repo.evidence!.latestRelease!.tag} release. The published tag gets an approval; the implementation was not inspected.`;
  if (selected?.id.endsWith(":minimal-delivered")) return `${repo.name}'s root manifest lists ${repo.evidence!.runtimeDependencies} runtime dependencies. Its minimal claim survives a basic count.`;
  if (selected?.id.endsWith(":fresh-traction")) return `${repo.name} was created ${repo.createdAt!.slice(0, 10)} and has ${repo.stars} stars. The new project already has a visible audience.`;
  if (selected?.id.endsWith(":archived")) return `${repo.name} is marked archived. That is an explicit lifecycle decision, not a guessed failure to maintain it.`;
  if (selected?.id.endsWith(":audience")) return `${repo.name} pairs ${repo.stars} stars with a description. Its public introduction is doing the job most repo names cannot.`;
  if (selected?.id.endsWith(":workflow")) return `${repo.name} lists ${repo.evidence!.workflowPathSamples![0]}. The workflow exists; the run history remains outside this review.`;
  if (selected?.id.endsWith(":old-survivor")) return `${repo.name} was created ${repo.createdAt!.slice(0, 10)} and had a public push ${repo.pushedAt!.slice(0, 10)}. Its age hasn't stopped public work from appearing.`;
  if (!repo.pushedAt || !Number.isFinite(Date.parse(repo.pushedAt))) return repoContext(repo, index);
  return repo.description?.trim()
      ? `${repo.name} has a description and a public push date. There is no code-level charge in the evidence inspected here.`
      : `${repo.name} is public; the available metadata is too thin for a defensible code review.`;
}

function repoContext(repo: Repo, index: number) {
  if (repo.description?.trim()) return [
    `${repo.name} has ${repo.stars} stars and lists ${repo.language ?? "no primary language"}. Its public page supplies an introduction, not a code finding.`,
    `With ${repo.stars} stars, ${repo.name} has an audience and a description. The available metadata stops before a work-level accusation.`,
    `${repo.name} identifies its purpose publicly and has ${repo.stars} stars; a sharper review needs inspected source.`,
    `${repo.name}: ${repo.stars} stars, ${repo.language ?? "no primary language"}. That's a footprint, not permission to invent a defect.`
  ][index % 4];
  return [
    `${repo.name} has ${repo.stars} stars and no description. The public pitch left this review holding a blank page.`,
    `The ${repo.stars}-star ${repo.name} leaves its one-line introduction empty; this sample gives no second work-level charge.`,
    `${repo.name} has ${repo.stars} stars but no description. A code-level accusation would need more than this thin public page.`,
    `${repo.name}: ${repo.stars} stars, zero words in the description. The missing introduction is visible; the implementation isn't.`
  ][index % 4];
}

export function buildFallbackReport(summary: RoastSummary): RoastReport {
  const popular = summary.repos.find((repo) => repo.selectionReasons?.includes("Most starred"));
  const oldest = summary.repos.find((repo) => repo.selectionReasons?.includes("Oldest"));
  const angles = buildEditorialAngles(summary);
  const charges = angles.filter((angle) => angle.tone === "charge");
  const credits = angles.filter((angle) => angle.tone === "credit");
  const lead = angles.find((angle) => angle.priority >= 55 && !angle.id.startsWith("commit:")) ?? credits[0] ?? charges[0];
  const candidateSecond = charges.find((angle) => angle !== lead && family(angle) !== (lead && family(lead)) &&
    angle.subject !== lead?.subject && !angle.id.startsWith("commit:")) ??
    angles.find((angle) => angle !== lead && family(angle) !== (lead && family(lead)) &&
      angle.subject !== lead?.subject && !angle.id.startsWith("commit:")) ??
    angles.find((angle) => angle !== lead && family(angle) !== (lead && family(lead)) && !angle.id.startsWith("commit:"));
  const second = candidateSecond && candidateSecond.priority >= 65 ? candidateSecond : undefined;
  const scoreFactors = Object.entries(summary.scoreBreakdown).sort((a, b) => b[1] - a[1]);
  const [highName, highValue] = scoreFactors[0];
  const [lowName, lowValue] = scoreFactors[scoreFactors.length - 1];
  const leadRepo = summary.repos.find((repo) => repo.name === lead?.subject);
  const title = !summary.repos.length ? `${summary.username}: No Public Originals` :
    lead?.id.endsWith(":minimal-dependencies") ? `${lead!.subject}: Minimal in Name Only` :
    lead?.id.endsWith(":commit-scope") ? `${lead!.subject}: The Commit Title Blackout` :
    lead?.id.endsWith(":test-discoverability") ? `${lead!.subject}: Testing Needs an Address` :
    lead?.id.endsWith(":missing-description") ? `${lead!.subject}: ${leadRepo?.stars ?? 0} Stars, No Pitch` :
    lead?.id.endsWith(":popular-stale") ? `${lead!.subject}: Famous and Quiet` :
    lead?.id.endsWith(":quiet") ? `${lead!.subject}: Still Open, Barely Moving` :
    lead?.id === "profile:portfolio-split" ? `${popular!.name} vs ${oldest!.name}: A Hit and a Cliffhanger` :
    lead?.id === "profile:commit-pattern" ? `${summary.username}: Commit Log on Repeat` :
    lead?.id === "profile:clean-sample" ? `${summary.username}: The Review Found Receipts` :
    lead?.id === "profile:thin-evidence" ? `${lead!.subject}: No Fake Scandal` :
    lead?.id.startsWith("commit:") ? `${lead!.subject}: The Missing Commit Plot` :
    `${(lead?.subject ?? summary.username).slice(0, 45)}: Public Work Under Review`;
  const useReference = lead?.reference && lead.priority >= 70 && variant(`${summary.username}:${lead.id}:reference`, [false, false, true]);
  const roast = [useReference ? lead.reference : lead?.headline ?? lead?.line, second?.headline ?? second?.line].filter(Boolean).join(" ") ||
    `@${summary.username} has too little public evidence for a specific roast.`;
  const strengths = bestDistinct(credits.filter((angle) => angle !== lead && angle !== second), 2).map((angle) => angle.line);
  if (!strengths.length) strengths.push(summary.repos.length
    ? lead?.tone === "credit" ? lead.evidence : `${summary.repos[0].name} is public. More evidence is needed before this review can approve its implementation.`
    : `Private work is unknown, and this public-only review will keep it that way.`);
  const weaknessAngles = bestDistinct([
    ...charges.filter((angle) => angle !== lead && angle !== second),
    ...charges.filter((angle) => angle === lead || angle === second)
  ], 3);
  const weaknesses = weaknessAngles.map((angle) => angle === lead || angle === second ? angle.evidence : angle.line);
  const inspectedWork = angles.find((angle) => /:(?:commit-scope|test-discoverability|test-path|workflow|minimal-dependencies|minimal-delivered|release)$/.test(angle.id));
  const receiptAngles = bestDistinct([
    ...(inspectedWork ? [inspectedWork] : []),
    ...angles.filter((angle) => angle !== lead && angle !== second && angle !== inspectedWork),
    ...angles.filter((angle) => angle === lead || angle === second)
  ], 3, true);
  const receipts: RoastReceipt[] = receiptAngles.map((angle) => ({
    title: angle.id.startsWith("commit:") ? "Commit subject" : angle.id.includes("commit-scope") ? "Inspected commit scope" : angle.id.includes("release") ? "Release record" : angle.id.includes("description") ? "Repository introduction" : angle.id.includes("quiet") ? "Public push date" : "Repository evidence",
    evidence: angle.evidence,
    sourceUrl: angle.sourceUrl
  }));
  const featured = summary.repos.slice(0, 6);
  const usedRepoFamilies = new Set([lead, second].filter((angle): angle is Angle => Boolean(angle)).map(family));
  return {
    developerType: title,
    archetypeDescription: leadRepo?.selectionReasons?.[0]
      ? `${leadRepo.name} earned the ${leadRepo.selectionReasons[0] === "Most starred" ? "top-starred" : leadRepo.selectionReasons[0].toLowerCase()} slot in this sampled public-work review.`
      : lead?.evidence ?? `No public originals were available.`,
    roastScore: summary.profileScore,
    scoreRoast: highValue - lowValue >= 25
      ? variant(`${summary.username}:score-wide`, [
          `${summary.profileScore}/100. ${highName} scored ${highValue}; ${lowName} limped in at ${lowValue}. The imbalance is doing more talking than the total.`,
          `${summary.profileScore}/100. ${highName} brought ${highValue}; ${lowName} brought ${lowValue}. This score has a visible weak link, not a mystery diagnosis.`,
          `${summary.profileScore}/100. ${highName} at ${highValue} is covering for ${lowName} at ${lowValue}. Even the app's comic math noticed the split.`
        ])
      : variant(`${summary.username}:score-even`, [
          `${summary.profileScore}/100. ${highName} leads at ${highValue}; ${lowName} trails at ${lowValue}. The score has receipts, not authority over the work.`,
          `${summary.profileScore}/100. ${highName} is ${highValue} and ${lowName} is ${lowValue}. The numbers are close enough that the joke has to come from the repos.`,
          `${summary.profileScore}/100. ${highName}: ${highValue}; ${lowName}: ${lowValue}. This is an app score, so the repository evidence gets the final word.`
        ]),
    roast,
    strengths,
    weaknesses,
    receipts,
    redemption: charges[0]?.fix ?? (featured[0] ? `Keep ${featured[0].name}'s public context current; this sample does not support an emergency patch.` : `Share a public project only if you choose to; private work is outside this review.`),
    repositoryRoasts: featured.map((repo, index) => ({
      name: repo.name,
      commentary: repoLine(repo, angles, usedRepoFamilies, index),
      status: repo.archived ? "approved" : angles.some((angle) => angle.subject === repo.name && angle.tone === "charge" && !angle.id.startsWith("commit:")) ? "changes-requested" :
        angles.some((angle) => angle.subject === repo.name && angle.tone === "credit") ? "approved" : "commented"
    })),
    commitCrimes: selectCommitSubjects(summary).map((message, index) => ({
      message,
      commentary: angles.find((angle) => angle.id === `commit:${index}`)?.line ?? `The public subject is ${quote(message)}.`,
      status: commitReviewStatus(message)
    }))
  };
}
