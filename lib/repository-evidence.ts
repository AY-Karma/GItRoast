import "server-only";
import type { RoastSummary, RepositoryEvidence } from "@/lib/types";

const MAX_BYTES = 32_768;

async function readEvidence(path: string, signal: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com${path}`, {
      headers: {
        Accept: "application/vnd.github.raw+json",
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
        if (bytes > MAX_BYTES) return null;
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

export function parseRepositoryEvidence(readme: string | null, manifest: string | null, release: string | null): RepositoryEvidence {
  const evidence: RepositoryEvidence = {};
  if (readme?.trim()) evidence.readmeExcerpt = readme.replace(/<!--[^]*?-->/g, "").replace(/\s+/g, " ").trim().slice(0, 1200);
  try {
    const pkg: unknown = manifest ? JSON.parse(manifest) : null;
    if (object(pkg)) {
      if (pkg.dependencies === undefined || object(pkg.dependencies)) evidence.runtimeDependencies = Object.keys(pkg.dependencies ?? {}).length;
      if (object(pkg.scripts)) evidence.scriptNames = Object.keys(pkg.scripts).slice(0, 12).map((name) => name.slice(0, 60));
    }
  } catch { /* Malformed JSON supplies no evidence. */ }
  try {
    const latest: unknown = release ? JSON.parse(release) : null;
    if (object(latest) && typeof latest.tag_name === "string" && typeof latest.published_at === "string") {
      evidence.latestRelease = { tag: latest.tag_name.slice(0, 80), publishedAt: latest.published_at.slice(0, 40) };
    }
  } catch { /* A failed release lookup says nothing about release history. */ }
  return evidence;
}

/** Six parallel, best-effort requests at most; one shared 2.5s budget. */
export async function enrichRepositoryEvidence(summary: RoastSummary): Promise<RoastSummary> {
  if (summary.dataSource !== "github-api" || process.env.ROAST_REPOSITORY_EVIDENCE === "off") return summary;
  const signal = AbortSignal.timeout(2500);
  const selected = await Promise.all(summary.repos.slice(0, 2).map(async (repo) => {
    const base = `/repos/${encodeURIComponent(summary.username)}/${encodeURIComponent(repo.name)}`;
    const [readme, manifest, release] = await Promise.all([
      readEvidence(`${base}/readme`, signal),
      readEvidence(`${base}/contents/package.json`, signal),
      readEvidence(`${base}/releases/latest`, signal)
    ]);
    return { ...repo, evidence: parseRepositoryEvidence(readme, manifest, release) };
  }));
  return { ...summary, repos: [...selected, ...summary.repos.slice(2)] };
}
