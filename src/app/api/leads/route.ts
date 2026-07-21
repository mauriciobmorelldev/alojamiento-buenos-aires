import { NextResponse } from "next/server";
import { getSupabaseWriteClient, isSupabaseWriteConfigured } from "@/lib/supabase/server";

const validLeadTypes = new Set(["tenant", "owner", "contact"]);

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const phone = String(body?.phone ?? "").trim();
  const message = String(body?.message ?? "").trim();
  const leadType = validLeadTypes.has(String(body?.leadType))
    ? String(body?.leadType)
    : "contact";
  const propertyId = String(body?.propertyId ?? "").trim();

  if (!name || !email || !phone) {
    return NextResponse.json(
      { ok: false, error: "Completá nombre, email y teléfono." },
      { status: 400 }
    );
  }

  const payload = Object.fromEntries(
    Object.entries(body ?? {})
      .filter(([key, value]) =>
        !["name", "email", "phone", "message", "leadType", "propertyId"].includes(key) &&
        typeof value === "string" &&
        value.trim()
      )
      .map(([key, value]) => [key, String(value).trim()])
  );

  const supabase = getSupabaseWriteClient();
  if (!supabase || !isSupabaseWriteConfigured()) {
    return NextResponse.json({ ok: true, source: "fallback" });
  }

  const now = new Date().toISOString();
  const result = await supabase.from("leads").insert({
    id: crypto.randomUUID(),
    name,
    email,
    phone,
    lead_type: leadType,
    property_id: propertyId || null,
    status: "nuevo",
    notes: message || null,
    payload,
    created_at: now,
    updated_at: now,
  });

  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, source: "supabase" });
}
