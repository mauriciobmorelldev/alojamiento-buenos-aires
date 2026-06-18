"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getAvailability } from "@/lib/availability";
import {
  propertyTypeLabels,
  type FilterGroup,
  type PropertyType,
} from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";
import { formatPrice, getListingComparablePriceInArs } from "@/lib/pricing";
import { buildThemeStyles } from "@/lib/theme";

type PropertyTypeFilter = "all" | PropertyType;
type PropertyStatusFilter = "all" | "disponible" | "no-disponible";

const typeFilters: Array<{ id: PropertyTypeFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "tradicional", label: propertyTypeLabels.tradicional },
  { id: "temporario", label: propertyTypeLabels.temporario },
  { id: "pozo", label: propertyTypeLabels.pozo },
  { id: "listo", label: propertyTypeLabels.listo },
];

const statusFilters: Array<{ id: PropertyStatusFilter; label: string }> = [
  { id: "all", label: "Todos" },
  { id: "disponible", label: "Disponible" },
  { id: "no-disponible", label: "No disponible" },
];

const normalizeWhatsAppPhone = (value?: string) =>
  (value ?? "").replace(/[^\d]/g, "");

const coverImage = (images: string[], coverIndex: number) =>
  images[Math.min(Math.max(coverIndex, 0), Math.max(images.length - 1, 0))] ?? images[0] ?? "";

const toggleAttributeSelection = (
  group: FilterGroup,
  option: string,
  current: Record<string, string[]>
) => {
  const selected = current[group.id] ?? [];
  if (group.mode === "single") {
    return { ...current, [group.id]: selected[0] === option ? [] : [option] };
  }
  const exists = selected.includes(option);
  return {
    ...current,
    [group.id]: exists
      ? selected.filter((item) => item !== option)
      : [...selected, option],
  };
};

