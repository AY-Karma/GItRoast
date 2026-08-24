# GitRoast: GitHub-native UI and roast research

Research date: 2026-08-24

## Decision summary

The strongest next release is not a broader visual redesign. It is a deeper code-review metaphor:

1. Replace each visible repository description with a grounded, one-off review comment about that repository.
2. Make every repository name a real GitHub link and present the repositories as an accessible card collection.
3. Turn the report into a believable review state: checks, labels, review decisions, timelines, and suggested patches.
4. Use short, contained motion to show state changes. Do not add ambient flames, continuous graph movement, or large-area animation.
5. Remove fake GitHub affordances and hard-coded popularity numbers. They make the interface look like a mockup instead of a product.

GitHub Primer describes its product UI as a system of reusable interaction patterns, not merely a color palette. Its Card examples already model repository collections with a repository icon, metadata, contextual action, and star/fork controls; its Label component is intended for status and category metadata. Those are better references for this app than ornamental GitHub-like chrome. ([Primer Card](https://primer.style/product/components/card/), [Primer Label](https://primer.style/product/components/label/))

## Current app audit

| Finding | Local evidence | Why it weakens the product |
| --- | --- | --- |
| Repository review is still a data dump | `components/roast-report.tsx` renders `repo.description` and only language/stars under “Repositories reviewed.” | The app's funniest premise stops exactly where users expect repo-specific jokes. |
| There is no per-repository output contract | `RoastReport` has receipts and commit crimes, but no `repoReviews`; the model response schema therefore cannot return durable repo verdicts. | A model may notice a repo in the main roast, but the UI cannot guarantee one unique joke per card. |
| Useful repository facts are discarded | `GitHubRepo` already contains URL, forks, open issues, size, default branch, and timestamps. `buildRoastSummary` projects only name, description, language, stars, and pushed date. | The app pays for these REST fields, then throws away many of the best grounded punchline anchors. |
| Repository names are not links | The name is rendered as a `<strong>` rather than an anchor, and the projected summary omits `html_url`. | A GitHub-style repository list that cannot open a repository feels decorative rather than native. |
| Header counters are fictional | `RepositoryHeader` displays hard-coded “Watch 1.2k” and “Star 8.4k” spans. | Fake social proof breaks trust and the controls look interactive even though they do nothing. |
| Header tabs are mostly aliases for one target | Overview links to `#main-content`; the other three entries all link to `#report`. Result navigation also keeps Overview visually selected rather than reflecting the current section. | The chrome imitates GitHub without carrying GitHub-like information architecture. |
| Repository collection semantics can improve | Repositories are a `div` of `article` elements. | Primer recommends a labelled `ul` containing `li` cards for a collection, and repository-specific accessible names for repeated controls. ([Primer Card accessibility](https://primer.style/product/components/card/accessibility/)) |
| Motion has no product choreography | Beyond the loading spinner and one 240 ms result entrance, state changes appear at once. | The app has little reveal or review-completion theatre, while adding arbitrary constant animation would be distracting. |
| One link forces a new tab | “View on GitHub” uses `target="_blank"`. | Primer recommends letting users choose whether to open a link in a new tab and reserving buttons for actions rather than navigation. ([Primer links and buttons](https://primer.style/accessibility/design-guidance/links-and-buttons/)) |

The current interface already gets important foundations right: semantic headings, visible focus, a reduced-motion rule, an `aria-live` loading state, bounded loading stages, and a readable GitHub dark palette. Preserve these.

## P0: implement repo review comments

### Output shape

Add a normalized, always-present repository review to the public response. Generate it locally first, then optionally let the model improve only the punchline.

```ts
type RepositoryReview = {
  name: string;
  url: string;
  roast: string;
  verdict: "approved" | "commented" | "changes-requested";
  labels: string[];
  facts: {
    language: string | null;
    stars: number;
    forks: number;
    openIssues: number;
    defaultBranch: string;
    pushedAt: string | null;
    archived: boolean;
  };
};
```

The existing “list repositories for a user” response already exposes fields including `html_url`, `fork`, `forks_count`, `stargazers_count`, `size`, `default_branch`, `open_issues_count`, `topics`, `archived`, `pushed_at`, `created_at`, and `updated_at`. Public repositories can be listed without authentication. This means most of the upgrade requires no additional upstream request. ([GitHub REST: repositories](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user))

### Grounded joke matrix

Use observable repository facts as setups and keep the punchline about project maintenance, documentation, or release habits—not the person.

| Signal | Safe comedic direction | Example style |
| --- | --- | --- |
| Missing description | The repository is mysterious, not the developer incompetent | “The README has delegated product discovery to whoever clicks first.” |
| Quiet for over a year | Long-term support, archaeology, museum exhibit | “Now accepting security patches and respectful museum visitors.” |
| Recently pushed | Suspiciously responsible shipping | “Fresh commits detected. The procrastination allegation has been dismissed.” |
| High stars | Community approval ruined the prosecution's case | “The internet submitted 4.2k approving reviews, which is inconvenient evidence for a roast.” |
| Forks | Family tree or spin-off franchise | “This repo has more spin-offs than the roadmap has nouns.” |
| Open issues | Parking tickets or an active waiting room | “The issue tracker is less backlog and more seated audience.” |
| Archived | A completed character arc, not abandonment | “Archived with dignity: one side quest that actually found an ending.” |
| Default branch `master` | Vintage label, never a moral judgment | “The default branch is keeping the period-correct signage.” |
| Sparse topics | Labels hiding from discovery | “The topics have invoked metadata protection.” |
| Clear description and recent work | Reluctant approval | “Annoyingly legible and recently maintained. Changes approved under protest.” |

Use a stable fingerprint such as `username + repository id/name + selected facts + generator version` to choose among several templates. That gives deterministic sharing and avoids repeated text across repositories. Do not choose from one global list based only on account-level metrics.

For AI output, require every repository name to match an input repository exactly, limit one review per selected repository, reject ungrounded claims, and fill missing/invalid entries from the local generator. Keep descriptions as private generation context, but do not show the original description in the reviewed-repository body, matching the product request.

### Card composition

Render the section as a labelled list. Each item should contain:

- repository icon and linked `owner/repo` name;
- `Public` plus a status label such as `approved`, `commented`, or `changes requested`;
- the repository roast as the primary body text;
- factual metadata: language, stars, forks, relative update time, and optional open-issue count;
- one descriptive “View repository” link or a repository-name link, not a fake button;
- optional expandable “Why this roast?” facts, implemented with native `details`/`summary`.

Primer's repository Card example uses repository identity, metadata, and contextual actions. For collections, Primer specifies `ul`/`li` semantics, warns against redundant headings per card, and requires repeated controls to include the card subject in their accessible name. ([Primer Card](https://primer.style/product/components/card/), [Card accessibility](https://primer.style/product/components/card/accessibility/))

Use Primer-style Labels for roast categories such as `docs-needed`, `fresh-push`, `release-archaeology`, `community-approved`, and `side-quest`. Labels are explicitly intended for contextual status/category metadata. ([Primer Label](https://primer.style/product/components/label/))

## P0: remove imitation that does not behave like GitHub

1. Replace the hard-coded Watch/Star numbers with truthful app state or remove them. A useful alternative is `6 repos reviewed` and `3 changes requested` after a result exists.
2. Give each top tab one real destination: `Overview`, `Receipts`, `Commits`, `Repositories`, `Share`. Update the active underline with section visibility, or leave it static only if it is a genuine tab/panel control.
3. Link repository names to their GitHub URLs. Do not force a new tab; users can choose that themselves. ([Primer links and buttons](https://primer.style/accessibility/design-guidance/links-and-buttons/))
4. Keep “Unofficial” visible. The app should feel compatible with GitHub, not imply that it is a GitHub-owned surface.
5. Convert the fake initial file list into honest workflow state. For example: `profile.json — waiting`, `activity.log — waiting`, `ROAST.md — waiting`; resolve those same rows during analysis instead of showing “just now” before a request has happened.

## P1: make the whole report feel like a code review

### Review decision summary

Add a compact “Review summary” panel near the verdict:

- `All checks passed` when there are no material maintenance findings;
- `Changes requested` when multiple evidence-backed cleanup items exist;
- `Commented` for neutral profiles;
- counts such as `3 approved · 2 comments · 1 change requested`.

This is comic framing, not a skill verdict. The visible explanation should say that statuses describe public repository hygiene signals.

### Suggested patch as a diff

Render the existing redemption advice as a small `roast.patch` diff:

```diff
- status: "trust me, it works"
+ status: "maintained; contributions welcome"
```

The patch should always be constructive, copyable, and based on an observed gap. Avoid inventing exact files or pretending that GitRoast changed the repository.

### Activity as a Timeline

Turn the flat commit review into a compact review timeline: push observed, commit subject reviewed, repository verdict posted. Primer's Timeline is specifically for vertically connected events and supports status-colored badges and condensed items. The text of each item must communicate its state because decorative separators are not announced to assistive technology. ([Primer Timeline](https://primer.style/product/components/timeline/))

### Filterable repository verdicts

Add `All`, `Approved`, and `Changes requested` filters only after there are enough cards to benefit. Keep focus on the selected filter after filtering and ensure every control remains keyboard-accessible. Primer's focus guidance requires logical tab order, visible focus, keyboard activation, and deliberate focus restoration when content changes. ([Primer focus management](https://primer.style/accessibility/design-guidance/focus-management/))

### Better share hooks

- “Copy review comment” per repository.
- “Share this repository verdict” with repo name, roast, factual anchor, and the app's unofficial label.
- “Challenge another profile” as a real secondary action after completion.
- Later: opt-in `Repo Graveyard`, `Commit Bingo`, and `Versus`; keep them separate modes rather than loading the core report with novelty sections.

## Motion specification

Primer's accessibility guidance says motion should be intentional, subtle, small and contained; informative animation needs an equivalent text state; CSS animation should respect `prefers-reduced-motion`; and motion lasting longer than five seconds needs user control. ([Primer motion and animation](https://primer.style/accessibility/design-guidance/motion-and-animation/))

| Moment | Motion | Duration | Reduced-motion behavior |
| --- | --- | ---: | --- |
| Loading check completes | Ring resolves into a check with a 0.96→1 scale | 140–180 ms | Immediate icon swap; text remains identical |
| Result arrives | Verdict fades and moves up 4–6 px | 180–240 ms | Immediate render |
| Repo cards reveal | Stagger opacity/translate by 35–50 ms, maximum six items | 160–220 ms each | No stagger or transform |
| Status label resolves | Small color/opacity transition, no bounce | 120–160 ms | Immediate final label |
| Score/progress bars | Animate width once after reveal | 300–450 ms | Render at final width |
| Card hover/focus | Border changes plus at most 2 px lift | 100–150 ms | Border change only |
| Active report nav | Underline slides between real section links | 140–180 ms | Underline jumps directly |
| Details disclosure | Chevron rotates 90 degrees | 120–160 ms | Immediate rotation |

Rules:

- Put animation declarations inside `@media (prefers-reduced-motion: no-preference)` instead of starting them and globally shortening them afterward.
- Never animate every contribution cell, continuously flicker a flame, autoplay confetti, or run a looping “terminal typing” effect.
- Do not rely on color or motion alone for approved/requested status; keep visible text and an icon.
- Avoid surprise focus movement during staged reveals. The final report heading focus behavior is useful after an explicitly submitted analysis, but repo-card reveals should not steal focus.
- Keep interactive targets at least 24 px and aim for 44 px touch space on mobile. Primer's responsive guidance also requires no loss of information or function at 320 px and calls out reduced-motion and contrast preferences. ([Primer responsive guidance](https://primer.style/product/getting-started/foundations/responsive))

## P2: additional public signals, with cost controls

### First, retain fields already returned

The immediate repository-roast upgrade should retain these existing list-response fields in `RoastSummary`: URL, forks, open issues, size, default branch, created/updated/pushed dates, `archived`, and topics. That provides much richer copy at zero extra request cost. The GitHub repository response documents all of them. ([GitHub REST: repositories](https://docs.github.com/en/rest/repos/repos#list-repositories-for-a-user))

### Optional public-events request

If a third REST request fits the latency and rate budget, `GET /users/{username}/events/public` can add public event types, repository identity, payload, and timestamps. It accepts up to 100 results per page and can be called without fine-grained permissions. GitHub explicitly says the endpoint is not real time and may lag from 30 seconds to six hours, so label it “recent public activity,” never “live.” ([GitHub REST: public user events](https://docs.github.com/en/rest/activity/events#list-public-events-for-a-user))

Possible event-based, artifact-only jokes:

- repeated `CreateEvent`: “Branches are multiplying faster than decisions.”
- `ReleaseEvent`: “A release exists; the deployment folklore is temporarily suspended.”
- `PullRequestEvent`: “The profile has been seen negotiating with its own diff.”
- concentrated `PushEvent`s: “One repository received the full weekend plot arc.”

Do not add per-repository releases, contributors, README, or language-detail requests in the first pass. Six visible repositories can turn those into a high-fan-out API pattern, slowing the primary loop and increasing quota failures.

## Tone policy for repository roasts

GitHub's product-content guidance describes its voice as clear, conversational, inclusive, and helpful, and warns that humor is unwelcome in errors, waiting states, and failures. It also recommends plain English, sentence case, and thoughtful use of humor. ([Primer content guidance](https://primer.style/product/getting-started/foundations/content/))

Apply that here as follows:

- Roast artifacts and observable states only: names, metadata, commit subjects, activity, documentation, and release hygiene.
- Never infer intelligence, employability, seniority, character, health, identity, personal circumstances, or motives.
- Praise real strengths with the same specificity as jokes.
- Use one setup and one punchline per repository; brevity improves both card layout and shareability.
- Keep failure/loading/error text direct and non-comedic.
- Never turn follower or star counts into a popularity judgment about a person.
- Treat archived or inactive repositories as normal project lifecycle states, not personal failure.
- Avoid profanity, diagnoses, culturally specific insults, appearance metaphors, or claims unsupported by public facts.

This boundary also aligns with GitHub's prohibition on targeted personal attacks, harassment, and abusive conduct. Criticism of projects can be legitimate, but it should remain respectful and avoid disrupting users' experience. ([GitHub bullying and harassment policy](https://docs.github.com/en/site-policy/acceptable-use-policies/github-bullying-and-harassment), [GitHub Community Guidelines](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines))

## Recommended implementation order

1. Extend the repository summary fields and add deterministic local `RepositoryReview` generation with tests.
2. Add normalized AI `repoReviews` output with exact-name/evidence validation and local fallback coverage.
3. Replace the repository-description rows with linked, labelled review cards using `ul`/`li` semantics.
4. Remove hard-coded Star/Watch counts and repair top/report navigation destinations.
5. Add the motion tokens and repo-card/check choreography under `prefers-reduced-motion: no-preference`.
6. Add review summary and the constructive `roast.patch` block.
7. Consider the single public-events request only after measuring latency, API-limit behavior, and cache hit rate.

## Acceptance criteria

- Every displayed repository gets exactly one unique, grounded roast even without an AI key.
- No visible repository description is repeated as the repo-card body.
- Every repo roast references at least one exact fact from that repo.
- Repository names navigate to the real public GitHub repository.
- Cards reflow at 320 px with no clipped roast, metadata, or action.
- Keyboard users can reach filters, repository links, disclosures, and copy actions in logical order.
- Reduced-motion mode communicates every final state with no stagger, lift, spinner loop, or score animation.
- No fictional counters, disabled-looking links, or tabs pointing to the same unrelated section remain.
- Error and upstream-failure states remain straightforward and joke-free.
