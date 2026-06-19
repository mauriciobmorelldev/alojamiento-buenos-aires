"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";
import { propertyTypeLabels, type FilterGroup, type Listing } from "@/lib/inmoData";
import { generatePropertyPdf } from "@/lib/propertyPdf";
import { getAvailability } from "@/lib/availability";
import { formatPrice } from "@/lib/pricing";
import { RealEstateMessage } from "@/components/inmo/RealEstateStatus";
import { isLocalVideoReference, parseVideoUrl } from "@/lib/video";

function PropertyLeadFormFallback() {
  return (
    <div className="mt-6 grid gap-4" aria-hidden="true">
      <div className="rounded-2xl bg-surface-container-low p-4">
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-outline-variant/20" />
        <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-outline-variant/15" />
        <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-outline-variant/15" />
      </div>
      <div className="h-14 animate-pulse rounded-xl bg-surface-container-lowest" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-14 animate-pulse rounded-xl bg-surface-container-lowest" />
        <div className="h-14 animate-pulse rounded-xl bg-surface-container-lowest" />
      </div>
    </div>
  );
}

const PropertyLeadForm = dynamic(
  () => import("@/components/inmo/PropertyLeadForm"),
  {
    ssr: false,
    loading: () => <PropertyLeadFormFallback />,
  }
);

const resolveAttributes = (
  groups: FilterGroup[],
  values: Record<string, string[]>
) =>
  groups
    .map((group) => ({
      label: group.label,
      values: values[group.id] ?? [],
    }))
    .filter((group) => group.values.length > 0);

const fallbackImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDDAgcQ1jH-fIHqf_1_ZpyWhB5OgV3FjRjRnpql6lTJVWDtzGO6uOOup5LqkSCn2KKr5FZT69TKFGv9opxa-EtnkAhHAFONQKnnGSxg-kpoXjvTZd2_zb_M0iY4cdZDsbE31W35JVc6NtFBpzRAIJ3fzBoiXjTRbt76CbQqkPo_uMsnGWzj1yfw1KLkJl-CTvkOXdNQwFmLYckq3fv_U2TWQex40VRDPn80Z1xtb0tEJczaLIblLpxrFYmY9rVwD_c7FEWmHPHXIg",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDI0K-3EhAsC26dD0_BayXjOCzeNuH20nxavwc4HLYyK1W8lmuyKoiNzSfyrjyS-T-oTiWd1HAvTSQG4R1JQrUZSjvWhWhLPKIErJI1sx8gjlWrwQumL4CKJ1-SJnVea2epp1jyuZ-pbSSiN09GVnDH2NouRR0pr7_1cvzrxCLdkp33_zUYVry2zh716dnQRPQansaLiUNHVZxz8kvq-qEq35qC1ciJztFsnuiUcECmtlHSgSDt4b9Fgu9NaPipKH8mp-uWLNphw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBPwVzgXPJm0swtY64CQbdnTef3BTgOiLpJyMC05lfsZ3vahhPB3JlrNwGPyzKnqC4edrrCpfXf0gRe1MltU-8HvUvqm9U62TxGf-TMbEaq4MuXzJyzMo0ql2RbO4ma5EOI1My4_3oXEEbpcsuJMScmmgFOOonN8dZHI-fiOJ0rWkRBY1c4Z8TYUTMAOkYdFP7L3FNk8qMiO4iJyOxj_PHaGnpiGspDEtM2oLtCXNIPPp8HPKPQjDZNpujgpXVREeeTMApubcs4lg",
];

const isSectionTitle = (line: string) => /:\s*$/.test(line) && line.length <= 80;

const isListLikeLine = (line: string) =>
  line.length <= 85 &&
  !/[.!?]$/.test(line) &&
  !/^\d+\s*(amb|ambiente|m²|m2)/i.test(line);

