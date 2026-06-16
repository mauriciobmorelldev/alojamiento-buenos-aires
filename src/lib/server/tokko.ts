import type { InmoState, Listing, PriceCurrency, PriceUnit, PropertyStatus, TokkoSyncLog } from "@/lib/inmoData";
import {
  getSupabaseServerClient,
  getSupabaseWriteClient,
  isSupabaseConfigured,
  isSupabaseWriteConfigured,
} from "@/lib/supabase/server";

const SETTINGS_ID = "default";
const DEFAULT_TOKKO_BASE_URL = "https://www.tokkobroker.com/api/v1";

export type TokkoSettings = {
  baseUrl: string;
  apiKey?: string;
  syncSecret?: string;
  autoSyncEnabled: boolean;
  lastTestedAt?: string;
};

export type PublicTokkoSettings = Omit<TokkoSettings, "apiKey"> & {
  hasApiKey: boolean;
};

type TokkoRemoteProperty = Record<string, unknown>;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const firstString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      const nested = firstString(
        record["es-AR"],
        record.es,
        record.es_ar,
        record.value,
        record.text,
        record.description
      );
      if (nested) return nested;
    }
  }
  return "";
};

const cleanDescription = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const firstNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^\d.-]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
};

const normalizeCurrency = (value: unknown): PriceCurrency => {
  const currency = firstString(value).toUpperCase();
  return currency.includes("ARS") || currency.includes("PES") ? "ARS" : "USD";
};

const normalizeStatus = (value: unknown): PropertyStatus => {
  const status = firstString(value).toLowerCase();
  if (status.includes("vend") || status.includes("alquil")) return "vendido";
  if (status.includes("reserv")) return "reservado";
  if (status.includes("paus") || status.includes("suspend")) return "pausado";
  return "disponible";
};

const normalizePriceUnit = (operation: string): PriceUnit => {
  const normalized = operation.toLowerCase();
  if (normalized.includes("alquiler temporario") || normalized.includes("temporary")) return "noche";
  if (normalized.includes("alquiler") || normalized.includes("rent")) return "mensual";
  return "venta";
};

const extractImages = (item: TokkoRemoteProperty) => {
  const photos = asArray(item.photos ?? item.images ?? item.pictures);
  return photos
    .map((photo) => {
      if (typeof photo === "string") return photo;
      const image = asRecord(photo);
      return firstString(image.image, image.original, image.url, image.thumbnail);
    })
    .filter(Boolean);
};

const extractOperation = (item: TokkoRemoteProperty) => {
  const operations = asArray(item.operations);
  const operation = asRecord(operations[0]);
  const operationType = asRecord(operation.operation_type);
  const prices = asArray(operation.prices);
  const price = asRecord(prices[0]);
  return {
    label: firstString(operationType.name, operation.type, item.operation, item.operation_type),
    price: firstNumber(price.price, price.amount, item.web_price, item.price),
    currency: normalizeCurrency(firstString(price.currency, item.currency)),
  };
};

const extractAttributeValue = (item: TokkoRemoteProperty, code: string) => {
  const attributes = asArray(item.attributes);
  const match = attributes
    .map((attribute) => asRecord(attribute))
    .find((attribute) => firstString(attribute.code).toLowerCase() === code.toLowerCase());
  return match?.value;
};

const extractDescription = (item: TokkoRemoteProperty) => {
  const direct = firstString(
    item.description,
    item.description_only,
    item.description_es,
    item.description_es_ar,
    item.publication_description,
    item.rich_description,
    item.web_description,
    item.portal_description,
    item.long_description,
    item.observations,
    item.publication_text
  );
  if (direct) return cleanDescription(direct);

  const attributesDescription = firstString(
    extractAttributeValue(item, "description"),
    extractAttributeValue(item, "publication_description"),
    extractAttributeValue(item, "web_description")
  );
  if (attributesDescription) return cleanDescription(attributesDescription);

  const customTags = asArray(item.custom_tags);
  const tagDescription = customTags
    .map((tag) => {
      const record = asRecord(tag);
      return firstString(record.description, record.text, record.value);
    })
    .find(Boolean);
  return cleanDescription(tagDescription ?? "");
};

const extractNeighborhood = (item: TokkoRemoteProperty) => {
  const location = asRecord(item.location);
  return firstString(
    location.short_location,
    location.name,
    location.neighborhood,
    item.neighborhood,
    item.location
  ) || "Sin barrio";
};

