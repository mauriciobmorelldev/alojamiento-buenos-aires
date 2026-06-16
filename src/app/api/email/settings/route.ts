import { NextResponse } from "next/server";
import { requireOwnerFromRequest } from "@/lib/server/adminAuth";
import {
  readEmailSettings,
  toPublicEmailSettings,
  writeEmailSettings,
  type EmailSettings,
} from "@/lib/server/email";

export async function GET(request: Request) {
  const context = await requireOwnerFromRequest(request);
  if (!context) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const settings = await readEmailSettings();
  return NextResponse.json({ ok: true, settings: toPublicEmailSettings(settings) });
}

export async function POST(request: Request) {
  const context = await requireOwnerFromRequest(request);
  if (!context) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await request.json()) as Partial<EmailSettings> & {
      clearResendApiKey?: boolean;
    };
    const settings = await writeEmailSettings(body);
    return NextResponse.json({ ok: true, settings: toPublicEmailSettings(settings) });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo guardar email.",
      },
      { status: 500 }
    );
  }
}
