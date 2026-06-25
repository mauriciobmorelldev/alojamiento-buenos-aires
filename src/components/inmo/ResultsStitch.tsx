"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInmoStore } from "@/lib/inmoStore";
import {
  propertyTypeLabels,
  type FilterGroup,
  type Listing,
  type PropertyType,
} from "@/lib/inmoData";
import { buildThemeStyles } from "@/lib/theme";
import { getAvailability } from "@/lib/availability";
import { formatPrice } from "@/lib/pricing";
import { InlineRealEstateLoader } from "@/components/inmo/RealEstateStatus";
import SiteFooter from "@/components/inmo/SiteFooter";

type PropertyTypeFilter = "all" | PropertyType;
type OperationFilter = "all" | "venta" | "alquiler";

const typeFilters: Array<{ id: PropertyTypeFilter; label: string }> = [
  { id: "all", label: "Todas" },
  { id: "tradicional", label: propertyTypeLabels.tradicional },
  { id: "temporario", label: propertyTypeLabels.temporario },
  { id: "pozo", label: propertyTypeLabels.pozo },
  { id: "listo", label: propertyTypeLabels.listo },
];

const getCoverImage = (images: string[], coverIndex: number) => {
  if (!images.length) return "";
  return images[coverIndex] ?? images[0];
};

const getPropertyAddress = (item: Listing) =>
  item.attributes.address?.find(Boolean) ??
  item.attributes.operation_address?.find(Boolean) ??
  item.attributes.operation_location?.find(Boolean) ??
  item.attributes.full_location?.find(Boolean) ??
  item.attributes.location?.find(Boolean) ??
  item.neighborhood;

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

