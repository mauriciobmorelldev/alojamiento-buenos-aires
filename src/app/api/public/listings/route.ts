import { NextResponse } from "next/server";
import { readPublicHomeListings, readPublicListings } from "@/lib/server/inmoRepository";
import { readThroughCache } from "@/lib/server/responseCache";

export async function GET(request: Request) {
  try {
    const startedAt = Date.now();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") === "home" ? "home" : "catalog";
    const cached = await readThroughCache(
      `public:listings:${mode}:v4`,
      5 * 1000,
      mode === "home" ? readPublicHomeListings : readPublicListings
    );
    const result = cached.value;
    return NextResponse.json(result.data, {
      headers: {
        "x-inmo-state-source": result.source,
        "x-inmo-state-scope": `public-listings-${mode}`,
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
