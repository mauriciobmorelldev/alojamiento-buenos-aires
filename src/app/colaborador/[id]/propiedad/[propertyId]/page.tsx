"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { getAvailability } from "@/lib/availability";
import { propertyTypeLabels } from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";
import { formatPrice } from "@/lib/pricing";
import { buildThemeStyles } from "@/lib/theme";

const normalizeWhatsAppPhone = (value?: string) =>
  (value ?? "").replace(/[^\d]/g, "");

const getSafeImage = (images: string[], index: number) =>
  images[Math.min(Math.max(index, 0), Math.max(images.length - 1, 0))] ?? "";

export default function CollaboratorPropertyPage() {
  const params = useParams<{ id: string | string[]; propertyId: string | string[] }>();
  const collaboratorId = Array.isArray(params?.id) ? params.id[0] : params?.id || "";
  const propertyId = Array.isArray(params?.propertyId)
    ? params.propertyId[0]
    : params?.propertyId || "";
  const { state, isReady } = useInmoStore();
  const { adminUsers, listings, theme } = state;
  const [activeImage, setActiveImage] = useState(0);
  const themeStyles = buildThemeStyles(theme);

  const collaborator = adminUsers.find(
    (admin) => admin.id === collaboratorId && admin.role === "colaborador" && admin.active
  );
  const property = useMemo(
    () =>
      listings.find(
        (listing) =>
          listing.id === propertyId &&
          listing.createdByAdminId === collaboratorId &&
          listing.status !== "pausado"
      ),
    [collaboratorId, listings, propertyId]
  );
  const whatsappPhone = normalizeWhatsAppPhone(collaborator?.phone);
  const availability = property ? getAvailability(property.status) : null;
  const mainImage = property
    ? getSafeImage(property.images, activeImage || property.coverIndex)
    : "";

  if (!isReady) {
    return (
      <div style={themeStyles} className="min-h-screen bg-background px-4 py-6 text-on-background">
        <main className="mx-auto max-w-screen-xl">
          <div className="h-12 w-40 animate-pulse rounded-full bg-outline-variant/20" />
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="aspect-[4/3] animate-pulse rounded-3xl bg-surface-container-low" />
            <div className="space-y-4">
              <div className="h-6 w-32 animate-pulse rounded-full bg-outline-variant/20" />
              <div className="h-12 w-4/5 animate-pulse rounded-2xl bg-outline-variant/20" />
              <div className="h-4 w-full animate-pulse rounded-full bg-outline-variant/15" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-outline-variant/15" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!collaborator || !property) {
    return (
      <div style={themeStyles} className="min-h-screen bg-background px-6 py-20 text-on-background">
        <main className="mx-auto max-w-screen-md text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
            Propiedad no disponible
          </p>
          <h1 className="mt-4 text-3xl font-headline font-bold text-primary">
            No encontramos esta publicación
          </h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            Puede estar inactiva o no pertenecer a este colaborador.
          </p>
          {collaboratorId ? (
            <Link
              href={`/colaborador/${collaboratorId}`}
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary"
              style={{ color: "var(--color-on-primary)" }}
            >
              Ver propiedades
            </Link>
          ) : null}
        </main>
      </div>
    );
  }

  const whatsappMessage = `Hola ${collaborator.name}, quiero consultar por ${property.title}.`;

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-on-background">
      <main className="mx-auto max-w-screen-2xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
          <Link
            href={`/colaborador/${collaboratorId}`}
            className="inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 text-sm font-bold text-primary"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Propiedades
          </Link>
          <p className="text-sm font-bold text-on-surface-variant">{collaborator.name}</p>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
          <div className="lg:sticky lg:top-5">
            <div className="overflow-hidden rounded-3xl bg-surface-container-low">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={property.title}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="aspect-[4/3] w-full bg-gradient-to-br from-primary/15 to-secondary/15" />
              )}
            </div>
            {property.images.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {property.images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`h-20 w-24 flex-shrink-0 overflow-hidden rounded-2xl border transition ${
                      index === activeImage
                        ? "border-primary"
                        : "border-outline-variant/20 opacity-75 hover:opacity-100"
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <article className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {availability ? (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${availability.badgeClassName}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${availability.dotClassName}`} />
                    {availability.label}
                  </span>
                ) : null}
                <span className="rounded-full bg-surface-container-low px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {propertyTypeLabels[property.type]}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-headline font-extrabold leading-tight text-primary sm:text-5xl">
                {property.title}
              </h1>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-on-surface-variant">
                {property.neighborhood}
              </p>
              <p className="mt-5 text-4xl font-headline font-bold text-primary">
                {formatPrice(property.price, property.priceUnit, property.currency)}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-surface-container-lowest p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Ambientes
                </p>
                <p className="mt-2 text-2xl font-bold text-primary">{property.rooms}</p>
              </div>
              <div className="rounded-2xl bg-surface-container-lowest p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Superficie
                </p>
                <p className="mt-2 text-2xl font-bold text-primary">{property.area} m²</p>
              </div>
              <div className="rounded-2xl bg-surface-container-lowest p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Operación
                </p>
                <p className="mt-2 text-lg font-bold text-primary">
                  {property.priceUnit === "venta"
                    ? "Venta"
                    : property.priceUnit === "noche"
                      ? "Temporal"
                      : "Alquiler"}
                </p>
              </div>
            </div>

            {property.highlight ? (
              <div className="rounded-3xl bg-primary px-5 py-4 text-on-primary">
                <p className="text-sm font-semibold leading-6">{property.highlight}</p>
              </div>
            ) : null}

            <div className="rounded-3xl bg-surface-container-lowest p-5">
              <h2 className="text-xl font-headline font-bold text-primary">
                Sobre esta propiedad
              </h2>
              <div className="mt-3 whitespace-pre-line text-sm leading-7 text-on-surface-variant">
                {property.description || "Descripción pendiente."}
              </div>
            </div>

            {whatsappPhone ? (
              <a
                href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full justify-center rounded-full bg-primary px-6 py-4 text-sm font-bold text-on-primary sm:w-auto"
                style={{ color: "var(--color-on-primary)" }}
              >
                Consultar esta propiedad
              </a>
            ) : null}
          </article>
        </section>
      </main>
    </div>
  );
}
