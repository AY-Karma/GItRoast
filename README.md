# GitRoast

GitRoast turns a public GitHub profile into a funny, evidence-backed code review. It samples repository health, the public activity timeline, descriptions, languages, and contribution activity, then produces a shareable report.

## What is in this version

- GitHub-native repository and profile interface with responsive review cards
- Accessible loading, error, score, contribution, and keyboard states
- Two-call GitHub REST budget with request timeouts and cached public signals
- Recent commit subjects from GitHub's public Atom timeline, including during REST quota exhaustion
- Evidence-specific local roasts plus optional OpenAI Responses API Structured Outputs
- Grounded roast receipts, a constructive patch, prompt-injection resistance, and output safety checks
- Lazy-loaded report and PNG exporter
- One-hour result cache and best-effort per-instance request limiting
- Bounded JSON body parsing, cross-site rejection, and production security headers
- 1200 x 630 share-card export and matching Open Graph artwork

The full product and architecture roadmap lives in [OVERHAUL.md](./OVERHAUL.md).

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
OPENAI_MODEL=gpt-4o-mini
GITHUB_TOKEN=
```

`OPENAI_API_KEY` is optional; without it, GitRoast uses the local roast engine. `GITHUB_TOKEN` is strongly recommended for higher public-API limits and should be a least-privilege token with no repository scopes.

## Checks

```bash
npm run lint
npm test
npm run typecheck
npm run build
npm audit --omit=dev
```

## Data and tone

GitRoast only requests public GitHub data. When OpenAI is configured, it sends a compact selection of public aggregates, repository names/descriptions, and recent public timeline commit subjects to the configured model; it does not send repository contents. Results may be cached for up to one hour.

The scores are comic heuristics, not measures of skill or employability. Roasts target code habits, not identity, appearance, or personal circumstances.

## Production note

The included rate limiter is a bounded, process-local safety net. A public multi-instance deployment must replace it with an atomic distributed limiter, a durable result cache/single-flight lock, and a global model-spend budget before launch.
