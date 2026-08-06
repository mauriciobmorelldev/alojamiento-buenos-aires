import { NextResponse } from "next/server";
import { readPublicCustomPage } from "@/lib/server/inmoRepository";
import {
  PUBLIC_CACHE_CONTROL,
  PUBLIC_CACHE_TTL,
  readThroughCache,
} from "@/lib/server/responseCache";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "").slice(0, 120);
  const cached = await readThroughCache(
    `public:page:${normalizedSlug}:v1`,
    PUBLIC_CACHE_TTL.shell,
    () => readPublicCustomPage(normalizedSlug)
  );
  const result = cached.value;

  return NextResponse.json(
    { page: result.page },
    {
      status: result.page ? 200 : 404,
      headers: {
        "x-inmo-state-source": result.source,
        "x-inmo-cache": cached.hit ? "hit" : "miss",
        "Cache-Control": result.page ? PUBLIC_CACHE_CONTROL.shell : PUBLIC_CACHE_CONTROL.notFound,
      },
    }
  );
}
