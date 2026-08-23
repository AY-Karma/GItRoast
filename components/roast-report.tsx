"use client";

import {
  Activity,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Code2,
  ExternalLink,
  Flame,
  GitCommitHorizontal,
  Github,
  History,
  Info,
  Lightbulb,
  MapPin,
  RotateCcw,
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
    <div className="github-box flex min-h-32 flex-col p-4">
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
          <li key={`${item}-${index}`} className="flex gap-3 px-4 py-3 text-sm leading-6 text-[#c9d1d9]">
            <CircleDot className={`mt-1 size-4 shrink-0 ${positive ? "text-[#3fb950]" : "text-[#f85149]"}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
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
        <div className="mx-auto flex h-12 w-full max-w-[1216px] items-center gap-1 overflow-x-auto px-4 md:px-6">
          <a href="#verdict" className="flex h-12 shrink-0 items-center gap-2 border-b-2 border-[#f78166] px-3 font-semibold text-[#f0f6fc]"><BookOpen className="size-4" /> Overview</a>
          <a href="#receipts" className="flex h-12 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-[#c9d1d9] hover:bg-[#21262d]"><Activity className="size-4" /> Insights</a>
          <a href="#commits" className="flex h-12 shrink-0 items-center gap-2 border-b-2 border-transparent px-3 text-[#c9d1d9] hover:bg-[#21262d]"><History className="size-4" /> Commits</a>
          <button type="button" onClick={onReset} className="ml-auto flex h-8 shrink-0 items-center gap-2 rounded-md border border-[#30363d] bg-[#21262d] px-3 font-medium text-[#c9d1d9] hover:bg-[#30363d]"><RotateCcw className="size-3.5" /> New profile</button>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1216px] gap-8 px-4 py-8 md:px-6 lg:grid-cols-[296px_minmax(0,1fr)]">
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
            <a href={summary.githubUrl} target="_blank" rel="noreferrer"><Github className="size-4" /> View on GitHub <ExternalLink className="size-3" /></a>
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

          <section className="github-box grid gap-5 p-5 sm:grid-cols-[190px_1fr] sm:items-center">
            <ScoreRing value={report.roastScore} />
            <div>
              <h2 className="text-lg font-semibold">Profile review completed</h2>
              <p className="mt-1 text-sm leading-6 text-[#8b949e]">GitRoast checked the available public profile, repository, event, and contribution signals.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border border-[#30363d] bg-[#161b22] p-3"><span className="block text-xs text-[#8b949e]">Total stars</span><strong>{compactNumber(summary.totalStars)}</strong></div>
                <div className="rounded-md border border-[#30363d] bg-[#161b22] p-3"><span className="block text-xs text-[#8b949e]">Total forks</span><strong>{compactNumber(summary.totalForks)}</strong></div>
              </div>
            </div>
          </section>

          <section id="receipts" className="scroll-mt-16">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-base font-semibold">Pinned insights</h2>
              <span className="text-xs text-[#8b949e]">Based on sampled public activity</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
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

          <section className="rounded-md border border-[rgba(46,160,67,.45)] bg-[rgba(46,160,67,.08)] p-4">
            <div className="flex gap-3">
              <Lightbulb className="mt-0.5 size-5 shrink-0 text-[#3fb950]" />
              <div>
                <h2 className="font-semibold text-[#f0f6fc]">Suggested patch</h2>
                <p className="mt-1 text-sm leading-6 text-[#c9d1d9]">{report.redemption}</p>
              </div>
            </div>
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
                    <article key={`${crime.message}-${index}`} className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(180px,.8fr)_1.2fr]">
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

          <section className="github-box overflow-hidden">
            <div className="github-box-header flex items-center gap-2 px-4 py-3 font-semibold"><Code2 className="size-4" /> Repositories reviewed</div>
            <div className="divide-y divide-[#21262d]">
              {summary.repos.slice(0, 6).map((repo) => (
                <article key={repo.name} className="px-4 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-[#58a6ff]">{repo.name}</strong>
                    <span className="rounded-full border border-[#30363d] px-2 py-0.5 text-[11px] text-[#8b949e]">Public</span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm text-[#8b949e]">{repo.description || "No description provided."}</p>
                  <div className="mt-3 flex items-center gap-4 text-xs text-[#8b949e]">
                    {repo.language ? <span>{repo.language}</span> : null}
                    <span className="flex items-center gap-1"><Star className="size-3.5" /> {compactNumber(repo.stars)}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <details id="methodology" className="github-box group scroll-mt-16">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold">
              <Info className="size-4 text-[#58a6ff]" /> About this analysis
              <ChevronRight className="ml-auto size-4 text-[#8b949e] transition-transform group-open:rotate-90" />
            </summary>
            <div className="grid gap-4 border-t border-[#21262d] px-4 py-4 text-sm leading-6 text-[#8b949e] md:grid-cols-3">
              <p><strong className="text-[#c9d1d9]">Scope.</strong> Public profile metadata, up to 100 recent repositories, the public activity feed, and the contribution calendar.</p>
              <p><strong className="text-[#c9d1d9]">Source.</strong> This run used {summary.dataSource === "github-api" ? "GitHub’s public REST API" : "a limited public profile fallback"}. Private and organization-only activity is excluded.</p>
              <p><strong className="text-[#c9d1d9]">Interpretation.</strong> Shipping and chaos scores are comic heuristics, not engineering-performance measurements.</p>
            </div>
          </details>
        </div>
      </div>

      <ShareCard result={result} />

      <div className="mx-auto w-full max-w-[1216px] px-4 pb-10 md:px-6">
        <div className="github-box flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><strong>Finished reviewing @{summary.username}</strong><p className="mt-1 text-sm text-[#8b949e]">Run another public profile through the same checks.</p></div>
          <Button type="button" onClick={onReset}><Github className="size-4" /> Roast another profile</Button>
        </div>
      </div>
    </article>
  );
}
