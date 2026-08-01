import { NextResponse } from "next/server";
import { STATE_VERSION, type EditorialPost } from "@/lib/inmoData";
import { getAdminFromRequest } from "@/lib/server/adminAuth";
import {
  deleteEditorialPost,
  upsertEditorialPost,
} from "@/lib/server/inmoRepository";
import { isSupabaseConfigured } from "@/lib/supabase/server";

const noStoreHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

const canManageEditorial = (role: string) => role === "owner" || role === "escritor";

const isEditorialPost = (value: unknown): value is EditorialPost => {
  if (!value || typeof value !== "object") return false;
  const post = value as Record<string, unknown>;
  return (
    typeof post.id === "string" &&
    typeof post.slug === "string" &&
    typeof post.title === "string" &&
    typeof post.excerpt === "string" &&
    typeof post.body === "string" &&
    typeof post.coverImage === "string" &&
    typeof post.category === "string" &&
    typeof post.metaTitle === "string" &&
    typeof post.metaDescription === "string" &&
    typeof post.published === "boolean" &&
    typeof post.publishedAt === "string" &&
    typeof post.createdAt === "string" &&
    typeof post.updatedAt === "string"
  );
};

const requireEditorialAdmin = async (request: Request) => {
  const context = await getAdminFromRequest(request);
  if (!context || !canManageEditorial(context.admin.role)) return null;
  return context;
};

const unavailableWriteResponse = () =>
  NextResponse.json(
    { ok: false, error: "La escritura de Supabase no esta configurada." },
    { status: 503, headers: noStoreHeaders }
  );

export async function GET(request: Request) {
  const context = await requireEditorialAdmin(request);
  if (!context) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    {
      data: {
        version: STATE_VERSION,
        theme: context.state.theme,
        adminUsers: [{ ...context.admin, password: "" }],
        editorialPosts: context.state.editorialPosts,
      },
      source: isSupabaseConfigured() ? "supabase" : "fallback",
    },
    { headers: noStoreHeaders }
  );
}

export async function PUT(request: Request) {
  try {
    const context = await requireEditorialAdmin(request);
    if (!context) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const post = (await request.json().catch(() => null)) as unknown;
    if (!isEditorialPost(post) || !post.id.trim() || !post.slug.trim() || !post.title.trim()) {
      return NextResponse.json({ ok: false, error: "Articulo invalido." }, { status: 400 });
    }

    const result = await upsertEditorialPost(post);
    if (isSupabaseConfigured() && result.source !== "supabase") {
      return unavailableWriteResponse();
    }
    return NextResponse.json({ ok: true, source: result.source }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo guardar el articulo.",
      },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await requireEditorialAdmin(request);
    if (!context) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const postId = new URL(request.url).searchParams.get("id")?.trim();
    if (!postId) {
      return NextResponse.json({ ok: false, error: "Falta el articulo." }, { status: 400 });
    }

    const result = await deleteEditorialPost(postId);
    if (isSupabaseConfigured() && result.source !== "supabase") {
      return unavailableWriteResponse();
    }
    return NextResponse.json({ ok: true, source: result.source }, { headers: noStoreHeaders });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo eliminar el articulo.",
      },
      { status: 500, headers: noStoreHeaders }
    );
  }
}
