import { NextResponse } from "next/server";
import {
  getSupabaseWriteClient,
  isSupabaseWriteConfigured,
} from "@/lib/supabase/server";
import { readInmoState } from "@/lib/server/inmoRepository";

const MEDIA_BUCKET = "property-media";
const getConfiguredVideoLimitBytes = () => {
  const configuredMb = Number(process.env.SUPABASE_MAX_VIDEO_UPLOAD_MB ?? 50);
  const safeMb = Number.isFinite(configuredMb) && configuredMb > 0 ? configuredMb : 50;
  return Math.min(safeMb, 50) * 1024 * 1024;
};

const MAX_VIDEO_BYTES = getConfiguredVideoLimitBytes();
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const allowedVideoTypes = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);
const allowedMediaTypes = new Set([...allowedImageTypes, ...allowedVideoTypes]);

const sanitizeFileName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

const ensureBucket = async (supabase: NonNullable<ReturnType<typeof getSupabaseWriteClient>>) => {
  const bucket = await supabase.storage.getBucket(MEDIA_BUCKET);
  if (!bucket.error) return;

  const created = await supabase.storage.createBucket(MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: MAX_VIDEO_BYTES,
    allowedMimeTypes: Array.from(allowedMediaTypes),
  });

  if (created.error && !created.error.message.toLowerCase().includes("already exists")) {
    const message = created.error.message.toLowerCase();
    if (message.includes("maximum allowed size") || message.includes("exceeded")) {
      const fallbackCreated = await supabase.storage.createBucket(MEDIA_BUCKET, {
        public: true,
        allowedMimeTypes: Array.from(allowedMediaTypes),
      });
      if (!fallbackCreated.error || fallbackCreated.error.message.toLowerCase().includes("already exists")) {
        return;
      }
      throw new Error(`No se pudo crear el bucket de medios: ${fallbackCreated.error.message}`);
    }
    throw new Error(`No se pudo crear el bucket de medios: ${created.error.message}`);
  }
};

export async function POST(request: Request) {
  try {
    const adminId = request.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const state = await readInmoState({ scope: "admin" });
    const admin = state.data.adminUsers.find((item) => item.id === adminId && item.active);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseWriteClient();
    if (!supabase || !isSupabaseWriteConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Falta SUPABASE_SERVICE_ROLE_KEY para subir medios a Storage.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const kind = formData.get("kind");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Archivo requerido." }, { status: 400 });
    }
    if (kind !== "video" && kind !== "image") {
      return NextResponse.json({ ok: false, error: "Tipo de medio inválido." }, { status: 400 });
    }
    if (kind === "image" && !allowedImageTypes.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Subí una imagen JPG, PNG, WebP o AVIF." },
        { status: 400 }
      );
    }
    if (kind === "video" && !allowedVideoTypes.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Subí un video MP4, WebM, OGG o MOV." },
        { status: 400 }
      );
    }
    const maxBytes = kind === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          ok: false,
          error:
            kind === "image"
              ? "La imagen supera el límite de 8 MB."
              : `El video supera el límite de ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)} MB.`,
        },
        { status: 400 }
      );
    }

    await ensureBucket(supabase);

    const fallbackExtension = kind === "image" ? "webp" : "mp4";
    const extension = sanitizeFileName(file.name).split(".").pop() || fallbackExtension;
    const safeBaseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || kind;
    const path = `${kind === "image" ? "images" : "videos"}/${admin.id}/${Date.now()}-${safeBaseName}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const upload = await supabase.storage.from(MEDIA_BUCKET).upload(path, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

    if (upload.error) {
      throw new Error(upload.error.message);
    }

    const publicUrl = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
    return NextResponse.json({
      ok: true,
      url: publicUrl,
      path,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo subir el archivo.",
      },
      { status: 500 }
    );
  }
}
