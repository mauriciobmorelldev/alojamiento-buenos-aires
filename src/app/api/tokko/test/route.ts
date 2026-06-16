import { NextResponse } from "next/server";
import { requireOwnerFromRequest } from "@/lib/server/adminAuth";
import { testTokkoConnection, toPublicTokkoSettings } from "@/lib/server/tokko";

export async function POST(request: Request) {
  const context = await requireOwnerFromRequest(request);
  if (!context) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await testTokkoConnection();
    return NextResponse.json({
      ok: true,
      sampleCount: result.sampleCount,
      sampleTitle: result.sampleTitle,
      sampleHasDescription: result.sampleHasDescription,
      sampleDescriptionLength: result.sampleDescriptionLength,
      settings: toPublicTokkoSettings(result.settings),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo probar Tokko.",
      },
      { status: 500 }
    );
  }
}
