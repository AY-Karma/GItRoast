# Roast quality changes and Snark assessment

Reviewed 2026-09-09. These are engineering recommendations and implemented controls, not measured claims that a model is funnier.

## What changed

- Artifact-focused “you/your” wording survives normalization. Personal-attack/profanity filters remain, supported by explicit prompt boundaries. The regex checks are a backstop, not comprehensive semantic safety verification.
- Generated developer titles are retained. Score-only jokes can cite the actual score or a named score factor without awkwardly inserting a repository name.
- Ten original fact/bland/sharper examples demonstrate contradiction, understatement, mock review rulings, and reluctant approval. Each report section has a different editorial purpose. Good, archived, and sparse profiles get appropriate instructions and fallback behavior.
- Contradiction candidates require observed supporting facts. Optional repository enrichment reads README excerpts, root package.json dependency counts/script names, and latest release metadata for at most two repositories. Six parallel requests maximum, 32 KiB per response, 1,200-character README excerpt, one shared 2.5-second deadline, one-hour fetch cache. Failed/oversized/malformed responses mean unknown, never missing. Root package.json does not describe an entire monorepo or its bundle size.
- Generated input is limited to six reviewed repositories. A lexical similarity check catches exact/near-duplicate lines; it does not detect every repeated semantic premise. The prompt separately instructs premise diversity.
- One optional repair call rewrites at most four rejected fields with an 800-output-token budget and at most four seconds. It cannot change scores, repository identities, or commit subjects; accepted text is preserved. Invalid repairs keep the existing fallback. Total generation budget is at most 16 seconds and is reduced when GitHub retrieval consumed the route budget.
- Server events report prompt version, model, outcome/reason, latency, token usage, replaced-field count, and repair attempts. They omit usernames, repository text, prompts, raw provider errors, and API keys. Events describe generation/cache misses, not all HTTP requests. Log aggregation and dashboards are not installed.
- Cache keys include prompt version, model, enrichment mode, and whether AI credentials are configured. Existing deterministic scores and the public response shape remain intact apart from optional repository evidence.

## Snark rating method

Scored against GitRoast **before this change**, from 1 (low) to 5 (high): benefit B 35%, theme fit T 25%, missing capability N 20%, cost/complexity efficiency E 20%. Higher efficiency means cheaper/simpler. Total /100 = 7B + 5T + 4N + 4E. These are explicit judgment scores, not benchmark measurements. 85+ suggests adopt now; 70–84 suggests a later experiment; below 70 generally defer. Existing capability can override the threshold.

| Snark idea | B | T | N | E | /100 | GitRoast decision |
|---|---:|---:|---:|---:|---:|---|
| Generation outcome, latency and usage diagnostics | 4 | 5 | 5 | 5 | **93** | Adopted as small structured server events; no database or dashboard. |
| Repetition avoidance | 5 | 5 | 4 | 4 | **92** | Adapted within each report, plus targeted repair. Cross-request history is separate below. |
| Explicit persona/tone/length instructions | 4 | 5 | 3 | 5 | **85** | Adapted as one reviewer voice with section roles and varied comedy techniques. No arbitrary mood override. |
| Recent-response history in prompts | 4 | 4 | 5 | 2 | **76** | Defer. Needs bounded retention and premise-level summaries, not another person's raw roast in the next prompt. First measure repetition across the 20 profiles. |
| Request-time length controls | 3 | 4 | 2 | 5 | **69** | Defer UI controls. Section limits already exist; repairs now enforce them without cutting off punchlines. |
| Cache keys that include generation options | 3 | 5 | 1 | 4 | **66** | Mostly existing. Added prompt/model/config versioning; no second cache service. |
| Multiple providers with automatic failover | 3 | 4 | 4 | 2 | **65** | Defer until blind results justify another provider. Extra adapters/latency do not establish better jokes. Deterministic fallback remains. |
| Streaming responses | 1 | 4 | 4 | 2 | **51** | Defer. Improves perceived waiting, not humor; structured report sections need complete validation. |
| Large unrelated persona library | 2 | 1 | 4 | 2 | **43** | Skip. A general joke service would dilute the PR-review theme. |
| Importing Django/PostgreSQL/Redis stack | 1 | 2 | 3 | 1 | **33** | Skip. Disproportionate operational complexity for this Next.js app. |

