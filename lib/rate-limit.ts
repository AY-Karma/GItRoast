import "server-only";

type RateLimitEntry = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const MAX_TRACKED_CLIENTS = 5_000;
const entries = new Map<string, RateLimitEntry>();

export function checkRateLimit(identifier: string) {
  const now = Date.now();
  const existing = entries.get(identifier);

  if (!existing || existing.resetAt <= now) {
    if (entries.size >= MAX_TRACKED_CLIENTS) {
      for (const [key, entry] of entries) {
        if (entry.resetAt <= now) entries.delete(key);
      }
      if (entries.size >= MAX_TRACKED_CLIENTS) {
        const oldestKey = entries.keys().next().value as string | undefined;
        if (oldestKey) entries.delete(oldestKey);
      }
    }
    entries.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1, retryAfter: 0 };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - existing.count),
    retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
  };
}
