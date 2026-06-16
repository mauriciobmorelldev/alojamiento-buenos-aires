import { NextResponse } from "next/server";
import { requireOwnerFromRequest } from "@/lib/server/adminAuth";
import { fetchTokkoRawPreview } from "@/lib/server/tokko";

export async function GET(request: Request) {
  const context = await requireOwnerFromRequest(request);
  if (!context) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 5);
  const offset = Number(url.searchParams.get("offset") ?? 0);

  try {
    const preview = await fetchTokkoRawPreview({ limit, offset });
    return NextResponse.json({ ok: true, ...preview });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo leer Tokko.",
      },
      { status: 500 }
    );
  }
}
