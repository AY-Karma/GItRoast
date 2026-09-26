"use client";

import {
  Activity,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Flame,
  Github,
  History,
  Info,
  LoaderCircle,
  LockKeyhole,
  MessageSquare,
  Search,
  ShieldCheck
} from "lucide-react";
import dynamic from "next/dynamic";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { RoastResponse } from "@/lib/types";

const RoastReport = dynamic(
  () => import("@/components/roast-report").then((module) => module.RoastReport),
  { loading: () => <div className="app-shell my-10 px-4 md:px-6"><div className="h-32 animate-pulse rounded-md border border-[#30363d] bg-[#161b22]" /></div> }
);

const examples = ["torvalds", "gaearon", "sindresorhus"];
function LoadingStage({ username }: { username: string }) {
  return (
    <div className="github-box mt-4 overflow-hidden" role="status" aria-live="polite">
      <div className="flex items-start gap-3 px-4 py-4">
        <LoaderCircle className="octicon-spin mt-0.5 size-5 shrink-0 text-[#d29922]" aria-hidden="true" />
        <div>
          <strong className="block">Reviewing @{username}</strong>
          <p className="mt-1 text-sm text-[#8b949e]">Collecting public signals and preparing the review. This may take a moment.</p>
        </div>
      </div>
    </div>
  );
}

