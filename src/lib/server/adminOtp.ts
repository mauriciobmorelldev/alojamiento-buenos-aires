import { sendEmail } from "@/lib/server/email";
import { createHash } from "crypto";
import {
  getSupabaseWriteClient,
  isSupabaseWriteConfigured,
} from "@/lib/supabase/server";

type OtpChallenge = {
  adminId: string;
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
};

const challenges = new Map<string, OtpChallenge>();
const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const createNumericCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const createChallengeId = () =>
  `otp-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const hashCode = (value: string) => createHash("sha256").update(value).digest("hex");

export const createAdminOtpChallenge = async ({
  adminId,
  email,
  name,
}: {
  adminId: string;
  email: string;
  name: string;
}) => {
  const challengeId = createChallengeId();
  const code = createNumericCode();
  const expiresAt = Date.now() + OTP_TTL_MS;
  challenges.set(challengeId, {
    adminId,
    email,
    code: hashCode(code),
    expiresAt,
    attempts: 0,
  });
  const supabase = getSupabaseWriteClient();
  if (supabase && isSupabaseWriteConfigured()) {
    const insertResult = await supabase.from("admin_otp_challenges").insert({
      id: challengeId,
      admin_id: adminId,
      email,
      code_hash: hashCode(code),
      expires_at: new Date(expiresAt).toISOString(),
      attempts: 0,
    });
    if (!insertResult.error) {
      challenges.delete(challengeId);
    }
  }

  const emailResult = await sendEmail({
    to: email,
    subject: "Código de acceso administrador",
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;color:#1b365d">
        <p style="font-size:13px;text-transform:uppercase;letter-spacing:2px;color:#64748b">Acceso seguro</p>
        <h1 style="font-size:28px;margin:0 0 12px">Hola ${name}</h1>
        <p style="font-size:15px;line-height:1.6;color:#334155">Usá este código para ingresar al panel administrador. Expira en 10 minutos.</p>
        <div style="margin:26px 0;padding:22px;border-radius:18px;background:#f5f7fb;text-align:center">
          <strong style="font-size:34px;letter-spacing:10px;color:#1b365d">${code}</strong>
        </div>
        <p style="font-size:13px;line-height:1.5;color:#64748b">Si no intentaste ingresar, ignorá este email y revisá los usuarios administradores.</p>
      </div>
    `,
  });

  return {
    challengeId,
    expiresAt: new Date(expiresAt).toISOString(),
    emailSent: emailResult.sent,
    emailProvider: emailResult.provider,
    previewCode: emailResult.sent ? undefined : code,
  };
};

export const verifyAdminOtpChallenge = ({
  challengeId,
  code,
}: {
  challengeId: string;
  code: string;
}) => {
  const supabase = getSupabaseWriteClient();
  if (supabase && isSupabaseWriteConfigured()) {
    return verifySupabaseChallenge({ challengeId, code });
  }
  return verifyMemoryChallenge({ challengeId, code });
};

const verifyMemoryChallenge = ({
  challengeId,
  code,
}: {
  challengeId: string;
  code: string;
}) => {
  const challenge = challenges.get(challengeId);
  if (!challenge) {
    return { ok: false as const, error: "Código inválido o vencido." };
  }
  if (Date.now() > challenge.expiresAt) {
    challenges.delete(challengeId);
    return { ok: false as const, error: "El código venció. Iniciá sesión nuevamente." };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    challenges.delete(challengeId);
    return { ok: false as const, error: "Demasiados intentos. Iniciá sesión nuevamente." };
  }
  challenge.attempts += 1;
  if (challenge.code !== hashCode(code)) {
    return { ok: false as const, error: "Código incorrecto." };
  }
  challenges.delete(challengeId);
  return {
    ok: true as const,
    adminId: challenge.adminId,
    email: challenge.email,
  };
};

const verifySupabaseChallenge = async ({
  challengeId,
  code,
}: {
  challengeId: string;
  code: string;
}) => {
  const supabase = getSupabaseWriteClient();
  if (!supabase) return { ok: false as const, error: "Supabase no está configurado." };
  const result = await supabase
    .from("admin_otp_challenges")
    .select("*")
    .eq("id", challengeId)
    .maybeSingle();
  if (result.error || !result.data) {
    if (challenges.has(challengeId)) {
      return verifyMemoryChallenge({ challengeId, code });
    }
    return { ok: false as const, error: "Código inválido o vencido." };
  }
  const challenge = result.data;
  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    await supabase.from("admin_otp_challenges").delete().eq("id", challengeId);
    return { ok: false as const, error: "El código venció. Iniciá sesión nuevamente." };
  }
  if (Number(challenge.attempts ?? 0) >= MAX_ATTEMPTS) {
    await supabase.from("admin_otp_challenges").delete().eq("id", challengeId);
    return { ok: false as const, error: "Demasiados intentos. Iniciá sesión nuevamente." };
  }
  if (challenge.code_hash !== hashCode(code)) {
    await supabase
      .from("admin_otp_challenges")
      .update({ attempts: Number(challenge.attempts ?? 0) + 1 })
      .eq("id", challengeId);
    return { ok: false as const, error: "Código incorrecto." };
  }
  await supabase.from("admin_otp_challenges").delete().eq("id", challengeId);
  return {
    ok: true as const,
    adminId: String(challenge.admin_id),
    email: String(challenge.email),
  };
};
