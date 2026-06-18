"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { getAvailability } from "@/lib/availability";
import { propertyTypeLabels } from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";
import { formatPrice } from "@/lib/pricing";
import { buildThemeStyles } from "@/lib/theme";

const normalizeWhatsAppPhone = (value?: string) =>
  (value ?? "").replace(/[^\d]/g, "");

const coverImage = (images: string[], coverIndex: number) =>
  images[Math.min(Math.max(coverIndex, 0), Math.max(images.length - 1, 0))] ?? images[0] ?? "";

export default function CollaboratorPublicPage() {
  const params = useParams<{ id: string | string[] }>();
  const collaboratorId = Array.isArray(params?.id) ? params.id[0] : params?.id || "";
  const { state, isReady } = useInmoStore();
  const { adminUsers, listings, theme } = state;
  const themeStyles = buildThemeStyles(theme);
  const collaborator = adminUsers.find(
    (admin) => admin.id === collaboratorId && admin.role === "colaborador" && admin.active
  );
  const properties = useMemo(
    () =>
      listings.filter(
        (listing) =>
          listing.createdByAdminId === collaboratorId &&
          listing.status !== "pausado"
      ),
    [collaboratorId, listings]
  );
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
      <main className="mx-auto max-w-screen-2xl px-5 py-8 sm:px-8 lg:px-10">
        <section className="rounded-[2rem] bg-primary px-6 py-10 text-on-primary sm:px-10 lg:px-14">
          <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-primary-fixed">
            Catálogo independiente
          </p>
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-4xl font-headline font-extrabold leading-tight sm:text-5xl">
                {collaborator.name}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-on-primary/75">
                Propiedades cargadas directamente por este colaborador. Consultá por disponibilidad y coordinación de visita.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Disponibles
              </p>
              <h2 className="mt-2 text-2xl font-headline font-bold text-primary">
                {properties.length} propiedades
              </h2>
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="mt-8 rounded-3xl bg-surface-container-lowest p-8 text-center">
              <h3 className="text-2xl font-headline font-bold text-primary">
                Todavía no hay propiedades publicadas
              </h3>
              <p className="mt-2 text-sm text-on-surface-variant">
                Cuando el colaborador cargue inmuebles, se van a mostrar acá.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
