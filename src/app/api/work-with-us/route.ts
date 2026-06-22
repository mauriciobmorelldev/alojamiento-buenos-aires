import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/server/email";
import { readPublicShell } from "@/lib/server/inmoRepository";
import { mergeState } from "@/lib/stateMerge";
import { defaultState } from "@/lib/inmoData";
import {
  getSupabaseWriteClient,
  isSupabaseWriteConfigured,
} from "@/lib/supabase/server";

const CV_BUCKET = "candidate-cvs";
const MAX_CV_BYTES = 3 * 1024 * 1024;
const allowedCvTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const normalizePayloadValue = (value: unknown) =>
  typeof value === "string" ? value.trim().slice(0, 2000) : "";

const sanitizeFileName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const ensureCvBucket = async (
  supabase: NonNullable<ReturnType<typeof getSupabaseWriteClient>>
) => {
  const bucket = await supabase.storage.getBucket(CV_BUCKET);
  if (!bucket.error) return;

  const created = await supabase.storage.createBucket(CV_BUCKET, {
    public: false,
    fileSizeLimit: MAX_CV_BYTES,
    allowedMimeTypes: Array.from(allowedCvTypes),
  });

  if (created.error && !created.error.message.toLowerCase().includes("already exists")) {
    throw new Error(`No se pudo crear el bucket de CV: ${created.error.message}`);
  }
};

const uploadCv = async (file: File) => {
  if (!isSupabaseWriteConfigured()) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para recibir CV.");
  }
  const supabase = getSupabaseWriteClient();
  if (!supabase) throw new Error("Supabase no está configurado.");
  if (!allowedCvTypes.has(file.type)) {
    throw new Error("El CV debe ser PDF, DOC o DOCX.");
  }
  if (file.size > MAX_CV_BYTES) {
    throw new Error("El CV supera el límite de 3 MB.");
  }

  await ensureCvBucket(supabase);

  const safeName = sanitizeFileName(file.name) || "cv.pdf";
  const path = `work-with-us/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const upload = await supabase.storage.from(CV_BUCKET).upload(path, buffer, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });
  if (upload.error) throw new Error(upload.error.message);

  const signed = await supabase.storage.from(CV_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 14);
  if (signed.error) throw new Error(signed.error.message);

  return { name: file.name, url: signed.data.signedUrl };
};

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let values: Record<string, unknown> = {};
    let cvName = "";
    let cvFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const rawValues = formData.get("values");
      values =
        typeof rawValues === "string"
          ? (JSON.parse(rawValues) as Record<string, unknown>)
          : {};
      const file = formData.get("cv");
      cvFile = file instanceof File && file.size > 0 ? file : null;
      cvName = cvFile?.name ?? "";
    } else {
      const payload = (await request.json()) as {
        values?: Record<string, unknown>;
        cvName?: unknown;
      };
      values = payload.values ?? {};
      cvName = normalizePayloadValue(payload.cvName);
    }

    const shell = await readPublicShell("home");
    const state = mergeState(defaultState, shell.data);
    const config = state.homeContent.workWithUs;

    if (!config.active) {
      return NextResponse.json(
        { ok: false, error: "El formulario no está disponible." },
        { status: 403 }
      );
    }

    const destinationEmail = config.destinationEmail.trim();
    if (
      (config.destinationType === "email" || config.destinationType === "both") &&
      !destinationEmail
    ) {
      return NextResponse.json(
        { ok: false, error: "No hay email destino configurado." },
        { status: 400 }
      );
    }

    const activeFields = config.fields.filter((field) => field.active);
    const missingRequired = activeFields.find((field) => {
      if (!field.required) return false;
      return !normalizePayloadValue(values[field.id]);
    });

    if (missingRequired) {
      return NextResponse.json(
        { ok: false, error: `Completá ${missingRequired.label}.` },
        { status: 400 }
      );
    }

    const rows = activeFields
      .map((field) => ({
        label: field.label,
        value: normalizePayloadValue(values[field.id]) || "-",
      }))
      .filter((row) => row.label);
    const uploadedCv = cvFile && config.allowCvUpload ? await uploadCv(cvFile) : null;
    const finalCvName = uploadedCv?.name || cvName;
    const finalCvUrl = uploadedCv?.url || "";

    const html = `
      <div style="font-family:Arial,sans-serif;color:#1b365d;line-height:1.55">
        <h1 style="margin:0 0 12px;font-size:24px">Nueva postulación desde ${escapeHtml(state.theme.name || "Connexa")}</h1>
        <p style="margin:0 0 20px;color:#4d5870">Formulario: Trabaja con nosotros</p>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
          ${rows
            .map(
              (row) => `
                <tr>
                  <td style="width:34%;padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">${escapeHtml(row.label)}</td>
                  <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(row.value).replace(/\n/g, "<br />")}</td>
                </tr>
              `
            )
            .join("")}
          ${
            finalCvName
              ? `
                <tr>
                  <td style="width:34%;padding:10px;border-bottom:1px solid #e5e7eb;font-weight:bold">CV seleccionado</td>
                  <td style="padding:10px;border-bottom:1px solid #e5e7eb">
                    ${escapeHtml(finalCvName)}
                    ${finalCvUrl ? `<br /><a href="${escapeHtml(finalCvUrl)}">Descargar CV</a>` : ""}
                  </td>
                </tr>
              `
              : ""
          }
        </table>
        ${finalCvUrl ? `<p style="margin:20px 0 0;color:#6b7280;font-size:12px">El link del CV es temporal y privado.</p>` : ""}
      </div>
    `;

    if (config.destinationType === "whatsapp") {
      return NextResponse.json({
        ok: true,
        provider: "whatsapp",
        cvName: finalCvName,
        cvUrl: finalCvUrl,
      });
    }

    const result = await sendEmail({
      to: destinationEmail,
      subject: `Nueva postulación - ${state.theme.name || "Connexa"}`,
      html,
    });

    if (!result.sent && result.provider !== "preview") {
      return NextResponse.json(
        { ok: false, error: result.reason ?? "No se pudo enviar el email." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      provider: result.provider,
      sent: result.sent,
      cvName: finalCvName,
      cvUrl: finalCvUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo enviar la postulación.",
      },
      { status: 500 }
    );
  }
}
