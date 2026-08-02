import {
  defaultState,
  normalizeAdminRole,
  STATE_VERSION,
  type EditorialPost,
  type InmoState,
  type Listing,
  type LeadType,
  type LeadStatus,
  type NewsletterSubscriber,
  type PriceCurrency,
  type PriceUnit,
  type PropertyStatus,
  type PropertyType,
} from "@/lib/inmoData";
import { decodeEditorialBody, encodeEditorialBody } from "@/lib/editorialContent";
import {
  getSupabaseServerClient,
  getSupabaseWriteClient,
  isSupabaseConfigured,
  isSupabaseWriteConfigured,
} from "@/lib/supabase/server";
import { mergeState } from "@/lib/stateMerge";
import { clearResponseCache } from "@/lib/server/responseCache";
import { sanitizeVideoUrls } from "@/lib/video";

const SETTINGS_ID = "default";

type RepositoryResult<T> = {
  data: T;
  source: "supabase" | "fallback";
};

type ReadInmoStateOptions = {
  scope?: "public" | "admin";
  adminMode?: "dashboard" | "properties" | "leads" | "settings" | "full";
};

type PublicReadResult = RepositoryResult<Partial<InmoState>>;
type PublicShellMode = "home" | "catalog";
export type PublicListingsPageOptions = {
  page?: number;
  pageSize?: number;
  query?: string;
  type?: string;
  operation?: string;
  minRooms?: number;
  sort?: string;
  attributes?: Record<string, string[]>;
};
export type PublicListingsPageResult = PublicReadResult & {
  data: Partial<InmoState> & {
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
};
type PublicPropertyRow = {
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
  cover_index?: number | string | null;
  agent_id?: string | null;
  attributes?: Record<string, string[]>;
};

const publicListingPropertySelect =
  "id,title,type,status,price,price_unit,currency,neighborhood,area,rooms,tag,highlight,cover_index,agent_id,created_by_admin_id,attributes";

const publicPropertyDetailSelect =
  "id,title,type,status,price,price_unit,currency,neighborhood,area,rooms,tag,highlight,description,videos,cover_index,agent_id,created_by_admin_id,attributes";

const hiddenPublicStatuses: PropertyStatus[] = ["tasacion", "no_disponible"];

const isPublicListingStatus = (status: string | null | undefined) =>
  !hiddenPublicStatuses.includes(status as PropertyStatus);

const clampPublicPage = (value: number | undefined) =>
  Number.isFinite(value) && Number(value) > 0 ? Math.floor(Number(value)) : 1;

const clampPublicPageSize = (value: number | undefined) => {
  const pageSize = Number.isFinite(value) && Number(value) > 0 ? Math.floor(Number(value)) : 12;
  return Math.min(Math.max(pageSize, 1), 24);
};

const escapeIlike = (value: string) =>
  value.replace(/[%_]/g, "\\$&").replace(/[(),]/g, " ").trim();

const filterFallbackListings = (
  listings: Listing[],
  options: PublicListingsPageOptions
) => {
  let items = listings.filter((listing) => isPublicListingStatus(listing.status));
  const query = options.query?.trim().toLowerCase();
  if (query) {
    items = items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.neighborhood.toLowerCase().includes(query)
    );
  }
  if (options.type && options.type !== "all") {
    items = items.filter((item) => item.type === options.type);
  }
  if (options.operation === "venta") {
    items = items.filter((item) => item.priceUnit === "venta");
  }
  if (options.operation === "alquiler") {
    items = items.filter((item) => item.priceUnit === "mensual" || item.priceUnit === "noche");
  }
  if (options.minRooms) {
    items = items.filter((item) => item.rooms >= Number(options.minRooms));
  }
  Object.entries(options.attributes ?? {}).forEach(([groupId, selected]) => {
    const active = selected.filter(Boolean);
    if (!active.length) return;
    items = items.filter((item) => {
      const values = item.attributes[groupId] ?? [];
      return active.every((option) => values.includes(option));
    });
  });
  if (options.sort === "price-asc") {
    items = [...items].sort((a, b) => Number(a.price ?? 0) - Number(b.price ?? 0));
  } else if (options.sort === "price-desc") {
    items = [...items].sort((a, b) => Number(b.price ?? 0) - Number(a.price ?? 0));
  }
  return items;
};

const ensureArray = <T>(value: T[] | null) => value ?? [];

const isOversizedDataImage = (value: unknown, maxBytes: number) =>
  typeof value === "string" &&
  value.startsWith("data:image/") &&
  value.length > maxBytes;

const sanitizePublicImage = (value: unknown, maxBytes: number) =>
  typeof value === "string" &&
  !value.startsWith("data:") &&
  !value.startsWith("blob:") &&
  !isOversizedDataImage(value, maxBytes)
    ? value
    : "";

const sanitizePublicImages = (images: unknown, maxBytes = 900_000) =>
  Array.isArray(images)
    ? images.map((image) => sanitizePublicImage(image, maxBytes)).filter(Boolean)
    : [];

const sanitizePublicTheme = (theme: InmoState["theme"]) => ({
  ...theme,
  logo: sanitizePublicImage(theme.logo, 260_000),
  heroImage: sanitizePublicImage(theme.heroImage, 1_100_000),
});

const assertSupabaseOk = (
  result: { error?: { message?: string } | null },
  action: string
) => {
  if (result.error) {
    throw new Error(`${action}: ${result.error.message ?? "Error de Supabase"}`);
  }
};

const toPropertyRow = (property: Listing) => ({
  id: property.id,
  title: property.title,
  type: property.type,
  status: property.status,
  price: property.price,
  price_unit: property.priceUnit,
  currency: property.currency ?? "ARS",
  neighborhood: property.neighborhood,
  area: property.area,
  rooms: property.rooms,
  tag: property.tag,
  highlight: property.highlight,
  description: property.description,
  videos: sanitizeVideoUrls(property.videos),
  cover_index: property.coverIndex,
  agent_id: property.agentId ?? null,
  created_by_admin_id: property.createdByAdminId ?? null,
  attributes: property.attributes,
  updated_at: new Date().toISOString(),
});