const normalizeTokkoProperty = (item: TokkoRemoteProperty): Listing => {
  const id = firstString(item.id, item.reference_code, item.code) || `${Date.now()}`;
  const operation = extractOperation(item);
  const surface = firstNumber(
    item.total_surface,
    item.surface,
    item.roofed_surface,
    item.area,
    extractAttributeValue(item, "total_surface"),
    extractAttributeValue(item, "roofed_surface")
  );
  const description = extractDescription(item);

  return {
    id: `tokko-${id}`,
    title:
      firstString(item.publication_title, item.title, item.name, item.address) ||
      "Propiedad importada desde Tokko",
    type: operation.label.toLowerCase().includes("tempor") ? "temporario" : "tradicional",
    status: normalizeStatus(item.status),
    price: operation.price,
    priceUnit: normalizePriceUnit(operation.label),
    currency: operation.currency,
    neighborhood: extractNeighborhood(item),
    area: surface,
    rooms:
      firstNumber(
        item.room_amount,
        item.rooms,
        item.suite_amount,
        extractAttributeValue(item, "room_amount")
      ) || 1,
    tag: "Tokko",
    highlight: "Sincronizada desde Tokko",
    description,
    images: extractImages(item),
    videos: [],
    coverIndex: 0,
    attributes: {},
  };
};

const createLog = ({
  status,
  message,
  importedCount,
  startedAt,
}: {
  status: TokkoSyncLog["status"];
  message: string;
  importedCount: number;
  startedAt: string;
}): TokkoSyncLog => ({
  id: `tokko-log-${Date.now()}`,
  status,
  message,
  importedCount,
  startedAt,
  finishedAt: new Date().toISOString(),
});

const normalizeSettings = (value: unknown): TokkoSettings => {
  const config = asRecord(value);
  return {
    baseUrl:
      firstString(config.baseUrl, config.base_url, process.env.TOKKO_API_BASE_URL) ||
      DEFAULT_TOKKO_BASE_URL,
    apiKey: firstString(config.apiKey, config.api_key, process.env.TOKKO_API_KEY) || undefined,
    syncSecret:
      firstString(config.syncSecret, config.sync_secret, process.env.TOKKO_SYNC_SECRET) ||
      undefined,
    autoSyncEnabled: Boolean(config.autoSyncEnabled ?? config.auto_sync_enabled ?? false),
    lastTestedAt: firstString(config.lastTestedAt, config.last_tested_at) || undefined,
  };
};

export const toPublicTokkoSettings = (settings: TokkoSettings): PublicTokkoSettings => ({
  baseUrl: settings.baseUrl,
  syncSecret: settings.syncSecret,
  autoSyncEnabled: settings.autoSyncEnabled,
  lastTestedAt: settings.lastTestedAt,
  hasApiKey: Boolean(settings.apiKey),
});

export const readTokkoSettings = async (): Promise<TokkoSettings> => {
  const fallback = normalizeSettings({});
  if (!isSupabaseConfigured()) return fallback;
  const supabase = getSupabaseServerClient();
  if (!supabase) return fallback;
  const result = await supabase
    .from("platform_settings")
    .select("tokko_config")
    .eq("id", SETTINGS_ID)
    .maybeSingle();
  if (result.error) return fallback;
  return normalizeSettings(result.data?.tokko_config);
};

export const writeTokkoSettings = async (incoming: Partial<TokkoSettings> & { clearApiKey?: boolean }) => {
  if (!isSupabaseWriteConfigured()) {
    throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para guardar la configuración de Tokko.");
  }
  const supabase = getSupabaseWriteClient();
  if (!supabase) throw new Error("Supabase no está configurado.");
  const current = await readTokkoSettings();
  const next: TokkoSettings = {
    ...current,
    ...incoming,
    apiKey: incoming.clearApiKey ? undefined : incoming.apiKey?.trim() || current.apiKey,
    baseUrl: incoming.baseUrl?.trim() || DEFAULT_TOKKO_BASE_URL,
    syncSecret: incoming.syncSecret?.trim() || current.syncSecret,
    autoSyncEnabled: Boolean(incoming.autoSyncEnabled),
  };
  const result = await supabase.from("platform_settings").upsert({
    id: SETTINGS_ID,
    tokko_config: next,
    updated_at: new Date().toISOString(),
  });
  if (result.error) throw new Error(`Guardar Tokko: ${result.error.message}`);
  return next;
};

