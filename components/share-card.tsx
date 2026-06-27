"use client";

import { toPng } from "html-to-image";
import { Download, Link2, Share2 } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RoastResponse } from "@/lib/types";

export function ShareCard({ result }: { result: RoastResponse }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const bestSignal = result.summary.topPatterns[0] ?? result.summary.repos[0]?.name ?? "Shipping with theatrical confidence";

  async function copyText(text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall back below.
      }
    }

    if (typeof document === "undefined") return false;

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.readOnly = true;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    const copiedWithFallback =
      typeof document.execCommand === "function" ? document.execCommand("copy") : false;

    document.body.removeChild(textarea);
    return copiedWithFallback;
  }

  async function download() {
    if (!cardRef.current) return;
    const dataUrl = await toPng(cardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#0B0B0F"
    });
    const link = document.createElement("a");
    link.download = `gitroast-${result.summary.username}.png`;
    link.href = dataUrl;
    link.click();
  }

  async function copyLink() {
    const url = `${window.location.origin}?u=${encodeURIComponent(result.summary.username)}`;
    const copiedSuccessfully = await copyText(url);
    setCopied(copiedSuccessfully);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function share() {
    const text = `${result.summary.username} scored ${result.report.roastScore}/100 on GitRoast: ${result.report.developerType}`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "GitRoast", text, url: window.location.href });
        return;
      } catch {
        // Fall through to copy fallback.
      }
    }

    const copiedSuccessfully = await copyText(text);
    setCopied(copiedSuccessfully);
  }

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1fr_.82fr] md:px-6">
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0B0B0F] p-8 shadow-card"
      >
        <div className="absolute inset-0 bg-radial-stage opacity-90" />
        <div className="relative z-10 flex min-h-[420px] flex-col justify-between">
          <div className="flex items-center gap-4">
            <Image
              src={result.summary.avatarUrl}
              alt=""
              width={72}
              height={72}
              className="rounded-3xl border border-white/15"
            />
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan">GitRoast</div>
              <div className="text-2xl font-black tracking-normal">@{result.summary.username}</div>
            </div>
          </div>
          <div>
            <div className="mb-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white break-words max-w-full">
              {result.report.developerType}
            </div>
            <div className="max-w-xl text-5xl font-black leading-[0.98] tracking-normal sm:text-6xl break-words">
              {result.report.roastScore}/100 roast score.
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/25 p-5 text-lg font-semibold text-zinc-100 break-words">
            Endorsed for: {bestSignal}
          </div>
        </div>
      </div>
      <div className="glass flex flex-col justify-center rounded-[32px] p-6">
        <div className="mb-5">
          <h2 className="text-3xl font-black tracking-normal">Share Card</h2>
          <p className="mt-2 text-zinc-400">A screenshot-ready summary sized for maximum social accountability.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
          <Button onClick={download}>
            <Download className="size-4" />
            Download PNG
          </Button>
          <Button variant="secondary" onClick={copyLink}>
            <Link2 className="size-4" />
            {copied ? "Copied" : "Copy Link"}
          </Button>
          <Button variant="secondary" onClick={share}>
            <Share2 className="size-4" />
            Share
          </Button>
        </div>
      </div>
    </section>
  );
}
