import { NextResponse } from "next/server";
import { readPublicShell } from "@/lib/server/inmoRepository";

export async function GET(request: Request) {
  try {
    const startedAt = Date.now();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") === "catalog" ? "catalog" : "home";
    const result = await readPublicShell(mode);
    return NextResponse.json(result.data, {
      headers: {
        "x-inmo-state-source": result.source,
        "x-inmo-state-scope": `public-shell-${mode}`,
        "x-inmo-state-duration-ms": String(Date.now() - startedAt),
        "Cache-Control": "public, max-age=30, s-maxage=120, stale-while-revalidate=300",
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