const toPropertyImageRows = (property: Listing) =>
  property.images.map((url, index) => ({
    id: `${property.id}-${index}`,
    property_id: property.id,
    url,
    sort_order: index,
  }));

const omitProfilePhone = (row: {
  phone?: string;
  [key: string]: unknown;
}) => {
  const clone = { ...row };
  delete clone.phone;
  return clone;
};

const sanitizeHomeContent = (value: unknown) => {
  if (!value || typeof value !== "object") return defaultState.homeContent;
  const homeContent = { ...(value as Record<string, unknown>) };
  delete homeContent.customPages;
  if (Array.isArray(homeContent.banners)) {
    homeContent.banners = homeContent.banners.map((banner) =>
      banner && typeof banner === "object"
        ? {
            ...banner,
            image: sanitizePublicImage((banner as { image?: unknown }).image, 1_100_000),
          }
        : banner
    );
  }
  if (Array.isArray(homeContent.partnerLogos)) {
    homeContent.partnerLogos = homeContent.partnerLogos.map((logo) =>
      logo && typeof logo === "object"
        ? {
            ...logo,
            image: sanitizePublicImage((logo as { image?: unknown }).image, 260_000),
          }
        : logo
    );
  }
  if (homeContent.buenosAires && typeof homeContent.buenosAires === "object") {
    const buenosAires = homeContent.buenosAires as Record<string, unknown>;
    homeContent.buenosAires = {
      ...buenosAires,
      heroImage: sanitizePublicImage(buenosAires.heroImage, 1_100_000),
      sections: Array.isArray(buenosAires.sections)
        ? buenosAires.sections.map((section) =>
            section && typeof section === "object"
              ? {
                  ...section,
                  image: sanitizePublicImage(
                    (section as { image?: unknown }).image,
                    900_000
                  ),
                }
              : section
          )
        : buenosAires.sections,
    };
  }
  return homeContent as InmoState["homeContent"];
};

const sanitizeFooterOnlyHomeContent = (value: unknown): InmoState["homeContent"] => ({
  ...defaultState.homeContent,
  footer: sanitizeHomeContent(value).footer,
});

const sanitizeCustomPages = (pages: InmoState["customPages"]) =>
  pages.map((page) => ({
    ...page,
    blocks: page.blocks.map((block) => ({
      ...block,
      image: sanitizePublicImage(block.image, 900_000),
    })),
  }));

const getCatalogTheme = (theme: InmoState["theme"]) => ({
  ...theme,
  logo: "",
  heroImage: "",
});

const mapPublicListingRows = (
  rows: PublicPropertyRow[],
  imagesByProperty: Map<string, string[]>
): Listing[] =>
  rows.map((property) => ({
    id: property.id,
    title: property.title,
    createdByAdminId: property.created_by_admin_id ?? undefined,
    type: property.type as PropertyType,
    status: property.status as PropertyStatus,
    price: Number(property.price ?? 0),
    priceUnit: property.price_unit as PriceUnit,
    currency: (property.currency === "USD" ? "USD" : "ARS") as PriceCurrency,
    neighborhood: property.neighborhood,
    area: Number(property.area ?? 0),
    rooms: Number(property.rooms ?? 0),
    tag: property.tag ?? "",
    highlight: property.highlight ?? "",
    description: "",
    images: sanitizePublicImages(imagesByProperty.get(property.id) ?? []),
    videos: [],
    coverIndex: Number(property.cover_index ?? 0),
    agentId: property.agent_id ?? undefined,
    attributes: property.attributes ?? {},
  }));

type EditorialPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  body?: string | null;
  cover_image?: string | null;
  category?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  published?: boolean | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type NewsletterSubscriberRow = {
  id: string;
  email: string;
  name?: string | null;
  active?: boolean | null;
  created_at?: string | null;
};

const mapEditorialPostRow = (post: EditorialPostRow): EditorialPost => {
  const decoded = decodeEditorialBody(post.body ?? "");
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt ?? "",
    body: decoded.body,
    coverImage: sanitizePublicImage(post.cover_image, 1_100_000),
    authorName: decoded.authorName,
    authorPhoto: sanitizePublicImage(decoded.authorPhoto, 1_100_000),
    authorSignature: sanitizePublicImage(decoded.authorSignature, 1_100_000),
    contentBlocks: decoded.contentBlocks.map((block) => ({
      ...block,
      image: block.type === "image" ? sanitizePublicImage(block.image, 1_100_000) : "",
    })),
    category: post.category ?? "",
    metaTitle: post.meta_title ?? post.title,
    metaDescription: post.meta_description ?? post.excerpt ?? "",
    published: Boolean(post.published),
    publishedAt: post.published_at ?? "",
    createdAt: post.created_at ?? "",
    updatedAt: post.updated_at ?? "",
  };
};

const toEditorialPostRow = (post: EditorialPost) => ({
  id: post.id,
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  body: encodeEditorialBody(post),
  cover_image: post.coverImage,
  category: post.category,
  meta_title: post.metaTitle,
  meta_description: post.metaDescription,
  published: post.published,
  published_at: post.publishedAt || null,
  updated_at: new Date().toISOString(),
});

const mapNewsletterSubscriberRow = (
  subscriber: NewsletterSubscriberRow
): NewsletterSubscriber => ({
  id: subscriber.id,
  email: subscriber.email,
  name: subscriber.name ?? "",
  active: Boolean(subscriber.active),
  createdAt: subscriber.created_at ?? "",
});

const toNewsletterSubscriberRow = (subscriber: NewsletterSubscriber) => ({
  id: subscriber.id,
  email: subscriber.email,
  name: subscriber.name,
  active: subscriber.active,
  created_at: subscriber.createdAt,
});

