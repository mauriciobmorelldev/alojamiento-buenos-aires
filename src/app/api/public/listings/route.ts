import { NextResponse } from "next/server";
import { readPublicListings } from "@/lib/server/inmoRepository";
import { readThroughCache } from "@/lib/server/responseCache";

export async function GET() {
  try {
    const startedAt = Date.now();
    const cached = await readThroughCache("public:listings:v3", 5 * 1000, readPublicListings);
    const result = cached.value;
    return NextResponse.json(result.data, {
      headers: {
        "x-inmo-state-source": result.source,
        "x-inmo-state-scope": "public-listings",
        "x-inmo-cache": cached.hit ? "hit" : "miss",
        "x-inmo-state-duration-ms": String(Date.now() - startedAt),
        "Cache-Control": "public, max-age=5, s-maxage=15, stale-while-revalidate=30",
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
