"use client";

import Link from "next/link";
import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type TouchEvent,
} from "react";
import FrontHeader from "@/components/inmo/FrontHeader";
import SiteFooter from "@/components/inmo/SiteFooter";
import { getAvailability } from "@/lib/availability";
import { propertyTypeLabels, type InmoState } from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";
import { formatPrice } from "@/lib/pricing";
import {
  getOptimizedPublicImageSrcSet,
  getOptimizedPublicImageUrl,
  isSupabasePublicImage,
} from "@/lib/publicImage";
import { buildHomeThemeStyles } from "@/lib/theme";

const getCoverImage = (images: string[], coverIndex: number) => {
  if (!images.length) return "";
  return images[coverIndex] ?? images[0];
};

const getPropertyAddress = (item: {
  neighborhood: string;
  attributes: Record<string, string[]>;
}) =>
  item.attributes.address?.find(Boolean) ??
  item.attributes.operation_address?.find(Boolean) ??
  item.attributes.operation_location?.find(Boolean) ??
  item.attributes.full_location?.find(Boolean) ??
  item.attributes.location?.find(Boolean) ??
  item.neighborhood;

const sanitizePublicHref = (href?: string) =>
  href === "/acceso" || href === "/registro" || href === "/mi-cuenta"
    ? "/propiedades"
    : href || "/propiedades";

const propertyModuleLinkProps = (href: string) =>
  href.startsWith("/propiedades")
    ? { target: "_blank", rel: "noreferrer" }
    : {};

const getAttributeText = (attributes: Record<string, string[]>) =>
  Object.values(attributes).flat().join(" ").toLowerCase();

const hasFeature = (attributes: Record<string, string[]>, keywords: string[]) => {
  const value = getAttributeText(attributes);
  return keywords.some((keyword) => value.includes(keyword));
};

const isPinnedHome = (attributes: Record<string, string[]>) =>
  attributes.pinned_home?.includes("true");

const isPubliclyVisibleListing = (item: { status: string }) =>
  item.status !== "tasacion" && item.status !== "no_disponible";

const getPropertyFeatures = (item: {
  rooms: number;
  area: number;
  attributes: Record<string, string[]>;
}) => [
  { icon: "bed", label: `${item.rooms} amb.` },
  { icon: "square_foot", label: `${item.area} m2` },
  {
    icon: "bathtub",
    label: hasFeature(item.attributes, ["baño", "bano", "bath", "ducha"])
      ? "Baño"
      : "Consultar",
  },
  {
    icon: "directions_car",
    label: hasFeature(item.attributes, ["cochera", "garage", "parking"])
      ? "Cochera"
      : "Opcional",
  },
];

const truncate = (value: string, max = 104) =>
  value.length <= max ? value : `${value.slice(0, max).trimEnd()}...`;

const isInlineImage = (src: string) => src.startsWith("data:") || src.startsWith("blob:");

function PublicImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes,
  quality = 76,
  responsiveWidths,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  responsiveWidths?: number[];
}) {
  const optimizedSrc = getOptimizedPublicImageUrl(src, {
    width,
    quality,
  });
  const shouldUseDirectResponsiveImage =
    isSupabasePublicImage(src) && Array.isArray(responsiveWidths) && responsiveWidths.length > 0;

  if (shouldUseDirectResponsiveImage || isInlineImage(src)) {
    const directSrc = shouldUseDirectResponsiveImage
      ? getOptimizedPublicImageUrl(src, {
          width: Math.min(...responsiveWidths),
          quality,
        })
      : optimizedSrc;

    return (
      <img
        src={directSrc}
        srcSet={
          shouldUseDirectResponsiveImage
            ? getOptimizedPublicImageSrcSet(src, responsiveWidths, { quality })
            : undefined
        }
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
        className={className}
      />
    );
  }

  return (
    <Image
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      quality={quality}
      sizes={sizes}
      className={className}
    />
  );
}