function RepositoryHeader({ result, isLoading, username }: { result: RoastResponse | null; isLoading: boolean; username: string }) {
  const approvedCount = result?.report.repositoryRoasts.filter((repo) => repo.status === "approved").length ?? 0;

  return (
    <div className="border-b border-[#21262d] bg-[#0d1117]">
      <div className="app-shell px-4 pt-5 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2 text-xl">
            <BookOpen className="size-4 shrink-0 text-[#8b949e]" />
            <a href="#main-content" className="truncate font-normal text-[#58a6ff] hover:underline">gitroast</a>
            <span className="text-[#8b949e]">/</span>
            <a href="#main-content" className="truncate font-semibold text-[#58a6ff] hover:underline">profile-review</a>
            <span className="rounded-full border border-[#30363d] px-2 py-0.5 text-xs font-medium text-[#8b949e]">Public</span>
          </div>
          <div className="flex items-center gap-2">
            {result ? (
              <>
                <span className="inline-flex h-8 items-center gap-2 rounded-md border border-[#30363d] bg-[#21262d] px-3 text-xs font-medium text-[#c9d1d9]"><MessageSquare className="size-4" /> {result.report.repositoryRoasts.length} repo comments</span>
                <span className="inline-flex h-8 items-center gap-2 rounded-md border border-[rgba(46,160,67,.45)] bg-[rgba(46,160,67,.12)] px-3 text-xs font-medium text-[#3fb950]"><Check className="size-4" /> {approvedCount} approved</span>
              </>
            ) : isLoading ? (
              <>
                <span className="inline-flex h-8 items-center gap-2 rounded-md border border-[#30363d] bg-[#21262d] px-3 text-xs font-medium text-[#c9d1d9]"><LoaderCircle className="octicon-spin size-4" /> Checks running</span>
                <span className="hidden h-8 items-center gap-2 rounded-md border border-[#30363d] px-3 text-xs text-[#8b949e] sm:inline-flex"><Search className="size-4" /> @{username}</span>
              </>
            ) : (
              <>
                <span className="inline-flex h-8 items-center gap-2 rounded-md border border-[#30363d] bg-[#21262d] px-3 text-xs font-medium text-[#c9d1d9]"><ShieldCheck className="size-4 text-[#3fb950]" /> Artifact-only jokes</span>
                <span className="hidden h-8 items-center gap-2 rounded-md border border-[#30363d] px-3 text-xs text-[#8b949e] sm:inline-flex"><LockKeyhole className="size-4" /> Public data</span>
              </>
            )}
          </div>
        </div>
        <nav className="mt-5 flex gap-1 overflow-x-auto" aria-label="Repository navigation">
          {[
            [Code2, "Overview", "#main-content", !result],
            ...(result ? [
              [Flame, "Roast report", "#verdict", false],
              [Activity, "Receipts", "#receipts", false],
              [History, "Commits", "#commits", false],
              [MessageSquare, "Repositories", "#repositories", false]
            ] : [])
          ].map(([Icon, label, href, active]) => {
            const NavIcon = Icon as typeof Code2;
            return (
              <a
                key={String(label)}
                href={String(href)}
                className={`flex h-10 shrink-0 items-center gap-2 border-b-2 px-3 text-sm text-[#c9d1d9] hover:bg-[#161b22] ${active ? "border-[#f78166] font-semibold" : "border-transparent"}`}
              >
                <NavIcon className="size-4 text-[#8b949e]" /> {String(label)}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function RoastExperience() {
  const [username, setUsername] = useState("");
  const [activeUsername, setActiveUsername] = useState("");
  const [result, setResult] = useState<RoastResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const reportHeadingRef = useRef<HTMLHeadingElement>(null);

  const submit = useCallback(async (rawValue: string) => {
    const clean = rawValue.trim().replace(/^@/, "");
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(clean)) {
      setError("Enter a valid GitHub username using letters, numbers, or hyphens.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestIdRef.current;
    setUsername(clean);
    setActiveUsername(clean);
    setResult(null);
    setIsLoading(true);
    setError("");
    void import("@/components/roast-report").catch(() => {});

    try {
      const response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: clean }),
        signal: controller.signal
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message = payload && typeof payload === "object" && "error" in payload
          ? String((payload as { error: unknown }).error)
          : "GitHub did not return a usable profile.";
        throw new Error(message);
      }
      if (requestId !== requestIdRef.current) return;
      setResult(payload as RoastResponse);
      window.history.replaceState(null, "", `?u=${encodeURIComponent(clean)}`);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (requestId === requestIdRef.current) {
        setError(caught instanceof Error ? caught.message : "GitHub did not return a usable profile.");
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const sharedUsername = new URLSearchParams(window.location.search).get("u");
    const sharedReviewTimer = sharedUsername && /^[a-zA-Z0-9-]{1,39}$/.test(sharedUsername)
      ? window.setTimeout(() => void submit(sharedUsername), 0)
      : undefined;
    return () => {
      if (sharedReviewTimer) window.clearTimeout(sharedReviewTimer);
      abortRef.current?.abort();
    };
  }, [submit]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoading) void submit(username);
  }

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    abortRef.current?.abort();
    setResult(null);
    setError("");
    setIsLoading(false);
    window.history.replaceState(null, "", window.location.pathname);
    document.getElementById("username")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
      <header className="border-b border-[#21262d] bg-[#010409]">
        <div className="app-shell flex h-16 items-center gap-3 px-4 md:px-8">
          <a href="#main-content" aria-label="GitRoast home" className="text-[#f0f6fc]"><Github className="size-8" fill="currentColor" /></a>
          <div className="h-6 w-px bg-[#30363d]" />
          <span className="font-semibold text-[#f0f6fc]">GitRoast</span>
          <span className="hidden rounded-full border border-[#30363d] px-2 py-0.5 text-xs text-[#8b949e] sm:inline">Unofficial</span>
          <div className="ml-auto hidden items-center gap-2 text-xs text-[#8b949e] md:flex"><LockKeyhole className="size-3.5" /> Public GitHub data only</div>
        </div>
      </header>

      <RepositoryHeader result={result} isLoading={isLoading} username={activeUsername} />

      <div className="app-shell grid gap-8 px-4 py-8 md:px-6 lg:grid-cols-[minmax(0,1fr)_296px] 2xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <section className="github-box overflow-hidden" aria-labelledby="readme-title">
            <div className="github-box-header flex items-center gap-2 px-4 py-3 text-xs font-semibold">
              <BookOpen className="size-4 text-[#8b949e]" /> README.md
            </div>
            <div className="markdown-body p-5 sm:p-8">
              <h1 id="readme-title">Roast your GitHub profile</h1>
              <p className="max-w-2xl text-base text-[#c9d1d9] xl:max-w-4xl 2xl:max-w-5xl">
                Enter a public username. GitRoast reviews repository activity, recent public commits, project descriptions, and contribution habits—then writes the code review your teammates were too polite to leave.
              </p>

              <form id="roast-form" onSubmit={onSubmit} className="mt-6 max-w-2xl xl:max-w-4xl 2xl:max-w-5xl" aria-describedby="form-note form-error">
                <label htmlFor="username" className="mb-2 block font-semibold">GitHub username</label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex min-h-10 flex-1 items-center rounded-md border border-[#30363d] bg-[#010409] px-3 shadow-inner focus-within:border-[#58a6ff] focus-within:ring-1 focus-within:ring-[#58a6ff]">
                    <span className="mr-1 text-[#8b949e]">github.com/</span>
                    <input
                      id="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="username"
                      autoCapitalize="none"
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={40}
                      enterKeyHint="go"
                      aria-describedby={error ? "form-note form-error" : "form-note"}
                      aria-invalid={Boolean(error)}
                      className="min-w-0 flex-1 bg-transparent text-base text-[#f0f6fc] outline-none placeholder:text-[#8b949e] sm:text-sm"
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="h-11 px-4">
                    <Flame className="size-4" /> {isLoading ? "Analyzing…" : "Roast profile"}
                  </Button>
                </div>
                <p id="form-note" className="mt-2 flex items-start gap-2 text-xs text-[#8b949e]">
                  <Info className="mt-0.5 size-3.5 shrink-0" /> No sign-in and no private repository access. Selected public signals may be sent to the configured AI provider.
                </p>
                {error ? (
                  <div id="form-error" role="alert" className="mt-4 rounded-md border border-[rgba(248,81,73,.4)] bg-[rgba(248,81,73,.1)] px-4 py-3 text-sm text-[#ff7b72]">
                    <strong>Analysis failed.</strong> {error}
                  </div>
                ) : null}
                {isLoading ? <LoadingStage username={activeUsername} /> : null}
              </form>

              <h2>Try an example</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {examples.map((example) => (
                  <button
                    key={example}
                    type="button"
                    disabled={isLoading}
                    className="inline-flex min-h-11 items-center gap-1 rounded px-2 font-medium text-[#58a6ff] hover:bg-[#161b22] hover:underline disabled:opacity-50"
                    onClick={() => void submit(example)}
                  >
                    <Search className="size-3.5" /> @{example}
                  </button>
                ))}
              </div>
            </div>
          </section>

        </div>

        <aside className="space-y-6 text-sm" aria-label="About GitRoast">
          <section>
            <h2 className="mb-3 font-semibold text-[#f0f6fc]">About</h2>
            <p className="leading-6 text-[#c9d1d9]">A public GitHub profile reviewer with a playful code-review sense of humor.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["github", "developer-tools", "roast", "open-source"].map((topic) => <span key={topic} className="rounded-full bg-[rgba(56,139,253,.15)] px-2.5 py-1 text-xs font-medium text-[#58a6ff]">{topic}</span>)}
            </div>
          </section>
          <div className="border-t border-[#21262d] pt-4">
            <h2 className="mb-3 font-semibold">How it works</h2>
            <ol className="space-y-3 text-[#8b949e]">
              {["Collect bounded public signals", "Calculate transparent heuristics", "Generate a code-habits-only roast"].map((item, index) => (
                <li key={item} className="flex gap-2"><span className="text-[#3fb950]">{index + 1}.</span><span>{item}</span></li>
              ))}
            </ol>
          </div>
          {result ? (
            <div className="border-t border-[#21262d] pt-4">
              <h2 className="mb-3 font-semibold">Languages observed</h2>
              <div className="flex flex-wrap gap-2">
                {result.summary.languages.length ? result.summary.languages.slice(0, 6).map((language) => (
                  <span key={language} className="rounded-full border border-[#30363d] bg-[#161b22] px-2.5 py-1 text-xs text-[#c9d1d9]">{language}</span>
                )) : <span className="text-xs text-[#8b949e]">No repository language data available.</span>}
              </div>
              <p className="mt-2 text-xs text-[#8b949e]">Observed in the sampled public repositories.</p>
            </div>
          ) : null}
          <div className="border-t border-[#21262d] pt-4 text-xs text-[#8b949e]">
            {result ? (
              <a href="#methodology" className="flex min-h-7 items-center justify-between hover:underline">Methodology <ChevronRight className="size-4" /></a>
            ) : (
              <span className="flex min-h-7 items-center justify-between">Methodology appears with the report <Info className="size-4" /></span>
            )}
          </div>
        </aside>
      </div>

      {result ? <RoastReport result={result} headingRef={reportHeadingRef} onReset={reset} /> : null}

      <footer className="mt-10 border-t border-[#21262d]">
        <div className="app-shell flex flex-col gap-3 px-4 py-8 text-xs text-[#8b949e] sm:flex-row sm:items-center sm:justify-between md:px-6">
          <span className="flex items-center gap-2"><Github className="size-5" /> GitRoast is not affiliated with GitHub.</span>
          <span>Roasts code and public work—not people.</span>
        </div>
      </footer>
    </main>
  );
}