export const readPublicShell = async (
  mode: PublicShellMode = "home"
): Promise<PublicReadResult> => {
  const isCatalogMode = mode === "catalog";
  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) {
    return {
      data: {
        version: STATE_VERSION,
        theme: isCatalogMode
          ? getCatalogTheme(defaultState.theme)
          : sanitizePublicTheme(defaultState.theme),
        ...(isCatalogMode
          ? {
              homeContent: sanitizeFooterOnlyHomeContent(defaultState.homeContent),
            }
          : {
              homeContent: sanitizeHomeContent(defaultState.homeContent),
            }),
        filterGroups: defaultState.filterGroups,
        adminUsers: defaultState.adminUsers.map((admin) => ({
          ...admin,
          password: "",
        })),
        agents: defaultState.agents,
      },
      source: "fallback",
    };
  }

  const settingsQuery = isCatalogMode
    ? supabase
        .from("platform_settings")
        .select("theme,filter_groups")
        .eq("id", SETTINGS_ID)
        .maybeSingle()
    : supabase
        .from("platform_settings")
        .select("theme,home_content,filter_groups")
        .eq("id", SETTINGS_ID)
        .maybeSingle();

  const [settings, profiles, agents] = await Promise.all([
    settingsQuery,
    supabase
      .from("profiles")
      .select("id,role,active")
      .eq("kind", "admin"),
    supabase.from("agents").select("id,name,role"),
  ]);

  if (settings.error) {
    console.warn("Supabase public settings read failed", settings.error.message);
  }
  if (profiles.error) {
    console.warn("Supabase public profiles read failed", profiles.error.message);
  }
  if (agents.error) {
    console.warn("Supabase public agents read failed", agents.error.message);
  }

  const settingsData = settings.data as {
    theme?: InmoState["theme"];
    home_content?: Record<string, unknown>;
    filter_groups?: InmoState["filterGroups"];
  } | null;
  return {
    data: {
      version: STATE_VERSION,
      theme: getCatalogTheme(
        settings.error ? defaultState.theme : settingsData?.theme ?? defaultState.theme
      ),
      ...(isCatalogMode
        ? {
            homeContent: sanitizeFooterOnlyHomeContent(settingsData?.home_content),
          }
        : {
            theme: sanitizePublicTheme(
              settings.error ? defaultState.theme : settingsData?.theme ?? defaultState.theme
            ),
            homeContent: settings.error
              ? sanitizeHomeContent(defaultState.homeContent)
              : sanitizeHomeContent(settingsData?.home_content),
          }),
      filterGroups: settings.error
        ? defaultState.filterGroups
        : settingsData?.filter_groups ?? defaultState.filterGroups,
      adminUsers: profiles.error ? [] : ensureArray(profiles.data).map((profile) => ({
        id: profile.id,
        name: "",
        email: "",
        password: "",
        role: normalizeAdminRole(profile.role),
        phone: "",
        active: Boolean(profile.active),
      })),
      agents: agents.error ? [] : ensureArray(agents.data).map((agent) => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        phone: "",
        email: "",
        photo: undefined,
      })),
    },
    source: "supabase",
  };
};

export const readPublicCustomPage = async (slug: string) => {
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "");
  const fallbackPage = sanitizeCustomPages(defaultState.customPages).find(
    (page) => page.active && page.slug.replace(/^\/+|\/+$/g, "") === normalizedSlug
  ) ?? null;
  const supabase = getSupabaseServerClient();

  if (!supabase || !isSupabaseConfigured()) {
    return { page: fallbackPage, source: "fallback" as const };
  }

  const settings = await supabase
    .from("platform_settings")
    .select("home_content")
    .eq("id", SETTINGS_ID)
    .maybeSingle();

  if (settings.error) {
    console.warn("Supabase public page read failed", settings.error.message);
    return { page: fallbackPage, source: "fallback" as const };
  }

  const homeContent = settings.data?.home_content as Record<string, unknown> | null;
  const pages = Array.isArray(homeContent?.customPages)
    ? sanitizeCustomPages(homeContent.customPages as InmoState["customPages"])
    : [];
  const page =
    pages.find(
      (item) =>
        item.active && item.slug.replace(/^\/+|\/+$/g, "") === normalizedSlug
    ) ?? null;

  return { page, source: "supabase" as const };
};

export const readPublicListings = async (): Promise<PublicReadResult> => {
  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) {
    return {
      data: {
        version: STATE_VERSION,
        listings: defaultState.listings
          .filter((listing) => isPublicListingStatus(listing.status))
          .map((listing) => ({
            ...listing,
            description: "",
            images: sanitizePublicImages(listing.images.slice(0, 4)),
            videos: [],
          })),
      },
      source: "fallback",
    };
  }

  const propertiesQuery = supabase
    .from("properties")
    .select(publicListingPropertySelect)
    .not("status", "in", `(${hiddenPublicStatuses.join(",")})`)
    .order("updated_at", { ascending: false });

  const properties = await propertiesQuery;

  if (properties.error) {
    console.warn("Supabase public properties read failed", properties.error.message);
    return {
      data: {
        version: STATE_VERSION,
        listings: defaultState.listings
          .filter((listing) => isPublicListingStatus(listing.status))
          .map((listing) => ({
            ...listing,
            description: "",
            images: sanitizePublicImages(listing.images.slice(0, 4)),
            videos: [],
          })),
      },
      source: "fallback",
    };
  }

  const propertyIds = ensureArray(properties.data).map((property) => property.id);
  const propertyImages = propertyIds.length
    ? await supabase
        .from("property_images")
        .select("property_id,url,sort_order")
        .in("property_id", propertyIds)
        .lte("sort_order", 3)
        .order("sort_order")
    : { data: [], error: null };

  if (propertyImages.error) {
    console.warn("Supabase public property_images read failed", propertyImages.error.message);
    return {
      data: {
        version: STATE_VERSION,
        listings: defaultState.listings
          .filter((listing) => isPublicListingStatus(listing.status))
          .map((listing) => ({
            ...listing,
            description: "",
            images: sanitizePublicImages(listing.images.slice(0, 4)),
            videos: [],
          })),
      },
      source: "fallback",
    };
  }

  const imagesByProperty = new Map<string, string[]>();
  const propertyImageRows = (propertyImages.data ?? []) as Array<{
    property_id: string;
    url: string;
  }>;
  propertyImageRows.forEach((image) => {
    const list = imagesByProperty.get(image.property_id) ?? [];
    if (list.length >= 4) return;
    list.push(image.url);
    imagesByProperty.set(image.property_id, list);
  });

  return {
    data: {
      version: STATE_VERSION,
      listings: mapPublicListingRows(
        ensureArray(properties.data) as PublicPropertyRow[],
        imagesByProperty
      ),
    },
    source: "supabase",
  };
};

