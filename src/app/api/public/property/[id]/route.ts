import { NextResponse } from "next/server";
import { readPublicProperty } from "@/lib/server/inmoRepository";
import { readThroughCache } from "@/lib/server/responseCache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const startedAt = Date.now();
    const { id } = await params;
    const cached = await readThroughCache(
      `public:property:${id}:v2`,
      15 * 1000,
      () => readPublicProperty(id)
    );
    const result = cached.value;

    if (!result.data.listing) {
      return NextResponse.json(
        { ok: false, error: "Propiedad no encontrada." },
        {
          status: 404,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(result.data, {
      headers: {
        "x-inmo-state-source": result.source,
        "x-inmo-state-scope": "public-property",
        "x-inmo-cache": cached.hit ? "hit" : "miss",
        "x-inmo-state-duration-ms": String(Date.now() - startedAt),
        "Cache-Control": "no-store",
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
