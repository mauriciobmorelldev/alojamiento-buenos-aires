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

const allowedTypes = new Set(["all", "tradicional", "temporario", "pozo", "listo"]);
const allowedOperations = new Set(["all", "venta", "alquiler"]);
const allowedSorts = new Set(["featured", "price-asc", "price-desc"]);

const allowedValue = (value: string | null, allowed: Set<string>, fallback: string) =>
  value && allowed.has(value) ? value : fallback;

const positiveInteger = (value: string | null, fallback: number, maximum: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), maximum);
};

const safeJsonAttributes = (value: string | null): Record<string, string[]> => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .slice(0, 12)
        .map(([key, items]) => [
          key.trim().slice(0, 64),
          Array.isArray(items)
            ? Array.from(
                new Set(
                  items
                    .filter((item): item is string => typeof item === "string")
                    .map((item) => item.trim().slice(0, 64))
                    .filter(Boolean)
                    .slice(0, 12)
                )
              ).sort()
            : [],
        ])
        .filter(([key]) => Boolean(key))
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
      page: positiveInteger(searchParams.get("page"), 1, 500),
      pageSize: positiveInteger(searchParams.get("pageSize"), 12, 24),
      query: (searchParams.get("q") ?? "").trim().slice(0, 80),
      type: allowedValue(searchParams.get("type"), allowedTypes, "all"),
      operation: allowedValue(searchParams.get("operation"), allowedOperations, "all"),
      minRooms:
        searchParams.get("minRooms") && searchParams.get("minRooms") !== "all"
          ? positiveInteger(searchParams.get("minRooms"), 1, 20)
          : undefined,
      sort: allowedValue(searchParams.get("sort"), allowedSorts, "featured"),
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
