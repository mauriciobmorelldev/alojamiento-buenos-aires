import { NextResponse } from "next/server";
import type {
  AdminRole,
  Listing,
  PriceCurrency,
  PriceUnit,
  PropertyStatus,
  PropertyType,
} from "@/lib/inmoData";
import { deleteListing, upsertListing } from "@/lib/server/inmoRepository";
import { deleteRemovedListingMedia } from "@/lib/server/mediaStorage";
import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { sanitizeVideoUrls } from "@/lib/video";

const propertySelect =
  "id,title,type,status,price,price_unit,currency,neighborhood,area,rooms,tag,highlight,description,videos,cover_index,agent_id,created_by_admin_id,attributes";

type PropertyRow = {
  id: string;
  title: string;
  created_by_admin_id?: string | null;
  type: string;
  status: string;
  price: number | string | null;
  price_unit: string;
  currency?: string | null;
  neighborhood: string;
  area: number | string | null;
  rooms: number | string | null;
  tag?: string | null;
  highlight?: string | null;
  description?: string | null;
  videos?: unknown;
  cover_index?: number | string | null;
  agent_id?: string | null;
  attributes?: Record<string, string[]>;
};

const mapProperty = (
  row: PropertyRow,
  images: Array<{ url: string }>
): Listing => ({
  id: row.id,
  title: row.title,
  createdByAdminId: row.created_by_admin_id ?? undefined,
  type: row.type as PropertyType,
  status: row.status as PropertyStatus,
  price: Number(row.price ?? 0),
  priceUnit: row.price_unit as PriceUnit,
  currency: (row.currency === "USD" ? "USD" : "ARS") as PriceCurrency,
  neighborhood: row.neighborhood,
  area: Number(row.area ?? 0),
  rooms: Number(row.rooms ?? 0),
  tag: row.tag ?? "",
  highlight: row.highlight ?? "",
  description: row.description ?? "",
  images: images.map((image) => image.url),
  videos: sanitizeVideoUrls(row.videos),
  coverIndex: Number(row.cover_index ?? 0),
  agentId: row.agent_id ?? undefined,
  attributes: row.attributes ?? {},
});

const getAdmin = async (request: Request) => {
  const adminId = request.headers.get("x-admin-id");
  if (!adminId) return null;
  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) return null;
  const profile = await supabase
    .from("profiles")
    .select("id,role,active")
    .eq("id", adminId)
    .eq("kind", "admin")
    .maybeSingle();
  const admin = profile.data;
  return admin?.active
    ? {
        id: admin.id as string,
        role: (admin.role === "owner" ? "owner" : "colaborador") as AdminRole,
      }
    : null;
};

const readListing = async (id: string) => {
  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) return null;
  const [property, images] = await Promise.all([
    supabase.from("properties").select(propertySelect).eq("id", id).maybeSingle(),
    supabase
      .from("property_images")
      .select("url,sort_order")
      .eq("property_id", id)
      .order("sort_order"),
  ]);
  if (property.error || images.error || !property.data) return null;
  return mapProperty(property.data, images.data ?? []);
};

export async function GET(request: Request) {
  const admin = await getAdmin(request);
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("id");
  if (!propertyId) {
    return NextResponse.json({ ok: false, error: "Missing property id" }, { status: 400 });
  }
  const listing = await readListing(propertyId);
  if (!listing) {
    return NextResponse.json({ ok: false, error: "Propiedad no encontrada." }, { status: 404 });
  }
  if (admin.role !== "owner" && listing.createdByAdminId !== admin.id) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
  }
  return NextResponse.json({ ok: true, property: listing });
}

export async function POST(request: Request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const incoming = (await request.json()) as Listing;
    const previous = await readListing(incoming.id);
    const isOwner = admin.role === "owner";
    const canEdit =
      isOwner ||
      previous?.createdByAdminId === admin.id ||
      (!previous && admin.role === "colaborador");

    if (!canEdit) {
      return NextResponse.json(
        { ok: false, error: "El colaborador solo puede editar propiedades propias." },
        { status: 403 }
      );
    }

    const listing: Listing = {
      ...incoming,
      agentId: isOwner ? incoming.agentId : undefined,
      createdByAdminId:
        isOwner ? incoming.createdByAdminId : previous?.createdByAdminId ?? admin.id,
    };

    const result = await upsertListing(listing);
    if (result.source !== "supabase") {
      return NextResponse.json(
        {
          ok: false,
          source: result.source,
          error:
            "Supabase está conectado para lectura, pero falta SUPABASE_SERVICE_ROLE_KEY para guardar sin bloqueo de RLS.",
        },
        { status: 500 }
      );
    }
    try {
      await deleteRemovedListingMedia(previous, listing);
    } catch (cleanupError) {
      console.warn("No se pudieron borrar medios removidos de la propiedad", cleanupError);
    }
    return NextResponse.json({ ok: true, source: result.source, property: listing });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo guardar en Supabase.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("id");
    if (!propertyId) {
      return NextResponse.json({ ok: false, error: "Missing property id" }, { status: 400 });
    }

    const listing = await readListing(propertyId);
    const isOwner = admin.role === "owner";
    const canDelete = isOwner || listing?.createdByAdminId === admin.id;
    if (!canDelete) {
      return NextResponse.json(
        { ok: false, error: "El colaborador solo puede eliminar propiedades propias." },
        { status: 403 }
      );
    }

    const result = await deleteListing(propertyId);
    if (result.source !== "supabase") {
      return NextResponse.json(
        {
          ok: false,
          source: result.source,
          error:
            "Supabase está conectado para lectura, pero falta SUPABASE_SERVICE_ROLE_KEY para eliminar sin bloqueo de RLS.",
        },
        { status: 500 }
      );
    }
    try {
      await deleteRemovedListingMedia(listing, null);
    } catch (cleanupError) {
      console.warn("No se pudieron borrar medios de la propiedad eliminada", cleanupError);
    }
    return NextResponse.json({ ok: true, source: result.source });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "No se pudo eliminar en Supabase.",
      },
      { status: 500 }
    );
  }
}
