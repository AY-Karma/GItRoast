"use client";

import {
  BookOpen,
  Check,
  Code2,
  Copy,
  Download,
  GitBranch,
  GitCommitHorizontal,
  Github,
  Link2,
  LoaderCircle,
  MessageSquare,
  Share2,
  Star
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RoastResponse } from "@/lib/types";
import { compactNumber, profileScoreColor } from "@/lib/utils";

type Feedback = "idle" | "downloading" | "downloaded" | "copied" | "caption-copied" | "shared" | "error";

const activityPalette = ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"];

export function ShareCard({ result }: { result: RoastResponse }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState<number | null>(null);
  const [previewZoomed, setPreviewZoomed] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const [isDownloading, setIsDownloading] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const downloadRef = useRef(false);

  useEffect(() => () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, []);
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const updateScale = () => setPreviewScale(Math.min(1, preview.clientWidth / 1200));
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(preview);
    return () => observer.disconnect();
  }, []);
  const scoreColor = profileScoreColor(result.report.roastScore);
  const bestSignal = result.report.roast;
  const featuredReview = [...result.report.repositoryRoasts].sort((a, b) => {
    const strength = (review: typeof a) => {
      const repo = result.summary.repos.find((item) => item.name === review.name);
      return (repo?.evidence?.runtimeDependencies !== undefined && repo.evidence.runtimeDependencies >= 20 ? 6 : 0)
        + (repo && repo.stars >= 20 && !repo.description?.trim() ? 5 : 0)
        + (review.status === "changes-requested" ? 3 : 0)
        + Math.min(repo?.stars ?? 0, 100) / 100;
    };
    return strength(b) - strength(a);
  })[0];
  const featuredRepository = result.summary.repos.find((repo) => repo.name === featuredReview?.name) ?? result.summary.repos[0];
  const reviewSubject = featuredReview?.name ?? featuredRepository?.name ?? "profile-review";
  const reviewCommentary = featuredReview?.commentary ?? bestSignal;
  const reviewStatus = featuredReview?.status ?? "commented";
  const reviewStatusLabel = {
    approved: "Approved",
    commented: "Commented",
    "changes-requested": "Changes requested"
  }[reviewStatus];
  const reviewStatusClass = reviewStatus === "approved"
    ? "border-[#238636] bg-[#122117] text-[#3fb950]"
    : reviewStatus === "changes-requested"
      ? "border-[#9e6a03] bg-[#2a1f0b] text-[#d29922]"
      : "border-[#1f6feb] bg-[#0c2d6b] text-[#79c0ff]";
  const scoreVerdict = result.report.roastScore >= 80
    ? "Merge ready"
    : result.report.roastScore >= 60
      ? "Review complete"
      : "Changes requested";
  const shareStats = [
    { label: "Contributions", value: compactNumber(result.summary.totalContributions), Icon: GitCommitHorizontal },
    { label: "Stars earned", value: compactNumber(result.summary.totalStars), Icon: Star },
    { label: "Public repos", value: compactNumber(result.summary.repoCount), Icon: BookOpen },
    { label: "Top language", value: result.summary.languages[0] ?? "Mixed", Icon: Code2 }
  ];
  const recentActivity = result.summary.contributions.slice(-14);
  const activityLevels = Array.from({ length: 14 }, (_, index) => {
    const offset = 14 - recentActivity.length;
    return index < offset ? 0 : recentActivity[index - offset]?.level ?? 0;
  });

  async function copyText(value: string) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch {
        // Some browsers expose the clipboard API but deny access outside a secure context.
      }
    }

    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.readOnly = true;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    const previouslyFocused = document.activeElement;
    try {
      textarea.select();
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      textarea.remove();
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
    }
  }

  function settle(next: Feedback) {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setFeedback(next);
    feedbackTimerRef.current = setTimeout(() => setFeedback("idle"), 2200);
  }

  async function download() {
    if (!cardRef.current || downloadRef.current) return;
    downloadRef.current = true;
    setIsDownloading(true);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    const card = cardRef.current;
    let exportCard: HTMLDivElement | null = null;
    setFeedback("downloading");
    try {
      exportCard = card.cloneNode(true) as HTMLDivElement;
      exportCard.dataset.exporting = "true";
      Object.assign(exportCard.style, {
        position: "fixed",
        inset: "0 auto auto -10000px",
        width: "1200px",
        height: "630px",
        minHeight: "630px",
        maxWidth: "none",
        aspectRatio: "auto",
        transform: "none",
        visibility: "visible",
        pointerEvents: "none"
      });
      document.body.appendChild(exportCard);
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(exportCard, {
        cacheBust: false,
        skipFonts: true,
        pixelRatio: 1,
        width: 1200,
        height: 630,
        canvasWidth: 1200,
        canvasHeight: 630,
        backgroundColor: "#0d1117"
      });
      const link = document.createElement("a");
      link.download = `gitroast-${result.summary.username}.png`;
      link.href = dataUrl;
      link.click();
      settle("downloaded");
    } catch {
      settle("error");
    } finally {
      exportCard?.remove();
      downloadRef.current = false;
      setIsDownloading(false);
    }
  }

  async function copyLink() {
    if (downloadRef.current) return;
    const url = `${window.location.origin}?u=${encodeURIComponent(result.summary.username)}`;
    settle((await copyText(url)) ? "copied" : "error");
  }

  async function copyCaption() {
    if (downloadRef.current) return;
    const url = `${window.location.origin}?u=${encodeURIComponent(result.summary.username)}`;
    const text = `@${result.summary.username} was reviewed as “${result.report.developerType}” — ${result.report.roastScore}/100.\n${reviewCommentary}\n${url}`;
    settle((await copyText(text)) ? "caption-copied" : "error");
  }

  async function share() {
    if (downloadRef.current) return;
    const text = `@${result.summary.username} was reviewed as “${result.report.developerType}” — ${result.report.roastScore}/100. ${reviewCommentary}`;
    const url = `${window.location.origin}?u=${encodeURIComponent(result.summary.username)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "GitRoast", text, url });
        settle("shared");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    settle((await copyText(`${text}\n${url}`)) ? "copied" : "error");
  }

  const feedbackText = isDownloading ? "Rendering preview..." : {
    idle: "Ready to share",
    downloading: "Rendering preview...",
    downloaded: "PNG downloaded",
    copied: "Copied to clipboard",
    "caption-copied": "Roast caption copied",
    shared: "Share sheet opened",
    error: "Share failed. Please try again."
  }[feedback];

  return (
    <section id="share" className="app-shell grid scroll-mt-16 gap-6 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1120px)_360px] 2xl:justify-center">
      <div className="github-box share-card-preview w-full max-w-[1120px] justify-self-center overflow-hidden bg-[#010409] p-3">
        <div ref={previewRef} className={`w-full rounded-md ${previewZoomed ? "h-[630px] overflow-x-auto" : "aspect-[1200/630] overflow-hidden"}`}>
          <div
            ref={cardRef}
            data-share-card
            className="relative grid h-[630px] w-[1200px] grid-rows-[88px_minmax(0,1fr)_70px] overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] [container-type:inline-size]"
            style={{ transform: `scale(${previewZoomed ? 1 : previewScale ?? 1})`, transformOrigin: "top left", visibility: previewScale === null ? "hidden" : "visible" }}
          >
          <div className="flex min-w-0 items-center justify-between gap-[2cqw] border-b border-[#21262d] bg-[#010409] px-[5cqw]">
            <div className="flex min-w-0 items-center gap-[clamp(0.4rem,1.4cqw,0.75rem)] font-semibold">
              <Github className="size-[clamp(1.35rem,3cqw,2rem)] shrink-0" />
              <span className="truncate text-[clamp(0.75rem,1.8cqw,1.25rem)]">gitroast / profile-review</span>
              <span className="shrink-0 rounded-full border border-[#30363d] px-[1cqw] py-0.5 text-[clamp(0.5rem,1cqw,0.75rem)] font-medium text-[#8b949e]">Public</span>
            </div>
            <div className="mono-type shrink-0 text-[clamp(0.5rem,1cqw,0.75rem)] text-[#8b949e]">ROAST.md</div>
          </div>

          <div
            data-share-main
            className="share-card-main grid min-h-0 min-w-0 grid-cols-[clamp(4.5rem,18cqw,13.5rem)_minmax(0,1fr)_clamp(6.5rem,18cqw,13.5rem)] items-center gap-x-[clamp(0.75rem,4cqw,3rem)] gap-y-[clamp(0.5rem,1.4cqw,1rem)] px-[6cqw] py-[2.4cqw]"
          >
            <Image
              src={result.summary.avatarUrl}
              alt=""
              width={240}
              height={240}
              quality={100}
              sizes="240px"
              className="share-card-avatar share-card-motion aspect-square h-auto w-full rounded-full border border-[#30363d] object-cover"
            />
            <div className="share-card-identity share-card-motion min-w-0 self-center">
              <div className="share-card-username mono-type break-all text-[clamp(0.6rem,1.2cqw,0.875rem)] text-[#8b949e]">github.com/{result.summary.username}</div>
              <h2
                data-share-title
                className="mt-[1.2cqw] max-w-full text-balance text-[clamp(1.5rem,5.4cqw,4rem)] font-semibold leading-[1.02] tracking-[-0.035em] [overflow-wrap:anywhere]"
              >
                {result.report.developerType}
              </h2>
              <p className="mt-[1.5cqw] line-clamp-2 max-w-full text-[clamp(0.7rem,1.4cqw,1rem)] leading-[1.5] text-[#c9d1d9] [overflow-wrap:anywhere]">{bestSignal}</p>
            </div>
            <div data-share-score className="share-card-score share-card-motion min-w-0 rounded-md border border-[#30363d] bg-[#161b22] p-[clamp(0.6rem,1.6cqw,1rem)]">
              <span className="share-card-score-label mono-type block text-[clamp(0.5rem,0.9cqw,0.7rem)] uppercase tracking-wider text-[#8b949e]"><span className="share-card-score-label-prefix">Profile </span>score</span>
              <div className="mt-[1.2cqw] flex min-w-0 items-end gap-[0.5cqw]">
                <strong className="text-[clamp(2rem,6cqw,4.5rem)] leading-none">{result.report.roastScore}</strong>
                <span className="share-card-score-unit pb-[0.5cqw] text-[clamp(0.55rem,1.2cqw,0.875rem)] text-[#8b949e]">/100</span>
              </div>
              <div className="mt-[1.5cqw] h-[clamp(0.3rem,0.7cqw,0.5rem)] overflow-hidden rounded-full bg-[#30363d]">
                <div className="share-card-score-fill share-card-motion h-full rounded-full" style={{ width: `${result.report.roastScore}%`, backgroundColor: scoreColor }} />
              </div>
              <span className="share-card-score-verdict mt-[1cqw] block text-[clamp(0.5rem,0.9cqw,0.7rem)] font-semibold" style={{ color: scoreColor }}>{scoreVerdict}</span>
            </div>

            <div data-share-details className="share-card-details col-start-2 col-end-4 grid min-w-0 grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-[1cqw] self-end">
              <div className="share-card-review share-card-motion min-w-0 rounded-md border border-[#30363d] bg-[#010409] px-[1.3cqw] py-[1cqw]">
                <div className="flex min-w-0 items-center gap-[0.7cqw]">
                  <MessageSquare className="size-[clamp(0.65rem,1.2cqw,0.9rem)] shrink-0 text-[#58a6ff]" />
                  <span className="mono-type min-w-0 truncate text-[clamp(0.75rem,1cqw,0.875rem)] text-[#8b949e]">gitroast[bot] reviewed {reviewSubject}</span>
                  <span className={`shrink-0 rounded-full border px-[0.7cqw] py-px text-[clamp(0.65rem,0.9cqw,0.75rem)] font-semibold ${reviewStatusClass}`}>{reviewStatusLabel}</span>
                </div>
                <p className="mt-[0.6cqw] line-clamp-2 text-[clamp(0.875rem,1.25cqw,1rem)] leading-[1.4] text-[#c9d1d9] [overflow-wrap:anywhere]">{reviewCommentary}</p>
              </div>

              <div data-share-stats className="grid min-w-0 grid-cols-2 gap-[0.6cqw]">
                {shareStats.map(({ label, value, Icon }, index) => (
                  <div key={label} className="share-card-stat share-card-motion min-w-0 rounded-md border border-[#30363d] bg-[#161b22] px-[0.8cqw] py-[0.6cqw]" style={{ animationDelay: `${150 + index * 35}ms` }}>
                    <div className="flex min-w-0 items-center gap-[0.45cqw] text-[#8b949e]">
                      <Icon className="size-[clamp(0.55rem,0.95cqw,0.72rem)] shrink-0" />
                      <span className="truncate text-[clamp(0.75rem,1cqw,0.875rem)] uppercase tracking-wide">{label}</span>
                    </div>
                    <strong className="mt-[0.2cqw] block truncate text-[clamp(1rem,1.5cqw,1.25rem)] leading-none text-[#f0f6fc]">{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex min-w-0 items-center justify-between gap-[2cqw] border-t border-[#21262d] bg-[#161b22] px-[5cqw] text-[clamp(0.8rem,1.2cqw,0.95rem)]">
            <span className="share-card-footer-summary flex min-w-0 items-center gap-[1cqw] text-[#c9d1d9]"><GitBranch className="size-[clamp(0.75rem,1.5cqw,1rem)] shrink-0 text-[#3fb950]" /><span className="truncate">Reviewed {result.summary.analyzedRepoCount} repos · {result.summary.sampledCommitCount} commits</span></span>
            <span className="share-card-activity flex items-center gap-[0.35cqw]" aria-label={`${result.summary.totalContributions} public contributions`}>
              {activityLevels.map((level, index) => (
                <span key={index} className="share-card-activity-cell share-card-motion size-[clamp(0.25rem,0.65cqw,0.45rem)] rounded-[1px] border border-black/20" style={{ backgroundColor: activityPalette[Math.min(level, 4)], animationDelay: `${180 + index * 18}ms` }} />
              ))}
            </span>
            <span className="share-card-brand shrink-0 font-semibold text-[#58a6ff]">gitroast<span className="share-card-brand-suffix"> · unofficial</span></span>
          </div>
        </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-[#8b949e]">
          <span>The preview matches the 1200 × 630 PNG.</span>
          <button type="button" aria-pressed={previewZoomed} onClick={() => setPreviewZoomed((value) => !value)} className="min-h-11 rounded-md border border-[#30363d] bg-[#161b22] px-3 font-medium text-[#c9d1d9] hover:bg-[#21262d]">
            {previewZoomed ? "Fit card to screen" : "Inspect at full size"}
          </button>
        </div>
      </div>

      <aside className="github-box overflow-hidden self-start">
        <div className="github-box-header px-4 py-3 font-semibold">Share this review</div>
        <div className="p-4">
          <p className="text-sm leading-6 text-[#8b949e]">Export a 1200×630 review card with real profile stats, a repository verdict, and a share-ready roast.</p>
          <div className="mt-4 grid gap-2">
            <Button type="button" onClick={download} disabled={isDownloading}>
              {isDownloading ? <LoaderCircle className="size-4 animate-spin" /> : feedback === "downloaded" ? <Check className="size-4" /> : <Download className="size-4" />}
              {isDownloading ? "Rendering" : "Download PNG"}
            </Button>
            <Button type="button" variant="secondary" onClick={copyLink} disabled={isDownloading}>
              {feedback === "copied" ? <Check className="size-4" /> : <Link2 className="size-4" />}
              Copy review link
            </Button>
            <Button type="button" variant="secondary" onClick={copyCaption} disabled={isDownloading}>
              {feedback === "caption-copied" ? <Check className="size-4" /> : <Copy className="size-4" />}
              Copy roast caption
            </Button>
            <Button type="button" variant="secondary" onClick={share} disabled={isDownloading}>
              <Share2 className="size-4" /> Share review
            </Button>
          </div>
          <p className={`mt-4 text-xs ${feedback === "error" ? "text-[#f85149]" : "text-[#8b949e]"}`} role="status" aria-live="polite">
            {feedbackText}
          </p>
        </div>
      </aside>
    </section>
  );
}
