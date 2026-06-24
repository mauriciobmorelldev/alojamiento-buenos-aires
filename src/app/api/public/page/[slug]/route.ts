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
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "");
  const cached = await readThroughCache(
    `public:page:${normalizedSlug}:v1`,
    PUBLIC_CACHE_TTL.shell,
    () => readPublicCustomPage(normalizedSlug)
  );

  return NextResponse.json(
    { page: cached.value.page },
    {
      status: cached.value.page ? 200 : 404,
      headers: {
        "x-inmo-state-source": cached.value.source,
        "x-inmo-cache": cached.hit ? "hit" : "miss",
        "Cache-Control": PUBLIC_CACHE_CONTROL.shell,
      },
    }
  );
}
