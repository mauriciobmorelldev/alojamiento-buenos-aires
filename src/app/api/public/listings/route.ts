import { NextResponse } from "next/server";
import { readPublicListings } from "@/lib/server/inmoRepository";

export async function GET() {
  try {
    const startedAt = Date.now();
    const result = await readPublicListings();
    return NextResponse.json(result.data, {
      headers: {
        "x-inmo-state-source": result.source,
        "x-inmo-state-scope": "public-listings",
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