export default function HomeStitchLite({
  initialState,
}: {
  initialState?: Partial<InmoState>;
}) {
  const { state } = useInmoStore(initialState);
  const { listings, agents, theme, homeContent, adminUsers } = state;
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const bannerTouchStartX = useRef<number | null>(null);

  const themeStyles = useMemo(() => buildHomeThemeStyles(theme), [theme]);
  const activeBanners = useMemo(
    () => homeContent.banners.filter((banner) => banner.active),
    [homeContent.banners]
  );
  const activePartnerLogos = useMemo(
    () =>
      homeContent.partnerLogos.filter(
        (logo) => logo.active && logo.image && logo.name.trim()
      ),
    [homeContent.partnerLogos]
  );
  const publicListings = useMemo(
    () => listings.filter(isPubliclyVisibleListing),
    [listings]
  );
  const pinnedHomeListings = useMemo(
    () => publicListings.filter((item) => isPinnedHome(item.attributes)),
    [publicListings]
  );
  const featuredListings = useMemo(
    () =>
      (pinnedHomeListings.length
        ? pinnedHomeListings
        : publicListings.filter((item) => item.status === "disponible")
      ).slice(0, 6),
    [pinnedHomeListings, publicListings]
  );
  const recentListings = useMemo(() => [...publicListings].slice(-3).reverse(), [publicListings]);
  const agentsById = useMemo(
    () => Object.fromEntries(agents.map((agent) => [agent.id, agent])),
    [agents]
  );
  const collaboratorAdminIds = useMemo(
    () =>
      new Set(
        adminUsers
          .filter((admin) => admin.role === "colaborador")
          .map((admin) => admin.id)
      ),
    [adminUsers]
  );

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % activeBanners.length);
    }, 5600);
    return () => window.clearInterval(interval);
  }, [activeBanners.length]);

  const safeActiveBannerIndex = activeBanners.length
    ? activeBannerIndex % activeBanners.length
    : 0;
  const heroImage = theme.heroImage || "";
  const primaryHref = sanitizePublicHref(homeContent.primaryCtaHref);
  const secondaryHref = sanitizePublicHref(homeContent.secondaryCtaHref);
  const secondaryLabel = /cliente|cuenta|acceso/i.test(homeContent.secondaryCtaLabel)
    ? "Consultar ahora"
    : homeContent.secondaryCtaLabel;
  const inventoryTotal = homeContent.publicInventoryTotal ?? publicListings.length;
  const availableCount =
    homeContent.publicInventoryAvailable ??
    publicListings.filter((item) => item.status === "disponible").length;
  const goToPreviousBanner = () => {
    if (activeBanners.length <= 1) return;
    setActiveBannerIndex(
      (current) => (current - 1 + activeBanners.length) % activeBanners.length
    );
  };
  const goToNextBanner = () => {
    if (activeBanners.length <= 1) return;
    setActiveBannerIndex((current) => (current + 1) % activeBanners.length);
  };
  const handleBannerTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    bannerTouchStartX.current = event.touches[0]?.clientX ?? null;
  };
  const handleBannerTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startX = bannerTouchStartX.current;
    bannerTouchStartX.current = null;
    if (startX === null || activeBanners.length <= 1) return;
    const endX = event.changedTouches[0]?.clientX ?? startX;
    const deltaX = endX - startX;
    if (Math.abs(deltaX) < 44) return;
    if (deltaX > 0) {
      goToPreviousBanner();
    } else {
      goToNextBanner();
    }
  };

  return (
    <div
      style={themeStyles}
      className="bg-background text-on-background font-body selection:bg-primary-fixed selection:text-on-primary-fixed"
    >
      <FrontHeader active="home" />

      <main className="pt-16 sm:pt-20">
        <section
          className="relative flex min-h-[calc(100svh-4rem)] w-full items-center overflow-hidden bg-background py-8 sm:min-h-[720px] sm:py-16"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <div className="absolute inset-0 z-0">
            {heroImage ? (
              <PublicImage
                className="h-full w-full scale-[1.03] object-cover"
                alt="Portada"
                src={heroImage}
                width={1440}
                height={900}
                priority
                quality={72}
                responsiveWidths={[480, 640, 768, 960, 1200, 1440]}
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1440px"
              />
            ) : (
              <div className="h-full w-full bg-background" />
            )}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(to right, ${
                  homeContent.heroOverlayColor?.trim() || "color-mix(in srgb, var(--color-primary) 72%, transparent)"
                }, color-mix(in srgb, ${
                  homeContent.heroOverlayColor?.trim() || "var(--color-primary)"
                } 42%, transparent), transparent)`,
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-32"
              style={{
                backgroundImage: `linear-gradient(to top, ${
                  homeContent.heroFadeColor?.trim() || "var(--color-background)"
                }, transparent)`,
              }}
            />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <div className="animate-home-rise max-w-3xl">
              <div className="aba-legacy-mark mb-6 flex max-w-3xl items-end overflow-hidden text-on-primary">
                <span className="font-headline text-3xl font-extrabold uppercase tracking-normal sm:text-4xl md:text-7xl">
                  Conne
                </span>
                <span className="animate-aba-x font-headline text-4xl font-extrabold uppercase text-primary-fixed sm:text-5xl md:text-8xl">
                  x
                </span>
                <span className="font-headline text-3xl font-extrabold uppercase tracking-normal sm:text-4xl md:text-7xl">
                  a
                </span>
              </div>
              <span className="mb-5 inline-block rounded-full bg-primary-fixed px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                {homeContent.eyebrow}
              </span>
              <h1 className="mb-5 text-4xl font-headline font-extrabold leading-[0.95] tracking-tighter text-on-primary sm:text-5xl md:text-8xl">
                {homeContent.title} <br />
                <span className="font-light italic text-primary-fixed">{homeContent.italicTitle}</span>
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-on-primary/90 sm:text-base md:text-lg">
                {homeContent.subtitle}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                <Link
                  href={primaryHref}
                  {...propertyModuleLinkProps(primaryHref)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-fixed px-6 py-3 text-sm font-bold text-primary transition-transform hover:-translate-y-1 sm:w-auto"
                >
                  {homeContent.primaryCtaLabel}
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
                <Link
                  href={secondaryHref}
                  {...propertyModuleLinkProps(secondaryHref)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/12 px-6 py-3 text-sm font-bold text-on-primary ghost-border backdrop-blur transition-transform hover:-translate-y-1 sm:w-auto"
                >
                  {secondaryLabel}
                </Link>
              </div>
            </div>

            <div className="animate-home-rise mt-8 max-w-4xl rounded-[1.75rem] bg-surface-container-lowest/95 p-3 backdrop-blur [animation-delay:140ms] sm:mt-12">
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                    Propiedades
                  </p>
                  <p className="mt-2 text-3xl font-headline font-bold text-primary">
                    {inventoryTotal}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                    Disponibles
                  </p>
                  <p className="mt-2 text-3xl font-headline font-bold text-primary">{availableCount}</p>
                </div>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                    Consulta
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-primary">Consultá fácil</p>
                </div>
                <Link
                  href={primaryHref}
                  {...propertyModuleLinkProps(primaryHref)}
                  className="brand-gradient flex h-full items-center justify-center gap-2 rounded-3xl px-8 py-4 text-sm font-bold tracking-tight text-on-primary transition-transform hover:-translate-y-1"
                >
                  Ver propiedades
                </Link>
              </div>
            </div>
          </div>
        </section>

        {activeBanners.length ? (
          <section className="mx-auto max-w-screen-2xl px-4 pb-8 pt-5 sm:-mt-10 sm:px-6 sm:pt-0 lg:px-8">
            <div
              className="banner-carousel relative overflow-hidden rounded-[2rem] bg-primary text-on-primary pro-card"
              style={{
                boxShadow: homeContent.bannerShadow?.trim() || undefined,
              }}
              onTouchStart={handleBannerTouchStart}
              onTouchEnd={handleBannerTouchEnd}
            >
              <div
                className="banner-carousel__track flex transition-transform duration-[850ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ transform: `translateX(-${safeActiveBannerIndex * 100}%)` }}
              >
                {activeBanners.map((banner, index) => (
                  <Link
                    key={banner.id}
                    href={banner.ctaHref || "/propiedades"}
                    {...propertyModuleLinkProps(banner.ctaHref || "/propiedades")}
                    className="banner-carousel__slide group relative block min-w-full overflow-hidden"
                    aria-hidden={safeActiveBannerIndex !== index}
                    tabIndex={safeActiveBannerIndex === index ? 0 : -1}
                  >
                    <div className="relative min-h-[20rem] sm:min-h-[25rem]">
                      {banner.image ? (
                        <PublicImage
                          src={banner.image}
                          alt={banner.title}
                          width={1920}
                          height={1080}
                          quality={86}
                          responsiveWidths={[640, 960, 1280, 1600, 1920, 2400]}
                          sizes="(max-width: 768px) 100vw, (max-width: 1536px) 96vw, 1536px"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]"
                        />
                      ) : (
                        <div className="absolute inset-0 brand-gradient" />
                      )}
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${
                            homeContent.bannerOverlayColor?.trim() || "var(--color-primary)"
                          }, color-mix(in srgb, ${
                            homeContent.bannerOverlayColor?.trim() || "var(--color-primary)"
                          } 78%, transparent), color-mix(in srgb, ${
                            homeContent.bannerOverlayColor?.trim() || "var(--color-primary)"
                          } 10%, transparent))`,
                        }}
                      />
                      <div
                        className="absolute inset-x-0 bottom-0 h-40"
                        style={{
                          backgroundImage: `linear-gradient(to top, color-mix(in srgb, ${
                            homeContent.bannerFadeColor?.trim() || "var(--color-primary)"
                          } 72%, transparent), transparent)`,
                        }}
                      />
                      <div className="banner-carousel__content relative flex min-h-[20rem] max-w-4xl flex-col justify-end p-7 sm:min-h-[25rem] sm:p-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary-fixed">
                          Destacado
                        </p>
                        <h2 className="mt-4 max-w-3xl text-3xl font-headline font-bold text-on-primary sm:text-5xl">
                          {banner.title}
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-on-primary/84 sm:text-base">
                          {banner.subtitle}
                        </p>
                        <span
                          className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-primary-fixed px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary"
                          style={{ boxShadow: homeContent.bannerButtonShadow?.trim() || undefined }}
                        >
                          {banner.ctaLabel || "Ver más"}
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {activeBanners.length > 1 ? (
                <>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 sm:bottom-5 sm:left-auto sm:right-5 sm:justify-end">
                    <div className="flex items-center gap-2 rounded-full bg-surface-container-lowest/14 p-2 backdrop-blur-md">
                      {activeBanners.map((banner, index) => (
                        <button
                          key={`dot-${banner.id}`}
                          type="button"
                          onClick={() => setActiveBannerIndex(index)}
                          className={`h-2.5 rounded-full transition-all ${
                            safeActiveBannerIndex === index
                              ? "w-8 bg-primary-fixed"
                              : "w-2.5 bg-on-primary/45 hover:bg-on-primary/75"
                          }`}
                          aria-label={`Ver banner ${index + 1}`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={goToPreviousBanner}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-lowest/18 text-on-primary backdrop-blur-md transition hover:bg-surface-container-lowest/28"
                        aria-label="Banner anterior"
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <button
                        type="button"
                        onClick={goToNextBanner}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-fixed text-primary transition hover:-translate-y-0.5"
                        style={{ boxShadow: homeContent.bannerButtonShadow?.trim() || undefined }}
                        aria-label="Banner siguiente"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              ["home_work", "Catálogo claro", "Explorá propiedades con fotos y características relevantes."],
              ["apartment", "Filtros simples", "Encontrá opciones por zona, tipo, ambientes y estado."],
              ["support_agent", "Consulta directa", "Enviá tus datos desde la ficha y recibí seguimiento comercial."],
              ["forum", "Sin exponer datos", "Alojamiento Buenos Aires responde por el canal correcto."],
            ].map(([icon, title, text]) => (
              <div
                key={title}
                className="rounded-3xl bg-surface-container-lowest p-6 pro-card transition-transform hover:-translate-y-1"
              >
                <span className="material-symbols-outlined text-3xl text-primary">{icon}</span>
                <p className="mt-4 text-sm font-bold text-primary">{title}</p>
                <p className="mt-2 text-sm leading-6 text-on-surface-variant">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {activePartnerLogos.length ? (
          <section className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
            <div
              className="overflow-hidden rounded-3xl bg-surface-container-lowest p-5 pro-card sm:p-8"
              style={{
                boxShadow: homeContent.partnersShadow?.trim() || undefined,
              }}
            >
              <h2 className="text-3xl font-headline font-bold tracking-tight text-primary">
                {homeContent.partnersTitle}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
                {homeContent.partnersSubtitle}
              </p>
              <div
                className="logo-marquee mt-6"
                style={{
                  "--logo-marquee-fade":
                    homeContent.partnersFadeColor?.trim() ||
                    "var(--color-surface-container-lowest)",
                } as CSSProperties}
              >
                <div className="logo-marquee__track">
                  {[...activePartnerLogos, ...activePartnerLogos].map((logo, index) => {
                    const content = (
                      <div className="logo-marquee__item">
                        <img
                          src={logo.image}
                          alt={logo.name}
                          loading="lazy"
                          decoding="async"
                          className="logo-marquee__image"
                        />
                      </div>
                    );
                    return logo.href ? (
                      <Link
                        key={`${logo.id}-${index}`}
                        href={logo.href}
                        target={logo.href.startsWith("http") ? "_blank" : undefined}
                        rel={logo.href.startsWith("http") ? "noreferrer" : undefined}
                        className="shrink-0"
                        aria-label={logo.name}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={`${logo.id}-${index}`} className="shrink-0">
                        {content}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:mb-12 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-headline font-bold tracking-tighter text-primary sm:text-4xl">
                {homeContent.featuredTitle}
              </h2>
              <p className="mt-2 max-w-2xl text-on-surface-variant">
                {homeContent.featuredSubtitle}
              </p>
            </div>
            <Link
              className="flex items-center gap-2 border-b-2 border-primary pb-1 text-sm font-bold uppercase tracking-widest"
              href="/propiedades"
              target="_blank"
              rel="noreferrer"
            >
              Ver todas las propiedades
            </Link>
          </div>

          {featuredListings.length === 0 ? (
            <div className="rounded-xl bg-surface-container-lowest p-10 text-center">
              <h3 className="text-2xl font-headline font-bold text-primary">
                Todavía no hay propiedades destacadas
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredListings.map((item, index) => {
                const cover = getCoverImage(item.images, item.coverIndex);
                const agent = item.agentId ? agentsById[item.agentId] : undefined;
                const features = getPropertyFeatures(item);
                const availability = getAvailability(item.status);
                const isFromCollaborator = Boolean(
                  item.createdByAdminId && collaboratorAdminIds.has(item.createdByAdminId)
                );
                const narrative = truncate(
                  item.description ||
                    `${item.rooms} ambientes con ${item.area}m2 en ${item.neighborhood}.`
                );

                return (
                  <Link
                    key={item.id}
                    href={`/departamentos/${item.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group block overflow-hidden rounded-3xl bg-surface-container-lowest pro-card transition-transform hover:-translate-y-2"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {cover ? (
                        <PublicImage
                          src={cover}
                          alt={item.title}
                          width={900}
                          height={720}
                          quality={74}
                          priority={index === 0}
                          responsiveWidths={[360, 480, 720, 900]}
                          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/75 via-primary/15 to-transparent" />

                      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
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

                      <div className="absolute left-4 right-4 bottom-4 rounded-xl bg-surface-container-lowest/90 p-3 backdrop-blur">
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-on-surface-variant">
                          <span>{propertyTypeLabels[item.type]}</span>
                          <span>{item.area} m2</span>
                        </div>
                        <p className="mt-2 text-lg font-bold text-primary">
                          {formatPrice(item.price, item.priceUnit, item.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-headline font-bold text-primary">{item.title}</h3>
                      <p className="mt-1 flex items-start gap-2 text-sm font-semibold leading-6 text-on-surface-variant">
                        <span className="material-symbols-outlined mt-0.5 text-base text-primary">
                          location_on
                        </span>
                        <span>{getPropertyAddress(item) || "Ubicación privada"}</span>
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">{narrative}</p>

                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {features.map((feature) => (
                          <div
                            key={`${item.id}-${feature.icon}`}
                            className="flex min-w-0 flex-col items-center rounded-2xl bg-surface-container-low px-2 py-2 text-center"
                          >
                            <span className="material-symbols-outlined text-lg text-primary">
                              {feature.icon}
                            </span>
                            <span className="mt-1 max-w-full truncate text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                              {feature.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary group-hover:text-primary-container">
                          Ver detalle completo
                        </span>
                        <span className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-on-primary">
                          Agendar
                        </span>
                      </div>
                      <p className="mt-4 text-xs text-on-surface-variant">
                        {agent ? "Asesor disponible" : "Consulta directa"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <div className="rounded-3xl bg-surface-container-lowest p-5 pro-card sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-headline font-bold tracking-tight text-primary">
                  {homeContent.recentTitle}
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {homeContent.recentSubtitle}
                </p>
              </div>
              <Link href="/propiedades" target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary">
                Ver propiedades
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
              {recentListings.length === 0 ? (
                <p className="text-sm text-on-surface-variant">No hay nuevas incorporaciones aún.</p>
              ) : (
                recentListings.map((item) => {
                  const availability = getAvailability(item.status);
                  return (
                    <Link
                      key={item.id}
                      href={`/departamentos/${item.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-3xl bg-surface-container-low p-4 transition-transform hover:-translate-y-1"
                    >
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${availability.badgeClassName}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${availability.dotClassName}`} />
                        {availability.label}
                      </span>
                      <h3 className="mt-2 text-lg font-bold text-primary">{item.title}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">{item.neighborhood}</p>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