export const readPublicEditorialPosts = async (): Promise<PublicReadResult> => {
  const fallbackPosts = defaultState.editorialPosts
    .filter((post) => post.published)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  const supabase = getSupabaseServerClient();

  if (!supabase || !isSupabaseConfigured()) {
    return {
      data: {
        version: STATE_VERSION,
        editorialPosts: fallbackPosts,
      },
      source: "fallback",
    };
  }

  const posts = await supabase
    .from("editorial_posts")
    .select(
      "id,slug,title,excerpt,body,cover_image,category,meta_title,meta_description,published,published_at,created_at,updated_at"
    )
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (posts.error) {
    console.warn("Supabase public editorial_posts read failed", posts.error.message);
    return {
      data: {
        version: STATE_VERSION,
        editorialPosts: fallbackPosts,
      },
      source: "fallback",
    };
  }

  return {
    data: {
      version: STATE_VERSION,
      editorialPosts: ensureArray(posts.data).map(mapEditorialPostRow),
    },
    source: "supabase",
  };
};

export const readPublicListingsPage = async (
  options: PublicListingsPageOptions = {}
): Promise<PublicListingsPageResult> => {
  const page = clampPublicPage(options.page);
  const pageSize = clampPublicPageSize(options.pageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const buildPagination = (total: number) => ({
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });

  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) {
    const filtered = filterFallbackListings(defaultState.listings, options);
    const pageRows = filtered.slice(from, from + pageSize).map((listing) => ({
      ...listing,
      description: "",
      images: sanitizePublicImages(listing.images.slice(0, 4)),
      videos: [],
    }));
    return {
      data: {
        version: STATE_VERSION,
        listings: pageRows,
        pagination: buildPagination(filtered.length),
      },
      source: "fallback",
    };
  }

  let propertiesQuery = supabase
    .from("properties")
    .select(publicListingPropertySelect, { count: "exact" })
    .not("status", "in", `(${hiddenPublicStatuses.join(",")})`);

  const query = escapeIlike(options.query ?? "");
  if (query) {
    propertiesQuery = propertiesQuery.or(
      `title.ilike.%${query}%,neighborhood.ilike.%${query}%`
    );
  }

  if (options.type && options.type !== "all") {
    propertiesQuery = propertiesQuery.eq("type", options.type);
  }

  if (options.operation === "venta") {
    propertiesQuery = propertiesQuery.eq("price_unit", "venta");
  } else if (options.operation === "alquiler") {
    propertiesQuery = propertiesQuery.in("price_unit", ["mensual", "noche"]);
  }

  if (options.minRooms) {
    propertiesQuery = propertiesQuery.gte("rooms", options.minRooms);
  }

  Object.entries(options.attributes ?? {}).forEach(([groupId, selected]) => {
    const active = selected.filter(Boolean);
    if (!active.length) return;
    propertiesQuery = propertiesQuery.contains("attributes", { [groupId]: active });
  });

  if (options.sort === "price-asc") {
    propertiesQuery = propertiesQuery.order("price", { ascending: true });
  } else if (options.sort === "price-desc") {
    propertiesQuery = propertiesQuery.order("price", { ascending: false });
  } else {
    propertiesQuery = propertiesQuery.order("updated_at", { ascending: false });
  }

  const properties = await propertiesQuery.range(from, to);

  if (properties.error) {
    console.warn("Supabase public paginated properties read failed", properties.error.message);
    return {
      data: {
        version: STATE_VERSION,
        listings: [],
        pagination: buildPagination(0),
      },
      source: "fallback",
    };
  }

  const rows = ensureArray(properties.data) as PublicPropertyRow[];
  const propertyIds = rows.map((property) => property.id);
  const propertyImages = propertyIds.length
    ? await supabase
        .from("property_images")
        .select("property_id,url,sort_order")
        .in("property_id", propertyIds)
        .lte("sort_order", 3)
        .order("sort_order")
    : { data: [], error: null };

  if (propertyImages.error) {
    console.warn("Supabase public paginated property_images read failed", propertyImages.error.message);
  }

  const imagesByProperty = new Map<string, string[]>();
  const propertyImageRows = (propertyImages.data ?? []) as Array<{
    property_id: string;
    url: string;
  }>;
  propertyImageRows.forEach((image) => {
    const list = imagesByProperty.get(image.property_id) ?? [];
    if (list.length >= 4) return;
    list.push(image.url);
    imagesByProperty.set(image.property_id, list);
  });

  return {
    data: {
      version: STATE_VERSION,
      listings: mapPublicListingRows(rows, imagesByProperty),
      pagination: buildPagination(properties.count ?? rows.length),
    },
    source: "supabase",
  };
};

