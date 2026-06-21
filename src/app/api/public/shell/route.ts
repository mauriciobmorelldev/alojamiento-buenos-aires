import { NextResponse } from "next/server";
import { readPublicShell } from "@/lib/server/inmoRepository";
import { readThroughCache } from "@/lib/server/responseCache";

export async function GET(request: Request) {
  try {
    const startedAt = Date.now();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") === "catalog" ? "catalog" : "home";
    const cached = await readThroughCache(
      `public:shell:${mode}:v2`,
      5 * 1000,
      () => readPublicShell(mode)
    );
    const result = cached.value;
    return NextResponse.json(result.data, {
      headers: {
        "x-inmo-state-source": result.source,
        "x-inmo-state-scope": `public-shell-${mode}`,
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
            : "No se pudo leer la configuración pública.",
      },
      { status: 500 }
    );
  }
}
