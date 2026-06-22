import { NextResponse } from "next/server";
import { requireOwnerFromRequest } from "@/lib/server/adminAuth";
import { deleteAllTokkoListings } from "@/lib/server/inmoRepository";

export async function DELETE(request: Request) {
  try {
    const context = await requireOwnerFromRequest(request);
    if (!context) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const result = await deleteAllTokkoListings();
    if (result.source !== "supabase") {
      return NextResponse.json(
        {
          ok: false,
          source: result.source,
          error: "Supabase no está configurado para escritura.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      source: result.source,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron limpiar las propiedades Tokko.",
      },
      { status: 500 }
    );
  }
}