export const readPublicHomeListings = async (): Promise<PublicReadResult> => {
  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) {
    const fallbackListings = defaultState.listings
      .filter((listing) => isPublicListingStatus(listing.status))
      .slice(0, 9)
      .map((listing) => ({
        ...listing,
        description: "",
        images: sanitizePublicImages(listing.images.slice(0, 2)),
        videos: [],
      }));
    return {
      data: {
        version: STATE_VERSION,
        listings: fallbackListings,
        homeContent: {
          publicInventoryTotal: fallbackListings.length,
          publicInventoryAvailable: fallbackListings.filter(
            (listing) => listing.status === "disponible"
          ).length,
        } as InmoState["homeContent"],
      },
      source: "fallback",
    };
  }

  const [pinned, recent, totalCount, availableCount] = await Promise.all([
    supabase
      .from("properties")
      .select(publicListingPropertySelect)
      .contains("attributes", { pinned_home: ["true"] })
      .not("status", "in", `(${hiddenPublicStatuses.join(",")})`)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("properties")
      .select(publicListingPropertySelect)
      .not("status", "in", `(${hiddenPublicStatuses.join(",")})`)
      .order("updated_at", { ascending: false })
      .limit(9),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .not("status", "in", `(${hiddenPublicStatuses.join(",")})`),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("status", "disponible"),
  ]);

  const propertyErrors = [pinned.error, recent.error].filter(Boolean);
  if (propertyErrors.length) {
    console.warn(
      "Supabase public home listings read failed",
      propertyErrors.map((error) => error?.message).join(" | ")
    );
    return {
      data: {
        version: STATE_VERSION,
        listings: [],
        homeContent: {
          publicInventoryTotal: 0,
          publicInventoryAvailable: 0,
        } as InmoState["homeContent"],
      },
      source: "fallback",
    };
  }

  const rowsById = new Map<string, PublicPropertyRow>();
  ([...(pinned.data ?? []), ...(recent.data ?? [])] as PublicPropertyRow[]).forEach(
    (row) => {
      if (rowsById.size >= 12 && !rowsById.has(row.id)) return;
      rowsById.set(row.id, row);
    }
  );
  const rows = [...rowsById.values()];
  const propertyIds = rows.map((property) => property.id);
  const propertyImages = propertyIds.length
    ? await supabase
        .from("property_images")
        .select("property_id,url,sort_order")
        .in("property_id", propertyIds)
        .lte("sort_order", 1)
        .order("sort_order")
    : { data: [], error: null };

  if (propertyImages.error) {
    console.warn("Supabase public home property_images read failed", propertyImages.error.message);
  }

  const imagesByProperty = new Map<string, string[]>();
  const propertyImageRows = (propertyImages.data ?? []) as Array<{
    property_id: string;
    url: string;
  }>;
  propertyImageRows.forEach((image) => {
    const list = imagesByProperty.get(image.property_id) ?? [];
    if (list.length >= 2) return;
    list.push(image.url);
    imagesByProperty.set(image.property_id, list);
  });

  return {
    data: {
      version: STATE_VERSION,
      listings: mapPublicListingRows(rows, imagesByProperty),
      homeContent: {
        publicInventoryTotal: totalCount.count ?? rows.length,
        publicInventoryAvailable:
          availableCount.count ??
          rows.filter((property) => property.status === "disponible").length,
      } as InmoState["homeContent"],
    },
    source: "supabase",
  };
};

export const readPublicProperty = async (
  id: string
): Promise<RepositoryResult<{ listing: Listing | null }>> => {
  const fallbackListing = defaultState.listings.find((listing) => listing.id === id) ?? null;
  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) {
    return { data: { listing: fallbackListing }, source: "fallback" };
  }

  const property = await supabase
    .from("properties")
    .select(publicPropertyDetailSelect)
    .eq("id", id)
    .maybeSingle();

  if (property.error || !property.data) {
    if (property.error) {
      console.warn("Supabase public property read failed", property.error.message);
    }
    return { data: { listing: fallbackListing }, source: property.error ? "fallback" : "supabase" };
  }

  const propertyImages = await supabase
    .from("property_images")
    .select("url,sort_order")
    .eq("property_id", id)
    .order("sort_order");

  if (propertyImages.error) {
    console.warn("Supabase public property images read failed", propertyImages.error.message);
  }

  const row = property.data;
  if (!isPublicListingStatus(row.status)) {
    return { data: { listing: null }, source: "supabase" };
  }

  return {
    data: {
      listing: {
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
        images: propertyImages.error
          ? sanitizePublicImages(fallbackListing?.images ?? [], 1_500_000)
          : sanitizePublicImages(
              ensureArray(propertyImages.data).map((image) => image.url),
              1_500_000
            ),
        videos: sanitizeVideoUrls(row.videos),
        coverIndex: Number(row.cover_index ?? 0),
        agentId: row.agent_id ?? undefined,
        attributes: row.attributes ?? {},
      },
    },
    source: "supabase",
  };
};

