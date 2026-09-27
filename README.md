# GitRoast

GitRoast turns a public GitHub profile into a funny, evidence-backed code review. It samples repository health, the public activity timeline, descriptions, languages, and contribution activity, then produces a shareable report.

## What is in this version

- GitHub-native repository and profile interface with responsive review cards
- Accessible loading, error, score, contribution, and keyboard states
- Four curated repository lanes: top stars, recently pushed with traction, newest creation, and oldest creation; larger accounts use bounded additional GitHub queries
- Recent commit subjects from GitHub's public Atom timeline, including during REST quota exhaustion
- Evidence-ranked local roasts plus optional OpenAI Responses API Structured Outputs and a report-wide premise plan
- One grounded roast comment per visible repository, with validated AI enhancement and deterministic local fallbacks
- GitHub-style review summaries, repository verdict labels, commit timelines, and a constructive `roast.patch`
- Short, reduced-motion-safe state transitions instead of ambient or looping visual effects
- Linked factual receipts, a constructive patch, prompt-injection resistance, and output safety checks
- Lazy-loaded report and PNG exporter
- One-hour result cache and best-effort per-instance request limiting
- Bounded JSON body parsing, cross-site rejection, and production security headers
- 1200 x 630 share-card export and matching Open Graph artwork

The full product and architecture roadmap lives in [OVERHAUL.md](./OVERHAUL.md). The current roast-system diagnosis and primary-source research live in [docs/roast-system-research-2026-09.md](./docs/roast-system-research-2026-09.md).

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env.local` instead of `cp` if needed. Open [http://localhost:3000](http://localhost:3000).

Environment variables:

```dotenv
OPENAI_API_KEY=
OPENAI_MODEL=gpt-6-sol
GITHUB_TOKEN=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`OPENAI_API_KEY` is optional; without it, GitRoast uses the local roast engine. The local engine produces fewer lines when evidence is thin. The default AI model is `gpt-6-sol`; set `OPENAI_MODEL` to another supported model if you want to compare quality, latency, and cost. `GITHUB_TOKEN` is strongly recommended for higher public-API limits and should be a least-privilege token for public data. Repository enrichment makes up to sixteen additional, best-effort GitHub requests for four curated repositories per uncached profile; `ROAST_REPOSITORY_EVIDENCE=off` disables them.

## Deploy to Vercel

Import the repository in Vercel and keep the detected framework as **Next.js**. Vercel will use the existing `npm run build` command; the `npm run start` script is also available for running the production build locally. No custom adapter or `vercel.json` is required.

Set these variables in the Vercel project settings (for Preview and Production as appropriate):

```dotenv
NEXT_PUBLIC_SITE_URL=https://your-production-domain.example
GITHUB_TOKEN=                # optional, least-privilege public-data token
OPENAI_API_KEY=              # optional; local roast engine is the fallback
OPENAI_MODEL=gpt-6-sol
```

`NEXT_PUBLIC_SITE_URL` should include the protocol and your canonical production host. If it is omitted, Vercel's deployment URL is used for generated metadata. After deployment, `GET /api/health` provides a cache-disabled liveness check.

## Checks

```bash
npm run lint
npm test
npm run typecheck
npm run build
npm audit --omit=dev
```

## Data and tone

GitRoast only requests public GitHub data. Up to four featured originals are selected from a bounded sample; for accounts with over 100 repositories, GitRoast also requests oldest/newest creation lanes and a star-sorted search. A failed optional lane leaves a partial sample, so category labels are sample-relative. When the REST API is rate-limited, the limited public-page fallback cannot establish creation or push dates and omits those claims; unknown maintenance contributes a neutral score and the shipping metric is hidden. “Hot” means a push within 180 days weighted by existing stars and forks; if none qualifies, the freshest sampled repository is labeled “Latest push.” Neither label measures recent star growth or proves that the profile owner authored that push. When OpenAI is configured, it sends a bounded selection of public aggregates, repository names/descriptions, recent public commit subjects, and inspected README/package/release/tree/commit-scope evidence to the configured model. Results may be cached for up to one hour. A file path in a repository tree proves presence, not that tests or workflows pass; commit counts show scope, not code quality; unavailable evidence is treated as unknown.

The scores are comic heuristics, not measures of skill or employability. Roasts target code habits, not identity, appearance, or personal circumstances.

The profile score is deterministic and favors current public work: 45% activity, 25% public impact (stars, forks, and followers), 12% consistency, 10% repository maintenance, and 8% project/commit presentation. Square-root scaling keeps viral repositories from overwhelming every other signal.

## Production note

The included rate limiter is a bounded, process-local safety net. A public multi-instance deployment must replace it with an atomic distributed limiter, a durable result cache/single-flight lock, and a global model-spend budget before launch.