export default function CollaboratorPublicPage() {
  const params = useParams<{ id: string | string[] }>();
  const collaboratorId = Array.isArray(params?.id) ? params.id[0] : params?.id || "";
  const { state, isReady } = useInmoStore();
  const { adminUsers, filterGroups, listings, theme } = state;
  const [query, setQuery] = useState("");
  const [type, setType] = useState<PropertyTypeFilter>("all");
  const [status, setStatus] = useState<PropertyStatusFilter>("all");
  const [sort, setSort] = useState("featured");
  const [attributeFilters, setAttributeFilters] = useState<Record<string, string[]>>({});
  const themeStyles = buildThemeStyles(theme);
  const collaborator = adminUsers.find(
    (admin) => admin.id === collaboratorId && admin.role === "colaborador" && admin.active
  );
  const collaboratorListings = useMemo(
    () =>
      listings.filter(
        (listing) =>
          listing.createdByAdminId === collaboratorId &&
          listing.status !== "pausado"
      ),
    [collaboratorId, listings]
  );
  const properties = useMemo(() => {
    let items = [...collaboratorListings];
    const normalizedQuery = query.trim().toLowerCase();
    if (normalizedQuery) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.neighborhood.toLowerCase().includes(normalizedQuery) ||
          item.description.toLowerCase().includes(normalizedQuery)
      );
    }
    if (type !== "all") {
      items = items.filter((item) => item.type === type);
    }
    if (status === "disponible") {
      items = items.filter((item) => item.status === "disponible");
    }
    if (status === "no-disponible") {
      items = items.filter((item) => item.status !== "disponible");
    }
    items = items.filter((item) =>
      filterGroups.every((group) => {
        const selected = attributeFilters[group.id] ?? [];
        if (!selected.length) return true;
        const values = item.attributes[group.id] ?? [];
        return selected.every((option) => values.includes(option));
      })
    );
    if (sort === "price-asc") {
      items.sort(
        (a, b) =>
          getListingComparablePriceInArs(a, theme) -
          getListingComparablePriceInArs(b, theme)
      );
    }
    if (sort === "price-desc") {
      items.sort(
        (a, b) =>
          getListingComparablePriceInArs(b, theme) -
          getListingComparablePriceInArs(a, theme)
      );
    }
    return items;
  }, [
    attributeFilters,
    collaboratorListings,
    filterGroups,
    query,
    sort,
    status,
    theme,
    type,
  ]);
  const whatsappPhone = normalizeWhatsAppPhone(collaborator?.phone);

  if (!isReady) {
    return (
      <div style={themeStyles} className="min-h-screen bg-background px-5 py-8 text-on-background">
        <main className="mx-auto max-w-screen-2xl">
          <section className="rounded-[2rem] bg-primary/10 px-6 py-10 sm:px-10 lg:px-14">
            <div className="h-4 w-40 animate-pulse rounded-full bg-primary/15" />
            <div className="mt-5 h-12 max-w-lg animate-pulse rounded-2xl bg-primary/15" />
            <div className="mt-4 h-4 max-w-2xl animate-pulse rounded-full bg-primary/10" />
          </section>
          <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="overflow-hidden rounded-3xl bg-surface-container-lowest"
              >
                <div className="h-64 animate-pulse bg-surface-container-low" />
                <div className="space-y-3 p-6">
                  <div className="h-3 w-28 animate-pulse rounded-full bg-outline-variant/20" />
                  <div className="h-6 w-3/4 animate-pulse rounded-full bg-outline-variant/20" />
                  <div className="h-4 w-1/2 animate-pulse rounded-full bg-outline-variant/15" />
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
    );
  }

  if (!collaborator) {
    return (
      <div style={themeStyles} className="min-h-screen bg-background px-6 py-20 text-on-background">
        <main className="mx-auto max-w-screen-md text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
            Link no disponible
          </p>
          <h1 className="mt-4 text-3xl font-headline font-bold text-primary">
            Este catálogo no está activo
          </h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            El colaborador puede estar inactivo o el link no corresponde a un usuario habilitado.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-on-background">
      <main className="mx-auto max-w-screen-2xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="sticky top-0 z-20 border-b border-outline-variant/20 bg-background/95 py-4 backdrop-blur-xl">
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto_auto_auto] lg:items-end">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Buscar propiedades
              <div className="flex items-center rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 py-3">
                <span className="material-symbols-outlined mr-2 text-base text-on-surface-variant">
                  search
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-on-background outline-none placeholder:text-on-surface-variant/60"
                  placeholder="Título, barrio o descripción"
                />
              </div>
            </label>

            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Estado
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as PropertyStatusFilter)}
                className="h-12 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 text-sm font-semibold text-on-background outline-none focus:border-primary"
              >
                {statusFilters.map((filter) => (
                  <option key={filter.id} value={filter.id}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              Orden
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-12 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest px-4 text-sm font-semibold text-on-background outline-none focus:border-primary"
              >
                <option value="featured">Destacados</option>
                <option value="price-asc">Precio menor</option>
                <option value="price-desc">Precio mayor</option>
              </select>
            </label>

            <div className="rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-bold text-primary">
              {properties.length} de {collaboratorListings.length}
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {typeFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setType(filter.id)}
                className={`h-10 flex-shrink-0 rounded-full border px-4 text-xs font-bold uppercase tracking-widest transition ${
                  type === filter.id
                    ? "border-primary bg-primary text-on-primary"
                    : "border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary"
                }`}
                style={type === filter.id ? { color: "var(--color-on-primary)" } : undefined}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {filterGroups.length ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {filterGroups.flatMap((group) =>
                group.options.map((option) => {
                  const isActive = (attributeFilters[group.id] ?? []).includes(option);
                  return (
                    <button
                      key={`${group.id}-${option}`}
                      type="button"
                      onClick={() =>
                        setAttributeFilters((prev) =>
                          toggleAttributeSelection(group, option, prev)
                        )
                      }
                      className={`h-10 flex-shrink-0 rounded-full border px-4 text-xs font-bold uppercase tracking-widest transition ${
                        isActive
                          ? "border-secondary bg-secondary text-on-primary"
                          : "border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:border-secondary hover:text-secondary"
                      }`}
                      style={isActive ? { color: "var(--color-on-primary)" } : undefined}
                    >
                      {option}
                    </button>
                  );
                })
              )}
            </div>
          ) : null}
        </section>

        <section className="mt-8">
          {collaboratorListings.length === 0 ? (
            <div className="rounded-3xl bg-surface-container-lowest p-8 text-center">
              <h3 className="text-2xl font-headline font-bold text-primary">
                Todavía no hay propiedades publicadas
              </h3>
              <p className="mt-2 text-sm text-on-surface-variant">
                Cuando el colaborador cargue inmuebles, se van a mostrar acá.
              </p>
            </div>
          ) : properties.length === 0 ? (
            <div className="rounded-3xl bg-surface-container-lowest p-8 text-center">
              <h3 className="text-2xl font-headline font-bold text-primary">
                No hay propiedades con esos filtros
              </h3>
              <p className="mt-2 text-sm text-on-surface-variant">
                Probá ajustar la búsqueda, el estado o las características.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {properties.map((property) => {
                const cover = coverImage(property.images, property.coverIndex);
                const availability = getAvailability(property.status);
                const message = `Hola ${collaborator.name}, quiero consultar por ${property.title}.`;
                return (
                  <article
                    key={property.id}
                    className="overflow-hidden rounded-3xl bg-surface-container-lowest shadow-[0_34px_70px_-42px_rgba(27,54,93,0.45)]"
                  >
                    <div className="relative h-64 bg-surface-container-low">
                      {cover ? (
                        <img
                          src={cover}
                          alt={property.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/15 to-secondary/15" />
                      )}
                      <span
                        className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${availability.badgeClassName}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${availability.dotClassName}`} />
                        {availability.label}
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between text-xs uppercase tracking-widest text-on-surface-variant">
                        <span>{property.neighborhood}</span>
                        <span>{propertyTypeLabels[property.type]}</span>
                      </div>
                      <h3 className="mt-3 text-xl font-headline font-bold text-primary">
                        {property.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                        {property.rooms} ambientes · {property.area} m²
                      </p>
                      <p className="mt-4 text-2xl font-headline font-bold text-primary">
                        {formatPrice(property.price, property.priceUnit, property.currency)}
                      </p>
                      {property.description ? (
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-on-surface-variant">
                          {property.description}
                        </p>
                      ) : null}
                      {whatsappPhone ? (
                        <a
                          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-5 inline-flex w-full justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-on-primary"
                          style={{ color: "var(--color-on-primary)" }}
                        >
                          Consultar esta propiedad
                        </a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
