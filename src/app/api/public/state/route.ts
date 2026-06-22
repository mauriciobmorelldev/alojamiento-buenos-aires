import { NextResponse } from "next/server";
import { defaultState, type InmoState } from "@/lib/inmoData";
import {
  readPublicHomeListings,
  readPublicListings,
  readPublicShell,
} from "@/lib/server/inmoRepository";
import { readThroughCache } from "@/lib/server/responseCache";
import { mergeState } from "@/lib/stateMerge";

export async function GET(request: Request) {
  try {
    const startedAt = Date.now();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") === "catalog" ? "catalog" : "home";
    const [shell, listings] = await Promise.all([
      readThroughCache(`public:state:shell:${mode}:v2`, 5 * 1000, () =>
        readPublicShell(mode)
      ),
      readThroughCache(
        `public:state:listings:${mode}:v2`,
        5 * 1000,
        mode === "home" ? readPublicHomeListings : readPublicListings
      ),
    ]);
    const payload = {
      ...shell.value.data,
      ...listings.value.data,
      homeContent: {
        ...(shell.value.data.homeContent ?? {}),
        ...(listings.value.data.homeContent ?? {}),
      },
    } as Partial<InmoState>;
    const source =
      shell.value.source === "supabase" || listings.value.source === "supabase"
        ? "supabase"
        : "fallback";

    return NextResponse.json(mergeState(defaultState, payload), {
      headers: {
        "x-inmo-state-source": source,
        "x-inmo-state-scope": `public-state-${mode}`,
        "x-inmo-cache":
          shell.hit && listings.hit ? "hit" : shell.hit || listings.hit ? "partial" : "miss",
        "x-inmo-state-duration-ms": String(Date.now() - startedAt),
        "Cache-Control": "public, max-age=5, s-maxage=15, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "No se pudo leer el estado público.",
      },
      { status: 500 }
    );
  }
}