export default function ResultsStitch() {
  const { state, isReady } = useInmoStore();
  const { filterGroups, theme, adminUsers } = state;

  const [query, setQuery] = useState("");
  const [type, setType] = useState<PropertyTypeFilter>("all");
  const [operation, setOperation] = useState<OperationFilter>("all");
  const [minRooms, setMinRooms] = useState("all");
  const [sort, setSort] = useState("featured");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [catalogListings, setCatalogListings] = useState<Listing[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 1,
  });
  const [attributeFilters, setAttributeFilters] = useState<
    Record<string, string[]>
  >({});
  const didMountFiltersRef = useRef(false);

  const themeStyles = buildThemeStyles(theme);
  const collaboratorAdminIds = new Set(
    adminUsers.filter((admin) => admin.role === "colaborador").map((admin) => admin.id)
  );
  const isCollaboratorListing = (createdByAdminId?: string) =>
    Boolean(createdByAdminId && collaboratorAdminIds.has(createdByAdminId));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incoming = params.get("operacion");
    const incomingPage = Number(params.get("page") ?? 1);
    if (Number.isFinite(incomingPage) && incomingPage > 1) {
      setPage(Math.floor(incomingPage));
    }
    if (incoming === "venta" || incoming === "alquiler") {
      const applyOperation = () => setOperation(incoming);
      if (typeof queueMicrotask === "function") {
        queueMicrotask(applyOperation);
        return;
      }
      window.setTimeout(applyOperation, 0);
    }
  }, []);

  useEffect(() => {
    if (!didMountFiltersRef.current) {
      didMountFiltersRef.current = true;
      return;
    }
    setPage(1);
  }, [attributeFilters, minRooms, operation, query, sort, type]);

  useEffect(() => {
    if (!isReady) return;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsCatalogLoading(true);
      setCatalogError("");
      try {
        const params = new URLSearchParams({
          mode: "catalog",
          page: String(page),
          pageSize: String(pagination.pageSize),
          q: query.trim(),
          type,
          operation,
          minRooms,
          sort,
        });
        const activeAttributes = Object.fromEntries(
          Object.entries(attributeFilters).filter(([, values]) => values.length)
        );
        if (Object.keys(activeAttributes).length) {
          params.set("attributes", JSON.stringify(activeAttributes));
        }
        const response = await fetch(`/api/public/listings?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          listings?: Listing[];
          pagination?: typeof pagination;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "No se pudo cargar el catálogo.");
        }
        setCatalogListings(payload.listings ?? []);
        setPagination((prev) => payload.pagination ?? prev);

        const nextUrl = new URL(window.location.href);
        if (page > 1) {
          nextUrl.searchParams.set("page", String(page));
        } else {
          nextUrl.searchParams.delete("page");
        }
        window.history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}`);
      } catch (error) {
        if (controller.signal.aborted) return;
        setCatalogListings([]);
        setCatalogError(error instanceof Error ? error.message : "No se pudo cargar el catálogo.");
      } finally {
        if (!controller.signal.aborted) setIsCatalogLoading(false);
      }
    }, query.trim() ? 260 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [
    attributeFilters,
    isReady,
    minRooms,
    operation,
    page,
    pagination.pageSize,
    query,
    sort,
    type,
  ]);

  const activeFilterCount = [
    query.trim() ? 1 : 0,
    operation !== "all" ? 1 : 0,
    type !== "all" ? 1 : 0,
    minRooms !== "all" ? 1 : 0,
    ...Object.values(attributeFilters).map((items) => items.length),
  ].reduce((acc, value) => acc + value, 0);

  const clearFilters = () => {
    setQuery("");
    setOperation("all");
    setType("all");
    setMinRooms("all");
    setAttributeFilters({});
    setSort("featured");
  };

  const filterContent = (
    <div className="space-y-8">
      <div className="lg:hidden">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
          Buscar
        </label>
        <div className="mt-3 flex items-center rounded-2xl bg-surface-container px-4 py-3 ghost-border">
          <span className="material-symbols-outlined mr-2 text-on-surface-variant">
            search
          </span>
          <input
            className="min-w-0 flex-1 border-none bg-transparent text-sm font-label focus:outline-none"
            placeholder="Barrio o propiedad"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
          Operación
        </label>
        <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3 lg:grid-cols-1">
          {[
            ["all", "Todas"],
            ["venta", "Comprar"],
            ["alquiler", "Alquilar"],
          ].map(([id, label]) => {
            const isActive = operation === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setOperation(id as OperationFilter)}
                className={`min-h-12 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  isActive
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-highest text-primary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
          Tipo de Propiedad
        </label>
        <div className="grid gap-2">
          {typeFilters.map((filter) => {
            const isActive = type === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setType(filter.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-outline-variant/25 bg-surface-container-lowest text-on-surface-variant hover:border-primary/50 hover:text-primary"
                }`}
              >
                <span className="font-label">
                  {filter.label}
                </span>
                {isActive ? (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
          Dormitorios
        </label>
        <div className="flex flex-wrap gap-2">
          {["all", "1", "2", "3", "4"].map((value) => {
            const label = value === "all" ? "Todos" : `${value}+`;
            const active = minRooms === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMinRooms(value)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold font-label ${
                  active
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-highest text-primary"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {filterGroups.map((group) => (
        <div key={group.id} className="space-y-4">
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">
            {group.label}
          </label>
          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const isActive = (attributeFilters[group.id] ?? []).includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    setAttributeFilters((prev) =>
                      toggleAttributeSelection(group, option, prev)
                    )
                  }
                  className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "border-primary bg-primary text-on-primary"
                      : "border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:border-primary/60 hover:text-primary"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <button
        className="w-full rounded-2xl bg-surface-container-highest py-4 text-sm font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-on-primary"
        type="button"
        onClick={clearFilters}
      >
        Limpiar Filtros
      </button>
    </div>
  );

  return (
    <div
      style={themeStyles}
      className="font-body selection:bg-primary-fixed selection:text-primary"
    >
      <main className="mx-auto min-h-screen max-w-screen-2xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-12">
          <aside className="hidden w-full flex-shrink-0 lg:block lg:w-80">
            <div className="h-full rounded-3xl bg-surface-container-lowest p-5 shadow-[0_30px_60px_-36px_rgba(27,54,93,0.32)]">
              <h3 className="mb-6 text-lg font-headline font-bold text-primary">
                Filtrar propiedades
              </h3>
              {filterContent}
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6 flex flex-col justify-between gap-5 sm:mb-10 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-3xl font-headline font-extrabold tracking-tight text-primary sm:text-4xl">
                  Propiedades Disponibles
                </h1>
                <p className="mt-2 font-label text-on-surface-variant">
                  {isCatalogLoading
                    ? "Cargando propiedades..."
                    : `Mostrando ${catalogListings.length} de ${pagination.total} propiedades`}
                </p>
              </div>
              <div className="grid gap-3 sm:flex sm:items-center sm:space-x-4">
                <div className="hidden min-w-72 items-center rounded-2xl bg-surface-container-lowest px-4 py-3 ghost-border lg:flex">
                  <span className="material-symbols-outlined mr-2 text-on-surface-variant">
                    search
                  </span>
                  <input
                    className="min-w-0 flex-1 border-none bg-transparent text-sm font-label focus:outline-none"
                    placeholder="Barrio o propiedad"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-xs font-bold uppercase tracking-widest text-on-primary lg:hidden"
                >
                  <span className="material-symbols-outlined text-base">tune</span>
                  Filtros
                  {activeFilterCount ? (
                    <span className="rounded-full bg-primary-fixed px-2 py-0.5 text-[10px] text-primary">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </button>
                <span className="hidden text-xs font-bold uppercase tracking-widest text-on-surface-variant sm:block">
                  Ordenar por:
                </span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="ghost-border w-full cursor-pointer appearance-none rounded-2xl bg-surface-container-lowest px-4 py-3 pr-10 text-sm font-semibold text-primary focus:border-primary focus:ring-primary sm:w-auto sm:px-6 sm:py-2.5 sm:pr-12"
                  >
                    <option value="featured">Recomendadas</option>
                    <option value="price-desc">Precio: Mayor a Menor</option>
                    <option value="price-asc">Precio: Menor a Mayor</option>
                  </select>
                  <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                    expand_more
                  </span>
                </div>
              </div>
            </div>

            {!isReady || isCatalogLoading ? (
              <InlineRealEstateLoader
                title="Cargando propiedades"
                message="Estamos consultando el catálogo disponible."
              />
            ) : catalogError ? (
              <div className="rounded-2xl bg-surface-container-lowest p-8 text-center editorial-shadow">
                <p className="text-xs uppercase tracking-widest text-error">
                  Error
                </p>
                <h3 className="mt-3 text-2xl font-headline font-semibold text-primary">
                  {catalogError}
                </h3>
              </div>
            ) : catalogListings.length === 0 ? (
              <div className="rounded-2xl bg-surface-container-lowest p-8 text-center editorial-shadow">
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">
                  Sin resultados
                </p>
                <h3 className="mt-3 text-2xl font-headline font-semibold text-primary">
                  No hay propiedades con esos filtros
                </h3>
              </div>
            ) : (
              <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-10">
                {catalogListings.map((item, index) => {
                  const cover = getCoverImage(item.images, item.coverIndex);
                  const availability = getAvailability(item.status);
                  const isFromCollaborator = isCollaboratorListing(item.createdByAdminId);
                  return (
                    <Link
                      key={item.id}
                      href={`/propiedades/${item.id}`}
                      className="group relative block overflow-hidden rounded-3xl bg-surface-container-lowest editorial-shadow transition-transform duration-500 hover:-translate-y-2"
                    >
                      <div className="relative h-64 overflow-hidden sm:h-80">
                        {cover ? (
                          <img
                            src={cover}
                            alt={item.title}
                            width={900}
                            height={720}
                            loading={index === 0 ? "eager" : "lazy"}
                            fetchPriority={index === 0 ? "high" : "auto"}
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-surface-container-low to-secondary/20" />
                        )}
                        <div className="absolute left-4 top-4 flex gap-2 sm:left-6 sm:top-6">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm ${availability.badgeClassName}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${availability.dotClassName}`} />
                            {availability.label}
                          </span>
                          {isFromCollaborator ? (
                            <span className="inline-flex items-center rounded-full border border-primary/15 bg-surface-container-lowest/90 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary shadow-sm">
                              Colaborador
                            </span>
                          ) : null}
                        </div>
                        <span className="absolute inset-x-4 bottom-4 rounded-2xl bg-surface-container-lowest/95 py-3 text-center text-sm font-bold text-primary shadow-[0_20px_40px_-30px_rgba(27,54,93,0.45)] sm:inset-x-6 sm:bottom-6 lg:hidden lg:group-hover:block">
                          Ver ficha completa
                        </span>
                      </div>
                      <div className="space-y-4 p-5 sm:p-6">
                        <div className="flex items-center justify-end text-xs uppercase tracking-widest text-on-surface-variant">
                          <span>{propertyTypeLabels[item.type]}</span>
                        </div>
                        <h3 className="text-xl font-headline font-bold text-primary">
                          {item.title}
                        </h3>
                        <p className="flex items-start gap-2 text-sm font-semibold leading-6 text-on-surface-variant">
                          <span className="material-symbols-outlined mt-0.5 text-base text-primary">
                            location_on
                          </span>
                          <span>{getPropertyAddress(item)}</span>
                        </p>
                        <p className="text-sm text-on-surface-variant">
                          {item.rooms} ambientes · {item.area} m²
                        </p>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-lg font-semibold text-primary">
                            {formatPrice(item.price, item.priceUnit, item.currency)}
                          </span>
                          <span className="text-sm font-semibold text-primary group-hover:text-primary-container">
                            Ver ficha →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
              {pagination.totalPages > 1 ? (
                <nav className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm font-bold text-primary transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <span className="material-symbols-outlined text-base">chevron_left</span>
                    Anterior
                  </button>
                  {Array.from({ length: pagination.totalPages })
                    .map((_, index) => index + 1)
                    .filter(
                      (itemPage) =>
                        itemPage === 1 ||
                        itemPage === pagination.totalPages ||
                        Math.abs(itemPage - pagination.page) <= 1
                    )
                    .map((itemPage, index, pages) => {
                      const previousPage = pages[index - 1];
                      const showGap = previousPage && itemPage - previousPage > 1;
                      return (
                        <span key={itemPage} className="inline-flex items-center gap-2">
                          {showGap ? (
                            <span className="px-1 text-sm font-bold text-on-surface-variant">
                              ...
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setPage(itemPage)}
                            className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-black transition ${
                              pagination.page === itemPage
                                ? "bg-primary text-on-primary"
                                : "bg-surface-container-lowest text-primary hover:bg-primary-fixed"
                            }`}
                          >
                            {itemPage}
                          </button>
                        </span>
                      );
                    })}
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() =>
                      setPage((prev) => Math.min(pagination.totalPages, prev + 1))
                    }
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline-variant/30 bg-surface-container-lowest px-4 py-2 text-sm font-bold text-primary transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Siguiente
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                  </button>
                </nav>
              ) : null}
              </>
            )}
          </div>
        </div>

        <div
          className={`fixed inset-0 z-[60] bg-primary/45 backdrop-blur-md transition-opacity duration-300 lg:hidden ${
            showFilters ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="absolute inset-0" onClick={() => setShowFilters(false)} />
          <div
            className={`absolute inset-x-3 bottom-3 max-h-[calc(100dvh-24px)] overflow-hidden rounded-[2rem] bg-surface-container-lowest shadow-[0_40px_80px_-28px_rgba(27,54,93,0.55)] transition-all duration-300 ${
              showFilters ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">
                  Catálogo
                </p>
                <h2 className="text-xl font-headline font-bold text-primary">
                  Filtros
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-primary"
                aria-label="Cerrar filtros"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <div className="max-h-[calc(100dvh-170px)] overflow-y-auto px-5 py-5">
              {filterContent}
            </div>
            <div className="border-t border-outline-variant/20 p-4">
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="w-full rounded-2xl bg-primary py-4 text-sm font-bold uppercase tracking-widest text-on-primary"
              >
                Ver {pagination.total} resultados
              </button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter cookiesOnly />
    </div>
  );
}