const PropertyDescription = ({
  description,
  highlight,
}: {
  description: string;
  highlight?: string;
}) => {
  const lines = description
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return (
      <p className="rounded-2xl bg-surface-container-low p-5 text-sm leading-7 text-on-surface-variant">
        Descripción pendiente.
      </p>
    );
  }

  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let lastWasHeading = false;

  const flushList = () => {
    if (!listItems.length) return;
    elements.push(
      <ul
        key={`list-${elements.length}`}
        className="grid gap-2 rounded-2xl bg-surface-container-low p-5 text-sm text-on-surface-variant sm:grid-cols-2"
      >
        {listItems.map((item, itemIndex) => (
          <li key={`${item}-${itemIndex}`} className="flex gap-2 leading-6">
            <span className="material-symbols-outlined mt-0.5 text-base text-primary">
              check_circle
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    if (index === 0 && line === line.toUpperCase() && line.length <= 40) {
      flushList();
      elements.push(
        <p
          key={`eyebrow-${index}`}
          className="text-xs font-bold uppercase tracking-[0.28em] text-primary"
        >
          {line}
        </p>
      );
      lastWasHeading = false;
      return;
    }

    if (index === 1 && elements.length === 1 && line.length <= 120) {
      flushList();
      elements.push(
        <h3 key={`lead-${index}`} className="text-xl font-headline font-bold text-primary">
          {line}
        </h3>
      );
      lastWasHeading = false;
      return;
    }

    if (isSectionTitle(line)) {
      flushList();
      elements.push(
        <h3
          key={`section-${index}`}
          className="pt-3 text-lg font-headline font-bold text-primary"
        >
          {line.replace(/:\s*$/, "")}
        </h3>
      );
      lastWasHeading = true;
      return;
    }

    if (lastWasHeading && isListLikeLine(line)) {
      listItems.push(line);
      return;
    }

    flushList();
    elements.push(
      <p key={`paragraph-${index}`} className="text-base leading-8 text-on-surface-variant">
        {line}
      </p>
    );
    lastWasHeading = false;
  });

  flushList();

  return (
    <div className="space-y-5">
      {elements}
      {highlight && highlight !== "Sincronizada desde Tokko" ? (
        <p className="rounded-2xl bg-surface-container-low p-5 text-sm leading-7 text-on-surface-variant">
          {highlight}
        </p>
      ) : null}
    </div>
  );
};

const BuildingHouseLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-8 text-primary">
    <div className="text-center">
      <div className="mx-auto h-56 w-56">
        <DotLottieReact
          src="https://lottie.host/fb1730d2-9648-4008-ba55-f8a989c5e15e/E9ZNH6CJo7.lottie"
          loop
          autoplay
        />
      </div>
      <p className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-on-surface-variant">
        Construyendo ficha
      </p>
      <p className="mt-2 text-sm text-on-surface-variant">
        Estamos preparando la propiedad.
      </p>
    </div>
  </div>
);

const PropertyVideo = ({ url, title }: { url: string; title: string }) => {
  const video = parseVideoUrl(url);
  const isLocal = isLocalVideoReference(url);

  if (video?.embedUrl) {
    return (
      <iframe
        className="h-full w-full"
        src={video.embedUrl}
        title={`Video de ${title}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    );
  }

  if (video?.fileUrl) {
    return (
      <video
        className="h-full w-full object-cover"
        src={video.fileUrl}
        controls
        playsInline
        preload="metadata"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-surface-container-low p-8 text-center">
      <div>
        <span className="material-symbols-outlined text-4xl text-primary">
          smart_display
        </span>
        <p className="mt-3 text-sm font-semibold text-primary">
          {isLocal
            ? "Este video está guardado como archivo local."
            : "No pudimos reproducir este video."}
        </p>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-on-surface-variant">
          {isLocal
            ? "Para verlo en la web, subilo a YouTube, Vimeo o un hosting público y pegá una URL https."
            : "Revisá que el enlace sea público o reemplazalo por YouTube, Vimeo o un MP4/WebM directo."}
        </p>
        {!isLocal ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-primary"
          >
            Abrir video
          </a>
        ) : null}
      </div>
    </div>
  );
};

export default function DetallePropiedadPage() {
  const params = useParams<{ id: string | string[] }>();
  const propertyId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { state, isReady } = useInmoStore();
  const {
    listings,
    agents,
    filterGroups,
    theme,
    homeContent,
    adminUsers,
  } = state;
  const propertySummary = listings.find((item) => item.id === propertyId);
  const [propertyDetail, setPropertyDetail] = useState<Listing | null>(null);
  const property = propertyDetail?.id === propertyId ? propertyDetail : propertySummary;
  const [activeImage, setActiveImage] = useState(0);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [isPropertyDetailLoading, setIsPropertyDetailLoading] = useState(false);

  const agent = useMemo(
    () => agents.find((item) => item.id === property?.agentId),
    [agents, property?.agentId]
  );

  useEffect(() => {
    if (!propertyId) {
      setPropertyDetail(null);
      setIsPropertyDetailLoading(false);
      return;
    }

    const controller = new AbortController();
    setPropertyDetail(null);
    setIsPropertyDetailLoading(true);

    const fetchPropertyDetail = async () => {
      try {
        const response = await fetch(`/api/public/property/${encodeURIComponent(propertyId)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = (await response.json()) as { listing?: Listing };
        if (data.listing) setPropertyDetail(data.listing);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        console.warn("No se pudo cargar la ficha completa", error);
      } finally {
        if (!controller.signal.aborted) {
          setIsPropertyDetailLoading(false);
        }
      }
    };

    void fetchPropertyDetail();
    return () => controller.abort();
  }, [propertyId]);
  useEffect(() => {
    const resetGallery = () => {
      setActiveImage(0);
      setViewerIndex(0);
      setViewerZoom(1);
      setIsViewerOpen(false);
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(resetGallery);
      return;
    }
    window.setTimeout(resetGallery, 0);
  }, [propertyId]);

  const attributes = useMemo(
    () => (property ? resolveAttributes(filterGroups, property.attributes) : []),
    [filterGroups, property]
  );

  const images = property?.images.length ? property.images : fallbackImages;
  const mainImage = images[activeImage] ?? images[0];
  const mainVideo = property?.videos?.[0] ?? "";
  const visitForm = homeContent.visitForm;
  const themeStyles = buildThemeStyles(theme);

  const openViewer = (index: number) => {
    const nextIndex = Math.min(Math.max(index, 0), images.length - 1);
    setViewerIndex(nextIndex);
    setActiveImage(nextIndex);
    setViewerZoom(1);
    setIsViewerOpen(true);
  };

  const closeViewer = useCallback(() => {
    setIsViewerOpen(false);
    setViewerZoom(1);
  }, []);

  const moveViewer = useCallback((direction: 1 | -1) => {
    setViewerIndex((current) => {
      const nextIndex = (current + direction + images.length) % images.length;
      setActiveImage(nextIndex);
      setViewerZoom(1);
      return nextIndex;
    });
  }, [images.length]);

  const updateZoom = (delta: number) => {
    setViewerZoom((current) => Math.min(5, Math.max(1, Number((current + delta).toFixed(2)))));
  };

  const toggleImageZoom = () => {
    setViewerZoom((current) => (current > 1 ? 1 : 2.5));
  };

  useEffect(() => {
    if (!isViewerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowRight") moveViewer(1);
      if (event.key === "ArrowLeft") moveViewer(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeViewer, isViewerOpen, moveViewer]);

  if (!property && (!isReady || isPropertyDetailLoading)) {
    return <BuildingHouseLoader />;
  }

  if (!property) {
    return (
      <RealEstateMessage
        eyebrow="Propiedad no encontrada"
        title="No pudimos abrir esta ficha"
        message="Puede que la publicacion haya sido pausada, reservada o que el link ya no este disponible."
        actions={[
          { href: "/propiedades", label: "Volver al catalogo" },
          { href: "/", label: "Ir al inicio", variant: "secondary" },
        ]}
      />
    );
  }

  const availability = getAvailability(property.status);
  const isFromCollaborator = Boolean(
    property.createdByAdminId &&
      adminUsers.some(
        (admin) =>
          admin.id === property.createdByAdminId && admin.role === "colaborador"
      )
  );

  const handleDownloadPdf = async () => {
    setPdfError("");
    setIsGeneratingPdf(true);
    try {
      await generatePropertyPdf({
        property,
        attributes,
        images,
        theme,
        propertyUrl: window.location.href,
      });
    } catch (error) {
      console.error("No se pudo generar la ficha PDF", error);
      setPdfError("No pudimos generar el PDF. Probá nuevamente.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div style={themeStyles} className="bg-background text-on-background font-body">
      <main className="pt-5">
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-8">
          <Link
            href="/propiedades"
            className="mb-5 inline-flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-2 text-sm font-bold text-primary"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Propiedades
          </Link>
        </div>
        <section className="mx-auto max-w-screen-2xl px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:sticky lg:top-24 lg:col-span-7">
              <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest">
                <div className="relative aspect-[16/10] overflow-hidden">
                  {mainVideo ? (
                    <PropertyVideo url={mainVideo} title={property.title} />
                  ) : (
                    <button
                      type="button"
                      onClick={() => openViewer(activeImage)}
                      className="group block h-full w-full cursor-zoom-in"
                      aria-label="Abrir galería de imágenes"
                    >
                      <img
                        alt={property.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        src={mainImage}
                        width={1280}
                        height={800}
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                      />
                      <span className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-surface-container-lowest/92 px-4 py-2 text-xs font-bold text-primary shadow-[0_20px_45px_-28px_rgba(27,54,93,0.55)] backdrop-blur">
                        <span className="material-symbols-outlined text-base">zoom_in</span>
                        Ver fotos
                      </span>
                    </button>
                  )}
                  <div className="absolute left-6 top-6 flex flex-wrap gap-2">
                    <span className="rounded-full bg-surface-container-lowest/90 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest">
                      {propertyTypeLabels[property.type]}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest shadow-sm ${availability.badgeClassName}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${availability.dotClassName}`} />
                      {availability.label}
                    </span>
                  </div>
                  {mainVideo ? (
                    <button
                      type="button"
                      onClick={() => openViewer(activeImage)}
                      className="absolute bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-surface-container-lowest/92 px-4 py-2 text-xs font-bold text-primary shadow-[0_20px_45px_-28px_rgba(27,54,93,0.55)] backdrop-blur"
                    >
                      <span className="material-symbols-outlined text-base">photo_library</span>
                      Ver fotos
                    </button>
                  ) : null}
                </div>
                <div className="flex gap-3 overflow-x-auto p-4">
                  {images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={`relative shrink-0 overflow-hidden rounded-xl border ${
                        activeImage === index
                          ? "border-primary"
                          : "border-outline-variant/30"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`Miniatura ${index + 1}`}
                        width={160}
                        height={112}
                        loading="lazy"
                        decoding="async"
                        className="h-20 w-28 object-cover"
                      />
                      {activeImage === index ? (
                        <span className="absolute inset-0 border-2 border-primary" />
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="space-y-6 rounded-2xl bg-surface-container-lowest p-6 md:p-8">
                <div className="space-y-3">
                  <h1 className="text-4xl font-headline font-extrabold tracking-tighter text-primary md:text-5xl">
                    {property.title}
                  </h1>
                  <p className="text-lg font-light text-on-surface-variant">
                    {property.neighborhood}
                  </p>
                </div>
                <div className="rounded-2xl bg-surface-container-low p-5 text-left">
                  <p className="text-4xl font-headline font-bold text-primary">
                    {formatPrice(property.price, property.priceUnit, property.currency)}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${availability.badgeClassName}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${availability.dotClassName}`} />
                      {availability.label}
                    </span>
                    {isFromCollaborator ? (
                      <span className="inline-flex items-center rounded-full border border-primary/15 bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                        Colaborador
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-surface-container-low p-4">
                    <span className="material-symbols-outlined text-2xl text-primary">square_foot</span>
                    <p className="mt-2 text-xs uppercase tracking-widest text-on-surface-variant">Espacio</p>
                    <p className="font-bold">{property.area} m²</p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low p-4">
                    <span className="material-symbols-outlined text-2xl text-primary">bed</span>
                    <p className="mt-2 text-xs uppercase tracking-widest text-on-surface-variant">Ambientes</p>
                    <p className="font-bold">{property.rooms}</p>
                  </div>
                  <div className="rounded-2xl bg-surface-container-low p-4">
                    <span className="material-symbols-outlined text-2xl text-primary">
                      {availability.isAvailable ? "verified" : "block"}
                    </span>
                    <p className="mt-2 text-xs uppercase tracking-widest text-on-surface-variant">Estado</p>
                    <p className={availability.isAvailable ? "font-bold text-emerald-700" : "font-bold text-red-700"}>
                      {availability.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-16 px-8 py-16 lg:grid-cols-12">
          <div className="lg:col-span-8 space-y-12">
            <div className="space-y-6">
              <h2 className="text-2xl font-headline font-bold tracking-tight">
                Sobre esta propiedad
              </h2>
              <PropertyDescription
                description={property.description}
                highlight={property.highlight}
              />
            </div>

            {attributes.length ? (
              <div className="space-y-8">
                <h2 className="text-2xl font-headline font-bold tracking-tight">
                  Características destacadas
                </h2>
                <div className="grid grid-cols-2 gap-x-12 gap-y-6 md:grid-cols-3">
                  {attributes.flatMap((group) =>
                    group.values.map((value) => (
                      <div key={`${group.label}-${value}`} className="flex items-center space-x-3">
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                        <span className="text-sm font-medium text-on-surface-variant">{value}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.06)]">
              <h3 className="text-xl font-headline font-bold text-primary">
                Consultar con un asesor
              </h3>
              {agent ? (
                <div className="mt-4 flex items-center gap-4">
                  {agent.photo ? (
                    <img
                      src={agent.photo}
                      alt={agent.name}
                      width={48}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-primary">
                      {agent.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-primary">{agent.name}</p>
                    <p className="text-xs text-on-surface-variant">{agent.role}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-on-surface-variant">
                  Un asesor va a responder tu consulta.
                </p>
              )}
              <PropertyLeadForm
                property={property}
                theme={theme}
                visitForm={visitForm}
              />
            </div>

            <div className="rounded-2xl bg-surface-container-lowest p-6 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.06)]">
              <h3 className="text-lg font-headline font-bold text-primary">Ficha rápida</h3>
              <div className="mt-4 space-y-3 text-sm text-on-surface-variant">
                <div className="flex items-center justify-between">
                  <span>Tipo</span>
                  <span className="font-semibold text-primary">{propertyTypeLabels[property.type]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Precio</span>
                  <span className="font-semibold text-primary">{formatPrice(property.price, property.priceUnit, property.currency)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Ambientes</span>
                  <span className="font-semibold text-primary">{property.rooms}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Superficie</span>
                  <span className="font-semibold text-primary">{property.area} m²</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:scale-[1.01] disabled:cursor-wait disabled:opacity-70"
                style={{ color: "var(--color-on-primary)" }}
              >
                <span className="material-symbols-outlined text-lg">
                  {isGeneratingPdf ? "progress_activity" : "download"}
                </span>
                {isGeneratingPdf ? "Armando ficha PDF" : "Descargar ficha PDF"}
              </button>
              {pdfError ? <p className="mt-3 text-sm text-error">{pdfError}</p> : null}
            </div>
          </div>
        </section>
      </main>

      {isViewerOpen ? (
        <div
          className="fixed inset-0 z-[80] bg-primary/92 text-on-primary backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Visualizador de imágenes"
          onClick={closeViewer}
        >
          <div className="flex h-full flex-col" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-on-primary/10 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-on-primary">
                  {property.title}
                </p>
                <p className="text-xs text-on-primary/70">
                  Foto {viewerIndex + 1} de {images.length}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateZoom(-0.25)}
                  disabled={viewerZoom <= 1}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-on-primary/10 text-on-primary transition hover:bg-on-primary/18 disabled:opacity-35"
                  aria-label="Alejar imagen"
                >
                  <span className="material-symbols-outlined text-lg">zoom_out</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateZoom(0.25)}
                  disabled={viewerZoom >= 5}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-on-primary/10 text-on-primary transition hover:bg-on-primary/18 disabled:opacity-35"
                  aria-label="Acercar imagen"
                >
                  <span className="material-symbols-outlined text-lg">zoom_in</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewerZoom(1)}
                  className="hidden rounded-full bg-on-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-primary transition hover:bg-on-primary/18 sm:inline-flex"
                >
                  {Math.round(viewerZoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={closeViewer}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-primary transition hover:scale-105"
                  aria-label="Cerrar galería"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>

            <div className="relative min-h-0 flex-1">
              {images.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => moveViewer(-1)}
                    className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-on-primary/12 text-on-primary backdrop-blur transition hover:bg-on-primary/20 sm:left-6 sm:h-12 sm:w-12"
                    aria-label="Imagen anterior"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveViewer(1)}
                    className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-on-primary/12 text-on-primary backdrop-blur transition hover:bg-on-primary/20 sm:right-6 sm:h-12 sm:w-12"
                    aria-label="Imagen siguiente"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </>
              ) : null}

              <div
                className="h-full overflow-auto px-4 py-6 sm:px-20 sm:py-8"
              >
                <div className="flex min-h-full min-w-full items-center justify-center">
                  <img
                    src={images[viewerIndex]}
                    alt={`${property.title} - imagen ${viewerIndex + 1}`}
                    width={1400}
                    height={1000}
                    loading="eager"
                    decoding="async"
                    className="select-none rounded-2xl object-contain shadow-[0_40px_90px_-35px_rgba(0,0,0,0.55)]"
                    draggable={false}
                    onClick={toggleImageZoom}
                    style={{
                      cursor: viewerZoom > 1 ? "zoom-out" : "zoom-in",
                      maxHeight: viewerZoom === 1 ? "calc(100dvh - 220px)" : "none",
                      maxWidth: viewerZoom === 1 ? "100%" : "none",
                      width: viewerZoom > 1 ? `${Math.round(92 * viewerZoom)}vw` : "auto",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-on-primary/10 px-4 py-3 sm:px-6">
              <div className="mx-auto flex max-w-screen-lg gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={`viewer-${image}-${index}`}
                    type="button"
                    onClick={() => {
                      setViewerIndex(index);
                      setActiveImage(index);
                      setViewerZoom(1);
                    }}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition sm:h-20 sm:w-32 ${
                      viewerIndex === index
                        ? "border-primary-fixed"
                        : "border-on-primary/15 opacity-70 hover:opacity-100"
                    }`}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`Miniatura ${index + 1}`}
                      width={160}
                      height={100}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
