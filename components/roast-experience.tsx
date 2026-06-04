"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Flame,
  Github,
  GitPullRequest,
  Loader2,
  Quote,
  Sparkles,
  Star,
  TerminalSquare,
  Trophy,
  WandSparkles
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ScoreRing } from "@/components/score-ring";
import { ShareCard } from "@/components/share-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { RoastResponse } from "@/lib/types";
import { cn, compactNumber } from "@/lib/utils";

const examples = ["torvalds", "gaearon", "sindresorhus"];
const loadingLines = [
  "Reading commit history...",
  "Finding questionable decisions...",
  "Counting unfinished projects...",
  "Consulting senior engineers...",
  "Ignoring their advice...",
  "Generating disappointment..."
];

const reveal = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 }
};

function MetricCard({
  label,
  value,
  suffix = "",
  tone = "pink"
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: "pink" | "violet" | "cyan";
}) {
  const color = tone === "pink" ? "from-pink" : tone === "violet" ? "from-violet" : "from-cyan";
  return (
    <Card className="p-5">
      <div className="mb-4 text-sm font-semibold text-zinc-400">{label}</div>
      <div className="text-4xl font-black tracking-normal">
        {value}
        {suffix}
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r to-white", color)}
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(100, Math.max(6, value))}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </div>
    </Card>
  );
}

function LoadingStage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIndex((current) => (current + 1) % loadingLines.length);
    }, 1250);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="mx-auto mt-10 max-w-xl rounded-[32px] border border-white/10 bg-white/[0.06] p-6 text-center shadow-glow"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <Loader2 className="mx-auto mb-4 size-8 animate-spin text-cyan" />
      <AnimatePresence mode="wait">
        <motion.div
          key={loadingLines[index]}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="text-lg font-bold"
        >
          {loadingLines[index]}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

