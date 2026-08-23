# GitRoast public-app overhaul

## North star

GitRoast should feel like a mischievous review surface that could live beside a GitHub profile: familiar, fast, specific enough to feel uncanny, and fair enough to share.

The core loop is:

1. Enter one public GitHub handle.
2. Watch the app gather bounded “receipts.”
3. Reveal a theatrical, evidence-backed verdict.
4. Share one card or challenge another developer.
5. Return for a new format, matchup, or yearly rerun.

## Phase 1 — The public-ready foundation (implemented)

- Replace generic glassmorphism with a restrained GitHub-native visual system.
- Turn the report into a repository-style profile review with a README verdict, pinned insights, commit review, methodology, and share panel.
- Surface generated strengths and weaknesses instead of discarding them.
- Make the form race-safe and abort stale requests.
- Add focus management, live regions, semantic meters, reduced motion, mobile scroll affordances, and stronger contrast.
- Filter commit evidence to the profile owner and fix contribution date shifting.
- Bound and sanitize model input/output; send only the compact prompt view.
- Bound inbound bodies and outbound time, reject drive-by cross-site requests, add rate limiting and security headers.
- Upgrade the vulnerable dependency chain and enforce lint/type/build/audit gates.
- Defer report and image-export code until it is needed.

## Phase 2 — Make every roast a durable object

Build a `RoastRepository` behind the existing `roastGitHubProfile(username)` server seam. Persist a versioned facts snapshot and normalized report, then expose immutable `/r/[reportId]` pages.

Deliverables:

- Server-rendered report pages with per-report metadata and Open Graph images
- Expiring, privacy-aware storage with explicit deletion/report-abuse controls
- Regenerate action instead of surprise work on page load
- Durable cache, per-username single-flight generation lock, and idempotency keys
- Share modes for 1200 × 630, square, and vertical story cards
- Clear provider/retention disclosure beside the first submission

Success target: a shared report loads under 500 ms without calling GitHub or a model.

## Phase 3 — The viral playground

- **Repo Graveyard:** real tombstones ranked by inactivity, with a “resurrection PR” callout.
- **Commit Bingo:** a generated board for `fix`, `final`, `WIP`, vague one-word messages, and suspicious punctuation.
- **Roast intensity:** Light Toast, Full Roast, and Team-Safe; tone becomes an explicit input to the generator.
- **GitRoast Versus:** compare two public profiles using the same facts model and one split share card.
- **Redemption Arc:** convert every charge into one concrete, good-faith improvement suggestion.
- **Hall of Flame:** opt-in published reports only—never an automatic public leaderboard.

Success target: more than 25% of completed roasts create a share or challenge action.

## Phase 4 — Scale, trust, and data quality

Replace the high-fan-out REST implementation with a bounded GitHub GraphQL adapter. The deep roast module keeps one interface; production and fixture adapters sit at its external seams.

- Two GitHub REST calls plus bounded public timeline and contribution requests per cold profile
- Distributed atomic rate limits, global concurrency ceiling, and daily spend kill switch
- Facts cache separate from successful AI-report cache; degraded fallbacks get a short TTL
- Runtime schemas at GitHub, model, cache, and browser seams
- Typed upstream errors instead of message matching
- Reference time injected into analytics for deterministic tests
- Moderation/reporting workflow and sanitized operational telemetry
- Latency, cache-hit, fallback, token, and upstream-rate-limit dashboards

Success targets: p75 LCP under 2.5 s, INP under 200 ms, CLS under 0.1, and under 2,000 prompt tokens.

## Module direction

Keep `roastGitHubProfile(username) -> RoastResponse` as the small external interface. Hide collection, analysis, prompt shaping, generation, policy, caching, and fallback behavior behind that seam.

The next internal modules should be:

- `GitHubSnapshotProvider` — production GraphQL adapter and fixture adapter
- `RoastAnalyzer` — deterministic facts and scores
- `RoastPromptBuilder` — minimal untrusted-data-safe model view
- `RoastGenerator` — model and local adapters with normalized output
- `RoastRepository` — durable results, expiry, and single-flight coordination

Split the current broad `RoastSummary` into private facts, model prompt, stored result, and public view types. That preserves locality: changing a chart should not change the model payload, and changing the prompt should not enlarge the browser response.

## Launch gates

- Keyboard-only and screen-reader happy/error/share flows
- 320 px through wide-desktop visual checks and reduced-motion parity
- Fixture coverage for parsing, score determinism, fallback behavior, and route validation
- Browser tests for submit, stale-request cancellation, shared-prefill consent, and PNG error feedback
- Load tests for hot usernames, unique-username floods, cache stampedes, and provider failure
- CI gates: lint, typecheck, tests, production build, dependency audit, and landing-JS budget
- Privacy page, acceptable-use/tone policy, provider disclosure, retention policy, and abuse contact
