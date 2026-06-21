import { NextResponse } from "next/server";
import {
  getSupabaseWriteClient,
  isSupabaseWriteConfigured,
} from "@/lib/supabase/server";
import { readInmoState } from "@/lib/server/inmoRepository";

const MEDIA_BUCKET = "property-media";
const MAX_VIDEO_BYTES = 120 * 1024 * 1024;
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
  if (!bucket.error) {
    const updated = await supabase.storage.updateBucket(MEDIA_BUCKET, {
      public: true,
      fileSizeLimit: MAX_VIDEO_BYTES,
      allowedMimeTypes: Array.from(allowedMediaTypes),
    });
    if (updated.error) {
      throw new Error(`No se pudo actualizar el bucket de medios: ${updated.error.message}`);
    }
    return;
  }

  const created = await supabase.storage.createBucket(MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: MAX_VIDEO_BYTES,
    allowedMimeTypes: Array.from(allowedMediaTypes),
  });

  if (created.error && !created.error.message.toLowerCase().includes("already exists")) {
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
              : "El video supera el límite de 120 MB.",
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
