"use client";

import {
  Activity, AlertCircle, Archive, BookOpen, Bot, CheckCircle2, CircleDot, Code2,
  ExternalLink, Flame, GitBranch, GitCommitHorizontal, GitFork, Github, History,
  Info, Lightbulb, MapPin, MessageSquare, RotateCcw, Star, Users
} from "lucide-react";
import Image from "next/image";
import { memo, useEffect, type RefObject } from "react";
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

function ReviewList({ title, kicker, items, positive }: { title: string; kicker: string; items: string[]; positive: boolean }) {
  return (
    <section className={`review-panel overflow-hidden rounded-md border ${positive ? "border-[rgba(46,160,67,.35)]" : "border-[rgba(210,153,34,.42)]"}`}>
      <div className={`flex items-center gap-3 border-b px-4 py-3 ${positive ? "border-[rgba(46,160,67,.24)] bg-[rgba(46,160,67,.08)]" : "border-[rgba(210,153,34,.26)] bg-[rgba(210,153,34,.08)]"}`}>
        {positive ? <CheckCircle2 className="size-4 text-[#3fb950]" /> : <Info className="size-4 text-[#d29922]" />}
        <div>
          <span className="block text-[10px] font-semibold uppercase tracking-[.16em] text-[#8b949e]">{kicker}</span>
          <h2 className="font-semibold text-[#f0f6fc]">{title}</h2>
        </div>
        <span className="ml-auto rounded-full bg-[#30363d] px-2 py-0.5 text-xs">{items.length}</span>
      </div>
      <ul className="divide-y divide-[#21262d]">
        {items.map((item, index) => (
          <li key={`${item}-${index}`} className="review-stagger flex gap-3 px-4 py-3 text-sm leading-6 text-[#c9d1d9]" style={{ animationDelay: `${120 + index * 45}ms` }}>
            <CircleDot className={`mt-1 size-4 shrink-0 ${positive ? "text-[#3fb950]" : "text-[#d29922]"}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function repoStatus(status: "approved" | "commented" | "changes-requested") {
  if (status === "approved") return { label: "Approved", classes: "border-[rgba(46,160,67,.45)] bg-[rgba(46,160,67,.12)] text-[#3fb950]" };
  if (status === "changes-requested") return { label: "Changes requested", classes: "border-[rgba(248,81,73,.4)] bg-[rgba(248,81,73,.1)] text-[#ff7b72]" };
  return { label: "Commented", classes: "border-[rgba(56,139,253,.4)] bg-[rgba(56,139,253,.12)] text-[#58a6ff]" };
}

const pushDateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

function pushedLabel(value: string | null) {
  if (!value) return "No public push date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Push date unavailable";
  return `Pushed ${pushDateFormatter.format(date)}`;
}

export const RoastReport = memo(function RoastReport({ result, headingRef, onReset }: {
  result: RoastResponse;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onReset: () => void;
}) {
  useEffect(() => {
    document.getElementById("report")?.scrollIntoView({ behavior: "auto", block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, [result, headingRef]);

  const { summary, report } = result;
  const repositoryRoasts = new Map(report.repositoryRoasts.map((repo) => [repo.name, repo]));
  const scoreFactors = [
    { label: "Activity", value: summary.scoreBreakdown.activity },
    { label: "Impact", value: summary.scoreBreakdown.impact },
    { label: "Maintenance", value: summary.scoreBreakdown.maintenance },
    { label: "Consistency", value: summary.scoreBreakdown.consistency },
    { label: "Presentation", value: summary.scoreBreakdown.presentation }
  ];
  const metrics = [
    { label: "Public repositories", value: String(summary.repoCount), detail: `${summary.analyzedRepoCount} originals inspected; ${summary.inactiveRepos} are currently cosplaying as history.`, icon: Code2 },
    { label: "Shipping score", value: `${summary.shippingScore}%`, detail: summary.inactiveRepos ? `${summary.inactiveRepos} repositories have been quiet for over a year.` : "Every sampled repository still has a pulse. Suspiciously tidy.", icon: Activity },
    { label: "Described projects", value: `${summary.descriptionCoverage}%`, detail: summary.descriptionCoverage < 70 ? "The rest expect visitors to infer the plot from the title." : "Most projects remembered that mystery is not documentation.", icon: BookOpen },
    { label: "Public contributions", value: compactNumber(summary.totalContributions), detail: "Visible calendar activity. Private heroics remain outside the courtroom.", icon: GitCommitHorizontal },
    { label: "Commit sample", value: String(summary.sampledCommitCount), detail: "Recent public subjects invited to testify against their authoring choices.", icon: History },
    { label: "Chaos index", value: `${summary.chaosScore}%`, detail: "A deliberately unserious composite with disturbingly serious receipts.", icon: Flame }
  ];

  return (
    <article id="report" className="result-enter scroll-mt-4 border-t border-[#21262d] bg-[#0d1117]">
      <div className="sticky top-0 z-30 border-b border-[#21262d] bg-[rgba(22,27,34,.94)] backdrop-blur">
        <nav aria-label="Report sections" className="report-nav app-shell flex h-12 items-center gap-1 overflow-x-auto px-4 md:px-6">
          <a href="#verdict" className="report-nav-link flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-[#c9d1d9] hover:bg-[#21262d]"><Flame className="size-4" /> Roast</a>
          <a href="#commits" className="report-nav-link flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-[#c9d1d9] hover:bg-[#21262d]"><History className="size-4" /> Commits</a>
          <a href="#repositories" className="report-nav-link flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-[#c9d1d9] hover:bg-[#21262d]"><MessageSquare className="size-4" /> Repositories</a>
          <a href="#receipts" className="report-nav-link flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-[#c9d1d9] hover:bg-[#21262d]"><Activity className="size-4" /> Evidence</a>
          <a href="#share" className="report-nav-link flex h-12 shrink-0 items-center gap-2 border-b-2 px-3 text-[#c9d1d9] hover:bg-[#21262d]"><ExternalLink className="size-4" /> Share</a>
          <button type="button" onClick={onReset} className="ml-auto flex h-11 shrink-0 items-center gap-2 rounded-md border border-[#30363d] bg-[#21262d] px-3 font-medium text-[#c9d1d9] hover:bg-[#30363d]"><RotateCcw className="size-3.5" /> New profile</button>
        </nav>
      </div>

      <div className="app-shell grid gap-8 px-4 py-8 md:px-6 lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1180px)_360px] 2xl:justify-center">
        <div className="min-w-0 space-y-6">
          <section id="verdict" className="github-box roast-verdict overflow-hidden scroll-mt-16">
            <div className="github-box-header flex flex-wrap items-center justify-between gap-4 px-4 py-3 text-xs">
              <span className="flex items-center gap-2 font-semibold"><BookOpen className="size-4 text-[#8b949e]" /> @{summary.username} / ROAST.md</span>
              <span className={`rounded-full border px-2 py-0.5 ${result.generatedWith === "openai" ? "border-[rgba(46,160,67,.4)] bg-[rgba(46,160,67,.15)] text-[#3fb950]" : "border-[#30363d] text-[#8b949e]"}`}>{result.generatedWith === "openai" ? "AI sharpened" : "Evidence engine"}</span>
            </div>
            <div className="p-5 sm:p-8">
              <span className="mono-type text-[11px] font-semibold uppercase tracking-[.2em] text-[#f85149]">Profile classification</span>
              <h1 ref={headingRef} tabIndex={-1} className="mt-2 text-3xl font-semibold leading-tight outline-none sm:text-4xl">{report.developerType}</h1>
              <p className="mt-3 max-w-3xl text-lg leading-7 text-[#c9d1d9]">{report.archetypeDescription}</p>
              <div className="mt-6 border-l-4 border-[#f85149] bg-[linear-gradient(90deg,rgba(248,81,73,.12),rgba(248,81,73,.025))] px-4 py-4 sm:px-5">
                <span className="mono-type text-[10px] font-bold uppercase tracking-[.18em] text-[#ff7b72]">Primary verdict</span>
                <p className="mt-2 text-lg font-medium leading-8 text-[#f0f6fc]">{report.roast}</p>
              </div>
              <a href="#share" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md border border-[#238636] bg-[#238636] px-4 text-sm font-semibold text-white hover:bg-[#2ea043]"><ExternalLink className="size-4" /> Share this review</a>
            </div>
          </section>

          <section aria-labelledby="review-fire-title">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div><span className="mono-type text-[10px] font-semibold uppercase tracking-[.18em] text-[#8b949e]">Inline review</span><h2 id="review-fire-title" className="mt-1 text-xl font-semibold">The review, with the safety off</h2></div>
              <span className="text-xs text-[#8b949e]">Generated from this profile’s public signals</span>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <ReviewList title="Annoyingly mergeable" kicker="Reluctant approvals" items={report.strengths} positive />
              <ReviewList title="Worth a closer look" kicker="Review notes" items={report.weaknesses} positive={false} />
            </div>
          </section>

          <section className="github-box overflow-hidden" aria-labelledby="suggested-patch-title">
            <div className="github-box-header flex items-center gap-2 px-4 py-3 font-semibold"><Lightbulb className="size-4 text-[#3fb950]" /><h2 id="suggested-patch-title">The one patch that might save this branch</h2><code className="mono-type ml-auto hidden text-xs font-normal text-[#8b949e] sm:block">roast.patch</code></div>
            <div className="mono-type overflow-hidden text-xs leading-6">
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] border-b border-[rgba(248,81,73,.2)] bg-[rgba(248,81,73,.08)] text-[#c9d1d9]"><span className="select-none border-r border-[rgba(248,81,73,.18)] px-3 text-right text-[#8b949e]">−</span><span className="break-words px-3 py-1">observed: context is apparently an optional dependency</span></div>
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] bg-[rgba(46,160,67,.1)] text-[#c9d1d9]"><span className="select-none border-r border-[rgba(46,160,67,.2)] px-3 text-right text-[#3fb950]">+</span><span className="break-words px-3 py-1">suggested: {report.redemption}</span></div>
            </div>
          </section>

          <section id="commits" className="github-box overflow-hidden scroll-mt-16">
            <div className="github-box-header flex items-center gap-2 px-4 py-3 font-semibold"><GitCommitHorizontal className="size-4 text-[#f85149]" /> Commit messages on trial<span className="ml-auto rounded-full bg-[#30363d] px-2 py-0.5 text-xs">{report.commitCrimes.length}</span></div>
            {report.commitCrimes.length ? (
              <div className="divide-y divide-[#21262d]">
                {report.commitCrimes.map((crime, index) => {
                  const signal = summary.commitSignals.find((commit) => commit.message === crime.message);
                  return (
                    <article key={`${crime.message}-${index}`} className="commit-timeline-item review-stagger relative grid gap-3 py-4 pl-14 pr-4 md:grid-cols-[minmax(180px,.8fr)_1.2fr]" style={{ animationDelay: `${120 + index * 45}ms` }}>
                      <span className={`absolute left-[15px] top-4 z-10 grid size-7 place-items-center rounded-full border bg-[#0d1117] ${crime.status === "approved" ? "border-[rgba(46,160,67,.5)] text-[#3fb950]" : "border-[rgba(248,81,73,.45)] text-[#ff7b72]"}`} aria-hidden="true">{crime.status === "approved" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}</span>
                      <div className="min-w-0">
                        <code className="block break-words text-sm font-semibold text-[#58a6ff]">{crime.message}</code>
                        {signal ? <span className="mono-type mt-1 block text-[11px] text-[#8b949e]">{signal.repo} · {signal.date.slice(0, 10)}</span> : null}
                        <span className={`mt-2 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${crime.status === "approved" ? "border-[rgba(46,160,67,.45)] bg-[rgba(46,160,67,.12)] text-[#3fb950]" : "border-[rgba(248,81,73,.4)] bg-[rgba(248,81,73,.1)] text-[#ff7b72]"}`}>{crime.status === "approved" ? "somehow approved" : "convicted"}</span>
                      </div>
                      <p className="text-sm leading-6 text-[#f0f6fc]">{crime.commentary}</p>
                    </article>
                  );
                })}
              </div>
            ) : <div className="p-6 text-center text-sm text-[#8b949e]">The public commit trail invoked its right to remain silent.</div>}
          </section>

          <section id="repositories" className="github-box scroll-mt-16 overflow-hidden" aria-labelledby="repository-reviews-title">
            <div className="github-box-header flex flex-wrap items-center gap-2 px-4 py-3 font-semibold"><MessageSquare className="size-4 text-[#f85149]" /><h2 id="repository-reviews-title">Selected repository reviews</h2><span className="ml-auto rounded-full bg-[#30363d] px-2 py-0.5 text-xs">{report.repositoryRoasts.length} of {summary.analyzedRepoCount} sampled originals</span></div>
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
                        <a href={repo.url} className="min-w-0 break-all font-semibold text-[#58a6ff] hover:underline" aria-label={`View ${summary.username}/${repo.name} on GitHub`}>{summary.username}/{repo.name}</a>
                        {repo.archived ? <span className="flex items-center gap-1 rounded-full border border-[rgba(210,153,34,.45)] bg-[rgba(210,153,34,.1)] px-2 py-0.5 text-[11px] text-[#e3b341]"><Archive className="size-3" /> Archived</span> : null}
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.classes}`}>{status.label}</span>
                      </div>
                      <div className="review-comment mt-3 overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117]">
                        <div className="flex items-center gap-2 border-b border-[#21262d] bg-[#161b22] px-3 py-2 text-xs text-[#8b949e]"><span className="grid size-6 place-items-center rounded-full bg-[#30363d] text-[#c9d1d9]"><Bot className="size-3.5" /></span><strong className="text-[#c9d1d9]">gitroast[bot]</strong> left a review</div>
                        <p className="px-3 py-3 text-sm font-medium leading-6 text-[#f0f6fc]">{review.commentary}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#8b949e]">
                        {repo.language ? <span className="flex items-center gap-1.5"><i className="inline-block size-2 rounded-full bg-[#58a6ff]" />{repo.language}</span> : null}
                        <span className="flex items-center gap-1"><Star className="size-3.5" /> {compactNumber(repo.stars)}</span><span className="flex items-center gap-1"><GitFork className="size-3.5" /> {compactNumber(repo.forks)}</span>
                        {repo.openIssues > 0 ? <span className="flex items-center gap-1"><CircleDot className="size-3.5" /> {compactNumber(repo.openIssues)} open</span> : null}
                        <span className="flex items-center gap-1"><GitBranch className="size-3.5" /> {repo.defaultBranch}</span><span>{pushedLabel(repo.pushedAt)}</span>
                        <a href={repo.url} className="ml-auto inline-flex min-h-11 items-center gap-1 font-medium text-[#58a6ff] hover:underline" aria-label={`Open ${summary.username}/${repo.name} repository`}>Open the crime scene <ExternalLink className="size-3" /></a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : <div className="p-6 text-center text-sm text-[#8b949e]">No original public repositories were available. Even the roast got ghosted.</div>}
          </section>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-16 lg:self-start" aria-label="Profile summary">
          <section className="github-box overflow-hidden" aria-labelledby="profile-score-title">
            <div className="github-box-header flex items-center gap-2 px-4 py-3"><Flame className="size-4 text-[#f85149]" /><h2 id="profile-score-title" className="font-semibold">Profile score</h2></div>
            <div className="flex flex-col items-center p-5 text-center"><ScoreRing value={report.roastScore} /><p className="mt-4 text-sm font-medium leading-6 text-[#f0f6fc]">{report.scoreRoast}</p></div>
          </section>

          <section className="github-box overflow-hidden" aria-labelledby="about-profile-title">
            <div className="github-box-header flex items-center gap-2 px-4 py-3"><Users className="size-4 text-[#8b949e]" /><h2 id="about-profile-title" className="font-semibold">About this profile</h2></div>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <Image src={summary.avatarUrl} alt={`${summary.username}'s GitHub avatar`} width={72} height={72} quality={90} sizes="72px" preload className="size-[72px] rounded-full border border-[#30363d] object-cover" />
                <div className="min-w-0"><h3 className="truncate text-lg font-semibold leading-tight">{summary.displayName || summary.username}</h3><p className="truncate text-[#8b949e]">@{summary.username}</p><p className="mt-1 flex items-center gap-1 text-xs text-[#8b949e]"><MapPin className="size-3" /> Public GitHub profile</p></div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[#c9d1d9]">Classified as <strong className="text-[#f0f6fc]">{report.developerType}</strong>. The title is subjective; the repository trail is regrettably public.</p>
              {summary.languages.length ? <div className="mt-4 flex flex-wrap gap-2">{summary.languages.slice(0, 5).map((language) => <span key={language} className="rounded-full bg-[rgba(56,139,253,.15)] px-2.5 py-1 text-xs font-medium text-[#58a6ff]">{language}</span>)}</div> : null}
              <Button asChild variant="secondary" className="mt-4 w-full"><a href={summary.githubUrl}><Github className="size-4" /> View on GitHub <ExternalLink className="size-3" /></a></Button>
            </div>
          </section>
        </aside>
      </div>

      <section id="receipts" className="evidence-locker scroll-mt-16 border-y border-[#30363d] bg-[#010409]">
        <div className="app-shell px-4 py-10 md:px-6">
          <div className="mb-6 flex flex-col gap-3 border-b border-[#21262d] pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div><span className="mono-type text-[10px] font-semibold uppercase tracking-[.2em] text-[#58a6ff]">Source material</span><h2 className="mt-1 text-2xl font-semibold">The evidence locker</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#8b949e]">All the stats, samples, and scoring details used to produce the roast—kept together so the jokes can stay upstairs.</p></div>
            <span className="rounded-full border border-[#30363d] bg-[#161b22] px-3 py-1 text-xs text-[#8b949e]">Public data only</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">{metrics.map((metric) => <StatCard key={metric.label} {...metric} />)}</div>

          <div className="mt-6 github-box overflow-hidden">
            <div className="github-box-header flex items-center gap-2 px-4 py-3 font-semibold"><Activity className="size-4 text-[#58a6ff]" /> Score ledger</div>
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
              {scoreFactors.map((factor) => <div key={factor.label} className="min-w-0"><div className="flex items-baseline justify-between gap-2 text-xs"><span className="truncate text-[#8b949e]">{factor.label}</span><strong className="text-[#c9d1d9]">{factor.value}</strong></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#30363d]"><div className="score-fill h-full rounded-full bg-[#2f81f7]" style={{ width: `${factor.value}%` }} /></div></div>)}
            </div>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,.9fr)]">
            <div className="min-w-0"><CommitChart summary={summary} /></div>
            <section className="github-box min-w-0 overflow-hidden" aria-labelledby="roast-receipts-title">
              <div className="github-box-header flex items-center gap-2 px-4 py-3 font-semibold"><Flame className="size-4 text-[#f85149]" /><h3 id="roast-receipts-title">Roast receipts</h3><span className="ml-auto rounded-full bg-[#30363d] px-2 py-0.5 text-xs">{report.receipts.length}</span></div>
              <div className="divide-y divide-[#21262d]">{report.receipts.map((receipt) => <article key={receipt.title} className="px-4 py-4"><strong className="text-sm text-[#58a6ff]">{receipt.title}</strong><code className="mt-2 block rounded-md border border-[#30363d] bg-[#161b22] px-3 py-2 text-xs leading-5 text-[#c9d1d9]">{receipt.evidence}</code><p className="mt-2 text-sm leading-6 text-[#f0f6fc]">{receipt.punchline}</p></article>)}</div>
            </section>
          </div>

          <section id="methodology" className="mt-6 github-box scroll-mt-16 overflow-hidden" aria-labelledby="analysis-method-title">
            <div className="github-box-header flex items-center gap-2 px-4 py-3 font-semibold"><Info className="size-4 text-[#58a6ff]" /><h3 id="analysis-method-title">How this roast was assembled</h3></div>
            <div className="grid gap-px bg-[#21262d] text-sm leading-6 md:grid-cols-3">
              <div className="bg-[#0d1117] p-4"><strong className="text-[#c9d1d9]">What we read</strong><p className="mt-1 text-[#8b949e]">Public profile metadata, up to 100 recent repositories, public activity, commit subjects, and the contribution calendar. Selected public README excerpts, package metadata, and releases may also inform the review.</p></div>
              <div className="bg-[#0d1117] p-4"><strong className="text-[#c9d1d9]">Where it came from</strong><p className="mt-1 text-[#8b949e]">This run used {summary.dataSource === "github-api" ? "GitHub’s public REST API" : "a limited public profile fallback"}. Private and organization-only work is excluded.</p></div>
              <div className="bg-[#0d1117] p-4"><strong className="text-[#c9d1d9]">How scoring works</strong><p className="mt-1 text-[#8b949e]">Activity 45%, impact 25%, consistency 12%, maintenance 10%, and presentation 8%. It measures public profile signals, not engineering ability.</p></div>
            </div>
          </section>
        </div>
      </section>

      <ShareCard result={result} />
      <div className="app-shell px-4 pb-10 md:px-6"><div className="github-box flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div><strong>@{summary.username} survived the review</strong><p className="mt-1 text-sm text-[#8b949e]">The repositories will need a minute.</p></div><Button type="button" onClick={onReset}><Github className="size-4" /> Roast another profile</Button></div></div>
    </article>
  );
});
