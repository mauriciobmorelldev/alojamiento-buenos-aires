import { NextResponse } from "next/server";
import {
  readPublicHomeListings,
  readPublicListingsPage,
  type PublicListingsPageOptions,
} from "@/lib/server/inmoRepository";
import {
  PUBLIC_CACHE_CONTROL,
  PUBLIC_CACHE_TTL,
  readThroughCache,
} from "@/lib/server/responseCache";

const safeJsonAttributes = (value: string | null): Record<string, string[]> => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).map(([key, items]) => [
        key,
        Array.isArray(items) ? items.filter((item): item is string => typeof item === "string") : [],
      ])
    );
  } catch {
    return {};
  }
};

export async function GET(request: Request) {
  try {
    const startedAt = Date.now();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") === "home" ? "home" : "catalog";
    const pageOptions: PublicListingsPageOptions = {
      page: Number(searchParams.get("page") ?? 1),
      pageSize: Number(searchParams.get("pageSize") ?? 12),
      query: searchParams.get("q") ?? "",
      type: searchParams.get("type") ?? "all",
      operation: searchParams.get("operation") ?? "all",
      minRooms:
        searchParams.get("minRooms") && searchParams.get("minRooms") !== "all"
          ? Number(searchParams.get("minRooms"))
          : undefined,
      sort: searchParams.get("sort") ?? "featured",
      attributes: safeJsonAttributes(searchParams.get("attributes")),
    };
    const cacheKey =
      mode === "home"
        ? "public:listings:home:v5"
        : `public:listings:catalog:v6:${JSON.stringify(pageOptions)}`;
    const cached = await readThroughCache(
      cacheKey,
      mode === "home" ? PUBLIC_CACHE_TTL.homeListings : PUBLIC_CACHE_TTL.catalogListings,
      mode === "home" ? readPublicHomeListings : () => readPublicListingsPage(pageOptions)
    );
    const result = cached.value;
    return NextResponse.json(result.data, {
      headers: {
        "x-inmo-state-source": result.source,
        "x-inmo-state-scope": `public-listings-${mode}`,
        "x-inmo-cache": cached.hit ? "hit" : "miss",
        "x-inmo-state-duration-ms": String(Date.now() - startedAt),
        "Cache-Control":
          mode === "home"
            ? PUBLIC_CACHE_CONTROL.homeListings
            : PUBLIC_CACHE_CONTROL.catalogListings,
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
