import { NextResponse } from "next/server";
import { readPublicListings } from "@/lib/server/inmoRepository";

export async function GET(request: Request) {
  try {
    const startedAt = Date.now();
    const { searchParams } = new URL(request.url);
    const collaboratorId = searchParams.get("collaboratorId")?.trim() || undefined;
    const result = await readPublicListings(collaboratorId);
    return NextResponse.json(result.data, {
      headers: {
        "x-inmo-state-source": result.source,
        "x-inmo-state-scope": "public-listings",
        ...(collaboratorId ? { "x-inmo-state-collaborator": collaboratorId } : {}),
        "x-inmo-state-duration-ms": String(Date.now() - startedAt),
        "Cache-Control": "private, max-age=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudo leer el catálogo público.",
      },
      { status: 500 }
    );
  }
}
