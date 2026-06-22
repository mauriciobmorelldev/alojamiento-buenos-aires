import { NextResponse } from "next/server";
import { readPublicProperty } from "@/lib/server/inmoRepository";
import {
  PUBLIC_CACHE_CONTROL,
  PUBLIC_CACHE_TTL,
  readThroughCache,
} from "@/lib/server/responseCache";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const startedAt = Date.now();
    const { id } = await params;
    const cached = await readThroughCache(
      `public:property:${id}:v3`,
      PUBLIC_CACHE_TTL.property,
      () => readPublicProperty(id)
    );
    const result = cached.value;

    if (!result.data.listing) {
      return NextResponse.json(
        { ok: false, error: "Propiedad no encontrada." },
        {
          status: 404,
          headers: {
            "Cache-Control": PUBLIC_CACHE_CONTROL.notFound,
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
        "Cache-Control": PUBLIC_CACHE_CONTROL.property,
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