export const readInmoState = async (
  options: ReadInmoStateOptions = {}
): Promise<RepositoryResult<InmoState>> => {
  const supabase = getSupabaseServerClient();
  if (!supabase || !isSupabaseConfigured()) {
    return { data: defaultState, source: "fallback" };
  }
  const isPublicScope = options.scope === "public";
  const adminMode = options.adminMode ?? "full";
  const needsClients = adminMode === "full";
  const needsFavorites = adminMode === "full";
  const needsLeads = adminMode === "full" || adminMode === "dashboard" || adminMode === "leads";
  const needsLeadEvents = adminMode === "full" || adminMode === "leads";
  const needsMetrics = adminMode === "full" || adminMode === "dashboard";
  const needsTokkoLogs = adminMode === "full" || adminMode === "dashboard";
  const needsNewsletter = adminMode === "full" || adminMode === "dashboard" || adminMode === "settings";
  const needsProperties =
    adminMode === "full" ||
    adminMode === "dashboard" ||
    adminMode === "properties" ||
    adminMode === "leads";
  const needsPropertyImages = adminMode === "full" || adminMode === "properties";
  const propertiesQuery = needsProperties
    ? supabase
        .from("properties")
        .select(
          "id,title,type,status,price,price_unit,currency,neighborhood,area,rooms,tag,highlight,description,videos,cover_index,agent_id,created_by_admin_id,attributes"
        )
        .order("updated_at", { ascending: false })
    : Promise.resolve({ data: null, error: null });

  const [
    settings,
    profiles,
    agents,
    clients,
    properties,
    favorites,
    leads,
    leadEvents,
    metrics,
    editorialPosts,
    newsletterSubscribers,
  ] = await Promise.all([
    supabase
      .from("platform_settings")
      .select("theme,home_content,filter_groups")
      .eq("id", SETTINGS_ID)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id,kind,name,email,password,role,phone,active"),
    supabase.from("agents").select("id,name,role,phone,email,photo"),
    isPublicScope || !needsClients
      ? Promise.resolve({ data: null, error: null })
      : supabase
          .from("clients")
          .select("id,name,email,password,phone,id_number,email_verified,verification_token,active"),
    propertiesQuery,
    isPublicScope || !needsFavorites
      ? Promise.resolve({ data: null, error: null })
      : supabase.from("property_favorites").select("id,client_id,property_id,created_at"),
    isPublicScope || !needsLeads
      ? Promise.resolve({ data: null, error: null })
      : supabase
          .from("leads")
          .select("id,name,email,phone,lead_type,property_id,agent_id,client_id,status,created_at,updated_at,notes,payload"),
    isPublicScope || !needsLeadEvents
      ? Promise.resolve({ data: null, error: null })
      : supabase
          .from("lead_events")
          .select("id,lead_id,from_status,to_status,note,created_at"),
    isPublicScope || !needsMetrics
      ? Promise.resolve({ data: null, error: null })
      : supabase
          .from("property_metrics")
          .select("id,property_id,views,leads,favorites,last_viewed_at"),
    supabase
      .from("editorial_posts")
      .select(
        "id,slug,title,excerpt,body,cover_image,category,meta_title,meta_description,published,published_at,created_at,updated_at"
      )
      .order("updated_at", { ascending: false }),
    isPublicScope || !needsNewsletter
      ? Promise.resolve({ data: null, error: null })
      : supabase
          .from("newsletter_subscribers")
          .select("id,email,name,active,created_at")
          .order("created_at", { ascending: false }),
  ]);
  const tokkoLogs = isPublicScope || !needsTokkoLogs
    ? { data: null, error: null }
    : await (async () => {
        const primaryTokkoLogs = await supabase
          .from("tokko_sync_logs")
          .select("*")
          .order("started_at", { ascending: false })
          .limit(20);
        return primaryTokkoLogs.error?.message.includes("tokko_sync_logs")
          ? supabase
              .from("tocco_sync_logs")
              .select("*")
              .order("started_at", { ascending: false })
              .limit(20)
          : primaryTokkoLogs;
      })();
  const propertyIds = ensureArray(properties.data).map((property) => property.id);
  const propertyImages = needsPropertyImages && propertyIds.length
    ? await supabase
        .from("property_images")
        .select("property_id,url,sort_order")
        .in("property_id", propertyIds)
        .lte("sort_order", 3)
        .order("sort_order")
    : { data: [], error: null };

  const readErrors = [
    ["profiles", profiles.error?.message],
    ["agents", agents.error?.message],
    ["clients", clients.error?.message],
    ["properties", properties.error?.message],
    ["property_images", propertyImages.error?.message],
    ["property_favorites", favorites.error?.message],
    ["leads", leads.error?.message],
    ["lead_events", leadEvents.error?.message],
    ["property_metrics", metrics.error?.message],
    ["editorial_posts", editorialPosts.error?.message],
    ["newsletter_subscribers", newsletterSubscribers.error?.message],
    ["tokko_sync_logs", tokkoLogs.error?.message],
  ].filter(([, error]) => error);

  if (settings.error) {
    console.warn("Supabase settings read failed", settings.error.message);
  }

  if (readErrors.length) {
    console.warn(
      "Supabase state read failed",
      readErrors.map(([table, error]) => `${table}: ${error}`).join(" | ")
    );
    return { data: defaultState, source: "fallback" };
  }

  const imagesByProperty = new Map<string, string[]>();
  const propertyImageRows = (propertyImages.data ?? []) as Array<{
    property_id: string;
    url: string;
  }>;
  propertyImageRows.forEach((image) => {
    const list = imagesByProperty.get(image.property_id) ?? [];
    list.push(image.url);
    imagesByProperty.set(image.property_id, list);
  });

  const incoming: Partial<InmoState> = {
    version: STATE_VERSION,
    theme: settings.error ? defaultState.theme : settings.data?.theme ?? defaultState.theme,
    homeContent: settings.error ? defaultState.homeContent : settings.data?.home_content ?? defaultState.homeContent,
    customPages: settings.error
      ? defaultState.customPages
      : settings.data?.home_content?.customPages ?? defaultState.customPages,
    filterGroups: settings.error ? defaultState.filterGroups : settings.data?.filter_groups ?? defaultState.filterGroups,
    adminUsers: ensureArray(profiles.data)
      .filter((profile) => profile.kind === "admin")
      .map((profile) => ({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        password: profile.password ?? "",
        role: normalizeAdminRole(profile.role),
        phone: profile.phone ?? "",
        active: Boolean(profile.active),
      })),
    agents: ensureArray(agents.data).map((agent) => ({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      phone: agent.phone,
      email: agent.email,
      photo: sanitizePublicImage(agent.photo, 260_000) || undefined,
    })),
    clientUsers: ensureArray(clients.data).map((client) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      password: client.password ?? "",
      phone: client.phone,
      idNumber: client.id_number ?? "",
      emailVerified: Boolean(client.email_verified),
      verificationToken: client.verification_token ?? undefined,
      active: Boolean(client.active),
    })),
    listings: ensureArray(properties.data).map((property) => ({
      id: property.id,
      title: property.title,
      createdByAdminId: property.created_by_admin_id ?? undefined,
      type: property.type as PropertyType,
      status: property.status as PropertyStatus,
      price: Number(property.price ?? 0),
      priceUnit: property.price_unit as PriceUnit,
      currency: (property.currency === "USD" ? "USD" : "ARS") as PriceCurrency,
      neighborhood: property.neighborhood,
      area: Number(property.area ?? 0),
      rooms: Number(property.rooms ?? 0),
      tag: property.tag ?? "",
      highlight: property.highlight ?? "",
      description: property.description ?? "",
      images: imagesByProperty.get(property.id) ?? [],
      videos: sanitizeVideoUrls(property.videos),
      coverIndex: Number(property.cover_index ?? 0),
      agentId: property.agent_id ?? undefined,
      attributes: property.attributes ?? {},
    })),
    propertyFavorites: ensureArray(favorites.data).map((favorite) => ({
      id: favorite.id,
      clientId: favorite.client_id,
      propertyId: favorite.property_id,
      createdAt: favorite.created_at,
    })),
    leads: ensureArray(leads.data).map((lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      leadType: (lead.lead_type ?? "tenant") as LeadType,
      propertyId: lead.property_id ?? undefined,
      agentId: lead.agent_id ?? undefined,
      clientId: lead.client_id ?? undefined,
      status: lead.status as LeadStatus,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      notes: lead.notes ?? undefined,
      payload: lead.payload ?? undefined,
    })),
    leadEvents: ensureArray(leadEvents.data).map((event) => ({
      id: event.id,
      leadId: event.lead_id,
      fromStatus: event.from_status ?? undefined,
      toStatus: event.to_status as LeadStatus,
      note: event.note ?? undefined,
      createdAt: event.created_at,
    })),
    propertyMetrics: ensureArray(metrics.data).map((metric) => ({
      id: metric.id,
      propertyId: metric.property_id,
      views: Number(metric.views ?? 0),
      leads: Number(metric.leads ?? 0),
      favorites: Number(metric.favorites ?? 0),
      lastViewedAt: metric.last_viewed_at ?? undefined,
    })),
    tokkoSyncLogs: ensureArray(tokkoLogs.data).map((log) => ({
      id: log.id,
      status: log.status,
      message: log.message,
      importedCount: Number(log.imported_count ?? 0),
      startedAt: log.started_at,
      finishedAt: log.finished_at,
    })),
    editorialPosts: ensureArray(editorialPosts.data).map(mapEditorialPostRow),
    newsletterSubscribers: ensureArray(newsletterSubscribers.data).map(
      mapNewsletterSubscriberRow
    ),
  };

  const merged = mergeState(defaultState, incoming);
  return {
    data: {
      ...merged,
      customPages: incoming.customPages ?? merged.customPages,
      listings: incoming.listings ?? [],
      agents: incoming.agents ?? [],
      clientUsers: incoming.clientUsers ?? [],
      propertyFavorites: incoming.propertyFavorites ?? [],
      leads: incoming.leads ?? [],
      leadEvents: incoming.leadEvents ?? [],
      propertyMetrics: incoming.propertyMetrics ?? [],
      tokkoSyncLogs: incoming.tokkoSyncLogs ?? [],
      editorialPosts: incoming.editorialPosts ?? [],
      newsletterSubscribers: incoming.newsletterSubscribers ?? [],
    },
    source: "supabase",
  };
};

