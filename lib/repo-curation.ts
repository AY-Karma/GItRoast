import type { GitHubRepo, SelectionReason } from "@/lib/types";

export type CuratedRepository = { repo: GitHubRepo; reasons: SelectionReason[] };

const time = (value: string | null | undefined) => {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
};
const byName = (a: GitHubRepo, b: GitHubRepo) => a.name.localeCompare(b.name);
const byStars = (a: GitHubRepo, b: GitHubRepo) => b.stargazers_count - a.stargazers_count || b.forks_count - a.forks_count || byName(a, b);
const byNewest = (a: GitHubRepo, b: GitHubRepo) => (time(b.created_at) ?? -1) - (time(a.created_at) ?? -1) || byName(a, b);
const byOldest = (a: GitHubRepo, b: GitHubRepo) => (time(a.created_at) ?? Infinity) - (time(b.created_at) ?? Infinity) || byName(a, b);

/** Recent public pushes plus existing audience, not an estimate of recent star growth. */
export function hotness(repo: GitHubRepo, now = Date.now()) {
  const pushed = time(repo.pushed_at);
  if (repo.archived || pushed === null) return -1;
  const days = Math.max(0, (now - pushed) / 86_400_000);
  return Math.exp(-days / 120) * (1 + Math.log1p(Math.max(0, repo.stargazers_count)) +
    0.35 * Math.log1p(Math.max(0, repo.forks_count)));
}

export function curateRepositories(repositories: GitHubRepo[], limit = 4, now = Date.now()): CuratedRepository[] {
  const unique = [...new Map(repositories.filter((repo) => !repo.fork).map((repo) => [repo.id || repo.full_name, repo])).values()];
  const selected: CuratedRepository[] = [];
  const seen = new Set<string>();
  const key = (repo: GitHubRepo) => repo.full_name.toLowerCase();
  const pick = (reason: SelectionReason, ranked: GitHubRepo[]) => {
    const repo = ranked[0];
    if (!repo) return;
    const existing = selected.find((item) => key(item.repo) === key(repo));
    if (existing) { existing.reasons.push(reason); return; }
    if (selected.length >= limit) return;
    selected.push({ repo, reasons: [reason] });
    seen.add(key(repo));
  };

  pick("Most starred", [...unique].sort(byStars));
  const pushed = unique.filter((repo) => !repo.archived && time(repo.pushed_at) !== null);
  const recent = pushed.filter((repo) => now - time(repo.pushed_at)! <= 180 * 86_400_000);
  if (recent.length) pick("Hot right now", recent.sort((a, b) => hotness(b, now) - hotness(a, now) || byStars(a, b)));
  else pick("Latest push", pushed.sort((a, b) => time(b.pushed_at)! - time(a.pushed_at)! || byStars(a, b)));
  pick("Newest", unique.filter((repo) => time(repo.created_at) !== null).sort(byNewest));
  pick("Oldest", unique.filter((repo) => time(repo.created_at) !== null).sort(byOldest));

  const remaining = unique.filter((repo) => !seen.has(key(repo))).sort((a, b) => {
    const score = (repo: GitHubRepo) => Math.log1p(Math.max(0, repo.stargazers_count)) * 2 +
      Math.max(0, hotness(repo, now)) + (repo.description?.trim() ? 0 : 0.8);
    return score(b) - score(a) || byName(a, b);
  });
  for (const repo of remaining) {
    if (selected.length >= limit) break;
    selected.push({ repo, reasons: ["Also notable"] });
  }
  return selected;
}
