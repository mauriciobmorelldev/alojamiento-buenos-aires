import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { defaultState, type HomeContent, type ThemeSettings } from "@/lib/inmoData";
import {
  getSupabaseServerClient,
  getSupabaseWriteClient,
  isSupabaseConfigured,
  isSupabaseWriteConfigured,
} from "@/lib/supabase/server";
import { clearResponseCache } from "@/lib/server/responseCache";

const SETTINGS_ID = "default";

const getAuthedOwner = async (adminId: string | null) => {
  if (!adminId) return null;
  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) return null;

  const profile = await supabase
    .from("profiles")
    .select("id,role,active")
    .eq("id", adminId)
    .eq("kind", "admin")
    .maybeSingle();

  if (profile.error || !profile.data?.active || profile.data.role !== "owner") {
    return null;
  }

  return profile.data;
};

export async function GET(request: Request) {
  const admin = await getAuthedOwner(request.headers.get("x-admin-id"));
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      source: "fallback",
      data: {
        theme: defaultState.theme,
        homeContent: defaultState.homeContent,
        customPages: defaultState.customPages,
        filterGroups: defaultState.filterGroups,
      },
    });
  }

  const settings = await supabase
    .from("platform_settings")
    .select("theme,home_content,filter_groups")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (settings.error) {
    return NextResponse.json(
      { ok: false, error: settings.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      source: "supabase",
      data: {
        theme: settings.data?.theme ?? defaultState.theme,
        homeContent: settings.data?.home_content ?? defaultState.homeContent,
        customPages:
          settings.data?.home_content?.customPages ?? defaultState.customPages,
        filterGroups: settings.data?.filter_groups ?? defaultState.filterGroups,
      },
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    }
  );
}

export async function PUT(request: Request) {
  const admin = await getAuthedOwner(request.headers.get("x-admin-id"));
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseWriteClient();
  if (!supabase || !isSupabaseWriteConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase no configurado." }, { status: 503 });
  }

  const payload = (await request.json()) as {
    theme?: ThemeSettings;
    homeContent?: HomeContent;
    customPages?: unknown[];
    filterGroups?: unknown[];
  };

  const persistedHomeContent = {
    ...(payload.homeContent ?? defaultState.homeContent),
    customPages: payload.customPages ?? defaultState.customPages,
  };

  const result = await supabase.from("platform_settings").upsert({
    id: SETTINGS_ID,
    theme: payload.theme ?? defaultState.theme,
    home_content: persistedHomeContent,
    filter_groups: payload.filterGroups ?? defaultState.filterGroups,
    updated_at: new Date().toISOString(),
  });

  if (result.error) {
    return NextResponse.json(
      { ok: false, error: result.error.message },
      { status: 500 }
    );
  }

  clearResponseCache();
  revalidatePath("/");
  revalidatePath("/buenos-aires");
  revalidatePath("/propiedades");
  return NextResponse.json(
    { ok: true, source: "supabase" },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    }
  );
}