export function RoastExperience() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<RoastResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const user = params.get("u");
    if (user) {
      setUsername(user);
      void submit(user);
    }
  }, []);

  async function submit(value = username) {
    const clean = value.trim();
    if (!clean) return;
    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to roast this profile.");
      setResult(payload as RoastResponse);
      window.history.replaceState(null, "", `?u=${encodeURIComponent(clean)}`);
      window.setTimeout(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }), 150);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to roast this profile.");
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit();
  }

  const stats = useMemo(() => {
    if (!result) return [];
    return [
      { label: "Projects Started", value: result.summary.repoCount, suffix: "", tone: "pink" as const },
      {
        label: "Projects Finished",
        value: result.summary.shippingScore,
        suffix: "%",
        tone: "cyan" as const
      },
      { label: "TODO Density", value: result.summary.todoDensity, suffix: "%", tone: "violet" as const },
      { label: "README Confidence", value: result.summary.readmeCoverage, suffix: "%", tone: "cyan" as const },
      { label: "Architecture Ego", value: Math.min(99, result.summary.languageDiversityScore + 18), suffix: "%", tone: "pink" as const },
      { label: "Bug Attraction Rate", value: result.summary.chaosScore, suffix: "%", tone: "violet" as const }
    ];
  }, [result]);

  return (
    <main className="min-h-screen overflow-hidden bg-background bg-radial-stage text-white">
      <div className="noise" />
      <section className="relative mx-auto flex min-h-[92vh] w-full max-w-6xl flex-col justify-center px-4 py-12 md:px-6">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1 } }
          }}
          className="relative z-10"
        >
          <motion.div variants={reveal} className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-zinc-200">
            <Sparkles className="size-4 text-pink" />
            GitRoast
          </motion.div>
          <motion.h1 variants={reveal} className="max-w-5xl text-6xl font-black leading-[0.92] tracking-normal sm:text-7xl lg:text-8xl">
            Your GitHub has been talking behind your back.
          </motion.h1>
          <motion.p variants={reveal} className="mt-6 max-w-2xl text-xl leading-8 text-zinc-300 md:text-2xl">
            Get a brutally honest AI performance review of your coding habits.
          </motion.p>
          <motion.form variants={reveal} onSubmit={onSubmit} className="mt-10 max-w-2xl rounded-[32px] border border-white/10 bg-[#17171C]/80 p-3 shadow-glow backdrop-blur-2xl">
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="username">
                GitHub username
              </label>
              <div className="flex min-h-14 flex-1 items-center gap-3 rounded-full bg-black/25 px-5">
                <Github className="size-5 text-zinc-400" />
                <input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="GitHub username"
                  className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-white outline-none placeholder:text-zinc-500"
                />
              </div>
              <Button disabled={isLoading} className="min-h-14">
                <Flame className="size-5" />
                Roast My GitHub
              </Button>
            </div>
          </motion.form>
          <motion.div variants={reveal} className="mt-4 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
            <span>Try:</span>
            {examples.map((example) => (
              <button
                key={example}
                className="rounded-full border border-white/10 px-3 py-1 font-semibold text-zinc-200 transition hover:border-cyan/50 hover:text-cyan"
                onClick={() => {
                  setUsername(example);
                  void submit(example);
                }}
              >
                {example}
              </button>
            ))}
          </motion.div>
          {error ? <div className="mt-5 max-w-2xl rounded-3xl border border-pink/40 bg-pink/10 p-4 text-sm font-semibold text-pink">{error}</div> : null}
          <AnimatePresence>{isLoading ? <LoadingStage /> : null}</AnimatePresence>
        </motion.div>
      </section>

      {result ? (
        <motion.div
          id="report"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          className="relative z-10"
        >
          <motion.section variants={reveal} className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1fr_auto] md:px-6">
            <Card className="flex flex-col gap-8 overflow-hidden p-6 sm:p-8 md:flex-row md:items-center">
              <Image
                src={result.summary.avatarUrl}
                alt={`${result.summary.username} avatar`}
                width={136}
                height={136}
                className="size-32 rounded-[28px] border border-white/10 object-cover shadow-card"
              />
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-3 text-sm font-semibold text-zinc-400">
                  <span>@{result.summary.username}</span>
                  <span>{compactNumber(result.summary.totalStars)} stars</span>
                  <span>{compactNumber(result.summary.totalForks)} forks</span>
                </div>
                <h2 className="text-4xl font-black tracking-normal md:text-6xl">{result.report.developerType}</h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">{result.report.archetypeDescription}</p>
              </div>
            </Card>
            <Card className="grid place-items-center p-6">
              <ScoreRing value={result.report.roastScore} />
            </Card>
          </motion.section>

          <motion.section variants={reveal} className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-pink/24 via-violet/18 to-cyan/16 p-8 shadow-glow sm:p-12">
              <WandSparkles className="mb-8 size-10 text-cyan" />
              <p className="max-w-5xl text-4xl font-black leading-tight tracking-normal md:text-6xl">{result.report.roast}</p>
              <div className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-zinc-300">
                Generated with {result.generatedWith === "openai" ? "AI" : "local fallback"}
              </div>
            </div>
          </motion.section>

          <motion.section variants={reveal} className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 md:grid-cols-[.8fr_1.2fr] md:px-6">
            <Card className="p-7">
              <TerminalSquare className="mb-5 size-9 text-pink" />
              <h2 className="text-3xl font-black tracking-normal">Developer Archetype</h2>
              <p className="mt-4 text-lg leading-8 text-zinc-300">{result.report.archetypeDescription}</p>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2">
              {result.summary.topPatterns.map((pattern) => (
                <Card key={pattern} className="flex items-start gap-4 p-5">
                  <BadgeCheck className="mt-1 size-5 shrink-0 text-cyan" />
                  <span className="font-semibold leading-7 text-zinc-100">{pattern}</span>
                </Card>
              ))}
            </div>
          </motion.section>

          <motion.section variants={reveal} className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3 md:px-6">
            {stats.map((stat) => (
              <MetricCard key={stat.label} {...stat} />
            ))}
          </motion.section>

          <motion.section variants={reveal} className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 md:grid-cols-2 md:px-6">
            <Card className="p-7">
              <Trophy className="mb-5 size-9 text-cyan" />
              <h2 className="text-3xl font-black tracking-normal">Fake LinkedIn Endorsements</h2>
              <div className="mt-6 grid gap-3">
                {result.report.endorsements.map((endorsement, index) => (
                  <div key={`${endorsement}-${index}`} className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 font-semibold">
                    Endorsed for: {endorsement}
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-7">
              <Quote className="mb-5 size-9 text-pink" />
              <h2 className="text-3xl font-black tracking-normal">Fake Testimonials</h2>
              <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-2">
                {result.report.testimonials.map((testimonial, index) => (
                  <div key={`${testimonial.by}-${index}`} className="min-w-[260px] snap-start rounded-3xl border border-white/10 bg-white/[0.06] p-5">
                    <p className="text-lg font-bold leading-7">&quot;{testimonial.quote}&quot;</p>
                    <div className="mt-5 text-sm font-semibold text-zinc-400">- {testimonial.by}</div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.section>

          <motion.section variants={reveal} className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6">
            <Card className="p-7">
              <GitPullRequest className="mb-5 size-9 text-violet" />
              <h2 className="text-3xl font-black tracking-normal">Commit Crimes</h2>
              <div className="mt-6 grid gap-4">
                {result.report.commitCrimes.map((crime, index) => (
                  <div key={`${crime.message}-${index}`} className="grid gap-3 rounded-3xl border border-white/10 bg-black/20 p-5 md:grid-cols-[.6fr_1fr]">
                    <code className="break-words rounded-2xl bg-black/35 p-4 font-mono text-sm text-cyan">{crime.message}</code>
                    <p className="font-semibold leading-7 text-zinc-200">{crime.commentary}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.section>

          <motion.div variants={reveal}>
            <ShareCard result={result} />
          </motion.div>
        </motion.div>
      ) : null}

      <footer className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-10 text-sm text-zinc-500 md:px-6">
        <span>GitRoast</span>
        <span>Roasts code, not people.</span>
      </footer>
    </main>
  );
}