The bounded field-repair design is an original GitRoast implementation, not a feature claimed to exist in Snark. Snark's provider retries are not the same thing as editorial line repair.

## Sources inspected

Snark snapshot: `f0fd9234d44c0e1c84931ead1077d79f084366d6` (2026-09-06).

- [Snark services](https://github.com/PramodTKodag/snark/blob/f0fd9234d44c0e1c84931ead1077d79f084366d6/snark/wit/services.py): recent-response prompt context, persona/mood/length controls, cache keys, provider fallback, generation events.
- [Snark models](https://github.com/PramodTKodag/snark/blob/f0fd9234d44c0e1c84931ead1077d79f084366d6/snark/wit/models.py): personas, response logs and generation events.
- [Snark README](https://github.com/PramodTKodag/snark/blob/f0fd9234d44c0e1c84931ead1077d79f084366d6/README.md): architecture and streaming behavior.
- [Snark license](https://github.com/PramodTKodag/snark/blob/f0fd9234d44c0e1c84931ead1077d79f084366d6/LICENSE): AGPL-3.0-or-later notice. No Snark source code or persona prompts were copied; the ideas were independently implemented.
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs): schema-constrained generation. Valid JSON does not establish factual or comedic quality.
- [GitHub repository contents](https://docs.github.com/en/rest/repos/contents): public README/content retrieval.

## Run and rate the evaluation

`npm run eval:roasts` creates 20 synthetic-profile reports in `artifacts/roast-evaluation/`. Default mode is offline and makes no API calls. It checks deterministic scores, repository identities, commit provenance, and nonempty report sections. It is not a live humor benchmark.

For live comparison, supply `OPENAI_API_KEY` through the process environment, set `ROAST_EVAL_LIVE=1`, and optionally set `ROAST_EVAL_MODELS` to up to three comma-separated OpenAI model IDs available to your account. Run the same command. This sends only the synthetic fixtures; it adds a deterministic fallback candidate and randomly labels candidates for each case. It does not load `.env.local` automatically. Live calls consume provider tokens. External providers such as Claude/Gemini are not wired in yet.

Read `blind-reports.json`, then fill `ratings.csv` before opening `answer-key.json`. Rate grounding, specificity, originality, theme, and shareability from 1 (poor) through 3 (acceptable) to 5 (excellent). Weighted /100 = 6*grounding + 5*specificity + 4*originality + 3*theme + 2*shareability. Disqualify invented claims and personal attacks regardless of score. Use pairwise wins across the same cases, not one favorite joke, to choose a model. Compare latency and token counts only after the human rating.

Local verification: offline evaluation completed for all 20 cases. Human ratings intentionally remain blank. No OpenAI credentials were available, so live output quality, provider latency/cost, and a model winner remain unmeasured.

## Controls and remaining limits

- `ROAST_REPOSITORY_EVIDENCE=off` disables additional GitHub requests. Unauthenticated requests share GitHub's smaller public quota; enrichment fails soft. Public-page fallback is never enriched after quota exhaustion.
- `OPENAI_MODEL` keeps the existing `gpt-4o-mini` default. The request no longer sends the optional `verbosity` parameter; temperature is sent only for GPT-4 family IDs. Other models still need evaluation for output budget and parameter compatibility.
- Increment `ROAST_PROMPT_VERSION` after editorial or normalization changes to avoid stale cached prose. Transient provider-fallback reports can still remain cached for up to an hour under the existing cache policy.
- Grounding checks are lexical/contextual heuristics, not a semantic fact checker. README source text is untrusted input. Human evaluation must check invented claims and prompt-injection resistance; the offline suite cannot certify either for live models.
- No fine-tuning, persistent cross-user history, paid provider switch, or additional infrastructure was introduced.