export const writeInmoState = async (state: InmoState) => {
  const supabase = getSupabaseWriteClient();
  if (!supabase || !isSupabaseWriteConfigured()) {
    return { source: "fallback" as const };
  }

  const persistedHomeContent = {
    ...state.homeContent,
    customPages: state.customPages,
  };

  const settingsWithFilters = await supabase.from("platform_settings").upsert({
    id: SETTINGS_ID,
    theme: state.theme,
    home_content: persistedHomeContent,
    filter_groups: state.filterGroups,
    updated_at: new Date().toISOString(),
  });
  if (settingsWithFilters.error?.message.includes("filter_groups")) {
    assertSupabaseOk(
      await supabase.from("platform_settings").upsert({
        id: SETTINGS_ID,
        theme: state.theme,
        home_content: persistedHomeContent,
        updated_at: new Date().toISOString(),
      }),
      "upsert platform_settings"
    );
  } else {
    assertSupabaseOk(settingsWithFilters, "upsert platform_settings");
  }

  const existingAdminProfiles = await supabase
    .from("profiles")
    .select("id,password")
    .eq("kind", "admin");
  const existingPasswords = new Map(
    ensureArray(existingAdminProfiles.data).map((profile) => [
      profile.id,
      profile.password ?? "",
    ])
  );
  const adminRows = state.adminUsers.map((admin) => ({
    id: admin.id,
    kind: "admin",
    name: admin.name,
    email: admin.email,
    password: admin.password || existingPasswords.get(admin.id) || "",
    role: admin.role,
    phone: admin.role === "owner" ? admin.phone ?? "" : "",
    active: admin.active,
    updated_at: new Date().toISOString(),
  }));
  if (adminRows.length) {
    const profilesWithPhone = await supabase.from("profiles").upsert(adminRows);
    if (profilesWithPhone.error?.message.includes("phone")) {
      assertSupabaseOk(
        await supabase.from("profiles").upsert(adminRows.map(omitProfilePhone)),
        "upsert profiles"
      );
    } else {
      assertSupabaseOk(profilesWithPhone, "upsert profiles");
    }
  }

  if (state.agents.length) {
    assertSupabaseOk(await supabase.from("agents").upsert(
      state.agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        role: agent.role,
        phone: agent.phone,
        email: agent.email,
        photo: agent.photo ?? null,
        updated_at: new Date().toISOString(),
      }))
    ), "upsert agents");
  }

  if (state.clientUsers.length) {
    assertSupabaseOk(await supabase.from("clients").upsert(
      state.clientUsers.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        password: client.password,
        phone: client.phone,
        id_number: client.idNumber,
        email_verified: client.emailVerified,
        verification_token: client.verificationToken ?? null,
        active: client.active,
        updated_at: new Date().toISOString(),
      }))
    ), "upsert clients");
  }

  if (state.listings.length) {
    assertSupabaseOk(await supabase.from("properties").upsert(
      state.listings.map(toPropertyRow)
    ), "upsert properties");
  }

  const imageRows = state.listings.flatMap((property) =>
    toPropertyImageRows(property)
  );
  if (imageRows.length) {
    assertSupabaseOk(await supabase.from("property_images").upsert(imageRows), "upsert property_images");
  }

  if (state.propertyFavorites.length) {
    assertSupabaseOk(await supabase.from("property_favorites").upsert(
      state.propertyFavorites.map((favorite) => ({
        id: favorite.id,
        client_id: favorite.clientId,
        property_id: favorite.propertyId,
        created_at: favorite.createdAt,
      }))
    ), "upsert property_favorites");
  }

  if (state.leads.length) {
    assertSupabaseOk(await supabase.from("leads").upsert(
      state.leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        lead_type: lead.leadType ?? "tenant",
        property_id: lead.propertyId ?? null,
        agent_id: lead.agentId ?? null,
        client_id: lead.clientId ?? null,
        status: lead.status,
        notes: lead.notes ?? null,
        payload: lead.payload ?? {},
        created_at: lead.createdAt,
        updated_at: lead.updatedAt,
      }))
    ), "upsert leads");
  }

  if (state.editorialPosts.length) {
    assertSupabaseOk(
      await supabase.from("editorial_posts").upsert(state.editorialPosts.map(toEditorialPostRow)),
      "upsert editorial_posts"
    );
  }
  const existingEditorialPosts = await supabase.from("editorial_posts").select("id");
  if (!existingEditorialPosts.error) {
    const keepIds = new Set(state.editorialPosts.map((post) => post.id));
    const deleteIds = ensureArray(existingEditorialPosts.data)
      .map((post) => post.id)
      .filter((id) => !keepIds.has(id));
    if (deleteIds.length) {
      assertSupabaseOk(
        await supabase.from("editorial_posts").delete().in("id", deleteIds),
        "delete editorial_posts"
      );
    }
  }

  if (state.newsletterSubscribers.length) {
    assertSupabaseOk(
      await supabase
        .from("newsletter_subscribers")
        .upsert(state.newsletterSubscribers.map(toNewsletterSubscriberRow), {
          onConflict: "email",
        }),
      "upsert newsletter_subscribers"
    );
  }

  if (state.leadEvents.length) {
    assertSupabaseOk(await supabase.from("lead_events").upsert(
      state.leadEvents.map((event) => ({
        id: event.id,
        lead_id: event.leadId,
        from_status: event.fromStatus ?? null,
        to_status: event.toStatus,
        note: event.note ?? null,
        created_at: event.createdAt,
      }))
    ), "upsert lead_events");
  }

  if (state.propertyMetrics.length) {
    assertSupabaseOk(await supabase.from("property_metrics").upsert(
      state.propertyMetrics.map((metric) => ({
        id: metric.id,
        property_id: metric.propertyId,
        views: metric.views,
        leads: metric.leads,
        favorites: metric.favorites,
        last_viewed_at: metric.lastViewedAt ?? null,
      }))
    ), "upsert property_metrics");
  }

  if (state.tokkoSyncLogs.length) {
    const logRows = state.tokkoSyncLogs.map((log) => ({
      id: log.id,
      status: log.status,
      message: log.message,
      imported_count: log.importedCount,
      started_at: log.startedAt,
      finished_at: log.finishedAt,
    }));
    const logResult = await supabase.from("tokko_sync_logs").upsert(logRows);
    if (logResult.error?.message.includes("tokko_sync_logs")) {
      assertSupabaseOk(
        await supabase.from("tocco_sync_logs").upsert(logRows),
        "upsert tokko_sync_logs"
      );
    } else {
      assertSupabaseOk(logResult, "upsert tokko_sync_logs");
    }
  }

  clearResponseCache();
  return { source: "supabase" as const };
};

