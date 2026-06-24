import { NextResponse } from "next/server";
import { readPublicCustomPage } from "@/lib/server/inmoRepository";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "");
  const result = await readPublicCustomPage(normalizedSlug);

  return NextResponse.json(
    { page: result.page },
    {
      status: result.page ? 200 : 404,
      headers: {
        "x-inmo-state-source": result.source,
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