const TOKKO_PAGE_SIZE = 100;
const TOKKO_MAX_PAGES = 50;

const buildTokkoPropertyUrl = (settings: TokkoSettings, limit = 50, offset = 0) => {
  const cleanBase = (settings.baseUrl || DEFAULT_TOKKO_BASE_URL).replace(/\/$/, "");
  const isFreePortal = cleanBase.includes("/freeportals");
  const endpoint = isFreePortal || cleanBase.endsWith("/property") || cleanBase.endsWith("/property/")
    ? cleanBase
    : `${cleanBase}/property/`;
  const url = new URL(endpoint);
  if (settings.apiKey) {
    url.searchParams.set(isFreePortal ? "api_key" : "key", settings.apiKey);
  }
  url.searchParams.set("format", "json");
  if (isFreePortal) url.searchParams.set("lang", "es-AR");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  return url.toString();
};

const fetchTokkoProperties = async (settings: TokkoSettings, limit = 50) => {
  if (!settings.apiKey) {
    throw new Error("Falta API key de Tokko.");
  }
  const response = await fetch(buildTokkoPropertyUrl(settings, limit, 0), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Tokko respondió ${response.status}`);
  }
  const payload = await response.json() as unknown;
  const record = asRecord(payload);
  const items = asArray(record.objects ?? record.properties ?? record.results ?? payload);
  return items.map((item) => asRecord(item));
};

const fetchAllTokkoProperties = async (settings: TokkoSettings) => {
  if (!settings.apiKey) {
    throw new Error("Falta API key de Tokko.");
  }
  const allItems: TokkoRemoteProperty[] = [];
  let offset = 0;
  for (let page = 0; page < TOKKO_MAX_PAGES; page += 1) {
    const response = await fetch(buildTokkoPropertyUrl(settings, TOKKO_PAGE_SIZE, offset), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Tokko respondió ${response.status}`);
    }
    const payload = await response.json() as unknown;
    const record = asRecord(payload);
    const meta = asRecord(record.meta);
    const items = asArray(record.objects ?? record.properties ?? record.results ?? payload)
      .map((item) => asRecord(item));
    allItems.push(...items);

    const next = typeof meta.next === "string" ? meta.next : "";
    if (!next && items.length < TOKKO_PAGE_SIZE) break;
    offset += TOKKO_PAGE_SIZE;
  }
  return allItems;
};

export const testTokkoConnection = async () => {
  const settings = await readTokkoSettings();
  const objects = await fetchTokkoProperties(settings, 1);
  const tested = await writeTokkoSettings({ ...settings, lastTestedAt: new Date().toISOString() });
  return {
    settings: tested,
    sampleCount: objects.length,
  };
};

export const syncTokkoProperties = async (state: InmoState): Promise<InmoState> => {
  const startedAt = new Date().toISOString();
  const settings = await readTokkoSettings();

  if (!settings.apiKey) {
    return {
      ...state,
      tokkoSyncLogs: [
        createLog({
          status: "mocked",
          message: "Sin API key Tokko. Se registró la sincronización sin modificar propiedades.",
          importedCount: 0,
          startedAt,
        }),
        ...state.tokkoSyncLogs,
      ],
    };
  }

  try {
    const imported = (await fetchAllTokkoProperties(settings)).map(normalizeTokkoProperty);
    const importedIds = new Set(imported.map((property) => property.id));
    const localWithoutImported = state.listings.filter(
      (property) => !importedIds.has(property.id)
    );

    return {
      ...state,
      listings: [...localWithoutImported, ...imported],
      tokkoSyncLogs: [
        createLog({
          status: "success",
          message: "Sincronización Tokko completada.",
          importedCount: imported.length,
          startedAt,
        }),
        ...state.tokkoSyncLogs,
      ],
    };
  } catch (error) {
    return {
      ...state,
      tokkoSyncLogs: [
        createLog({
          status: "failed",
          message: error instanceof Error ? error.message : "Error desconocido en Tokko.",
          importedCount: 0,
          startedAt,
        }),
        ...state.tokkoSyncLogs,
      ],
    };
  }
};
