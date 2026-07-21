import { NextResponse } from "next/server";
import { defaultState, type InmoState } from "@/lib/inmoData";
import {
  readPublicHomeListings,
  readPublicEditorialPosts,
  readPublicListings,
  readPublicShell,
} from "@/lib/server/inmoRepository";
import {
  PUBLIC_CACHE_CONTROL,
  PUBLIC_CACHE_TTL,
  readThroughCache,
} from "@/lib/server/responseCache";
import { mergeState } from "@/lib/stateMerge";

export async function GET(request: Request) {
  try {
    const startedAt = Date.now();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") === "catalog" ? "catalog" : "home";
    const [shell, listings, editorial] = await Promise.all([
      readThroughCache(`public:state:shell:${mode}:v4`, PUBLIC_CACHE_TTL.shell, () =>
        readPublicShell(mode)
      ),
      readThroughCache(
        `public:state:listings:${mode}:v2`,
        mode === "home" ? PUBLIC_CACHE_TTL.homeListings : PUBLIC_CACHE_TTL.catalogListings,
        mode === "home" ? readPublicHomeListings : readPublicListings
      ),
      readThroughCache("public:state:editorial:v1", PUBLIC_CACHE_TTL.shell, readPublicEditorialPosts),
    ]);
    const payload = {
      ...shell.value.data,
      ...listings.value.data,
      ...editorial.value.data,
      homeContent: {
        ...(shell.value.data.homeContent ?? {}),
        ...(listings.value.data.homeContent ?? {}),
      },
    } as Partial<InmoState>;
    const source =
      shell.value.source === "supabase" ||
      listings.value.source === "supabase" ||
      editorial.value.source === "supabase"
        ? "supabase"
        : "fallback";

    return NextResponse.json(mergeState(defaultState, payload), {
      headers: {
        "x-inmo-state-source": source,
        "x-inmo-state-scope": `public-state-${mode}`,
        "x-inmo-cache":
          shell.hit && listings.hit && editorial.hit
            ? "hit"
            : shell.hit || listings.hit || editorial.hit
              ? "partial"
              : "miss",
        "x-inmo-state-duration-ms": String(Date.now() - startedAt),
        "Cache-Control": PUBLIC_CACHE_CONTROL.shell,
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
