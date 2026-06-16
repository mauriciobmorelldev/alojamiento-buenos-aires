import { NextResponse } from "next/server";
import { verifyAdminOtpChallenge } from "@/lib/server/adminOtp";
import { readInmoState } from "@/lib/server/inmoRepository";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    challengeId?: string;
    code?: string;
  } | null;
  const challengeId = body?.challengeId?.trim() ?? "";
  const code = (body?.code ?? "").replace(/\D/g, "");
  if (!challengeId || code.length !== 6) {
    return NextResponse.json({ ok: false, error: "Código inválido." }, { status: 400 });
  }

  const verified = await verifyAdminOtpChallenge({ challengeId, code });
  if (!verified.ok) {
    return NextResponse.json({ ok: false, error: verified.error }, { status: 401 });
  }

  const { data } = await readInmoState();
  const admin = data.adminUsers.find(
    (item) => item.id === verified.adminId && item.active
  );
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Usuario inactivo." }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    admin: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
}
