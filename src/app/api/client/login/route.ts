import { NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/clientValidation";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  const email = normalizeEmail(body?.email ?? "");
  const password = body?.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Missing credentials" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase no configurado." }, { status: 503 });
  }
  const result = await supabase
    .from("clients")
    .select("id,name,email,password,email_verified,active")
    .ilike("email", email)
    .maybeSingle();
  const client = result.data;

  if (result.error || !client?.active || client.password !== password) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  if (!client.email_verified) {
    return NextResponse.json({ ok: false, error: "Email not verified" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    client: {
      id: client.id,
      email: client.email,
      name: client.name,
    },
  });
}
