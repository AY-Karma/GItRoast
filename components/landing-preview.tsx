"use client";

import { GitCommitHorizontal, FolderGit2, GitPullRequest, GitBranch, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

const examples = {
  commits: {
    label: "Recent commits",
    receipts: ["fix stuff", "fix stuff again", "final FINAL fix"],
    roast: "Three commits. One plot twist. Still no idea what you fixed.",
    suggestion: "A commit message with a little more context",
    before: "fix stuff",
    after: "fix: handle expired sessions"
  },
  repositories: {
    label: "Public repositories",
    receipts: ["side-project: no description", "side-project-v2: no description", "side-project-final: no description"],
    roast: "Three projects. Zero descriptions. Even your repos are keeping secrets.",
    suggestion: "Let people in on the plot",
    before: "No description provided",
    after: "Session manager for Node.js apps"
  }
};

export function LandingPreview() {
  const [selected, setSelected] = useState<keyof typeof examples>("commits");
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isPaused || isHovered || isFocused) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;

    function scheduleCycle() {
      window.clearInterval(timer);
      if (reducedMotion.matches || document.hidden) return;
      timer = window.setInterval(() => {
        setSelected((current) => current === "commits" ? "repositories" : "commits");
      }, 8000);
    }

    scheduleCycle();
    reducedMotion.addEventListener("change", scheduleCycle);
    document.addEventListener("visibilitychange", scheduleCycle);
    return () => {
      window.clearInterval(timer);
      reducedMotion.removeEventListener("change", scheduleCycle);
      document.removeEventListener("visibilitychange", scheduleCycle);
    };
  }, [isPaused, isHovered, isFocused]);

  return (
    <section
      className="landing-example"
      aria-labelledby="landing-example-title"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsFocused(false);
      }}
    >
      <div className="landing-example-header">
        <h2 id="landing-example-title"><GitPullRequest size={18} aria-hidden="true" /><span className="mono-type">you / ROAST.md</span></h2>
        <span className="landing-example-caption">Example</span>
      </div>
      <div className="landing-example-switch" role="group" aria-label="Example review type">
        <button type="button" aria-pressed={selected === "commits"} onClick={() => setSelected("commits")}><GitCommitHorizontal size={16} aria-hidden="true" />Commits</button>
        <button type="button" aria-pressed={selected === "repositories"} onClick={() => setSelected("repositories")}><FolderGit2 size={16} aria-hidden="true" />Repos</button>
        <button
          className="landing-preview-toggle"
          type="button"
          aria-label={isPaused ? "Resume automatic preview" : "Pause automatic preview"}
          title={isPaused ? "Resume automatic preview" : "Pause automatic preview"}
          onClick={() => setIsPaused((paused) => !paused)}
        >
          {isPaused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
        </button>
      </div>
      <div className="landing-example-content" aria-live={isPaused || isHovered || isFocused ? "polite" : "off"} aria-atomic="true">
        {Object.entries(examples).map(([type, example]) => {
          const ReceiptIcon = type === "commits" ? GitCommitHorizontal : FolderGit2;
          return (
            <div key={type} className="landing-example-variant" data-active={selected === type} aria-hidden={selected !== type}>
              <div className="landing-example-source">
                <span className="landing-example-label">{example.label}</span>
                <ul className="mono-type">
                  {example.receipts.map((receipt) => (
                    <li key={receipt}>
                      <ReceiptIcon size={16} aria-hidden="true" />
                      <code>{receipt}</code>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="landing-example-review">
                <div className="landing-review-byline">
                  <span className="landing-review-avatar"><GitBranch size={16} aria-hidden="true" /></span>
                  <strong>GitRoast</strong>
                  <span>requested changes</span>
                </div>
                <blockquote className="landing-example-quote">{example.roast}</blockquote>
              </div>
              <div className="landing-example-suggestion">
                <p className="landing-example-advice">{example.suggestion}</p>
                <div className="landing-example-diff mono-type">
                  <div className="landing-diff-before"><span aria-label="Remove">−</span><code>{example.before}</code></div>
                  <div className="landing-diff-after"><span aria-label="Replace with">+</span><code>{example.after}</code></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
