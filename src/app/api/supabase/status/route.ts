import { NextResponse } from "next/server";
import {
  getSupabaseServerClient,
  isSupabaseConfigured,
  isSupabaseWriteConfigured,
} from "@/lib/supabase/server";

const tables = [
  "platform_settings",
  "roles",
  "profiles",
  "admin_otp_challenges",
  "agents",
  "clients",
  "properties",
  "property_images",
  "property_favorites",
  "leads",
  "lead_events",
  "property_metrics",
  "tokko_sync_logs",
  "editorial_posts",
  "newsletter_subscribers",
];

export async function GET() {
  const configured = isSupabaseConfigured();
  const supabase = getSupabaseServerClient();

  if (!configured || !supabase) {
    return NextResponse.json({
      ok: false,
      configured: false,
      usingServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      error: "Faltan variables NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local.",
    });
  }

  const checks = await Promise.all(
    tables.map(async (table) => {
      const result = await supabase.from(table).select("id").limit(1);
      return {
        table,
        ok: !result.error,
        error: result.error?.message,
      };
    })
  );
  const filterGroupsColumn = await supabase
    .from("platform_settings")
    .select("filter_groups")
    .limit(1);
  const tokkoConfigColumn = await supabase
    .from("platform_settings")
    .select("tokko_config")
    .limit(1);
  const emailConfigColumn = await supabase
    .from("platform_settings")
    .select("email_config")
    .limit(1);
  const columnChecks = [
    {
      column: "platform_settings.filter_groups",
      ok: !filterGroupsColumn.error,
      error: filterGroupsColumn.error?.message,
    },
    {
      column: "platform_settings.tokko_config",
      ok: !tokkoConfigColumn.error,
      error: tokkoConfigColumn.error?.message,
    },
    {
      column: "platform_settings.email_config",
      ok: !emailConfigColumn.error,
      error: emailConfigColumn.error?.message,
    },
  ];

  return NextResponse.json({
    ok:
      checks.every((check) => check.ok) &&
      columnChecks.every((check) => check.ok) &&
      isSupabaseWriteConfigured(),
    configured: true,
    usingServiceRole: isSupabaseWriteConfigured(),
    writeReady: isSupabaseWriteConfigured(),
    error: isSupabaseWriteConfigured()
      ? undefined
      : "Lectura OK, pero falta SUPABASE_SERVICE_ROLE_KEY. Las escrituras del admin van a fallar por RLS.",
    tables: checks,
    columns: columnChecks,
  });
}
