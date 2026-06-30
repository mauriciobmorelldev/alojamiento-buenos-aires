import { NextResponse } from "next/server";
import { verifyAdminOtpChallenge } from "@/lib/server/adminOtp";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

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

  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase no configurado." }, { status: 503 });
  }
  const result = await supabase
    .from("profiles")
    .select("id,email,name,role,active")
    .eq("id", verified.adminId)
    .eq("kind", "admin")
    .maybeSingle();
  const admin = result.data;
  if (result.error || !admin?.active) {
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
