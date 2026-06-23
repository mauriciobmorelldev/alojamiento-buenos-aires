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

const readField = (record: Record<string, unknown>, key: string) => {
  if (key in record) return record[key];
  const normalizedKey = key.toLowerCase().replace(/[_-]/g, "");
  const match = Object.keys(record).find(
    (current) => current.toLowerCase().replace(/[_-]/g, "") === normalizedKey
  );
  return match ? record[match] : undefined;
};

const firstString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      const nested = firstString(
        record.id,
        record.code,
        record.name,
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

const descriptionKeyPattern = /(description|descripcion|observations|remarks|publication_text|web_text)/i;

const findNestedDescription = (value: unknown, depth = 0): string => {
  if (depth > 5) return "";
  if (!value || typeof value !== "object") return "";
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findNestedDescription(item, depth + 1);
      if (found) return found;
    }
    return "";
  }

  const record = value as Record<string, unknown>;
  const prioritizedKeys = Object.keys(record).filter((key) => descriptionKeyPattern.test(key));
  for (const key of prioritizedKeys) {
    const current = record[key];
    const found = typeof current === "string"
      ? cleanDescription(current)
      : findNestedDescription(current, depth + 1);
    if (found) return found;
  }
  for (const key of Object.keys(record)) {
    if (["photos", "images", "pictures", "operations", "prices"].includes(key)) continue;
    if (typeof record[key] !== "object") continue;
    const found = findNestedDescription(record[key], depth + 1);
    if (found) return found;
  }
  return "";
};

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

const collectStatusValues = (...values: unknown[]): string[] => {
  const collected: string[] = [];
  const visit = (value: unknown, depth = 0) => {
    if (depth > 3 || value == null) return;
    if (typeof value === "string" && value.trim()) {
      collected.push(value.trim());
      return;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      collected.push(String(value));
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      [
        "id",
        "code",
        "status",
        "name",
        "label",
        "value",
        "text",
        "description",
        "es",
        "es_ar",
        "es-AR",
      ].forEach((key) => visit(readField(record, key), depth + 1));
    }
  };
  values.forEach((value) => visit(value));
  return [...new Set(collected)];
};

const normalizeStatus = (...values: unknown[]): PropertyStatus => {
  const candidates = collectStatusValues(...values);
  const normalized = candidates.map((value) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
  );
  const numericStatuses = normalized
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  const hasText = (...needles: string[]) =>
    normalized.some((value) => needles.some((needle) => value.includes(needle)));

  if (numericStatuses.includes(1) || hasText("cotizar", "tasacion", "tasar")) {
    return "tasacion";
  }
  if (
    numericStatuses.includes(4) ||
    hasText("no disponible", "indisponible", "inactivo", "inactive")
  ) {
    return "no_disponible";
  }
  if (numericStatuses.includes(3) || hasText("reserv")) return "reservado";
  if (hasText("paus", "suspend")) return "pausado";
  if (hasText("vend", "alquilad")) return "vendido";
  return "disponible";
};

const normalizePriceUnit = (operation: string): PriceUnit => {
  const normalized = operation.toLowerCase();
  if (normalized === "1") return "venta";
  if (normalized === "2") return "mensual";
  if (normalized === "3") return "noche";
  if (normalized.includes("alquiler temporario") || normalized.includes("temporary")) return "noche";
  if (normalized.includes("alquiler") || normalized.includes("rent")) return "mensual";
  if (normalized.includes("venta") || normalized.includes("sale")) return "venta";
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
    label: firstString(
      operationType.name,
      operation.name,
      operation.type,
      item.operation,
      item.operation_type,
      item.operation_category
    ),
    price: firstNumber(price.price, price.amount, item.web_price, item.operation_amount, item.price),
    currency: normalizeCurrency(
      firstString(price.currency, item.operation_currency, item.currency, item.operation_currency_description)
    ),
  };
};

