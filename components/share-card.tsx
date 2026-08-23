"use client";

import { Check, Download, GitBranch, Github, Link2, LoaderCircle, Share2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RoastResponse } from "@/lib/types";

type Feedback = "idle" | "downloading" | "downloaded" | "copied" | "shared" | "error";

export function ShareCard({ result }: { result: RoastResponse }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [feedback, setFeedback] = useState<Feedback>("idle");
  const bestSignal = result.report.receipts.find((receipt) => receipt.title === "Commit message exhibit")?.punchline
    ?? result.report.roast;

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
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  }

  function settle(next: Feedback) {
    setFeedback(next);
    window.setTimeout(() => setFeedback("idle"), 2200);
  }

  async function download() {
    if (!cardRef.current || feedback === "downloading") return;
    setFeedback("downloading");
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
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
    }
  }

  async function copyLink() {
    const url = `${window.location.origin}?u=${encodeURIComponent(result.summary.username)}`;
    settle((await copyText(url)) ? "copied" : "error");
  }

  async function share() {
    const text = `@${result.summary.username} scored ${result.report.roastScore}/100 on GitRoast: ${result.report.developerType}`;
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

  const feedbackText = {
    idle: "Ready to share",
    downloading: "Rendering preview...",
    downloaded: "PNG downloaded",
    copied: "Copied to clipboard",
    shared: "Share sheet opened",
    error: "Share failed. Please try again."
  }[feedback];

  return (
    <section className="mx-auto grid w-full max-w-[1216px] gap-6 px-4 py-10 md:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="github-box overflow-hidden bg-[#010409] p-3">
        <div
          ref={cardRef}
          className="relative flex aspect-[1200/630] min-h-[360px] w-full flex-col overflow-hidden rounded-md border border-[#30363d] bg-[#0d1117] text-[#f0f6fc]"
        >
          <div className="flex h-[15%] min-h-16 items-center justify-between border-b border-[#21262d] bg-[#010409] px-[5%]">
            <div className="flex items-center gap-3 text-xl font-semibold">
              <Github className="size-8" />
              <span>gitroast / profile-review</span>
              <span className="rounded-full border border-[#30363d] px-2 py-0.5 text-xs font-medium text-[#8b949e]">Public</span>
            </div>
            <div className="mono-type text-xs text-[#8b949e]">ROAST.md</div>
          </div>

          <div className="flex flex-1 items-center gap-[5%] px-[6%] py-[5%]">
            <Image
              src={result.summary.avatarUrl}
              alt=""
              width={240}
              height={240}
              quality={100}
              sizes="240px"
              className="aspect-square h-auto w-[18%] min-w-24 shrink-0 rounded-full border border-[#30363d] object-cover sm:min-w-28"
            />
            <div className="min-w-0 flex-1">
              <div className="mono-type text-sm text-[#8b949e]">github.com/{result.summary.username}</div>
              <h2 className="mt-3 text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-[1.05] tracking-[-0.035em]">{result.report.developerType}</h2>
              <p className="mt-5 line-clamp-2 max-w-3xl text-base leading-7 text-[#c9d1d9]">{bestSignal}</p>
            </div>
            <div className="w-[18%] min-w-[104px] shrink-0 rounded-md border border-[#30363d] bg-[#161b22] p-3 sm:min-w-[132px] sm:p-4">
              <span className="mono-type block text-[10px] uppercase tracking-wider text-[#8b949e] sm:text-xs">Roast score</span>
              <div className="mt-2 flex items-baseline gap-1">
                <strong className="text-[clamp(2.4rem,5vw,4.8rem)] leading-none">{result.report.roastScore}</strong>
                <span className="text-sm text-[#8b949e]">/100</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#30363d]">
                <div className="h-full rounded-full bg-[#f85149]" style={{ width: `${result.report.roastScore}%` }} />
              </div>
            </div>
          </div>

          <div className="flex h-[13%] min-h-14 items-center justify-between border-t border-[#21262d] bg-[#161b22] px-[5%] text-sm">
            <span className="flex items-center gap-2 text-[#c9d1d9]"><GitBranch className="size-4 text-[#3fb950]" /> Review completed from public GitHub activity</span>
            <span className="font-semibold text-[#58a6ff]">gitroast</span>
          </div>
        </div>
      </div>

      <aside className="github-box overflow-hidden self-start">
        <div className="github-box-header px-4 py-3 font-semibold">Share this review</div>
        <div className="p-4">
          <p className="text-sm leading-6 text-[#8b949e]">Export the repository-style preview or invite someone to review the same public profile.</p>
          <div className="mt-4 grid gap-2">
            <Button type="button" onClick={download} disabled={feedback === "downloading"}>
              {feedback === "downloading" ? <LoaderCircle className="size-4 animate-spin" /> : feedback === "downloaded" ? <Check className="size-4" /> : <Download className="size-4" />}
              {feedback === "downloading" ? "Rendering" : "Download PNG"}
            </Button>
            <Button type="button" variant="secondary" onClick={copyLink}>
              {feedback === "copied" ? <Check className="size-4" /> : <Link2 className="size-4" />}
              Copy profile link
            </Button>
            <Button type="button" variant="secondary" onClick={share}>
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
