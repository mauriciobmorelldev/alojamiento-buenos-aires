import { NextResponse } from "next/server";
import { createAdminOtpChallenge } from "@/lib/server/adminOtp";
import { readInmoState } from "@/lib/server/inmoRepository";
import {
  getSupabaseServerClient,
  getSupabaseWriteClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

type AdminLoginProfile = {
  id: string;
  name: string;
  email: string;
  password: string | null;
  active: boolean | null;
  role: string | null;
};

const findAdminProfile = async (email: string) => {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseWriteClient() ?? getSupabaseServerClient();
  if (!supabase) return null;

  const result = await supabase
    .from("profiles")
    .select("id,name,email,password,active,role")
    .eq("kind", "admin")
    .ilike("email", email)
    .maybeSingle<AdminLoginProfile>();

  if (result.error) {
    console.warn("Admin login profile read failed", result.error.message);
    return null;
  }

  return result.data;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password?.trim() ?? "";

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Missing credentials" }, { status: 400 });
  }

  const profile = await findAdminProfile(email);
  if (profile) {
    if (!profile.active) {
      return NextResponse.json({ ok: false, error: "Inactive user" }, { status: 403 });
    }

    const storedPassword = (profile.password ?? "").trim();
    if (!storedPassword) {
      return NextResponse.json(
        { ok: false, error: "Password not configured" },
        { status: 409 }
      );
    }

    if (storedPassword !== password) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    const challenge = await createAdminOtpChallenge({
      adminId: profile.id,
      email: profile.email,
      name: profile.name,
    });

    return NextResponse.json({
      ok: true,
      requiresOtp: true,
      challenge,
    });
  }

  const { data } = await readInmoState({ scope: "admin", adminMode: "settings" });
  const admin = data.adminUsers.find(
    (item) => item.active && item.email.trim().toLowerCase() === email
  );

  if (!admin || admin.password.trim() !== password) {
    return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
  }

  const challenge = await createAdminOtpChallenge({
    adminId: admin.id,
    email: admin.email,
    name: admin.name,
  });

  return NextResponse.json({
    ok: true,
    requiresOtp: true,
    challenge,
  });
}
