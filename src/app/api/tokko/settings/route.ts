import { NextResponse } from "next/server";
import { requireOwnerFromRequest } from "@/lib/server/adminAuth";
import {
  readTokkoSettings,
  toPublicTokkoSettings,
  writeTokkoSettings,
  type TokkoSettings,
} from "@/lib/server/tokko";

export async function GET(request: Request) {
  const context = await requireOwnerFromRequest(request);
  if (!context) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const settings = await readTokkoSettings();
  return NextResponse.json({ ok: true, settings: toPublicTokkoSettings(settings) });
}

export async function POST(request: Request) {
  const context = await requireOwnerFromRequest(request);
  if (!context) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Partial<TokkoSettings> & {
      clearApiKey?: boolean;
    };
    const settings = await writeTokkoSettings(body);
    return NextResponse.json({ ok: true, settings: toPublicTokkoSettings(settings) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo guardar Tokko.",
      },
      { status: 500 }
    );
  }
}
