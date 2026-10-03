"use client";

import { ArrowRight, Github, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

export function LandingRoastForm() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const username = String(new FormData(event.currentTarget).get("u") ?? "").trim().replace(/^@/, "");
    if (!/^[a-zA-Z0-9-]{1,39}$/.test(username)) {
      setError("Enter a GitHub username, using letters, numbers or hyphens.");
      event.currentTarget.querySelector("input")?.focus();
      return;
    }
    startTransition(() => router.push(`/roast?u=${encodeURIComponent(username)}`));
  }

  return (
    <form action="/roast" method="get" onSubmit={submit} className="landing-roast-form" noValidate>
      <label htmlFor="landing-username">Your GitHub username</label>
      <div className="landing-input-row">
        <div className="landing-input-wrap">
          <Github size={21} aria-hidden="true" />
          <input id="landing-username" name="u" required maxLength={40} placeholder="GitHub username" autoComplete="off" autoCapitalize="none" spellCheck={false} enterKeyHint="go" aria-invalid={Boolean(error)} aria-describedby={error ? "landing-form-error landing-form-note" : "landing-form-note"} onChange={() => { if (error) setError(""); }} />
        </div>
        <button className="landing-button" type="submit" disabled={isPending}>{isPending ? <LoaderCircle size={18} className="octicon-spin" aria-hidden="true" /> : null}{isPending ? "Opening..." : "Roast my GitHub"}<ArrowRight size={18} aria-hidden="true" /></button>
      </div>
      {error ? <p id="landing-form-error" className="landing-form-error" role="alert">{error}</p> : null}
      <p id="landing-form-note" className="landing-form-note">Public profiles only. No sign-in.</p>
    </form>
  );
}
