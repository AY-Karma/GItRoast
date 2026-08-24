import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { roastGitHubProfile, RoastRequestError } from "@/lib/roast";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BODY_BYTES = 1_024;

class ApiInputError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

async function readJsonBody(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new ApiInputError("Content-Type must be application/json.", 415);
  }

  if (!request.body) throw new ApiInputError("Request body is required.", 400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new ApiInputError("Request is too large.", 413);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch {
    throw new ApiInputError("Request body must be valid JSON.", 400);
  }
}

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Cross-site requests are not allowed." }, { status: 403 });
  }

  const clientId = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimit = checkRateLimit(clientId);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many roasts from this connection. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } }
    );
  }

  try {
    const body = await readJsonBody(request);
    const username = body && typeof body === "object" && "username" in body
      ? (body as { username?: unknown }).username
      : undefined;
    if (typeof username !== "string" || !username.trim()) {
      return NextResponse.json({ error: "GitHub username is required." }, { status: 400 });
    }

    const result = await roastGitHubProfile(username);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "private, no-store",
        "X-RateLimit-Remaining": String(rateLimit.remaining)
      }
    });
  } catch (error) {
    if (error instanceof ApiInputError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof RoastRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "The roast engine tripped over a cable. Try again." }, { status: 500 });
  }
}
