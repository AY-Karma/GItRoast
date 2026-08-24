export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { ok: true, service: "gitroast" },
    { headers: { "Cache-Control": "no-store" } }
  );
}