const extractAttributeValue = (item: TokkoRemoteProperty, code: string) => {
  const attributes = asArray(readField(item, "attributes"));
  const match = attributes
    .map((attribute) => asRecord(attribute))
    .find((attribute) => {
      const keys = [
        firstString(readField(attribute, "code")),
        firstString(readField(attribute, "name")),
        firstString(readField(attribute, "label")),
        firstString(readField(attribute, "id")),
      ].map((value) => value.toLowerCase().replace(/[_\s-]/g, ""));
      return keys.includes(code.toLowerCase().replace(/[_\s-]/g, ""));
    });
  return match ? readField(match, "value") : undefined;
};

const extractStatusValues = (item: TokkoRemoteProperty) => [
  readField(item, "status"),
  readField(item, "status_id"),
  readField(item, "status_code"),
  readField(item, "status_name"),
  readField(item, "status_choice"),
  readField(item, "status_choices"),
  readField(item, "property_status"),
  readField(item, "property_status_id"),
  readField(item, "property_status_choice"),
  readField(item, "publication_status"),
  readField(item, "publication_status_id"),
  readField(item, "publication_status_choice"),
  readField(item, "web_status"),
  readField(item, "availability"),
  extractAttributeValue(item, "status"),
  extractAttributeValue(item, "status_choice"),
  extractAttributeValue(item, "status_choices"),
  extractAttributeValue(item, "statuschoices"),
  extractAttributeValue(item, "STATUS_CHOICES"),
  extractAttributeValue(item, "property_status"),
  extractAttributeValue(item, "property_status_choice"),
  extractAttributeValue(item, "publication_status"),
  extractAttributeValue(item, "publication_status_choice"),
  extractAttributeValue(item, "availability"),
];

