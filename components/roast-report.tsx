"use client";

import {
  Activity,
  AlertCircle,
  Archive,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Code2,
  ExternalLink,
  Flame,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  GitPullRequest,
  Github,
  History,
  Info,
  Lightbulb,
  MapPin,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Star,
  Users
} from "lucide-react";
import Image from "next/image";
import type { RefObject } from "react";
import { CommitChart } from "@/components/commit-chart";
import { ScoreRing } from "@/components/score-ring";
import { ShareCard } from "@/components/share-card";
import { Button } from "@/components/ui/button";
import type { RoastResponse } from "@/lib/types";
import { compactNumber } from "@/lib/utils";

function StatCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Activity }) {
  return (
    <div className="github-box stat-card flex min-h-32 flex-col p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-[#58a6ff]">{label}</span>
        <Icon className="size-4 text-[#8b949e]" />
      </div>
      <strong className="mt-3 text-2xl font-semibold text-[#f0f6fc]">{value}</strong>
      <p className="mt-auto pt-2 text-xs leading-5 text-[#8b949e]">{detail}</p>
    </div>
  );
}

function ReviewList({ title, items, positive }: { title: string; items: string[]; positive: boolean }) {
  return (
    <section className="github-box overflow-hidden">
      <div className="github-box-header flex items-center gap-2 px-4 py-3 font-semibold">
        {positive ? <CheckCircle2 className="size-4 text-[#3fb950]" /> : <AlertCircle className="size-4 text-[#f85149]" />}
        {title}
        <span className="ml-auto rounded-full bg-[#30363d] px-2 py-0.5 text-xs">{items.length}</span>
      </div>
      <ul className="divide-y divide-[#21262d]">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="review-stagger flex gap-3 px-4 py-3 text-sm leading-6 text-[#c9d1d9]" style={{ animationDelay: `${120 + index * 45}ms` }}>
            <CircleDot className={`mt-1 size-4 shrink-0 ${positive ? "text-[#3fb950]" : "text-[#f85149]"}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function repoStatus(status: "approved" | "commented" | "changes-requested") {
  if (status === "approved") {
    return { label: "Approved", classes: "border-[rgba(46,160,67,.45)] bg-[rgba(46,160,67,.12)] text-[#3fb950]" };
  }
  if (status === "changes-requested") {
    return { label: "Changes requested", classes: "border-[rgba(248,81,73,.4)] bg-[rgba(248,81,73,.1)] text-[#ff7b72]" };
  }
  return { label: "Commented", classes: "border-[rgba(56,139,253,.4)] bg-[rgba(56,139,253,.12)] text-[#58a6ff]" };
}

function pushedLabel(value: string | null) {
  if (!value) return "No public push date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Push date unavailable";
  return `Pushed ${new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date)}`;
}

export function RoastReport({
  result,
  headingRef,
  onReset
}: {
  result: RoastResponse;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onReset: () => void;
}) {
  const { summary, report } = result;
  const repositoryRoasts = new Map(report.repositoryRoasts.map((repo) => [repo.name, repo]));
  const repositoryStatusCounts = report.repositoryRoasts.reduce(
    (counts, repo) => ({ ...counts, [repo.status]: counts[repo.status] + 1 }),
    { approved: 0, commented: 0, "changes-requested": 0 }
  );
  const scoreFactors = [
    { label: "Activity", value: summary.scoreBreakdown.activity },
    { label: "Impact", value: summary.scoreBreakdown.impact },
    { label: "Maintenance", value: summary.scoreBreakdown.maintenance },
    { label: "Consistency", value: summary.scoreBreakdown.consistency },
    { label: "Presentation", value: summary.scoreBreakdown.presentation }
  ];
  const metrics = [
    { label: "Public repositories", value: String(summary.repoCount), detail: `${summary.analyzedRepoCount} original repositories analyzed`, icon: Code2 },
    { label: "Shipping score", value: `${summary.shippingScore}%`, detail: `${summary.inactiveRepos} repositories inactive for over a year`, icon: Activity },
    { label: "Described projects", value: `${summary.descriptionCoverage}%`, detail: "Original repositories with a public description", icon: BookOpen },
    { label: "Public contributions", value: compactNumber(summary.totalContributions), detail: "Visible contribution-calendar activity", icon: GitCommitHorizontal },
    { label: "Recent commit sample", value: String(summary.sampledCommitCount), detail: "Subjects from the public activity timeline", icon: History },
    { label: "Chaos index", value: `${summary.chaosScore}%`, detail: "A deliberately unserious composite score", icon: Flame }
  ];

  return (
    <article id="report" className="result-enter scroll-mt-4 border-t border-[#21262d] bg-[#0d1117]">
      <div className="border-b border-[#21262d] bg-[#161b22]">
        <nav aria-label="Report sections" className="report-nav app-shell flex h-12 items-center gap-1 overflow-x-auto px-4 md:px-6">
          <a href="#verdict" className="report-nav-link flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-[#c9d1d9] hover:bg-[#21262d]"><BookOpen className="size-4" /> Review</a>
          <a href="#receipts" className="report-nav-link flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-[#c9d1d9] hover:bg-[#21262d]"><Activity className="size-4" /> Receipts</a>
          <a href="#commits" className="report-nav-link flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-[#c9d1d9] hover:bg-[#21262d]"><History className="size-4" /> Commits</a>
          <a href="#repositories" className="report-nav-link flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-[#c9d1d9] hover:bg-[#21262d]"><MessageSquare className="size-4" /> Repositories</a>
          <a href="#share" className="report-nav-link flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-[#c9d1d9] hover:bg-[#21262d]"><ExternalLink className="size-4" /> Share</a>
          <button type="button" onClick={onReset} className="ml-auto flex h-8 shrink-0 items-center gap-2 rounded-md border border-[#30363d] bg-[#21262d] px-3 font-medium text-[#c9d1d9] hover:bg-[#30363d]"><RotateCcw className="size-3.5" /> New profile</button>
        </nav>
      </div>

      <div className="app-shell grid gap-8 px-4 py-8 md:px-6 lg:grid-cols-[296px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <Image
            src={summary.avatarUrl}
            alt={`${summary.username}'s GitHub avatar`}
            width={296}
            height={296}
            quality={100}
            sizes="(min-width: 1024px) 296px, (min-width: 640px) 296px, calc(100vw - 32px)"
            preload
            className="aspect-square w-full max-w-[296px] rounded-full border border-[#30363d] object-cover"
          />
          <div className="py-4">
            <h2 className="text-2xl font-semibold leading-tight">{summary.displayName || summary.username}</h2>
            <p className="text-xl font-light text-[#8b949e]">{summary.username}</p>
          </div>
          <p className="mb-4 leading-6 text-[#c9d1d9]">Public profile currently classified as <strong className="text-[#f0f6fc]">{report.developerType}</strong>.</p>
          <Button asChild variant="secondary" className="w-full">
            <a href={summary.githubUrl}><Github className="size-4" /> View on GitHub <ExternalLink className="size-3" /></a>
          </Button>
          <div className="mt-4 flex flex-wrap items-center gap-x-2 text-sm text-[#8b949e]">
            <Users className="size-4" /><strong className="text-[#c9d1d9]">{compactNumber(summary.followers)}</strong> followers
            <span>·</span><strong className="text-[#c9d1d9]">{summary.repoCount}</strong> repositories
          </div>
          <ul className="mt-4 space-y-2 text-sm text-[#c9d1d9]">
            <li className="flex items-center gap-2"><MapPin className="size-4 text-[#8b949e]" /> Public GitHub profile</li>
            <li className="flex items-center gap-2"><Activity className="size-4 text-[#8b949e]" /> {summary.dataSource === "github-api" ? "GitHub API signals" : "Limited public fallback"}</li>
          </ul>
          {summary.languages.length ? (
            <div className="mt-6 border-t border-[#21262d] pt-4">
              <h3 className="mb-3 font-semibold">Top languages</h3>
              <div className="flex flex-wrap gap-2">
                {summary.languages.slice(0, 6).map((language) => <span key={language} className="rounded-full bg-[rgba(56,139,253,.15)] px-2.5 py-1 text-xs font-medium text-[#58a6ff]">{language}</span>)}
              </div>
            </div>
          ) : null}
        </aside>

        <div className="min-w-0 space-y-6">
          <section id="verdict" className="github-box overflow-hidden scroll-mt-16">
            <div className="github-box-header flex items-center justify-between gap-4 px-4 py-3 text-xs">
              <span className="flex items-center gap-2 font-semibold"><BookOpen className="size-4 text-[#8b949e]" /> @{summary.username} / ROAST.md</span>
              <span className={`rounded-full border px-2 py-0.5 ${result.generatedWith === "openai" ? "border-[rgba(46,160,67,.4)] bg-[rgba(46,160,67,.15)] text-[#3fb950]" : "border-[#30363d] text-[#8b949e]"}`}>{result.generatedWith === "openai" ? "AI enhanced" : "Evidence engine"}</span>
            </div>
            <div className="markdown-body p-5 sm:p-8">
              <h1 ref={headingRef} tabIndex={-1} className="outline-none">{report.developerType}</h1>
              <p className="text-base leading-7 text-[#c9d1d9]">{report.archetypeDescription}</p>
              <h2>The review</h2>
              <blockquote className="my-4 border-l-4 border-[#f85149] bg-[rgba(248,81,73,.06)] px-4 py-3 text-base leading-7 text-[#f0f6fc]">
                {report.roast}
              </blockquote>
              <p className="text-xs text-[#8b949e]">Generated from public code-activity signals. The jokes are subjective; the repository counts are not.</p>
            </div>
          </section>

          <section className="github-box review-summary-enter overflow-hidden" aria-labelledby="review-summary-title">
            <div className="github-box-header flex items-center gap-2 px-4 py-3 font-semibold">
              <GitPullRequest className="size-4 text-[#8b949e]" />
              <h2 id="review-summary-title">Review summary</h2>
            </div>
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <span className="review-status-pop grid size-9 shrink-0 place-items-center rounded-full border border-[rgba(46,160,67,.45)] bg-[rgba(46,160,67,.12)] text-[#3fb950]">
                <ShieldCheck className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <strong className="text-[#f0f6fc]">Roast checks passed — ready to merge</strong>
                <p className="mt-1 text-sm leading-6 text-[#8b949e]">Every joke is tied to public work. Repository verdicts describe maintenance signals, never engineering ability.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-[rgba(46,160,67,.4)] bg-[rgba(46,160,67,.1)] px-2.5 py-1 text-[#3fb950]">{repositoryStatusCounts.approved} approved</span>
                <span className="rounded-full border border-[rgba(56,139,253,.4)] bg-[rgba(56,139,253,.1)] px-2.5 py-1 text-[#58a6ff]">{repositoryStatusCounts.commented} commented</span>
                <span className="rounded-full border border-[rgba(248,81,73,.4)] bg-[rgba(248,81,73,.08)] px-2.5 py-1 text-[#ff7b72]">{repositoryStatusCounts["changes-requested"]} changes requested</span>
              </div>
            </div>
          </section>

          <section className="github-box grid gap-5 p-5 sm:grid-cols-[190px_1fr] sm:items-center">
            <ScoreRing value={report.roastScore} />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Profile score</h2>
              <p className="mt-1 text-sm leading-6 text-[#8b949e]">A deterministic score weighted toward recent public activity, then impact, repository maintenance, consistency, and presentation.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-[#30363d] bg-[#161b22] p-3"><span className="block text-xs text-[#8b949e]">Total stars</span><strong>{compactNumber(summary.totalStars)}</strong></div>
                <div className="rounded-md border border-[#30363d] bg-[#161b22] p-3"><span className="block text-xs text-[#8b949e]">Total forks</span><strong>{compactNumber(summary.totalForks)}</strong></div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 md:grid-cols-5">
                {scoreFactors.map((factor) => (
                  <div key={factor.label} className="min-w-0">
                    <div className="flex items-baseline justify-between gap-2 text-xs">
                      <span className="truncate text-[#8b949e]">{factor.label}</span>
                      <strong className="text-[#c9d1d9]">{factor.value}</strong>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#30363d]">
                      <div className="score-fill h-full rounded-full bg-[#2f81f7]" style={{ width: `${factor.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="receipts" className="scroll-mt-16">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold">Pinned insights</h2>
              <span className="text-xs text-[#8b949e]">Based on sampled public activity</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {metrics.map((metric) => <StatCard key={metric.label} {...metric} />)}
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <ReviewList title="Approved changes" items={report.strengths} positive />
            <ReviewList title="Changes requested" items={report.weaknesses} positive={false} />
          </div>

          <section className="github-box overflow-hidden">
            <div className="github-box-header flex items-center gap-2 px-4 py-3 font-semibold">
              <Flame className="size-4 text-[#f85149]" /> Roast receipts
              <span className="ml-auto rounded-full bg-[#30363d] px-2 py-0.5 text-xs">{report.receipts.length}</span>
            </div>
            <div className="divide-y divide-[#21262d]">
              {report.receipts.map((receipt) => (
                <article key={receipt.title} className="grid gap-2 px-4 py-4 md:grid-cols-[180px_minmax(0,1fr)] md:gap-5">
                  <strong className="text-sm text-[#58a6ff]">{receipt.title}</strong>
                  <div>
                    <code className="block rounded-md border border-[#30363d] bg-[#161b22] px-3 py-2 text-xs leading-5 text-[#c9d1d9]">{receipt.evidence}</code>
                    <p className="mt-2 text-sm leading-6 text-[#f0f6fc]">{receipt.punchline}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="github-box overflow-hidden" aria-labelledby="suggested-patch-title">
            <div className="github-box-header flex items-center gap-2 px-4 py-3 font-semibold">
              <Lightbulb className="size-4 text-[#3fb950]" />
              <h2 id="suggested-patch-title">Suggested patch</h2>
              <code className="mono-type ml-auto text-xs font-normal text-[#8b949e]">roast.patch</code>
            </div>
            <div className="mono-type overflow-hidden text-xs leading-6">
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] border-b border-[rgba(248,81,73,.2)] bg-[rgba(248,81,73,.08)] text-[#c9d1d9]">
                <span className="select-none border-r border-[rgba(248,81,73,.18)] px-3 text-right text-[#8b949e]">−</span>
                <span className="break-words px-3 py-1">observed: maintenance context could be clearer</span>
              </div>
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] bg-[rgba(46,160,67,.1)] text-[#c9d1d9]">
                <span className="select-none border-r border-[rgba(46,160,67,.2)] px-3 text-right text-[#3fb950]">+</span>
                <span className="break-words px-3 py-1">suggested: {report.redemption}</span>
              </div>
            </div>
            <p className="border-t border-[#21262d] px-4 py-3 text-xs leading-5 text-[#8b949e]">Suggestion only — GitRoast does not modify repositories or invent file changes.</p>
          </section>

          <CommitChart summary={summary} />

          <section id="commits" className="github-box overflow-hidden scroll-mt-16">
            <div className="github-box-header flex items-center gap-2 px-4 py-3 font-semibold">
              <GitCommitHorizontal className="size-4" /> Commit review
              <span className="ml-auto rounded-full bg-[#30363d] px-2 py-0.5 text-xs">{report.commitCrimes.length}</span>
            </div>
            {report.commitCrimes.length ? (
              <div className="divide-y divide-[#21262d]">
                {report.commitCrimes.map((crime, index) => {
                  const signal = summary.commitSignals.find((commit) => commit.message === crime.message);
                  return (
                    <article key={`${crime.message}-${index}`} className="commit-timeline-item review-stagger relative grid gap-3 py-4 pl-14 pr-4 md:grid-cols-[minmax(180px,.8fr)_1.2fr]" style={{ animationDelay: `${120 + index * 45}ms` }}>
                      <span className={`absolute left-[15px] top-4 z-10 grid size-7 place-items-center rounded-full border bg-[#0d1117] ${crime.status === "approved" ? "border-[rgba(46,160,67,.5)] text-[#3fb950]" : "border-[rgba(248,81,73,.45)] text-[#ff7b72]"}`} aria-hidden="true">
                        {crime.status === "approved" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                      </span>
                      <div className="min-w-0">
                        <code className="block break-words text-sm font-semibold text-[#58a6ff]">{crime.message}</code>
                        {signal ? <span className="mono-type mt-1 block text-[11px] text-[#8b949e]">{signal.repo} · {signal.date.slice(0, 10)}</span> : null}
                        <span className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${crime.status === "approved" ? "border-[rgba(46,160,67,.45)] bg-[rgba(46,160,67,.12)] text-[#3fb950]" : "border-[rgba(248,81,73,.4)] bg-[rgba(248,81,73,.1)] text-[#ff7b72]"}`}>{crime.status === "approved" ? "approved" : "changes requested"}</span>
                      </div>
                      <p className="text-sm leading-6 text-[#c9d1d9]">{crime.commentary}</p>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-[#8b949e]">No recent commit subjects were available on the public activity timeline.</div>
            )}
          </section>

          <section id="repositories" className="github-box scroll-mt-16 overflow-hidden" aria-labelledby="repository-reviews-title">
            <div className="github-box-header flex items-center gap-2 px-4 py-3 font-semibold">
              <MessageSquare className="size-4 text-[#58a6ff]" />
              <h2 id="repository-reviews-title">Repository review comments</h2>
              <span className="ml-auto rounded-full bg-[#30363d] px-2 py-0.5 text-xs">{report.repositoryRoasts.length}</span>
            </div>
            {summary.repos.length ? (
              <ul className="divide-y divide-[#21262d] 2xl:grid 2xl:grid-cols-2 2xl:gap-px 2xl:divide-y-0 2xl:bg-[#21262d]" aria-label={`Repository reviews for ${summary.username}`}>
                {summary.repos.slice(0, 6).map((repo, index) => {
                  const review = repositoryRoasts.get(repo.name);
                  if (!review) return null;
                  const status = repoStatus(review.status);
                  return (
                    <li key={repo.name} className="repo-review-row review-stagger group bg-[#0d1117] px-4 py-4 sm:px-5" style={{ animationDelay: `${140 + index * 45}ms` }}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Code2 className="review-repo-icon size-4 shrink-0 text-[#8b949e]" />
                        <a href={repo.url} className="min-w-0 break-all font-semibold text-[#58a6ff] hover:underline" aria-label={`View ${summary.username}/${repo.name} on GitHub`}>
                          {summary.username}/{repo.name}
                        </a>
                        <span className="rounded-full border border-[#30363d] px-2 py-0.5 text-[11px] text-[#8b949e]">Public</span>
                        {repo.archived ? <span className="flex items-center gap-1 rounded-full border border-[rgba(210,153,34,.45)] bg-[rgba(210,153,34,.1)] px-2 py-0.5 text-[11px] text-[#e3b341]"><Archive className="size-3" /> Archived</span> : null}
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.classes}`}>{status.label}</span>
                      </div>

                      <div className="review-comment mt-3 overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]">
                        <div className="flex items-center gap-2 border-b border-[#21262d] bg-[#161b22] px-3 py-2 text-xs text-[#8b949e]">
                          <span className="grid size-6 place-items-center rounded-full bg-[#30363d] text-[#c9d1d9]"><Bot className="size-3.5" /></span>
                          <strong className="text-[#c9d1d9]">gitroast[bot]</strong>
                          reviewed this repository
                        </div>
                        <p className="px-3 py-3 text-sm leading-6 text-[#c9d1d9]">{review.commentary}</p>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#8b949e]">
                        {repo.language ? <span className="flex items-center gap-1.5"><i className="inline-block size-2 rounded-full bg-[#58a6ff]" />{repo.language}</span> : null}
                        <span className="flex items-center gap-1"><Star className="size-3.5" /> {compactNumber(repo.stars)}</span>
                        <span className="flex items-center gap-1"><GitFork className="size-3.5" /> {compactNumber(repo.forks)}</span>
                        {repo.openIssues > 0 ? <span className="flex items-center gap-1"><CircleDot className="size-3.5" /> {compactNumber(repo.openIssues)} open</span> : null}
                        <span className="flex items-center gap-1"><GitBranch className="size-3.5" /> {repo.defaultBranch}</span>
                        <span>{pushedLabel(repo.pushedAt)}</span>
                        <a href={repo.url} className="ml-auto inline-flex min-h-6 items-center gap-1 font-medium text-[#58a6ff] hover:underline" aria-label={`Open ${summary.username}/${repo.name} repository`}>
                          View repository <ExternalLink className="size-3" />
                        </a>
                      </div>
                      {repo.topics.length ? (
                        <div className="mt-3 flex flex-wrap gap-1.5" aria-label={`Topics for ${repo.name}`}>
                          {repo.topics.slice(0, 3).map((topic) => <span key={topic} className="rounded-full bg-[rgba(56,139,253,.15)] px-2 py-0.5 text-[11px] font-medium text-[#58a6ff]">{topic}</span>)}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-6 text-center text-sm text-[#8b949e]">No original public repositories were available for review.</div>
            )}
          </section>

          <details id="methodology" className="github-box group scroll-mt-16">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold">
              <Info className="size-4 text-[#58a6ff]" /> About this analysis
              <ChevronRight className="ml-auto size-4 text-[#8b949e] transition-transform group-open:rotate-90" />
            </summary>
            <div className="grid gap-4 border-t border-[#21262d] px-4 py-4 text-sm leading-6 text-[#8b949e] md:grid-cols-3">
              <p><strong className="text-[#c9d1d9]">Scope.</strong> Public profile metadata, up to 100 recent repositories, the public activity feed, and the contribution calendar.</p>
              <p><strong className="text-[#c9d1d9]">Source.</strong> This run used {summary.dataSource === "github-api" ? "GitHub’s public REST API" : "a limited public profile fallback"}. Private and organization-only activity is excluded.</p>
              <p><strong className="text-[#c9d1d9]">Interpretation.</strong> The profile score is deterministic: activity 45%, impact 25%, consistency 12%, maintenance 10%, and presentation 8%. It is not an engineering-performance measurement.</p>
            </div>
          </details>
        </div>
      </div>

      <ShareCard result={result} />

      <div className="app-shell px-4 pb-10 md:px-6">
        <div className="github-box flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><strong>Finished reviewing @{summary.username}</strong><p className="mt-1 text-sm text-[#8b949e]">Run another public profile through the same checks.</p></div>
          <Button type="button" onClick={onReset}><Github className="size-4" /> Roast another profile</Button>
        </div>
      </div>
    </article>
  );
}
