import { NextResponse } from "next/server";
import { readPublicProperty } from "@/lib/server/inmoRepository";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const startedAt = Date.now();
    const { id } = await params;
    const result = await readPublicProperty(id);

    if (!result.data.listing) {
      return NextResponse.json(
        { ok: false, error: "Propiedad no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(result.data, {
      headers: {
        "x-inmo-state-source": result.source,
        "x-inmo-state-scope": "public-property",
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
            : "No se pudo leer la propiedad pública.",
      },
      { status: 500 }
    );
  }
}