const extractDescription = (item: TokkoRemoteProperty) => {
  const direct = firstString(
    item.description,
    item.descripcion,
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

  const extraAttributesDescription = asArray(item.extra_attributes)
    .map((attribute) => {
      const record = asRecord(attribute);
      const name = firstString(record.name).toLowerCase();
      if (!name.includes("descrip")) return "";
      return firstString(record.value);
    })
    .find(Boolean);
  if (extraAttributesDescription) return cleanDescription(extraAttributesDescription);

  const customTags = asArray(item.custom_tags);
  const tagDescription = customTags
    .map((tag) => {
      const record = asRecord(tag);
      return firstString(record.description, record.text, record.value);
    })
    .find(Boolean);
  return cleanDescription(tagDescription ?? "") || findNestedDescription(item);
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
  const tokkoSku = firstString(item.tokko_id, item.publication_id, item.reference_code, item.id, item.code);
  const id = firstString(item.id, item.reference_code, item.code, item.tokko_id, item.publication_id) || `${Date.now()}`;
  const operation = extractOperation(item);
  const location = asRecord(item.location);
  const address = firstString(
    item.address,
    item.operation_address,
    item.full_address,
    extractAttributeValue(item, "address")
  );
  const operationLocation = firstString(
    item.operation_location,
    location.full_location,
    location.short_location,
    location.name,
    item.location
  );
  const surface = firstNumber(
    item.total_surface,
    item.surface,
    item.roofed_surface,
    item.area,
    extractAttributeValue(item, "total_surface"),
    extractAttributeValue(item, "roofed_surface")
  );
  const description = extractDescription(item);
  const statusValues = extractStatusValues(item);
  const normalizedStatus = normalizeStatus(...statusValues);
  const tokkoStatus = collectStatusValues(...statusValues).join(" | ");

  return {
    id: `tokko-${id}`,
    title:
      firstString(item.publication_title, item.title, item.name, item.address) ||
      "Propiedad importada",
    type: operation.label.toLowerCase().includes("tempor") ? "temporario" : "tradicional",
    status: normalizedStatus,
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
    tag: "",
    highlight: "",
    description,
    images: extractImages(item),
    videos: [],
    coverIndex: 0,
    attributes: {
      ...(tokkoSku ? { tokko_sku: [tokkoSku] } : {}),
      ...(firstString(item.tokko_id) ? { tokko_id: [firstString(item.tokko_id)] } : {}),
      ...(firstString(item.publication_id) ? { publication_id: [firstString(item.publication_id)] } : {}),
      ...(firstString(item.reference_code) ? { reference_code: [firstString(item.reference_code)] } : {}),
      ...(address ? { address: [address] } : {}),
      ...(operationLocation ? { operation_location: [operationLocation] } : {}),
      ...(firstString(location.name) ? { location: [firstString(location.name)] } : {}),
      ...(firstString(item.resource_uri) ? { resource_uri: [firstString(item.resource_uri)] } : {}),
      ...(firstString(item.public_url) ? { public_url: [firstString(item.public_url)] } : {}),
      ...(firstString(item.last_modification) ? { last_modification: [firstString(item.last_modification)] } : {}),
      ...(tokkoStatus ? { tokko_status: [tokkoStatus] } : {}),
    },
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
  const baseUrl = firstString(config.baseUrl, config.base_url, process.env.TOKKO_API_BASE_URL);
  const normalizedBaseUrl = baseUrl.includes("/freeportals")
    ? DEFAULT_TOKKO_BASE_URL
    : baseUrl || DEFAULT_TOKKO_BASE_URL;
  return {
    baseUrl: normalizedBaseUrl,
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

const TOKKO_PAGE_SIZE = 500;
const TOKKO_MAX_PAGES = 50;

const buildTokkoPropertyUrl = (settings: TokkoSettings, limit = 50, offset = 0) => {
  const cleanBase = (settings.baseUrl || DEFAULT_TOKKO_BASE_URL).replace(/\/$/, "");
  const endpoint = cleanBase.endsWith("/property") || cleanBase.endsWith("/property/")
    ? cleanBase
    : `${cleanBase}/property/`;
  const url = new URL(endpoint);
  if (settings.apiKey) {
    url.searchParams.set("key", settings.apiKey);
  }
  url.searchParams.set("lang", "es_ar");
  url.searchParams.set("format", "json");
  url.searchParams.set("filtered_attributes", "true");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  return url.toString();
};

const addTokkoAuthParams = (url: URL, settings: TokkoSettings) => {
  if (settings.apiKey) {
    url.searchParams.set("key", settings.apiKey);
  }
  url.searchParams.set("lang", "es_ar");
  url.searchParams.set("format", "json");
  url.searchParams.set("filtered_attributes", "true");
};

const buildTokkoPropertyDetailUrl = (settings: TokkoSettings, item: TokkoRemoteProperty) => {
  const cleanBase = (settings.baseUrl || DEFAULT_TOKKO_BASE_URL).replace(/\/$/, "");
  const resourceUri = firstString(item.resource_uri, item.resourceUri, item.url);
  const id = firstString(item.id, item.tokko_id);
  let url: URL | null = null;

  if (resourceUri) {
    url = resourceUri.startsWith("http")
      ? new URL(resourceUri)
      : new URL(resourceUri, cleanBase.includes("/api/") ? "https://www.tokkobroker.com" : `${cleanBase}/`);
  } else if (id) {
    const endpoint = cleanBase.endsWith("/property")
      ? `${cleanBase}/${id}/`
      : cleanBase.endsWith("/property/")
        ? `${cleanBase}${id}/`
        : `${cleanBase}/property/${id}/`;
    url = new URL(endpoint);
  }

  if (!url) return "";
  addTokkoAuthParams(url, settings);
  return url.toString();
};

const fetchTokkoPropertyDetail = async (
  settings: TokkoSettings,
  item: TokkoRemoteProperty
) => {
  const detailUrl = buildTokkoPropertyDetailUrl(settings, item);
  if (!detailUrl) return item;
  const response = await fetch(detailUrl, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) return item;
  const payload = await response.json() as unknown;
  const record = asRecord(payload);
  const detail = asRecord(
    record.object ??
    record.property ??
    record.data ??
    record.result ??
    payload
  );
  return {
    ...item,
    ...detail,
  };
};

const hydrateTokkoPropertyDetails = async (
  settings: TokkoSettings,
  items: TokkoRemoteProperty[]
) => {
  const hydrated: TokkoRemoteProperty[] = [];
  const batchSize = 6;
  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const details = await Promise.all(
      batch.map((item) =>
        extractDescription(item) ? Promise.resolve(item) : fetchTokkoPropertyDetail(settings, item)
      )
    );
    hydrated.push(...details);
  }
  return hydrated;
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
  return hydrateTokkoPropertyDetails(settings, items.map((item) => asRecord(item)));
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
  return hydrateTokkoPropertyDetails(settings, allItems);
};

export const testTokkoConnection = async () => {
  const settings = await readTokkoSettings();
  const objects = await fetchTokkoProperties(settings, 1);
  const sample = objects[0] ? normalizeTokkoProperty(objects[0]) : null;
  const tested = await writeTokkoSettings({ ...settings, lastTestedAt: new Date().toISOString() });
  return {
    settings: tested,
    sampleCount: objects.length,
    sampleTitle: sample?.title ?? "",
    sampleHasDescription: Boolean(sample?.description),
    sampleDescriptionLength: sample?.description.length ?? 0,
  };
};

export const auditTokkoDescriptions = async () => {
  const settings = await readTokkoSettings();
  const objects = await fetchAllTokkoProperties(settings);
  const normalized = objects.map(normalizeTokkoProperty);
  const withDescription = normalized.filter((property) => property.description.trim());
  const withoutDescription = normalized.filter((property) => !property.description.trim());
  const statusCounts = normalized.reduce<Record<string, number>>((acc, property) => {
    acc[property.status] = (acc[property.status] ?? 0) + 1;
    return acc;
  }, {});
  const statusSamples = normalized.slice(0, 30).map((property) => ({
    id: property.id,
    title: property.title,
    status: property.status,
    tokkoStatus: property.attributes.tokko_status?.[0] ?? "",
  }));

  return {
    total: normalized.length,
    withDescription: withDescription.length,
    withoutDescription: withoutDescription.length,
    statusCounts,
    statusSamples,
    samplesWithDescription: withDescription.slice(0, 5).map((property) => ({
      id: property.id,
      title: property.title,
      descriptionLength: property.description.length,
      descriptionPreview:
        property.description.length > 220
          ? `${property.description.slice(0, 220).trim()}...`
          : property.description,
    })),
    samplesWithoutDescription: withoutDescription.slice(0, 5).map((property) => ({
      id: property.id,
      title: property.title,
    })),
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
    if (!imported.length) {
      return {
        ...state,
        tokkoSyncLogs: [
          createLog({
            status: "failed",
            message: "Tokko respondió 0 propiedades. No se modificó el inventario para evitar borrar publicaciones existentes.",
            importedCount: 0,
            startedAt,
          }),
          ...state.tokkoSyncLogs,
        ],
      };
    }
    const previousById = new Map(state.listings.map((property) => [property.id, property]));
    const importedWithLocalFlags = imported.map((property) => {
      const previous = previousById.get(property.id);
      if (!previous?.attributes.pinned_home?.includes("true")) return property;
      return {
        ...property,
        attributes: {
          ...property.attributes,
          pinned_home: ["true"],
        },
      };
    });
    const importedIds = new Set(importedWithLocalFlags.map((property) => property.id));
    const localWithoutImported = state.listings.filter(
      (property) => !property.id.startsWith("tokko-") && !importedIds.has(property.id)
    );
    const statusCounts = importedWithLocalFlags.reduce<Record<string, number>>(
      (acc, property) => {
        acc[property.status] = (acc[property.status] ?? 0) + 1;
        return acc;
      },
      {}
    );
    const statusSummary = Object.entries(statusCounts)
      .map(([status, count]) => `${status}: ${count}`)
      .join(" · ");

    return {
      ...state,
      listings: [...localWithoutImported, ...importedWithLocalFlags],
      tokkoSyncLogs: [
        createLog({
          status: "success",
          message: `Sincronización Tokko completada. Estados: ${statusSummary || "sin datos"}.`,
          importedCount: importedWithLocalFlags.length,
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
