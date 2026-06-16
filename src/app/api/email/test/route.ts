import { NextResponse } from "next/server";
import { requireOwnerFromRequest } from "@/lib/server/adminAuth";
import { readEmailSettings, sendEmail, toPublicEmailSettings } from "@/lib/server/email";

export async function POST(request: Request) {
  const context = await requireOwnerFromRequest(request);
  if (!context) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const result = await sendEmail({
    to: context.admin.email,
    subject: "Prueba de email plataforma inmobiliaria",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;color:#1b365d">
        <h1 style="font-size:26px;margin:0 0 12px">Email configurado</h1>
        <p style="font-size:15px;line-height:1.6;color:#334155">La plataforma ya puede enviar emails transaccionales, incluyendo OTP de administrador y confirmaciones de clientes.</p>
      </div>
    `,
  });
  return NextResponse.json({
    ok: result.sent || result.provider === "preview",
    provider: result.provider,
    reason: result.reason,
    configured: result.sent || result.provider === "preview",
  }, { status: result.sent || result.provider === "preview" ? 200 : 500 });
}

export async function GET(request: Request) {
  const context = await requireOwnerFromRequest(request);
  if (!context) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const settings = await readEmailSettings();
  return NextResponse.json({ ok: true, settings: toPublicEmailSettings(settings) });
}
