import "server-only";
import type { RoastSummary, RepositoryEvidence } from "@/lib/types";
import { commitReviewStatus } from "@/lib/roast-copy";

const MAX_BYTES = 32_768;

async function readEvidence(path: string, signal: AbortSignal, maxBytes = MAX_BYTES): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: /\/commits(?:\/|\?)|\/git\/trees\//.test(path) ? "application/vnd.github+json" : "application/vnd.github.raw+json",
        "User-Agent": "GitRoast",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
      },
      next: { revalidate: 3600 },
      signal,
      redirect: "error"
    });
    if (!response.ok || !response.body) return null;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return text + decoder.decode();
        bytes += value.byteLength;
        if (bytes > maxBytes) return null;
        text += decoder.decode(value, { stream: true });
      }
    } finally {
      await reader.cancel();
    }
  } catch {
    return null;
  }
}

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseRepositoryEvidence(readme: string | null, manifest: string | null, release: string | null, tree: string | null = null): RepositoryEvidence {
  const evidence: RepositoryEvidence = {};
  if (readme?.trim()) evidence.readmeExcerpt = readme.replace(/<!--[^]*?-->/g, "").replace(/\s+/g, " ").trim().slice(0, 1200);
  try {
    const pkg: unknown = manifest ? JSON.parse(manifest) : null;
    if (object(pkg)) {
      if (pkg.dependencies === undefined || object(pkg.dependencies)) evidence.runtimeDependencies = Object.keys(pkg.dependencies ?? {}).length;
      if (pkg.scripts === undefined || object(pkg.scripts)) evidence.scriptNames = Object.keys(pkg.scripts ?? {}).slice(0, 12).map((name) => name.slice(0, 60));
    }
  } catch { /* Malformed JSON supplies no evidence. */ }
  try {
    const latest: unknown = release ? JSON.parse(release) : null;
    if (object(latest) && typeof latest.tag_name === "string" && typeof latest.published_at === "string") {
      evidence.latestRelease = { tag: latest.tag_name.slice(0, 80), publishedAt: latest.published_at.slice(0, 40) };
    }
  } catch { /* A failed release lookup says nothing about release history. */ }
  try {
    const files: unknown = tree ? JSON.parse(tree) : null;
    if (object(files) && files.truncated === false && Array.isArray(files.tree)) {
      const paths = files.tree.filter((entry): entry is { path: string; type: string } =>
        object(entry) && entry.type === "blob" && typeof entry.path === "string" && entry.path.length <= 180).map((entry) => entry.path);
      const tests = paths.filter((path) => /(^|\/)(?:test|tests|__tests__|spec)(?:\/|$)|\.(?:test|spec)\.[a-z0-9]+$/i.test(path));
      evidence.testPathCount = tests.length;
      evidence.testPathSamples = tests.slice(0, 4);
      evidence.workflowPathSamples = paths.filter((path) => /^\.github\/workflows\/[^/]+\.ya?ml$/i.test(path)).slice(0, 4);
    }
  } catch { /* A partial or oversized tree cannot establish file presence or absence. */ }
  return evidence;
}

function selectCommit(list: string | null, username: string): { sha: string; subject: string } | null {
  try {
    const parsed: unknown = list ? JSON.parse(list) : null;
    if (!Array.isArray(parsed)) return null;
    const candidates = parsed.flatMap((item): { sha: string; subject: string }[] => {
      if (!object(item) || !object(item.author) || typeof item.author.login !== "string" ||
          item.author.login.toLowerCase() !== username.toLowerCase() || typeof item.sha !== "string" ||
          !/^[0-9a-f]{40}$/i.test(item.sha) || !object(item.commit) || typeof item.commit.message !== "string") return [];
      const subject = item.commit.message.split(/\r?\n/, 1)[0].trim().slice(0, 120);
      return subject ? [{ sha: item.sha, subject }] : [];
    });
    return candidates.find((item) => commitReviewStatus(item.subject) === "changes-requested") ?? candidates[0] ?? null;
  } catch { return null; }
}

export function parseRecentCommitEvidence(detail: string | null, selected: { sha: string; subject: string }, repoUrl: string): RepositoryEvidence["recentCommit"] | undefined {
  try {
    const parsed: unknown = detail ? JSON.parse(detail) : null;
    if (!object(parsed) || parsed.sha !== selected.sha || !object(parsed.stats) || !Array.isArray(parsed.files)) return;
    const additions = parsed.stats.additions;
    const deletions = parsed.stats.deletions;
    if (typeof additions !== "number" || typeof deletions !== "number" || !Number.isSafeInteger(additions) || !Number.isSafeInteger(deletions) || additions < 0 || deletions < 0) return;
    const paths = parsed.files.filter((file): file is { filename: string } => object(file) && typeof file.filename === "string" && file.filename.length <= 180).map((file) => file.filename);
    return { sha: selected.sha, subject: selected.subject, additions, deletions, filesShown: parsed.files.length,
      filePaths: paths.slice(0, 4), url: `${repoUrl}/commit/${selected.sha}` };
  } catch { return; }
}

async function inspectRecentCommit(base: string, username: string, repoUrl: string, signal: AbortSignal) {
  const list = await readEvidence(`${base}/commits?author=${encodeURIComponent(username)}&per_page=5`, signal);
  const selected = selectCommit(list, username);
  if (!selected) return;
  const detail = await readEvidence(`${base}/commits/${selected.sha}?per_page=100`, signal, 131_072);
  return parseRecentCommitEvidence(detail, selected, repoUrl);
}

/** Up to sixteen best-effort requests for four curated repositories. */
export async function enrichRepositoryEvidence(summary: RoastSummary): Promise<RoastSummary> {
  if (summary.dataSource !== "github-api" || process.env.ROAST_REPOSITORY_EVIDENCE === "off") return summary;
  const signal = AbortSignal.timeout(6000);
  const inspected = await Promise.all(summary.repos.slice(0, 4).map(async (repo, index) => {
    const base = `/repos/${encodeURIComponent(summary.username)}/${encodeURIComponent(repo.name)}`;
    const [readme, manifest, release, tree, recentCommit] = await Promise.all([
      readEvidence(`${base}/readme`, signal),
      readEvidence(`${base}/contents/package.json`, signal),
      index < 2 ? readEvidence(`${base}/releases/latest`, signal) : Promise.resolve(null),
      readEvidence(`${base}/git/trees/${encodeURIComponent(repo.defaultBranch)}?recursive=1`, signal, 131_072),
      repo.selectionReasons?.some((reason) => reason === "Hot right now" || reason === "Latest push") || (index === 0 && summary.repos.length === 1)
        ? inspectRecentCommit(base, summary.username, repo.url, signal) : Promise.resolve(undefined)
    ]);
    return { ...repo, evidence: { ...parseRepositoryEvidence(readme, manifest, release, tree), ...(recentCommit ? { recentCommit } : {}) } };
  }));
  const byName = new Map(inspected.map((repo) => [repo.name, repo]));
  return { ...summary, repos: summary.repos.map((repo) => byName.get(repo.name) ?? repo) };
}
