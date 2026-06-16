import { NextResponse } from "next/server";
import { requireOwnerFromRequest } from "@/lib/server/adminAuth";
import { auditTokkoDescriptions } from "@/lib/server/tokko";

export async function POST(request: Request) {
  const context = await requireOwnerFromRequest(request);
  if (!context) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const audit = await auditTokkoDescriptions();
    return NextResponse.json({ ok: true, audit });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo auditar Tokko.",
      },
      { status: 500 }
    );
  }
}