export const upsertEditorialPost = async (post: EditorialPost) => {
  const supabase = getSupabaseWriteClient();
  if (!supabase || !isSupabaseWriteConfigured()) {
    return { source: "fallback" as const };
  }

  assertSupabaseOk(
    await supabase.from("editorial_posts").upsert(toEditorialPostRow(post)),
    "upsert editorial post"
  );
  clearResponseCache();
  return { source: "supabase" as const };
};

export const deleteEditorialPost = async (postId: string) => {
  const supabase = getSupabaseWriteClient();
  if (!supabase || !isSupabaseWriteConfigured()) {
    return { source: "fallback" as const };
  }

  assertSupabaseOk(
    await supabase.from("editorial_posts").delete().eq("id", postId),
    "delete editorial post"
  );
  clearResponseCache();
  return { source: "supabase" as const };
};

export const upsertListing = async (property: Listing) => {
  const supabase = getSupabaseWriteClient();
  if (!supabase || !isSupabaseWriteConfigured()) {
    return { source: "fallback" as const };
  }

  assertSupabaseOk(
    await supabase.from("properties").upsert(toPropertyRow(property)),
    "upsert property"
  );

  assertSupabaseOk(
    await supabase.from("property_images").delete().eq("property_id", property.id),
    "replace property_images"
  );

  const imageRows = toPropertyImageRows(property);
  if (imageRows.length) {
    assertSupabaseOk(
      await supabase.from("property_images").insert(imageRows),
      "insert property_images"
    );
  }

  clearResponseCache();
  return { source: "supabase" as const };
};

export const deleteObsoleteTokkoListings = async (keepIds: string[]) => {
  const supabase = getSupabaseWriteClient();
  if (!supabase || !isSupabaseWriteConfigured()) {
    return { source: "fallback" as const };
  }
  if (!keepIds.length) {
    return { source: "supabase" as const, deletedCount: 0 };
  }

  const keepSet = new Set(keepIds);
  const existing = await supabase
    .from("properties")
    .select("id")
    .like("id", "tokko-%");
  assertSupabaseOk(existing, "select obsolete tokko properties");

  const obsoleteIds = ensureArray(existing.data)
    .map((property) => property.id)
    .filter((id) => typeof id === "string" && !keepSet.has(id));

  for (let index = 0; index < obsoleteIds.length; index += 100) {
    const chunk = obsoleteIds.slice(index, index + 100);
    if (chunk.length) {
      assertSupabaseOk(
        await supabase.from("property_images").delete().in("property_id", chunk),
        "delete obsolete tokko property_images"
      );
      assertSupabaseOk(
        await supabase.from("properties").delete().in("id", chunk),
        "delete obsolete tokko properties"
      );
    }
  }

  if (obsoleteIds.length) clearResponseCache();
  return { source: "supabase" as const, deletedCount: obsoleteIds.length };
};

export const deleteAllTokkoListings = async () => {
  const supabase = getSupabaseWriteClient();
  if (!supabase || !isSupabaseWriteConfigured()) {
    return { source: "fallback" as const };
  }

  const existing = await supabase
    .from("properties")
    .select("id")
    .like("id", "tokko-%");
  assertSupabaseOk(existing, "select tokko properties");

  const ids = ensureArray(existing.data)
    .map((property) => property.id)
    .filter((id): id is string => typeof id === "string");

  for (let index = 0; index < ids.length; index += 100) {
    const chunk = ids.slice(index, index + 100);
    if (!chunk.length) continue;
    assertSupabaseOk(
      await supabase.from("property_images").delete().in("property_id", chunk),
      "delete tokko property_images"
    );
    assertSupabaseOk(
      await supabase.from("properties").delete().in("id", chunk),
      "delete tokko properties"
    );
  }

  if (ids.length) clearResponseCache();
  return { source: "supabase" as const, deletedCount: ids.length };
};

export const deleteListing = async (propertyId: string) => {
  const supabase = getSupabaseWriteClient();
  if (!supabase || !isSupabaseWriteConfigured()) {
    return { source: "fallback" as const };
  }

  assertSupabaseOk(
    await supabase.from("properties").delete().eq("id", propertyId),
    "delete property"
  );

  clearResponseCache();
  return { source: "supabase" as const };
};
