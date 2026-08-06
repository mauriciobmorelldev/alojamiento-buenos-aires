import { NextResponse } from "next/server";
import { buildOperationalMetrics } from "@/lib/server/analytics";
import { requireOwnerFromRequest } from "@/lib/server/adminAuth";
import { readInmoState } from "@/lib/server/inmoRepository";

export async function GET(request: Request) {
  const ownerContext = await requireOwnerFromRequest(request);
  if (!ownerContext) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "private, no-store" } }
    );
  }
  const { data } = await readInmoState({ scope: "admin", adminMode: "dashboard" });
  return NextResponse.json(buildOperationalMetrics(data), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
