import {
  getSupabaseServerClient,
  getSupabaseWriteClient,
  isSupabaseConfigured,
  isSupabaseWriteConfigured,
} from "@/lib/supabase/server";

const SETTINGS_ID = "default";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

export type EmailSettings = {
  mode: "preview" | "resend";
  from: string;
  resendApiKey?: string;
};

export type PublicEmailSettings = Omit<EmailSettings, "resendApiKey"> & {
  hasResendApiKey: boolean;
  configured: boolean;
};

const defaultEmailSettings = (): EmailSettings => ({
  mode: process.env.RESEND_API_KEY ? "resend" : "preview",
  from: process.env.EMAIL_FROM || "Connexa <no-reply@connexa.com>",
  resendApiKey: process.env.RESEND_API_KEY || undefined,
});

const normalizeEmailSettings = (value: unknown): EmailSettings => {
  const fallback = defaultEmailSettings();
  const config =
    value && typeof value === "object" && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {};
  const mode = config.mode === "resend" ? "resend" : config.mode === "preview" ? "preview" : fallback.mode;
  const from = typeof config.from === "string" && config.from.trim()
    ? config.from.trim()
    : fallback.from;
  const resendApiKey =
    typeof config.resendApiKey === "string" && config.resendApiKey.trim()
      ? config.resendApiKey.trim()
      : typeof config.resend_api_key === "string" && config.resend_api_key.trim()
        ? config.resend_api_key.trim()
        : fallback.resendApiKey;
  return { mode, from, resendApiKey };
};

export const toPublicEmailSettings = (settings: EmailSettings): PublicEmailSettings => ({
  mode: settings.mode,
  from: settings.from,
  hasResendApiKey: Boolean(settings.resendApiKey),
  configured: settings.mode === "preview" || Boolean(settings.resendApiKey),
});

export const readEmailSettings = async () => {
  const fallback = defaultEmailSettings();
  if (!isSupabaseConfigured()) return fallback;
  const supabase = getSupabaseServerClient();
  if (!supabase) return fallback;
  const result = await supabase
    .from("platform_settings")
    .select("email_config")
    .eq("id", SETTINGS_ID)
    .maybeSingle();
  if (result.error) return fallback;
  return normalizeEmailSettings(result.data?.email_config);
};

export const writeEmailSettings = async (
  incoming: Partial<EmailSettings> & { clearResendApiKey?: boolean }
) => {
  if (!isSupabaseWriteConfigured()) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para guardar email transaccional.");
  }
  const supabase = getSupabaseWriteClient();
  if (!supabase) throw new Error("Supabase no está configurado.");
  const current = await readEmailSettings();
  const next: EmailSettings = {
    mode: incoming.mode === "resend" ? "resend" : "preview",
    from: incoming.from?.trim() || current.from,
    resendApiKey: incoming.clearResendApiKey
      ? undefined
      : incoming.resendApiKey?.trim() || current.resendApiKey,
  };
  const result = await supabase.from("platform_settings").upsert({
    id: SETTINGS_ID,
    email_config: next,
    updated_at: new Date().toISOString(),
  });
  if (result.error) throw new Error(`Guardar email: ${result.error.message}`);
  return next;
};

export const sendEmail = async ({ to, subject, html }: SendEmailInput) => {
  const settings = await readEmailSettings();
  const apiKey = settings.mode === "resend" ? settings.resendApiKey : undefined;
  const from = settings.from;

  if (!apiKey) {
    console.info("[email:preview]", { to, subject, html });
    return {
      sent: false,
      provider: "preview",
      reason: "RESEND_API_KEY no configurada.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      sent: false,
      provider: "resend",
      reason: detail || "No se pudo enviar el email.",
    };
  }

  return { sent: true, provider: "resend" };
};
