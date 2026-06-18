"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import { createId, readFileAsDataUrl, validateBrandingForm } from "@/lib/adminForms";
import type {
  CustomPage,
  CustomPageBlock,
  CustomPageBlockType,
  HomeContent,
  ThemeSettings,
} from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";

export default function AdminBrandingPage() {
  const { state, updateState } = useInmoStore();
  const { theme, homeContent, listings, customPages } = state;

  const [themeForm, setThemeForm] = useState<ThemeSettings>(theme);
  const [homeForm, setHomeForm] = useState<HomeContent>(homeContent);
  const [pageForms, setPageForms] = useState<CustomPage[]>(customPages);
  const [activeTab, setActiveTab] = useState<
    "identity" | "hero" | "menu" | "pages" | "form" | "sections" | "banners" | "logos"
  >(
    "identity"
  );
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");

  useEffect(() => {
    setThemeForm(theme);
  }, [theme]);

  useEffect(() => {
    setHomeForm(homeContent);
  }, [homeContent]);

  useEffect(() => {
    setPageForms(customPages);
  }, [customPages]);

  const previewStyles = useMemo(() => buildThemeStyles(themeForm), [themeForm]);

  const handleThemeSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormNotice("");
    const errors = validateBrandingForm({
      name: themeForm.name,
      primary: themeForm.primary,
      secondary: themeForm.secondary,
    });
    if (errors.length) {
      setFormError(errors[0]);
      return;
    }
    updateState((prev) => ({
      ...prev,
      theme: {
        ...prev.theme,
        name: themeForm.name.trim() || prev.theme.name,
        primary: themeForm.primary.trim(),
        secondary: themeForm.secondary.trim(),
        accent: themeForm.accent?.trim(),
        dark: themeForm.dark?.trim(),
        neutral: themeForm.neutral?.trim(),
        surface: themeForm.surface?.trim(),
        logo: themeForm.logo,
        heroImage: themeForm.heroImage,
        whatsappPhone: themeForm.whatsappPhone?.trim(),
        whatsappMessage: themeForm.whatsappMessage?.trim(),
        usdToArsRate:
          Number.isFinite(Number(themeForm.usdToArsRate)) && Number(themeForm.usdToArsRate) > 0
            ? Number(themeForm.usdToArsRate)
            : prev.theme.usdToArsRate,
      },
    }));
    setFormNotice("Branding actualizado.");
  };

  const handleLogoUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const url = await readFileAsDataUrl(files[0]);
    setThemeForm((prev) => ({ ...prev, logo: url }));
  };

  const handleHeroUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const url = await readFileAsDataUrl(files[0]);
    setThemeForm((prev) => ({ ...prev, heroImage: url }));
  };

  const normalizeMenuHref = (href: string) => {
    const value = href.trim();
    if (!value) return "/";
    if (
      value.startsWith("/") ||
      value.startsWith("#") ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("mailto:") ||
      value.startsWith("tel:")
    ) {
      return value;
    }
    return `/${value}`;
  };

  const normalizeSlug = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const handleHomeSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setFormNotice("");
    const normalizedMenuItems = homeForm.menuItems
      .map((item) => ({
        ...item,
        label: item.label.trim(),
        href: normalizeMenuHref(item.href),
        active: Boolean(item.active),
      }))
      .filter((item) => item.label);
    if (activeTab === "menu" && !normalizedMenuItems.length) {
      setFormError("Agregá al menos un ítem visible para el menú.");
      return;
    }
    updateState((prev) => ({
      ...prev,
      homeContent: {
        ...homeForm,
        banners: homeForm.banners.map((banner) => ({
          ...banner,
          title: banner.title.trim(),
          subtitle: banner.subtitle.trim(),
          ctaLabel: banner.ctaLabel.trim(),
          ctaHref: banner.ctaHref.trim() || "/propiedades",
        })),
        partnerLogos: homeForm.partnerLogos
          .map((logo) => ({
            ...logo,
            name: logo.name.trim(),
            href: logo.href.trim(),
          }))
          .filter((logo) => logo.name || logo.image),
        menuItems: normalizedMenuItems,
        visitForm: Object.fromEntries(
          Object.entries(homeForm.visitForm).map(([key, value]) => [
            key,
            typeof value === "string" ? value.trim() : value,
          ])
        ) as HomeContent["visitForm"],
      },
      customPages: pageForms
        .map((page) => ({
          ...page,
          title: page.title.trim(),
          slug: normalizeSlug(page.slug || page.title),
          excerpt: page.excerpt.trim(),
          active: Boolean(page.active),
          blocks: page.blocks.map((block) => ({
            ...block,
            title: block.title.trim(),
            subtitle: block.subtitle?.trim(),
            body: block.body?.trim(),
            ctaLabel: block.ctaLabel?.trim(),
            ctaHref: block.ctaHref?.trim(),
            items: block.items?.map((item) => ({
              ...item,
              title: item.title.trim(),
              text: item.text.trim(),
              icon: item.icon?.trim(),
            })),
          })),
        }))
        .filter((page) => page.title && page.slug),
    }));
    setHomeForm((prev) => ({ ...prev, menuItems: normalizedMenuItems }));
    setFormNotice(
      activeTab === "menu"
        ? "Menú actualizado. Ya se refleja en el header público."
        : activeTab === "pages"
          ? "Páginas actualizadas."
        : activeTab === "form"
          ? "Formulario actualizado."
          : activeTab === "logos"
            ? "Logos actualizados."
          : "Home editable actualizada."
    );
  };

  const updateHomeField = <K extends keyof HomeContent>(
    key: K,
    value: HomeContent[K]
  ) => {
    setHomeForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateBanner = (
    bannerId: string,
    key: keyof HomeContent["banners"][number],
    value: string | boolean
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      banners: prev.banners.map((banner) =>
        banner.id === bannerId ? { ...banner, [key]: value } : banner
      ),
    }));
  };

  const updateVisitFormField = (
    key: keyof HomeContent["visitForm"],
    value: string
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      visitForm: {
        ...prev.visitForm,
        [key]: value,
      },
    }));
  };

  const handleBannerUpload = async (bannerId: string, files: FileList | null) => {
    if (!files?.length) return;
    const url = await readFileAsDataUrl(files[0]);
    updateBanner(bannerId, "image", url);
  };

  const updatePartnerLogo = (
    logoId: string,
    key: keyof HomeContent["partnerLogos"][number],
    value: string | boolean
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      partnerLogos: prev.partnerLogos.map((logo) =>
        logo.id === logoId ? { ...logo, [key]: value } : logo
      ),
    }));
  };

  const handlePartnerLogoUpload = async (logoId: string, files: FileList | null) => {
    if (!files?.length) return;
    const url = await readFileAsDataUrl(files[0]);
    updatePartnerLogo(logoId, "image", url);
  };

  const updateMenuItem = (
    itemId: string,
    key: keyof HomeContent["menuItems"][number],
    value: string | boolean
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      menuItems: prev.menuItems.map((item) =>
        item.id === itemId ? { ...item, [key]: value } : item
      ),
    }));
  };

  const addMenuItem = () => {
    setHomeForm((prev) => ({
      ...prev,
      menuItems: [
        ...prev.menuItems,
        {
          id: createId(),
          label: "Nuevo ítem",
          href: "/propiedades",
          active: true,
        },
      ],
    }));
  };

  const removeMenuItem = (itemId: string) => {
    setHomeForm((prev) => ({
      ...prev,
      menuItems: prev.menuItems.filter((item) => item.id !== itemId),
    }));
  };

  const addPage = () => {
    const id = createId();
    setPageForms((prev) => [
      ...prev,
      {
        id,
        title: "Nueva página",
        slug: `pagina-${prev.length + 1}`,
        excerpt: "Texto breve para presentar esta página.",
        active: true,
        blocks: [
          {
            id: createId(),
            type: "hero",
            title: "Nueva página",
            subtitle: "Editá este contenido desde el administrador.",
          },
          {
            id: createId(),
            type: "text",
            title: "Contenido",
            body: "Escribí acá el contenido principal de la página.",
          },
        ],
      },
    ]);
  };

  const updatePage = (
    pageId: string,
    key: keyof CustomPage,
    value: string | boolean | CustomPageBlock[]
  ) => {
    setPageForms((prev) =>
      prev.map((page) => (page.id === pageId ? { ...page, [key]: value } : page))
    );
  };

  const removePage = (pageId: string) => {
    setPageForms((prev) => prev.filter((page) => page.id !== pageId));
  };

  const addPageBlock = (pageId: string, type: CustomPageBlockType) => {
    const block: CustomPageBlock = {
      id: createId(),
      type,
      title:
        type === "hero"
          ? "Título principal"
          : type === "cta"
            ? "Llamado a la acción"
            : type === "cards"
              ? "Bloque de beneficios"
              : type === "image"
                ? "Bloque con imagen"
                : "Bloque de texto",
      subtitle: type === "hero" || type === "cta" || type === "image" ? "Texto de apoyo." : "",
      body: type === "text" ? "Escribí uno o más párrafos. Cada salto de línea se muestra como un párrafo." : "",
      image: "",
      ctaLabel: type === "cta" ? "Ver propiedades" : "",
      ctaHref: type === "cta" ? "/propiedades" : "",
      items:
        type === "cards"
          ? [
              {
                id: createId(),
                title: "Card editable",
                text: "Detalle de esta card.",
                icon: "stars",
              },
            ]
          : [],
    };
    setPageForms((prev) =>
      prev.map((page) =>
        page.id === pageId ? { ...page, blocks: [...page.blocks, block] } : page
      )
    );
  };

  const updatePageBlock = (
    pageId: string,
    blockId: string,
    key: keyof CustomPageBlock,
    value: string | CustomPageBlock["items"]
  ) => {
    setPageForms((prev) =>
      prev.map((page) =>
        page.id === pageId
          ? {
              ...page,
              blocks: page.blocks.map((block) =>
                block.id === blockId ? { ...block, [key]: value } : block
              ),
            }
          : page
      )
    );
  };

  const removePageBlock = (pageId: string, blockId: string) => {
    setPageForms((prev) =>
      prev.map((page) =>
        page.id === pageId
          ? { ...page, blocks: page.blocks.filter((block) => block.id !== blockId) }
          : page
      )
    );
  };

  const handlePageBlockImageUpload = async (
    pageId: string,
    blockId: string,
    files: FileList | null
  ) => {
    if (!files?.length) return;
    const url = await readFileAsDataUrl(files[0]);
    updatePageBlock(pageId, blockId, "image", url);
  };

  const addCardItem = (pageId: string, block: CustomPageBlock) => {
    updatePageBlock(pageId, block.id, "items", [
      ...(block.items ?? []),
      { id: createId(), title: "Nueva card", text: "Texto de la card.", icon: "stars" },
    ]);
  };

  const updateCardItem = (
    pageId: string,
    block: CustomPageBlock,
    itemId: string,
    key: "title" | "text" | "icon",
    value: string
  ) => {
    updatePageBlock(
      pageId,
      block.id,
      "items",
      (block.items ?? []).map((item) =>
        item.id === itemId ? { ...item, [key]: value } : item
      )
    );
  };

  const removeCardItem = (pageId: string, block: CustomPageBlock, itemId: string) => {
    updatePageBlock(
      pageId,
      block.id,
      "items",
      (block.items ?? []).filter((item) => item.id !== itemId)
    );
  };

  const addBanner = () => {
    setHomeForm((prev) => ({
      ...prev,
      banners: [
        ...prev.banners,
        {
          id: createId(),
          title: "Nuevo banner",
          subtitle: "Mensaje destacado para la home.",
          image: "",
          ctaLabel: "Ver más",
          ctaHref: "/propiedades",
          active: true,
        },
      ],
    }));
  };

  const removeBanner = (bannerId: string) => {
    setHomeForm((prev) => ({
      ...prev,
      banners: prev.banners.filter((banner) => banner.id !== bannerId),
    }));
  };

  const addPartnerLogo = () => {
    setHomeForm((prev) => ({
      ...prev,
      partnerLogos: [
        ...prev.partnerLogos,
        {
          id: createId(),
          name: "Nuevo aliado",
          image: "",
          href: "",
          active: true,
        },
      ],
    }));
  };

  const removePartnerLogo = (logoId: string) => {
    setHomeForm((prev) => ({
      ...prev,
      partnerLogos: prev.partnerLogos.filter((logo) => logo.id !== logoId),
    }));
  };

  return (
    <AdminShell activeSection="branding" title="Branding y Home">
      <LayoutGroup>
      <motion.div
        layout
        className="mt-8 flex flex-wrap gap-2 rounded-3xl bg-surface-container-low p-2"
      >
        {[
          ["identity", "Identidad", "palette"],
          ["hero", "Hero", "view_carousel"],
          ["menu", "Menú", "segment"],
          ["pages", "Páginas", "article"],
          ["form", "Formulario", "dynamic_form"],
          ["sections", "Secciones", "dashboard_customize"],
          ["banners", "Carrusel", "panorama"],
          ["logos", "Logos", "handshake"],
        ].map(([id, label, icon]) => (
          <motion.button
            key={id}
            layout
            type="button"
            onClick={() => setActiveTab(id as typeof activeTab)}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`relative flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-widest transition ${
              activeTab === id
                ? "text-on-primary"
                : "text-primary hover:bg-surface-container-lowest"
            }`}
          >
            {activeTab === id ? (
              <motion.span
                layoutId="branding-active-tab"
                className="absolute inset-0 rounded-2xl bg-primary shadow-[0_20px_45px_-30px_rgba(27,54,93,0.8)]"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="material-symbols-outlined relative z-10 text-base">{icon}</span>
            <span className="relative z-10">{label}</span>
          </motion.button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
      {activeTab === "identity" ? (
      <motion.section
        key="identity"
        initial={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -12, scale: 0.99, filter: "blur(8px)" }}
        transition={{ type: "spring", stiffness: 180, damping: 24 }}
        className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]"
      >
        <div className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
          <h3 className="text-xl font-headline font-bold text-primary">Identidad del emprendimiento</h3>
          <p className="mt-2 text-xs text-on-surface-variant">
            Estos cambios impactan en Home, catálogo, detalle de propiedades y panel admin.
          </p>

          <form className="mt-6 grid gap-4" onSubmit={handleThemeSubmit}>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Nombre comercial
              <input
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                value={themeForm.name}
                onChange={(event) =>
                  setThemeForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Color primario
                <input
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  value={themeForm.primary}
                  onChange={(event) =>
                    setThemeForm((prev) => ({
                      ...prev,
                      primary: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Color secundario
                <input
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  value={themeForm.secondary}
                  onChange={(event) =>
                    setThemeForm((prev) => ({
                      ...prev,
                      secondary: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["accent", "Crema principal"],
                ["neutral", "Dorado secundario"],
                ["dark", "Texto oscuro"],
                ["surface", "Superficie"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant"
                >
                  {label}
                  <input
                    className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                    value={String(themeForm[key as keyof ThemeSettings] ?? "")}
                    onChange={(event) =>
                      setThemeForm((prev) => ({
                        ...prev,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Logo
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleLogoUpload(event.target.files)}
                className="text-sm"
              />
            </label>

            {themeForm.logo ? (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-surface-container-low p-4">
                <img
                  src={themeForm.logo}
                  alt="Logo"
                  className="h-16 w-auto rounded-xl border border-outline-variant/40 bg-surface-container-lowest object-contain"
                />
                <button
                  type="button"
                  onClick={() => setThemeForm((prev) => ({ ...prev, logo: "" }))}
                  className="inline-flex items-center gap-2 rounded-full border border-error/25 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-error transition hover:bg-error-container"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                  Quitar logo
                </button>
              </div>
            ) : null}

            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Imagen portada home
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleHeroUpload(event.target.files)}
                className="text-sm"
              />
            </label>

            {themeForm.heroImage ? (
              <div className="flex flex-wrap items-center gap-3">
                <img
                  src={themeForm.heroImage}
                  alt="Imagen portada"
                  className="h-20 w-32 rounded-xl border border-outline-variant/40 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setThemeForm((prev) => ({ ...prev, heroImage: "" }))}
                  className="text-[10px] font-bold uppercase tracking-widest text-error"
                >
                  Quitar
                </button>
              </div>
            ) : null}

            <div className="grid gap-4 rounded-3xl bg-surface-container-low p-5 sm:grid-cols-2">
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                WhatsApp del sitio
                <input
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  placeholder="Ej: 5491123456789"
                  value={themeForm.whatsappPhone ?? ""}
                  onChange={(event) =>
                    setThemeForm((prev) => ({
                      ...prev,
                      whatsappPhone: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Mensaje inicial
                <input
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  value={themeForm.whatsappMessage ?? ""}
                  onChange={(event) =>
                    setThemeForm((prev) => ({
                      ...prev,
                      whatsappMessage: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="grid gap-4 rounded-3xl bg-surface-container-low p-5 sm:grid-cols-[1fr_1.2fr]">
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Tipo de cambio USD → ARS
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                  value={themeForm.usdToArsRate ?? 1000}
                  onChange={(event) =>
                    setThemeForm((prev) => ({
                      ...prev,
                      usdToArsRate: Number(event.target.value),
                    }))
                  }
                />
              </label>
              <p className="self-end rounded-2xl bg-surface-container-lowest p-4 text-xs text-on-surface-variant">
                Se usa solamente para ordenar y calcular métricas cuando hay propiedades en USD y ARS. La ficha siempre muestra la moneda cargada en cada propiedad.
              </p>
            </div>

            <button
              type="submit"
              className="mt-2 w-fit rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
            >
              Guardar branding
            </button>
            {formError ? <p className="text-sm text-error">{formError}</p> : null}
            {formNotice ? <p className="text-sm text-primary">{formNotice}</p> : null}
          </form>
        </div>

        <div
          style={previewStyles}
          className="rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]"
        >
          <p className="text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-bold">
            Vista previa rápida
          </p>
          <h3 className="mt-3 text-2xl font-headline font-extrabold text-primary">
            {themeForm.name || "Inmobiliaria"}
          </h3>
          <p className="mt-2 text-sm text-on-surface-variant">
            Así se verán los acentos de color y la identidad en el front.
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl bg-surface-container-high">
            {themeForm.heroImage ? (
              <img src={themeForm.heroImage} alt="Hero preview" className="h-40 w-full object-cover" />
            ) : (
              <div className="h-40 w-full bg-gradient-to-br from-primary/30 to-secondary/30" />
            )}
          </div>

          <div className="mt-6 grid gap-3">
            <button className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary text-left">
              Botón primario
            </button>
            <button className="rounded-lg border border-outline-variant/40 px-5 py-3 text-sm font-semibold text-primary text-left">
              Botón secundario
            </button>
          </div>

          <div className="mt-6 rounded-2xl bg-surface-container-low p-4">
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
              Propiedades cargadas
            </p>
            <p className="mt-2 text-2xl font-bold text-primary">{listings.length}</p>
          </div>
        </div>
      </motion.section>
      ) : null}

      {activeTab !== "identity" ? (
      <motion.section
        key={activeTab}
        initial={{ opacity: 0, y: 18, scale: 0.985, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -12, scale: 0.99, filter: "blur(8px)" }}
        transition={{ type: "spring", stiffness: 180, damping: 24 }}
        className="mt-6 rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-headline font-bold text-primary">
              {activeTab === "hero"
                ? "Hero de la home"
                : activeTab === "menu"
                  ? "Menú público"
                : activeTab === "pages"
                  ? "Páginas administrables"
                : activeTab === "form"
                  ? "Formulario de solicitud"
                : activeTab === "sections"
                  ? "Textos de secciones"
                : activeTab === "banners"
                  ? "Carrusel de banners"
                  : "Logos de aliados"}
            </h3>
            <p className="mt-2 max-w-2xl text-xs text-on-surface-variant">
              {activeTab === "hero"
                ? "Editá el primer impacto: claim, texto principal y botones."
                : activeTab === "menu"
                  ? "Administrá los links visibles del header público. Podés pausar ítems sin eliminarlos."
                : activeTab === "pages"
                  ? "Creá páginas públicas con bloques editables y enlazalas desde el menú."
                : activeTab === "form"
                  ? "Editá labels, textos legales, requisitos y mensajes del formulario de visita o reserva."
                : activeTab === "sections"
                  ? "Ajustá los títulos y bajadas de los bloques principales de la home."
                : activeTab === "banners"
                  ? "Creá banners que se muestran como carrusel en la home."
                  : "Cargá logos de marcas, estudios o aliados para mostrarlos en un carrusel infinito."}
            </p>
          </div>
          {activeTab === "menu" ? (
            <button
              type="button"
              onClick={addMenuItem}
              className="rounded-full bg-primary-fixed px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary"
            >
              Agregar ítem
            </button>
          ) : null}
          {activeTab === "pages" ? (
            <button
              type="button"
              onClick={addPage}
              className="rounded-full bg-primary-fixed px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary"
            >
              Agregar página
            </button>
          ) : null}
          {activeTab === "banners" ? (
            <button
              type="button"
              onClick={addBanner}
              className="rounded-full bg-primary-fixed px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary"
            >
              Agregar banner
            </button>
          ) : null}
          {activeTab === "logos" ? (
            <button
              type="button"
              onClick={addPartnerLogo}
              className="rounded-full bg-primary-fixed px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary"
            >
              Agregar logo
            </button>
          ) : null}
        </div>

        <form className="mt-6 grid gap-6" onSubmit={handleHomeSubmit}>
          {activeTab === "hero" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Eyebrow
              <input
                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                value={homeForm.eyebrow}
                onChange={(event) => updateHomeField("eyebrow", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Título principal
              <input
                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                value={homeForm.title}
                onChange={(event) => updateHomeField("title", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Título destacado
              <input
                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                value={homeForm.italicTitle}
                onChange={(event) => updateHomeField("italicTitle", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Texto hero
              <textarea
                className="min-h-28 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                value={homeForm.subtitle}
                onChange={(event) => updateHomeField("subtitle", event.target.value)}
              />
            </label>
          </div>
          ) : null}

          {activeTab === "hero" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["primaryCtaLabel", "CTA principal"],
              ["primaryCtaHref", "Link principal"],
              ["secondaryCtaLabel", "CTA secundario"],
              ["secondaryCtaHref", "Link secundario"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant"
              >
                {label}
                <input
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={String(homeForm[key as keyof HomeContent] ?? "")}
                  onChange={(event) =>
                    updateHomeField(
                      key as keyof HomeContent,
                      event.target.value as HomeContent[keyof HomeContent]
                    )
                  }
                />
              </label>
            ))}
          </div>
          ) : null}

          {activeTab === "sections" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              ["featuredTitle", "Título propiedades"],
              ["featuredSubtitle", "Texto propiedades"],
              ["partnersTitle", "Título logos aliados"],
              ["partnersSubtitle", "Texto logos aliados"],
              ["teamTitle", "Título bloque de acciones"],
              ["teamSubtitle", "Texto bloque de acciones"],
              ["recentTitle", "Título recientes"],
              ["recentSubtitle", "Texto recientes"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant"
              >
                {label}
                <input
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={String(homeForm[key as keyof HomeContent] ?? "")}
                  onChange={(event) =>
                    updateHomeField(
                      key as keyof HomeContent,
                      event.target.value as HomeContent[keyof HomeContent]
                    )
                  }
                />
              </label>
            ))}
          </div>
          ) : null}

          {activeTab === "form" ? (
          <div className="grid gap-5">
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["title", "Título del formulario"],
                ["subtitle", "Texto introductorio"],
                ["nameLabel", "Label nombre"],
                ["emailLabel", "Label email"],
                ["phoneLabel", "Label teléfono"],
                ["idNumberLabel", "Label DNI / CUIL / CUIT"],
                ["nationalityLabel", "Label nacionalidad"],
                ["ageLabel", "Label edad"],
                ["moveInDateLabel", "Label fecha ingreso"],
                ["durationLabel", "Label duración"],
                ["occupationLabel", "Label ocupación/estudios"],
                ["peopleCountLabel", "Label cantidad personas"],
                ["petsLabel", "Label mascotas"],
                ["petsCountLabel", "Label cantidad mascotas"],
                ["visitAvailabilityLabel", "Label disponibilidad"],
                ["messageLabel", "Label mensaje opcional"],
                ["submitLabel", "Texto botón"],
                ["successMessage", "Mensaje éxito"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className={`grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant ${
                    key === "subtitle" || key === "successMessage" ? "md:col-span-2" : ""
                  }`}
                >
                  {label}
                  <input
                    className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                    value={String(homeForm.visitForm[key as keyof HomeContent["visitForm"]] ?? "")}
                    onChange={(event) =>
                      updateVisitFormField(
                        key as keyof HomeContent["visitForm"],
                        event.target.value
                      )
                    }
                  />
                </label>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["requirementsText", "Texto documentación/ingresos"],
                ["requirementsHighlight", "Texto requisitos"],
                ["acknowledgementLabel", "Texto confirmación legal"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className={`grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant ${
                    key === "acknowledgementLabel" ? "md:col-span-2" : ""
                  }`}
                >
                  {label}
                  <textarea
                    className="min-h-28 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                    value={String(homeForm.visitForm[key as keyof HomeContent["visitForm"]] ?? "")}
                    onChange={(event) =>
                      updateVisitFormField(
                        key as keyof HomeContent["visitForm"],
                        event.target.value
                      )
                    }
                  />
                </label>
              ))}
            </div>
          </div>
          ) : null}

          {activeTab === "menu" ? (
          <div className="grid gap-4">
            {homeForm.menuItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-surface-container-low p-6 text-sm text-on-surface-variant"
              >
                No hay ítems en el menú. Agregá al menos “Inicio” o “Propiedades”.
              </motion.div>
            ) : null}
            {homeForm.menuItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 180, damping: 22, delay: index * 0.025 }}
                whileHover={{ y: -3 }}
                className="grid gap-4 rounded-3xl bg-surface-container-low p-5 lg:grid-cols-[1fr_1fr_auto]"
              >
                <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                  Texto del menú
                  <input
                    className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                    value={item.label}
                    onChange={(event) => updateMenuItem(item.id, "label", event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                  Link
                  <input
                    className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                    value={item.href}
                    onChange={(event) => updateMenuItem(item.id, "href", event.target.value)}
                    placeholder="/propiedades"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <label className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-3 text-xs font-semibold text-primary">
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={(event) =>
                        updateMenuItem(item.id, "active", event.target.checked)
                      }
                    />
                    Visible
                  </label>
                  <button
                    type="button"
                    onClick={() => removeMenuItem(item.id)}
                    className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-error transition hover:bg-error-container"
                  >
                    Eliminar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          ) : null}

          {activeTab === "pages" ? (
          <div className="grid gap-5">
            {pageForms.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-surface-container-low p-6 text-sm text-on-surface-variant"
              >
                Todavía no hay páginas. Creá una y enlazala desde el menú con su slug.
              </motion.div>
            ) : null}

            {pageForms.map((page, pageIndex) => (
              <motion.article
                key={page.id}
                layout
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 170, damping: 22, delay: pageIndex * 0.03 }}
                className="grid gap-5 rounded-[2rem] bg-surface-container-low p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                      Página pública
                    </p>
                    <h4 className="mt-2 text-xl font-headline font-bold text-primary">
                      {page.title || "Página sin título"}
                    </h4>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Link público: /{normalizeSlug(page.slug || page.title)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-3 text-xs font-semibold text-primary">
                      <input
                        type="checkbox"
                        checked={page.active}
                        onChange={(event) =>
                          updatePage(page.id, "active", event.target.checked)
                        }
                      />
                      Publicada
                    </label>
                    <button
                      type="button"
                      onClick={() => removePage(page.id)}
                      className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-error transition hover:bg-error-container"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Título
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={page.title}
                      onChange={(event) => updatePage(page.id, "title", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Slug
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={page.slug}
                      onChange={(event) =>
                        updatePage(page.id, "slug", normalizeSlug(event.target.value))
                      }
                      placeholder="servicios"
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant md:col-span-1">
                    Bajada breve
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={page.excerpt}
                      onChange={(event) => updatePage(page.id, "excerpt", event.target.value)}
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    ["hero", "Hero"],
                    ["text", "Texto"],
                    ["image", "Imagen"],
                    ["cards", "Cards"],
                    ["cta", "CTA"],
                  ].map(([type, label]) => (
                    <button
                      key={`${page.id}-${type}`}
                      type="button"
                      onClick={() => addPageBlock(page.id, type as CustomPageBlockType)}
                      className="rounded-full bg-surface-container-lowest px-4 py-2 text-xs font-bold text-primary transition hover:-translate-y-0.5 hover:bg-primary-fixed"
                    >
                      + {label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-4">
                  {page.blocks.map((block, blockIndex) => (
                    <motion.div
                      key={block.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: blockIndex * 0.02 }}
                      className="grid gap-4 rounded-3xl bg-surface-container-lowest p-5"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <span className="rounded-full bg-primary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                          {block.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePageBlock(page.id, block.id)}
                          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-error hover:bg-error-container"
                        >
                          Quitar bloque
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                          Título del bloque
                          <input
                            className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                            value={block.title}
                            onChange={(event) =>
                              updatePageBlock(page.id, block.id, "title", event.target.value)
                            }
                          />
                        </label>
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                          Subtítulo
                          <input
                            className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                            value={block.subtitle ?? ""}
                            onChange={(event) =>
                              updatePageBlock(page.id, block.id, "subtitle", event.target.value)
                            }
                          />
                        </label>
                      </div>

                      {block.type === "text" ? (
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                          Texto enriquecido simple
                          <textarea
                            className="min-h-40 rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm leading-6 text-on-surface focus:border-primary focus:outline-none"
                            value={block.body ?? ""}
                            onChange={(event) =>
                              updatePageBlock(page.id, block.id, "body", event.target.value)
                            }
                            placeholder="Cada salto de línea se muestra como un párrafo."
                          />
                        </label>
                      ) : null}

                      {block.type === "image" ? (
                        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                          <div className="flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-low">
                            {block.image ? (
                              <img src={block.image} alt={block.title} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                                Imagen
                              </span>
                            )}
                          </div>
                          <label className="grid content-start gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                            Cargar imagen
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) =>
                                handlePageBlockImageUpload(page.id, block.id, event.target.files)
                              }
                              className="rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low px-4 py-3 text-sm"
                            />
                          </label>
                        </div>
                      ) : null}

                      {block.type === "cta" ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                            Texto botón
                            <input
                              className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                              value={block.ctaLabel ?? ""}
                              onChange={(event) =>
                                updatePageBlock(page.id, block.id, "ctaLabel", event.target.value)
                              }
                            />
                          </label>
                          <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                            Link botón
                            <input
                              className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                              value={block.ctaHref ?? ""}
                              onChange={(event) =>
                                updatePageBlock(page.id, block.id, "ctaHref", event.target.value)
                              }
                            />
                          </label>
                        </div>
                      ) : null}

                      {block.type === "cards" ? (
                        <div className="grid gap-3">
                          <button
                            type="button"
                            onClick={() => addCardItem(page.id, block)}
                            className="justify-self-start rounded-full bg-primary-fixed px-4 py-2 text-xs font-bold text-primary"
                          >
                            Agregar card
                          </button>
                          {(block.items ?? []).map((item) => (
                            <div
                              key={item.id}
                              className="grid gap-3 rounded-2xl bg-surface-container-low p-4 md:grid-cols-[140px_1fr_1fr_auto]"
                            >
                              <input
                                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm"
                                value={item.icon ?? ""}
                                onChange={(event) =>
                                  updateCardItem(page.id, block, item.id, "icon", event.target.value)
                                }
                                placeholder="icono"
                              />
                              <input
                                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm"
                                value={item.title}
                                onChange={(event) =>
                                  updateCardItem(page.id, block, item.id, "title", event.target.value)
                                }
                                placeholder="Título"
                              />
                              <input
                                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-sm"
                                value={item.text}
                                onChange={(event) =>
                                  updateCardItem(page.id, block, item.id, "text", event.target.value)
                                }
                                placeholder="Texto"
                              />
                              <button
                                type="button"
                                onClick={() => removeCardItem(page.id, block, item.id)}
                                className="rounded-full px-3 py-2 text-xs font-bold text-error hover:bg-error-container"
                              >
                                Quitar
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </motion.div>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
          ) : null}

          {activeTab === "banners" ? (
          <div className="grid gap-4">
            {homeForm.banners.map((banner, index) => (
              <motion.div
                key={banner.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 170, damping: 22, delay: index * 0.03 }}
                className="grid gap-4 rounded-3xl bg-surface-container-low p-5 lg:grid-cols-[180px_1fr_auto]"
              >
                <div className="overflow-hidden rounded-2xl bg-surface-container-high">
                  {banner.image ? (
                    <img src={banner.image} alt={banner.title} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="brand-gradient flex h-40 items-center justify-center text-xs font-bold uppercase tracking-widest text-on-primary">
                      Banner {index + 1}
                    </div>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Título banner
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={banner.title}
                      onChange={(event) => updateBanner(banner.id, "title", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Link
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={banner.ctaHref}
                      onChange={(event) => updateBanner(banner.id, "ctaHref", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant md:col-span-2">
                    Texto banner
                    <textarea
                      className="min-h-24 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={banner.subtitle}
                      onChange={(event) => updateBanner(banner.id, "subtitle", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    CTA
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={banner.ctaLabel}
                      onChange={(event) => updateBanner(banner.id, "ctaLabel", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Imagen banner
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handleBannerUpload(banner.id, event.target.files)}
                      className="text-sm"
                    />
                  </label>
                </div>

                <div className="flex flex-row items-center gap-3 lg:flex-col lg:items-end">
                  <label className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <input
                      type="checkbox"
                      checked={banner.active}
                      onChange={(event) => updateBanner(banner.id, "active", event.target.checked)}
                    />
                    Activo
                  </label>
                  <button
                    type="button"
                    onClick={() => removeBanner(banner.id)}
                    className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-error"
                  >
                    Eliminar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          ) : null}

          {activeTab === "logos" ? (
          <div className="grid gap-4">
            {homeForm.partnerLogos.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl bg-surface-container-low p-6 text-sm text-on-surface-variant"
              >
                Todavía no hay logos cargados.
              </motion.div>
            ) : null}
            {homeForm.partnerLogos.map((logo, index) => (
              <motion.div
                key={logo.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 170, damping: 22, delay: index * 0.03 }}
                className="grid gap-4 rounded-3xl bg-surface-container-low p-5 lg:grid-cols-[180px_1fr_auto]"
              >
                <div className="flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-lowest p-5">
                  {logo.image ? (
                    <img src={logo.image} alt={logo.name} className="max-h-20 max-w-full object-contain" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-outline-variant/50 text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Logo
                    </div>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Nombre
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={logo.name}
                      onChange={(event) => updatePartnerLogo(logo.id, "name", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Link opcional
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={logo.href}
                      onChange={(event) => updatePartnerLogo(logo.id, "href", event.target.value)}
                      placeholder="https://..."
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant md:col-span-2">
                    Imagen logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => handlePartnerLogoUpload(logo.id, event.target.files)}
                      className="text-sm"
                    />
                  </label>
                </div>

                <div className="flex flex-row items-center gap-3 lg:flex-col lg:items-end">
                  <label className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <input
                      type="checkbox"
                      checked={logo.active}
                      onChange={(event) => updatePartnerLogo(logo.id, "active", event.target.checked)}
                    />
                    Activo
                  </label>
                  <button
                    type="button"
                    onClick={() => removePartnerLogo(logo.id)}
                    className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-error"
                  >
                    Eliminar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
          ) : null}

          <button
            type="submit"
            className="w-fit rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
          >
            {activeTab === "menu"
              ? "Guardar menú"
              : activeTab === "form"
                ? "Guardar formulario"
              : activeTab === "logos"
                ? "Guardar logos"
                : "Guardar home"}
          </button>
          {formError ? <p className="text-sm text-error">{formError}</p> : null}
          {formNotice ? <p className="text-sm text-primary">{formNotice}</p> : null}
        </form>
      </motion.section>
      ) : null}
      </AnimatePresence>
      </LayoutGroup>
    </AdminShell>
  );
}
