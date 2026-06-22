"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";
import { formatPrice } from "@/lib/pricing";
import { propertyTypeLabels } from "@/lib/inmoData";
import FrontHeader from "@/components/inmo/FrontHeader";
import { getAvailability } from "@/lib/availability";

const getCoverImage = (images: string[], coverIndex: number) => {
  if (!images.length) return "";
  return images[coverIndex] ?? images[0];
};

const fallbackHeroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDzWLJ1ZWYuCXv4uUt88LiRLMh6Kis0lEW9bZbHsLtWcsRCgtS5gGDYYDm3MEK1wSfzXnQIttSX6XW5vl8IyMI41AuH0r4TSctOX41XtfS0KEuaesTwOEQxFZ2wrNdo1BNdsgnmE5M3OJ-sO4yPFGYXZXUqaNLuH_jCe2MTLxpYuOf_L-7dDxXfImH4zAUslJI0QMbcb78l6j4xOPWyx_53wqiEyYTmTBUk_sucmOru6E9gt_HroO1fguRWslF7CchhD8Y-sBF9NQ";

const MotionLink = motion.create(Link);

const truncate = (value: string, max = 110) => {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}...`;
};

const getAttributeText = (attributes: Record<string, string[]>) =>
  Object.values(attributes).flat().join(" ").toLowerCase();

const hasFeature = (attributes: Record<string, string[]>, keywords: string[]) => {
  const value = getAttributeText(attributes);
  return keywords.some((keyword) => value.includes(keyword));
};

const isPinnedHome = (attributes: Record<string, string[]>) =>
  attributes.pinned_home?.includes("true");

const sanitizePublicHref = (href?: string) =>
  href === "/acceso" || href === "/registro" || href === "/mi-cuenta"
    ? "/propiedades"
    : href || "/propiedades";

const propertyModuleLinkProps = (href: string) =>
  href.startsWith("/propiedades")
    ? { target: "_blank", rel: "noreferrer" }
    : {};

const getPropertyFeatures = (item: {
  rooms: number;
  area: number;
  attributes: Record<string, string[]>;
}) => [
  {
    icon: "bed",
    label: `${item.rooms} amb.`,
  },
  {
    icon: "square_foot",
    label: `${item.area} m²`,
  },
  {
    icon: "bathtub",
    label: hasFeature(item.attributes, ["baño", "bano", "bath", "ducha"])
      ? "Baño"
      : "Consultar",
  },
  {
    icon: "local_laundry_service",
    label: hasFeature(item.attributes, ["lavadero", "laundry", "lavarropas"])
      ? "Lavadero"
      : "Servicios",
  },
  {
    icon: "directions_car",
    label: hasFeature(item.attributes, ["cochera", "garage", "parking"])
      ? "Cochera"
      : "Opcional",
  },
];

const smoothSpring = {
  type: "spring" as const,
  stiffness: 92,
  damping: 18,
  mass: 0.9,
};

const sectionReveal = {
  hidden: { opacity: 0, y: 34, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: smoothSpring,
  },
};

const staggerGroup = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.05,
    },
  },
};

const brandNameMotion = {
  hidden: { opacity: 0, x: -86, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { ...smoothSpring, duration: 0.95 },
  },
};

const brandXMotion = {
  hidden: { opacity: 0, x: 120, rotate: 18, scale: 1.32, filter: "blur(14px)" },
  visible: {
    opacity: 1,
    x: 0,
    rotate: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 110, damping: 14, mass: 0.92 },
  },
};

export default function HomeStitch() {
  const { state } = useInmoStore();
  const { listings, agents, theme, homeContent, adminUsers } = state;
  const { scrollYProgress } = useScroll();
  const heroImageY = useTransform(scrollYProgress, [0, 0.45], [0, 90]);
  const heroImageScale = useTransform(scrollYProgress, [0, 0.45], [1.05, 1.15]);

  const pinnedHomeListings = listings.filter((item) => isPinnedHome(item.attributes));
  const featuredListings = (
    pinnedHomeListings.length
      ? pinnedHomeListings
      : listings.filter((item) => item.status === "disponible")
  ).slice(0, 6);

  const heroImage = useMemo(() => {
    if (theme.heroImage) return theme.heroImage;
    return fallbackHeroImage;
  }, [theme.heroImage]);

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
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveBannerIndex((current) => (current + 1) % activeBanners.length);
    }, 5200);
    return () => window.clearInterval(interval);
  }, [activeBanners.length]);

  const safeActiveBannerIndex = activeBanners.length
    ? activeBannerIndex % activeBanners.length
    : 0;

  const agentsById = useMemo(
    () => Object.fromEntries(agents.map((agent) => [agent.id, agent])),
    [agents]
  );
  const collaboratorAdminIds = new Set(
    adminUsers.filter((admin) => admin.role === "colaborador").map((admin) => admin.id)
  );
  const isCollaboratorListing = (createdByAdminId?: string) =>
    Boolean(createdByAdminId && collaboratorAdminIds.has(createdByAdminId));

  const availableCount = listings.filter((item) => item.status === "disponible").length;

  const recentListings = useMemo(() => [...listings].slice(-3).reverse(), [listings]);
  const primaryHref = sanitizePublicHref(homeContent.primaryCtaHref);
  const secondaryHref = sanitizePublicHref(homeContent.secondaryCtaHref);
  const secondaryLabel = /cliente|cuenta|acceso/i.test(homeContent.secondaryCtaLabel)
    ? "Consultar ahora"
    : homeContent.secondaryCtaLabel;

  const themeStyles = buildThemeStyles(theme);

  return (
    <div
      style={themeStyles}
      className="bg-background text-on-background font-body selection:bg-primary-fixed selection:text-on-primary-fixed"
    >
      <FrontHeader active="home" />

      <main className="pt-20">
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerGroup}
          className="relative flex min-h-[calc(100svh-4rem)] w-full items-center overflow-hidden bg-primary py-8 sm:min-h-[760px] sm:py-16"
        >
          <div className="absolute inset-0 z-0">
            <motion.img
              style={{ y: heroImageY, scale: heroImageScale }}
              className="h-full w-full object-cover will-change-transform"
              alt="Portada"
              src={heroImage}
              width={1920}
              height={1200}
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/72 to-primary/12" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
          </div>
          <div className="relative z-10 mx-auto w-full max-w-screen-2xl px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={staggerGroup}
              className="connexa-mark mb-6 flex max-w-3xl items-end overflow-hidden text-on-primary sm:mb-8"
            >
              <motion.span
                variants={brandNameMotion}
                className="font-headline text-3xl font-extrabold uppercase tracking-normal sm:text-4xl md:text-7xl"
              >
                Conne
              </motion.span>
              <motion.span
                variants={brandXMotion}
                className="font-headline text-4xl font-extrabold uppercase text-primary-fixed sm:text-5xl md:text-8xl"
              >
                x
              </motion.span>
              <motion.span
                variants={brandNameMotion}
                className="font-headline text-3xl font-extrabold uppercase tracking-normal sm:text-4xl md:text-7xl"
              >
                a
              </motion.span>
            </motion.div>
            <div className="max-w-3xl">
              <motion.span
                variants={sectionReveal}
                className="mb-6 inline-block rounded-full bg-primary-fixed px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-[0_20px_45px_-25px_rgba(255,243,194,0.8)]"
              >
                {homeContent.eyebrow}
              </motion.span>
              <motion.h1
                variants={sectionReveal}
                className="mb-5 text-4xl font-headline font-extrabold leading-[0.95] tracking-tighter text-on-primary sm:text-5xl md:text-8xl"
              >
                {homeContent.title} <br />
                <span className="font-light italic text-primary-fixed">{homeContent.italicTitle}</span>
              </motion.h1>
              <motion.p
                variants={sectionReveal}
                className="max-w-2xl text-sm leading-7 text-on-primary/90 sm:text-base md:text-lg"
              >
                {homeContent.subtitle}
              </motion.p>
              <motion.div variants={sectionReveal} className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={primaryHref}
                    {...propertyModuleLinkProps(primaryHref)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-fixed px-6 py-3 text-sm font-bold text-primary shadow-[0_24px_45px_-28px_rgba(255,243,194,0.85)] sm:w-auto"
                  >
                    {homeContent.primaryCtaLabel}
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </motion.div>
                <motion.div whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={secondaryHref}
                    {...propertyModuleLinkProps(secondaryHref)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/12 px-6 py-3 text-sm font-bold text-on-primary ghost-border backdrop-blur sm:w-auto"
                  >
                    {secondaryLabel}
                  </Link>
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              variants={sectionReveal}
              className="mt-8 max-w-5xl rounded-[2rem] bg-surface-container-lowest/95 p-3 shadow-[0_40px_70px_-24px_rgba(27,54,93,0.5)] backdrop-blur sm:mt-12"
            >
              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
                <div className="rounded-xl bg-surface-container-low p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                    Propiedades
                  </p>
                  <p className="mt-2 text-3xl font-headline font-bold text-primary">{listings.length}</p>
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
                <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={primaryHref}
                    {...propertyModuleLinkProps(primaryHref)}
                    className="brand-gradient flex h-full items-center justify-center gap-2 rounded-3xl px-8 py-4 text-sm font-bold tracking-tight text-on-primary"
                  >
                    Ver propiedades
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {activeBanners.length ? (
          <section className="mx-auto max-w-screen-2xl px-4 pb-8 pt-5 sm:-mt-12 sm:px-6 sm:pt-0 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.98, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.28 }}
              transition={smoothSpring}
              className="relative overflow-hidden rounded-[2rem] bg-primary text-on-primary pro-card"
            >
              <div
                className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ transform: `translateX(-${safeActiveBannerIndex * 100}%)` }}
              >
                {activeBanners.map((banner) => (
                  <Link
                    key={banner.id}
                    href={banner.ctaHref || "/propiedades"}
                    {...propertyModuleLinkProps(banner.ctaHref || "/propiedades")}
                    className="group relative block min-w-full overflow-hidden"
                  >
                    <div className="relative min-h-[22rem] sm:min-h-[26rem]">
                      {banner.image ? (
                        <motion.img
                          src={banner.image}
                          alt={banner.title}
                          width={1600}
                          height={900}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover"
                          whileHover={{ scale: 1.06 }}
                          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        />
                      ) : (
                        <div className="absolute inset-0 brand-gradient" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/78 to-primary/10" />
                      <div className="relative flex min-h-[22rem] max-w-4xl flex-col justify-end p-7 sm:min-h-[26rem] sm:p-10">
                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary-fixed">
                          Destacado
                        </p>
                        <h2 className="mt-4 max-w-3xl text-3xl font-headline font-bold text-on-primary sm:text-5xl">
                          {banner.title}
                        </h2>
                        <p className="mt-3 max-w-2xl text-sm leading-7 text-on-primary/84 sm:text-base">
                          {banner.subtitle}
                        </p>
                        <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-primary-fixed px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary">
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
                  <div className="absolute bottom-5 right-5 flex items-center gap-2 rounded-full bg-surface-container-lowest/12 p-2 backdrop-blur">
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
                  <button
                    type="button"
                    onClick={() =>
                      setActiveBannerIndex(
                        (current) => (current - 1 + activeBanners.length) % activeBanners.length
                      )
                    }
                    className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface-container-lowest/16 text-on-primary backdrop-blur transition hover:bg-surface-container-lowest/24 sm:flex"
                    aria-label="Banner anterior"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveBannerIndex((current) => (current + 1) % activeBanners.length)
                    }
                    className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface-container-lowest/16 text-on-primary backdrop-blur transition hover:bg-surface-container-lowest/24 sm:flex"
                    aria-label="Banner siguiente"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </>
              ) : null}
            </motion.div>
          </section>
        ) : null}

        <section className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <motion.div
              variants={sectionReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.45 }}
              whileHover={{ y: -6 }}
              className="rounded-3xl bg-surface-container-lowest p-6 pro-card"
            >
              <span className="material-symbols-outlined text-3xl text-primary">home_work</span>
              <p className="mt-4 text-sm font-bold text-primary">Catálogo claro</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Explorá propiedades con datos completos, fotos y características relevantes.
              </p>
            </motion.div>
            <motion.div
              variants={sectionReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.45 }}
              transition={{ ...smoothSpring, delay: 0.06 }}
              whileHover={{ y: -6 }}
              className="rounded-3xl bg-surface-container-lowest p-6 pro-card"
            >
              <span className="material-symbols-outlined text-3xl text-primary">apartment</span>
              <p className="mt-4 text-sm font-bold text-primary">Filtros simples</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Encontrá opciones por zona, tipo, ambientes y estado sin pasos innecesarios.
              </p>
            </motion.div>
            <motion.div
              variants={sectionReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.45 }}
              transition={{ ...smoothSpring, delay: 0.12 }}
              whileHover={{ y: -6 }}
              className="rounded-3xl bg-surface-container-lowest p-6 pro-card"
            >
              <span className="material-symbols-outlined text-3xl text-primary">support_agent</span>
              <p className="mt-4 text-sm font-bold text-primary">Consulta directa</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Enviá tus datos desde la ficha y recibí seguimiento comercial sin pasos extra.
              </p>
            </motion.div>
            <motion.div
              variants={sectionReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.45 }}
              transition={{ ...smoothSpring, delay: 0.18 }}
              whileHover={{ y: -6 }}
              className="rounded-3xl bg-surface-container-lowest p-6 pro-card"
            >
              <span className="material-symbols-outlined text-3xl text-primary">forum</span>
              <p className="mt-4 text-sm font-bold text-primary">Consultar sin exponer datos</p>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                Enviá tu consulta desde la ficha y Connexa responde por el canal correcto.
              </p>
            </motion.div>
          </div>
        </section>

        {activePartnerLogos.length ? (
          <section className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
            <motion.div
              variants={sectionReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.22 }}
              className="overflow-hidden rounded-3xl bg-surface-container-lowest p-5 pro-card sm:p-8"
            >
              <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-headline font-bold tracking-tight text-primary">
                    {homeContent.partnersTitle}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
                    {homeContent.partnersSubtitle}
                  </p>
                </div>
              </div>
              <div className="logo-marquee">
                <div className="logo-marquee__track">
                  {[...activePartnerLogos, ...activePartnerLogos].map((logo, index) => {
                    const content = (
                      <div className="logo-marquee__item">
                        <img
                          src={logo.image}
                          alt={logo.name}
                          width={220}
                          height={110}
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
            </motion.div>
          </section>
        ) : null}

        <section className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <div className="mb-8 flex flex-col items-start justify-between gap-5 sm:mb-14 md:flex-row md:items-end">
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
            <div className="rounded-xl bg-surface-container-lowest p-10 text-center shadow-[0_40px_60px_-15px_rgba(27,27,28,0.06)]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                Catálogo vacío
              </p>
              <h3 className="mt-4 text-2xl font-headline font-bold text-primary">
                Todavía no hay propiedades destacadas
              </h3>
              <Link
                href="/propiedades"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-on-primary"
              >
                Ver propiedades
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {featuredListings.slice(0, 6).map((item) => {
                const cover = getCoverImage(item.images, item.coverIndex);
                const video = item.videos?.[0];
                const agent = item.agentId ? agentsById[item.agentId] : undefined;
                const features = getPropertyFeatures(item);
                const availability = getAvailability(item.status);
                const isFromCollaborator = isCollaboratorListing(item.createdByAdminId);
                const narrative = truncate(
                  item.description ||
                    `${item.rooms} ambientes con ${item.area}m² en ${item.neighborhood}.`
                );

                return (
                  <MotionLink
                    key={item.id}
                    href={`/propiedades/${item.id}`}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, y: 36, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.22 }}
                    transition={{ ...smoothSpring, delay: (featuredListings.indexOf(item) % 3) * 0.05 }}
                    whileHover={{ y: -10, scale: 1.012 }}
                    className="group block overflow-hidden rounded-3xl bg-surface-container-lowest pro-card will-change-transform"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {video ? (
                        <video
                          className="h-full w-full object-cover"
                          src={video}
                          muted
                          playsInline
                          loop
                          autoPlay
                        />
                      ) : cover ? (
                        <motion.img
                          src={cover}
                          alt={item.title}
                          width={900}
                          height={720}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                          whileHover={{ scale: 1.07 }}
                          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
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
                          <span>{item.area} m²</span>
                        </div>
                        <p className="mt-2 text-lg font-bold text-primary">
                          {formatPrice(item.price, item.priceUnit, item.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-headline font-bold text-primary">{item.title}</h3>
                      <p className="mt-1 text-sm text-on-surface-variant">
                        {item.neighborhood || "Ubicación privada"}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-on-surface-variant">{narrative}</p>

                      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
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

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-on-surface-variant">
                        <span>{propertyTypeLabels[item.type]}</span>
                        {agent ? <span>Asesor disponible</span> : <span>Consulta directa</span>}
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}>
                          <span className="text-sm font-semibold text-primary group-hover:text-primary-container">
                            Ver detalle completo
                          </span>
                        </motion.div>
                        <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
                          <span className="rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-widest text-on-primary">
                            Agendar
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </MotionLink>
                );
              })}
            </div>
          )}
        </section>

        <section id="como-avanzar" className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.22 }}
            className="rounded-3xl bg-surface-container-lowest p-5 pro-card sm:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                  <h2 className="text-3xl font-headline font-bold tracking-tight text-primary">
                  {homeContent.teamTitle}
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                  {homeContent.teamSubtitle}
                </p>
              </div>
              <Link href="/propiedades" target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary">
                Ver propiedades
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <motion.div whileHover={{ y: -6, scale: 1.01 }}>
                <Link
                  href="/propiedades"
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-3xl bg-surface-container-low p-6"
                >
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Propiedades
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-primary">
                    Ver catálogo completo
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Explorá todas las propiedades disponibles desde un solo lugar.
                  </p>
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -6, scale: 1.01 }}>
                <Link
                  href="/propiedades"
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-3xl bg-surface-container-low p-6"
                >
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Consulta
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-primary">
                    Hacer una consulta
                  </h3>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Entrá a una ficha y enviá tu consulta con tus datos de contacto.
                  </p>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section id="insights" className="mx-auto max-w-screen-2xl px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
          <motion.div
            variants={sectionReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.22 }}
            className="rounded-3xl bg-surface-container-lowest p-5 pro-card sm:p-8"
          >
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
                recentListings.map((item, index) => {
                  const availability = getAvailability(item.status);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.45 }}
                      transition={{ ...smoothSpring, delay: index * 0.06 }}
                      whileHover={{ y: -5, scale: 1.01 }}
                    >
                      <Link
                        href={`/propiedades/${item.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-3xl bg-surface-container-low p-4"
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
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
