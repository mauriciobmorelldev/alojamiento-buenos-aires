import { NextResponse } from "next/server";
import { getSupabaseWriteClient, isSupabaseWriteConfigured } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    name?: string;
  } | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const name = body?.name?.trim() ?? "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "Email inválido." }, { status: 400 });
  }

  const supabase = getSupabaseWriteClient();
  if (!supabase || !isSupabaseWriteConfigured()) {
    return NextResponse.json({ ok: true, source: "fallback" });
  }

  const result = await supabase.from("newsletter_subscribers").upsert(
    {
      id: crypto.randomUUID(),
      email,
      name,
      active: true,
      created_at: new Date().toISOString(),
    },
    { onConflict: "email" }
  );

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, source: "supabase" });
}
