"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import {
  createId,
  optimizeImageFileForUpload,
  validateBrandingForm,
} from "@/lib/adminForms";
import { uploadAdminMedia } from "@/lib/adminMedia";
import type {
  CustomPage,
  CustomPageBlock,
  CustomPageBlockType,
  HomeContent,
  ThemeSettings,
  WorkWithUsField,
  WorkWithUsFieldType,
} from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";
import { readAdminSession } from "@/lib/session";
import { buildThemeStyles } from "@/lib/theme";
import { isSupportedVideoUrl } from "@/lib/video";

export default function AdminBrandingPage() {
  const { state, updateState } = useInmoStore();
  const { theme, homeContent, listings, customPages, filterGroups } = state;
  const [adminSession] = useState(() => readAdminSession());

  const [themeForm, setThemeForm] = useState<ThemeSettings>(theme);
  const [homeForm, setHomeForm] = useState<HomeContent>(homeContent);
  const [pageForms, setPageForms] = useState<CustomPage[]>(customPages);
  const [activeTab, setActiveTab] = useState<
    | "identity"
    | "hero"
    | "menu"
    | "pages"
    | "form"
    | "sections"
    | "ba"
    | "banners"
    | "logos"
    | "work"
    | "footer"
  >(
    "identity"
  );
  const [formError, setFormError] = useState("");
  const [formNotice, setFormNotice] = useState("");
  const [uploadingField, setUploadingField] = useState("");
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [expandedPageBlockId, setExpandedPageBlockId] = useState<string | null>(null);
  const [draggedPageBlockId, setDraggedPageBlockId] = useState<string | null>(null);

  const hasEmbeddedMedia = (value: unknown): boolean => {
    if (typeof value === "string") return value.startsWith("data:") || value.startsWith("blob:");
    if (Array.isArray(value)) return value.some(hasEmbeddedMedia);
    if (value && typeof value === "object") {
      return Object.values(value as Record<string, unknown>).some(hasEmbeddedMedia);
    }
    return false;
  };

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

  const persistBrandingSettings = async (
    nextTheme: ThemeSettings,
    nextHomeContent: HomeContent,
    nextCustomPages: CustomPage[]
  ) => {
    const response = await fetch("/api/admin/branding-state", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(adminSession?.adminId ? { "x-admin-id": adminSession.adminId } : {}),
      },
      body: JSON.stringify({
        theme: nextTheme,
        homeContent: nextHomeContent,
        customPages: nextCustomPages,
        filterGroups,
      }),
    });
    const payload = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;
    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error ?? "No se pudo guardar branding.");
    }
  };

  const handleThemeSubmit = async (event: FormEvent) => {
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
    if (hasEmbeddedMedia({ logo: themeForm.logo, heroImage: themeForm.heroImage })) {
      setFormError("Hay una imagen embebida en base64. Volvé a subirla desde el botón de archivo para guardarla en Storage.");
      return;
    }
    const nextTheme = {
      ...theme,
      name: themeForm.name.trim() || theme.name,
      primary: themeForm.primary.trim(),
      secondary: themeForm.secondary.trim(),
      accent: themeForm.accent?.trim(),
      dark: themeForm.dark?.trim(),
      neutral: themeForm.neutral?.trim(),
      background: themeForm.background?.trim(),
      surface: themeForm.surface?.trim(),
      homePrimary: themeForm.homePrimary?.trim(),
      homeSecondary: themeForm.homeSecondary?.trim(),
      homeAccent: themeForm.homeAccent?.trim(),
      homeDark: themeForm.homeDark?.trim(),
      homeNeutral: themeForm.homeNeutral?.trim(),
      homeBackground: themeForm.homeBackground?.trim(),
      homeSurface: themeForm.homeSurface?.trim(),
      logo: themeForm.logo,
      heroImage: themeForm.heroImage,
      whatsappPhone: themeForm.whatsappPhone?.trim(),
      whatsappMessage: themeForm.whatsappMessage?.trim(),
      usdToArsRate:
        Number.isFinite(Number(themeForm.usdToArsRate)) && Number(themeForm.usdToArsRate) > 0
          ? Number(themeForm.usdToArsRate)
          : theme.usdToArsRate,
    };
    try {
      await persistBrandingSettings(nextTheme, homeContent, customPages);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar branding.");
      return;
    }
    updateState((prev) => ({
      ...prev,
      theme: nextTheme,
    }), { persist: false });
    setFormNotice("Branding actualizado.");
  };

  const uploadOptimizedImage = async (
    file: File,
    field: string,
    opts: { maxSize?: number; quality?: number } = {}
  ) => {
    setUploadingField(field);
    try {
      const optimized = await optimizeImageFileForUpload(file, {
        maxSize: opts.maxSize ?? 1600,
        quality: opts.quality ?? 0.78,
        mimeType: "image/webp",
      });
      return await uploadAdminMedia(optimized, "image", adminSession?.adminId);
    } finally {
      setUploadingField("");
    }
  };

  const handleLogoUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const url = await uploadOptimizedImage(files[0], "logo", {
        maxSize: 520,
        quality: 0.82,
      });
      setThemeForm((prev) => ({ ...prev, logo: url }));
      setFormNotice("Logo subido a Storage.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo subir el logo.");
    }
  };

  const handleHeroUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const url = await uploadOptimizedImage(files[0], "theme-hero", {
        maxSize: 1800,
        quality: 0.76,
      });
      setThemeForm((prev) => ({ ...prev, heroImage: url }));
      setFormNotice("Imagen de portada subida a Storage.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo subir la imagen.");
    }
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

  const handleHomeSubmit = async (event: FormEvent) => {
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
    const nextHomeContent = {
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
      footer: {
        ...homeForm.footer,
        backgroundColor: homeForm.footer.backgroundColor?.trim(),
        textColor: homeForm.footer.textColor?.trim(),
        accentColor: homeForm.footer.accentColor?.trim(),
        linkColor: homeForm.footer.linkColor?.trim(),
        buttonBackgroundColor: homeForm.footer.buttonBackgroundColor?.trim(),
        buttonTextColor: homeForm.footer.buttonTextColor?.trim(),
        sections: homeForm.footer.sections
          .map((section) => ({
            ...section,
            title: section.title.trim(),
            active: Boolean(section.active),
            links: section.links
              .map((link) => ({
                ...link,
                label: link.label.trim(),
                href: normalizeMenuHref(link.href),
                active: Boolean(link.active),
              }))
              .filter((link) => link.label),
          }))
          .filter((section) => section.title || section.links.length),
        socialLinks: homeForm.footer.socialLinks
          .map((link) => ({
            ...link,
            label: link.label.trim(),
            href: link.href.trim(),
            icon: link.icon.trim() || "link",
            active: Boolean(link.active),
          }))
          .filter((link) => link.label || link.href),
      },
      visitForm: Object.fromEntries(
          Object.entries(homeForm.visitForm).map(([key, value]) => [
            key,
            typeof value === "string" ? value.trim() : value,
          ])
      ) as HomeContent["visitForm"],
      workWithUs: {
        ...homeForm.workWithUs,
        active: Boolean(homeForm.workWithUs.active),
        eyebrow: homeForm.workWithUs.eyebrow.trim(),
        title: homeForm.workWithUs.title.trim(),
        subtitle: homeForm.workWithUs.subtitle.trim(),
        introTitle: homeForm.workWithUs.introTitle.trim(),
        introText: homeForm.workWithUs.introText.trim(),
        formTitle: homeForm.workWithUs.formTitle.trim(),
        formSubtitle: homeForm.workWithUs.formSubtitle.trim(),
        submitLabel: homeForm.workWithUs.submitLabel.trim(),
        successMessage: homeForm.workWithUs.successMessage.trim(),
        allowCvUpload: Boolean(homeForm.workWithUs.allowCvUpload),
        destinationType: homeForm.workWithUs.destinationType,
        destinationEmail: homeForm.workWithUs.destinationEmail.trim(),
        destinationWhatsapp: homeForm.workWithUs.destinationWhatsapp.replace(/[^\d]/g, ""),
        whatsappMessage: homeForm.workWithUs.whatsappMessage.trim(),
        fields: homeForm.workWithUs.fields
          .map((field) => ({
            ...field,
            label: field.label.trim(),
            placeholder: field.placeholder?.trim() ?? "",
            type: field.type,
            active: Boolean(field.active),
            required: Boolean(field.required),
            options: (field.options ?? []).map((option) => option.trim()).filter(Boolean),
          }))
          .filter((field) => field.label),
      },
    };
    const nextCustomPages = pageForms
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
            videoUrl: block.videoUrl?.trim(),
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
        .filter((page) => page.title && page.slug);

    const invalidVideoBlock = nextCustomPages
      .flatMap((page) => page.blocks)
      .find(
        (block) =>
          block.type === "video" &&
          block.videoUrl &&
          !isSupportedVideoUrl(block.videoUrl)
      );
    if (invalidVideoBlock) {
      setFormError(
        "El enlace de video no es compatible. Usá YouTube, Vimeo, Instagram, TikTok, Facebook o un archivo MP4/WebM público."
      );
      return;
    }

    if (
      activeTab === "work" &&
      (nextHomeContent.workWithUs.destinationType === "email" ||
        nextHomeContent.workWithUs.destinationType === "both") &&
      !nextHomeContent.workWithUs.destinationEmail
    ) {
      setFormError("Agregá un email destino o cambiá el destino a WhatsApp.");
      return;
    }

    if (
      activeTab === "work" &&
      (nextHomeContent.workWithUs.destinationType === "whatsapp" ||
        nextHomeContent.workWithUs.destinationType === "both") &&
      !nextHomeContent.workWithUs.destinationWhatsapp
    ) {
      setFormError("Agregá un WhatsApp destino o cambiá el destino a Email.");
      return;
    }

    if (hasEmbeddedMedia({ home: nextHomeContent, pages: nextCustomPages })) {
      setFormError("Hay imágenes embebidas en base64. Volvé a subirlas desde el botón de archivo para guardarlas en Storage.");
      return;
    }

    try {
      await persistBrandingSettings(theme, nextHomeContent, nextCustomPages);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar la home.");
      return;
    }
    updateState((prev) => ({
      ...prev,
      homeContent: nextHomeContent,
      customPages: nextCustomPages,
    }), { persist: false });
    setHomeForm((prev) => ({ ...prev, menuItems: normalizedMenuItems }));
    setFormNotice(
      activeTab === "menu"
        ? "Menú actualizado. Ya se refleja en el header público."
        : activeTab === "pages"
          ? "Páginas actualizadas."
        : activeTab === "form"
          ? "Formulario actualizado."
        : activeTab === "ba"
          ? "Página Buenos Aires actualizada."
        : activeTab === "footer"
          ? "Footer actualizado."
        : activeTab === "work"
          ? "Trabaja con nosotros actualizado."
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

  const updateWorkWithUsField = <K extends keyof HomeContent["workWithUs"]>(
    key: K,
    value: HomeContent["workWithUs"][K]
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      workWithUs: {
        ...prev.workWithUs,
        [key]: value,
      },
    }));
  };

  const updateWorkField = (
    fieldId: string,
    key: keyof WorkWithUsField,
    value: string | boolean | string[]
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      workWithUs: {
        ...prev.workWithUs,
        fields: prev.workWithUs.fields.map((field) =>
          field.id === fieldId ? { ...field, [key]: value } : field
        ),
      },
    }));
  };

  const addWorkField = () => {
    setHomeForm((prev) => ({
      ...prev,
      workWithUs: {
        ...prev.workWithUs,
        fields: [
          ...prev.workWithUs.fields,
          {
            id: createId(),
            label: "Nuevo campo",
            type: "text",
            required: false,
            active: true,
            placeholder: "",
            options: [],
          },
        ],
      },
    }));
  };

  const removeWorkField = (fieldId: string) => {
    setHomeForm((prev) => ({
      ...prev,
      workWithUs: {
        ...prev.workWithUs,
        fields: prev.workWithUs.fields.filter((field) => field.id !== fieldId),
      },
    }));
  };

  const updateBuenosAiresField = <K extends keyof HomeContent["buenosAires"]>(
    key: K,
    value: HomeContent["buenosAires"][K]
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      buenosAires: {
        ...prev.buenosAires,
        [key]: value,
        ...(key === "heroImage" && typeof value === "string" && value.trim()
          ? { heroVideo: "" }
          : {}),
        ...(key === "heroVideo" && typeof value === "string" && value.trim()
          ? { heroImage: "" }
          : {}),
      },
    }));
  };

  const updateBuenosAiresFact = (
    index: number,
    key: keyof HomeContent["buenosAires"]["quickFacts"][number],
    value: string | boolean
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      buenosAires: {
        ...prev.buenosAires,
        quickFacts: prev.buenosAires.quickFacts.map((fact, factIndex) =>
          factIndex === index ? { ...fact, [key]: value } : fact
        ),
      },
    }));
  };

  const addBuenosAiresFact = () => {
    setHomeForm((prev) => ({
      ...prev,
      buenosAires: {
        ...prev.buenosAires,
        quickFacts: [
          ...prev.buenosAires.quickFacts,
          {
            id: createId(),
            text: "Nuevo dato destacado",
            active: true,
            backgroundColor: "",
            textColor: "",
            accentColor: "",
            borderColor: "",
          },
        ],
      },
    }));
  };

  const removeBuenosAiresFact = (index: number) => {
    setHomeForm((prev) => ({
      ...prev,
      buenosAires: {
        ...prev.buenosAires,
        quickFacts: prev.buenosAires.quickFacts.filter((_, factIndex) => factIndex !== index),
      },
    }));
  };

  const updateBuenosAiresSection = (
    sectionId: string,
    key: keyof HomeContent["buenosAires"]["sections"][number],
    value: string | boolean
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      buenosAires: {
        ...prev.buenosAires,
        sections: prev.buenosAires.sections.map((section) =>
          section.id === sectionId ? { ...section, [key]: value } : section
        ),
      },
    }));
  };

  const addBuenosAiresSection = () => {
    setHomeForm((prev) => ({
      ...prev,
      buenosAires: {
        ...prev.buenosAires,
        sections: [
          ...prev.buenosAires.sections,
          {
            id: createId(),
            title: "Nueva sección",
            eyebrow: "Categoría",
            text: "Texto breve para la card.",
            detail: "Texto ampliado para el bloque interno.",
            cardCtaLabel: "Ver capítulo",
            cardCtaHref: "",
            chapterTitle: "Título del capítulo",
            chapterBody: "Contenido ampliado del capítulo.",
            primaryCtaLabel: "CTA principal",
            primaryCtaHref: "/propiedades",
            secondaryCtaLabel: "CTA secundario",
            secondaryCtaHref: "",
            backgroundColor: "",
            textColor: "",
            accentColor: "",
            icon: "location_city",
            image: "",
            active: true,
          },
        ],
      },
    }));
  };

  const removeBuenosAiresSection = (sectionId: string) => {
    setHomeForm((prev) => ({
      ...prev,
      buenosAires: {
        ...prev.buenosAires,
        sections: prev.buenosAires.sections.filter((section) => section.id !== sectionId),
      },
    }));
  };

  const handleBuenosAiresSectionImageUpload = async (
    sectionId: string,
    files: FileList | null
  ) => {
    if (!files?.length) return;
    try {
      const url = await uploadOptimizedImage(files[0], `ba-section-${sectionId}`, {
        maxSize: 1400,
        quality: 0.78,
      });
      updateBuenosAiresSection(sectionId, "image", url);
      setFormNotice("Imagen de sección subida a Storage.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo subir la imagen.");
    }
  };

  const handleBuenosAiresHeroImageUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    try {
      const url = await uploadOptimizedImage(files[0], "ba-hero-image", {
        maxSize: 2200,
        quality: 0.78,
      });
      updateBuenosAiresField("heroImage", url);
      setFormNotice("Imagen hero subida a Storage. Se quitó el video porque son excluyentes.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo subir la imagen.");
    }
  };

  const handleBuenosAiresHeroVideoUpload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploadingField("ba-hero-video");
    try {
      const url = await uploadAdminMedia(file, "video", adminSession?.adminId);
      updateBuenosAiresField("heroVideo", url);
      setFormNotice("Video hero subido a Storage. Se quitó la imagen porque son excluyentes.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo subir el video.");
    } finally {
      setUploadingField("");
    }
  };

  const handleBannerUpload = async (bannerId: string, files: FileList | null) => {
    if (!files?.length) return;
    try {
      const url = await uploadOptimizedImage(files[0], `banner-${bannerId}`, {
        maxSize: 2400,
        quality: 0.86,
      });
      updateBanner(bannerId, "image", url);
      setFormNotice("Banner subido a Storage en alta definición.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo subir el banner.");
    }
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
    try {
      const url = await uploadOptimizedImage(files[0], `partner-logo-${logoId}`, {
        maxSize: 520,
        quality: 0.84,
      });
      updatePartnerLogo(logoId, "image", url);
      setFormNotice("Logo de aliado subido a Storage.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo subir el logo.");
    }
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

  const updateFooterField = <K extends keyof HomeContent["footer"]>(
    key: K,
    value: HomeContent["footer"][K]
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        [key]: value,
      },
    }));
  };

  const updateFooterSection = (
    sectionId: string,
    key: "title" | "active",
    value: string | boolean
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        sections: prev.footer.sections.map((section) =>
          section.id === sectionId ? { ...section, [key]: value } : section
        ),
      },
    }));
  };

  const addFooterSection = () => {
    setHomeForm((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        sections: [
          ...prev.footer.sections,
          {
            id: createId(),
            title: "Nueva sección",
            active: true,
            links: [
              {
                id: createId(),
                label: "Nuevo link",
                href: "/propiedades",
                active: true,
              },
            ],
          },
        ],
      },
    }));
  };

  const removeFooterSection = (sectionId: string) => {
    setHomeForm((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        sections: prev.footer.sections.filter((section) => section.id !== sectionId),
      },
    }));
  };

  const updateFooterLink = (
    sectionId: string,
    linkId: string,
    key: keyof HomeContent["footer"]["sections"][number]["links"][number],
    value: string | boolean
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        sections: prev.footer.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                links: section.links.map((link) =>
                  link.id === linkId ? { ...link, [key]: value } : link
                ),
              }
            : section
        ),
      },
    }));
  };

  const addFooterLink = (sectionId: string) => {
    setHomeForm((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        sections: prev.footer.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                links: [
                  ...section.links,
                  {
                    id: createId(),
                    label: "Nuevo link",
                    href: "/propiedades",
                    active: true,
                  },
                ],
              }
            : section
        ),
      },
    }));
  };

  const removeFooterLink = (sectionId: string, linkId: string) => {
    setHomeForm((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        sections: prev.footer.sections.map((section) =>
          section.id === sectionId
            ? { ...section, links: section.links.filter((link) => link.id !== linkId) }
            : section
        ),
      },
    }));
  };

  const updateSocialLink = (
    linkId: string,
    key: keyof HomeContent["footer"]["socialLinks"][number],
    value: string | boolean
  ) => {
    setHomeForm((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        socialLinks: prev.footer.socialLinks.map((link) =>
          link.id === linkId ? { ...link, [key]: value } : link
        ),
      },
    }));
  };

  const addSocialLink = () => {
    setHomeForm((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        socialLinks: [
          ...prev.footer.socialLinks,
          {
            id: createId(),
            label: "Nueva red",
            href: "",
            icon: "link",
            active: true,
          },
        ],
      },
    }));
  };

  const removeSocialLink = (linkId: string) => {
    setHomeForm((prev) => ({
      ...prev,
      footer: {
        ...prev.footer,
        socialLinks: prev.footer.socialLinks.filter((link) => link.id !== linkId),
      },
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
    setEditingPageId(id);
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
    setEditingPageId((current) => (current === pageId ? null : current));
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
              : type === "video"
                ? "Video"
              : type === "image"
                ? "Bloque con imagen"
                : "Bloque de texto",
      subtitle: type === "hero" || type === "cta" || type === "image" ? "Texto de apoyo." : "",
      body: type === "text" ? "Escribí uno o más párrafos. Cada salto de línea se muestra como un párrafo." : "",
      image: "",
      videoUrl: "",
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
    setExpandedPageBlockId(block.id);
  };

  const movePageBlock = (
    pageId: string,
    blockId: string,
    direction: -1 | 1
  ) => {
    setPageForms((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        const currentIndex = page.blocks.findIndex((block) => block.id === blockId);
        const nextIndex = currentIndex + direction;
        if (currentIndex < 0 || nextIndex < 0 || nextIndex >= page.blocks.length) {
          return page;
        }
        const blocks = [...page.blocks];
        const [moved] = blocks.splice(currentIndex, 1);
        blocks.splice(nextIndex, 0, moved);
        return { ...page, blocks };
      })
    );
  };

  const dropPageBlock = (pageId: string, targetBlockId: string) => {
    if (!draggedPageBlockId || draggedPageBlockId === targetBlockId) return;
    setPageForms((prev) =>
      prev.map((page) => {
        if (page.id !== pageId) return page;
        const fromIndex = page.blocks.findIndex(
          (block) => block.id === draggedPageBlockId
        );
        const toIndex = page.blocks.findIndex((block) => block.id === targetBlockId);
        if (fromIndex < 0 || toIndex < 0) return page;
        const blocks = [...page.blocks];
        const [moved] = blocks.splice(fromIndex, 1);
        blocks.splice(toIndex, 0, moved);
        return { ...page, blocks };
      })
    );
    setDraggedPageBlockId(null);
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
    try {
      const url = await uploadOptimizedImage(files[0], `page-block-${blockId}`, {
        maxSize: 1400,
        quality: 0.78,
      });
      updatePageBlock(pageId, blockId, "image", url);
      setFormNotice("Imagen de página subida a Storage.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo subir la imagen.");
    }
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
          ["ba", "Buenos Aires", "travel_explore"],
          ["work", "Trabaja", "badge"],
          ["banners", "Carrusel", "panorama"],
          ["logos", "Logos", "handshake"],
          ["footer", "Footer", "web_asset"],
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
                ["background", "Background"],
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

            <div className="rounded-3xl border border-outline-variant/25 bg-surface-container-low p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Colores solo Home
                  </p>
                  <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                    Si dejás estos campos vacíos, la home usa el branding general. Estos colores no afectan catálogo, ficha ni admin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setThemeForm((prev) => ({
                      ...prev,
                      homePrimary: "",
                      homeSecondary: "",
                      homeAccent: "",
                      homeNeutral: "",
                      homeDark: "",
                      homeBackground: "",
                      homeSurface: "",
                    }))
                  }
                  className="rounded-full border border-outline-variant/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary transition hover:border-primary"
                >
                  Heredar global
                </button>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["homePrimary", "Primario home"],
                  ["homeSecondary", "Secundario home"],
                  ["homeAccent", "Acento home"],
                  ["homeNeutral", "Neutral home"],
                  ["homeDark", "Texto home"],
                  ["homeBackground", "Background home"],
                  ["homeSurface", "Superficie home"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant"
                  >
                    {label}
                    <input
                      className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface focus:border-primary focus:outline-none"
                      placeholder="Hereda global"
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
                : activeTab === "ba"
                  ? "Página Buenos Aires"
                : activeTab === "work"
                  ? "Trabaja con nosotros"
                : activeTab === "banners"
                  ? "Carrusel de banners"
                : activeTab === "footer"
                  ? "Footer del sitio"
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
                : activeTab === "ba"
                  ? "Administrá el contenido inmersivo de Buenos Aires: hero, video, datos rápidos, cards y llamados a la acción."
                : activeTab === "work"
                  ? "Administrá la página de postulaciones: textos, campos, CV y destino de consultas."
                : activeTab === "banners"
                  ? "Creá banners que se muestran como carrusel en la home."
                : activeTab === "footer"
                  ? "Administrá secciones del pie, cookies, legales y redes sociales."
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
          {activeTab === "footer" ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addFooterSection}
                className="rounded-full bg-primary-fixed px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary"
              >
                Agregar sección
              </button>
              <button
                type="button"
                onClick={addSocialLink}
                className="rounded-full bg-surface-container-low px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary"
              >
                Agregar red
              </button>
            </div>
          ) : null}
          {activeTab === "ba" ? (
            <button
              type="button"
              onClick={addBuenosAiresSection}
              className="rounded-full bg-primary-fixed px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary"
            >
              Agregar sección
            </button>
          ) : null}
          {activeTab === "work" ? (
            <button
              type="button"
              onClick={addWorkField}
              className="rounded-full bg-primary-fixed px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary"
            >
              Agregar campo
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

          {activeTab === "hero" ? (
            <div className="grid gap-4 rounded-2xl bg-surface-container-low p-4 md:grid-cols-2">
              {[
                ["heroOverlayColor", "Color velo lateral", themeForm.primary],
                ["heroFadeColor", "Color degradado inferior", themeForm.background || "#ffffff"],
              ].map(([key, label, fallback]) => (
                <label
                  key={key}
                  className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant"
                >
                  {label}
                  <span className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-2">
                    <input
                      type="color"
                      value={String(homeForm[key as keyof HomeContent] || fallback || "#ffffff")}
                      onChange={(event) =>
                        updateHomeField(
                          key as keyof HomeContent,
                          event.target.value as HomeContent[keyof HomeContent]
                        )
                      }
                      className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                    />
                    <input
                      value={String(homeForm[key as keyof HomeContent] ?? "")}
                      onChange={(event) =>
                        updateHomeField(
                          key as keyof HomeContent,
                          event.target.value as HomeContent[keyof HomeContent]
                        )
                      }
                      placeholder={String(fallback || "#ffffff")}
                      className="min-w-0 flex-1 bg-transparent text-sm normal-case tracking-normal text-on-surface outline-none"
                    />
                  </span>
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

            {pageForms.map((page) => (
              <div
                key={`page-row-${page.id}`}
                className="flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low px-5 py-3"
              >
                <h4 className="min-w-0 truncate text-base font-bold text-primary">
                  {page.title || "Página sin título"}
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPageId(page.id);
                    setExpandedPageBlockId(null);
                  }}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary transition hover:-translate-y-0.5"
                  style={{ color: "var(--color-on-primary)" }}
                >
                  <span className="material-symbols-outlined text-base">edit</span>
                  Editar
                </button>
              </div>
            ))}

            <AnimatePresence>
              {editingPageId ? (
                <motion.button
                  type="button"
                  aria-label="Cerrar editor"
                  onClick={() => setEditingPageId(null)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[90] cursor-default bg-primary/45 backdrop-blur-sm"
                />
              ) : null}
            </AnimatePresence>

            {pageForms.filter((page) => page.id === editingPageId).map((page) => (
              <motion.article
                key={page.id}
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 190, damping: 24 }}
                className="fixed inset-x-2 bottom-2 top-2 z-[100] mx-auto grid max-w-3xl content-start gap-4 overflow-y-auto rounded-2xl bg-surface-container-low p-3 shadow-2xl sm:inset-x-6 sm:bottom-[5vh] sm:top-[5vh] sm:rounded-3xl sm:p-5"
              >
                <div className="sticky -top-3 z-10 flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant/20 bg-surface-container-low/95 px-1 py-3 backdrop-blur-md sm:-top-5">
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
                    <button
                      type="submit"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-on-primary transition hover:-translate-y-0.5"
                      style={{ color: "var(--color-on-primary)" }}
                    >
                      <span className="material-symbols-outlined text-base">save</span>
                      Guardar cambios
                    </button>
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
                      onClick={() => setEditingPageId(null)}
                      className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-surface-container-lowest text-primary transition hover:bg-primary-fixed"
                      aria-label="Cerrar editor"
                    >
                      <span className="material-symbols-outlined">close</span>
                    </button>
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
                    ["video", "Video social"],
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
                      draggable
                      onDragStart={() => setDraggedPageBlockId(block.id)}
                      onDragEnd={() => setDraggedPageBlockId(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => dropPageBlock(page.id, block.id)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: blockIndex * 0.02 }}
                      className={`grid gap-3 rounded-2xl border bg-surface-container-lowest p-3 transition sm:p-4 ${
                        draggedPageBlockId === block.id
                          ? "border-primary opacity-60"
                          : "border-outline-variant/20"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="material-symbols-outlined cursor-grab touch-none text-xl text-on-surface-variant active:cursor-grabbing"
                          title="Arrastrar para reordenar"
                        >
                          drag_indicator
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPageBlockId((current) =>
                              current === block.id ? null : block.id
                            )
                          }
                          className="min-w-0 flex-1 cursor-pointer text-left"
                        >
                          <span className="block truncate text-sm font-bold text-primary">
                            {block.title || "Sección sin título"}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                            {block.type}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => movePageBlock(page.id, block.id, -1)}
                          disabled={blockIndex === 0}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface-container-low text-primary disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Subir sección"
                        >
                          <span className="material-symbols-outlined text-lg">arrow_upward</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => movePageBlock(page.id, block.id, 1)}
                          disabled={blockIndex === page.blocks.length - 1}
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface-container-low text-primary disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Bajar sección"
                        >
                          <span className="material-symbols-outlined text-lg">arrow_downward</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedPageBlockId((current) =>
                              current === block.id ? null : block.id
                            )
                          }
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary-fixed text-primary"
                          aria-label="Editar sección"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {expandedPageBlockId === block.id ? "expand_less" : "edit"}
                          </span>
                        </button>
                      </div>

                      {expandedPageBlockId === block.id ? (
                      <>
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

                      {block.type === "video" ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant md:col-span-2">
                            Enlace del video
                            <input
                              type="url"
                              className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm normal-case tracking-normal text-on-surface focus:border-primary focus:outline-none"
                              value={block.videoUrl ?? ""}
                              onChange={(event) =>
                                updatePageBlock(page.id, block.id, "videoUrl", event.target.value)
                              }
                              placeholder="YouTube, Vimeo, Instagram, TikTok, Facebook o MP4 público"
                            />
                          </label>
                          <div className="flex min-h-32 items-center justify-center overflow-hidden rounded-2xl bg-surface-container-low">
                            {block.image ? (
                              <img
                                src={block.image}
                                alt=""
                                width={640}
                                height={360}
                                className="aspect-video h-full w-full object-cover"
                              />
                            ) : (
                              <span className="material-symbols-outlined text-4xl text-primary">
                                play_circle
                              </span>
                            )}
                          </div>
                          <label className="grid content-start gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                            Portada opcional
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(event) =>
                                handlePageBlockImageUpload(page.id, block.id, event.target.files)
                              }
                              className="rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-low px-4 py-3 text-sm"
                            />
                            <span className="text-[11px] font-medium normal-case tracking-normal">
                              La portada carga primero. El reproductor externo sólo se solicita al tocarlo.
                            </span>
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
                      <button
                        type="button"
                        onClick={() => removePageBlock(page.id, block.id)}
                        className="justify-self-start rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-error hover:bg-error-container"
                      >
                        Eliminar sección
                      </button>
                      </>
                      ) : null}
                    </motion.div>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>
          ) : null}

          {activeTab === "ba" ? (
          <div className="grid gap-6">
            <div className="grid gap-4 rounded-3xl bg-surface-container-low p-5 lg:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3 text-xs font-semibold text-primary">
                <input
                  type="checkbox"
                  checked={homeForm.buenosAires.active}
                  onChange={(event) =>
                    updateBuenosAiresField("active", event.target.checked)
                  }
                />
                Mostrar en el menú público
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Texto del menú
                <input
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={homeForm.buenosAires.menuLabel}
                  onChange={(event) => updateBuenosAiresField("menuLabel", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Eyebrow hero
                <input
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={homeForm.buenosAires.eyebrow}
                  onChange={(event) => updateBuenosAiresField("eyebrow", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Título hero
                <input
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={homeForm.buenosAires.title}
                  onChange={(event) => updateBuenosAiresField("title", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant lg:col-span-2">
                Subtítulo hero
                <textarea
                  className="min-h-28 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={homeForm.buenosAires.subtitle}
                  onChange={(event) => updateBuenosAiresField("subtitle", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Imagen hero
                <input
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  value={homeForm.buenosAires.heroImage}
                  onChange={(event) => updateBuenosAiresField("heroImage", event.target.value)}
                  placeholder="https://..."
                  disabled={Boolean(homeForm.buenosAires.heroVideo)}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => handleBuenosAiresHeroImageUpload(event.target.files)}
                  disabled={Boolean(homeForm.buenosAires.heroVideo)}
                  className="rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                />
                {homeForm.buenosAires.heroVideo ? (
                  <span className="text-xs normal-case tracking-normal text-on-surface-variant">
                    Quitá el video para cargar una imagen.
                  </span>
                ) : null}
                {uploadingField === "ba-hero-image" ? (
                  <span className="text-xs normal-case tracking-normal text-primary">
                    Subiendo imagen...
                  </span>
                ) : null}
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Video hero directo opcional
                <input
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  value={homeForm.buenosAires.heroVideo}
                  onChange={(event) => updateBuenosAiresField("heroVideo", event.target.value)}
                  placeholder="https://.../obelisco.mp4"
                  disabled={Boolean(homeForm.buenosAires.heroImage)}
                />
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov"
                  onChange={(event) => handleBuenosAiresHeroVideoUpload(event.target.files)}
                  disabled={Boolean(homeForm.buenosAires.heroImage)}
                  className="rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                />
                {homeForm.buenosAires.heroImage ? (
                  <span className="text-xs normal-case tracking-normal text-on-surface-variant">
                    Quitá la imagen para cargar un video.
                  </span>
                ) : null}
                {uploadingField === "ba-hero-video" ? (
                  <span className="text-xs normal-case tracking-normal text-primary">
                    Subiendo video...
                  </span>
                ) : null}
              </label>
              <div className="grid gap-4 md:grid-cols-2 lg:col-span-2">
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
                      value={String(homeForm.buenosAires[key as keyof HomeContent["buenosAires"]] ?? "")}
                      onChange={(event) =>
                        updateBuenosAiresField(
                          key as keyof HomeContent["buenosAires"],
                          event.target.value as HomeContent["buenosAires"][keyof HomeContent["buenosAires"]]
                        )
                      }
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl bg-surface-container-low p-5 lg:grid-cols-2">
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Eyebrow introducción
                <input
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={homeForm.buenosAires.introEyebrow}
                  onChange={(event) => updateBuenosAiresField("introEyebrow", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Título introducción
                <input
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={homeForm.buenosAires.introTitle}
                  onChange={(event) => updateBuenosAiresField("introTitle", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant lg:col-span-2">
                Texto introducción
                <textarea
                  className="min-h-28 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={homeForm.buenosAires.introText}
                  onChange={(event) => updateBuenosAiresField("introText", event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-3 rounded-3xl bg-surface-container-low p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="font-headline text-lg font-bold text-primary">
                  Datos rápidos del hero
                </h4>
                <button
                  type="button"
                  onClick={addBuenosAiresFact}
                  className="rounded-full bg-surface-container-lowest px-4 py-2 text-xs font-bold text-primary"
                >
                  Agregar dato
                </button>
              </div>
              {homeForm.buenosAires.quickFacts.map((fact, index) => (
                <motion.div
                  key={fact.id || `ba-fact-${index}`}
                  layout
                  className="grid gap-4 rounded-2xl bg-surface-container-lowest p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 rounded-full bg-surface-container-low px-4 py-3 text-xs font-semibold text-primary">
                      <input
                        type="checkbox"
                        checked={fact.active}
                        onChange={(event) =>
                          updateBuenosAiresFact(index, "active", event.target.checked)
                        }
                      />
                      Visible
                    </label>
                    <button
                      type="button"
                      onClick={() => removeBuenosAiresFact(index)}
                      className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-error hover:bg-error-container"
                    >
                      Quitar
                    </button>
                  </div>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Texto
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={fact.text}
                      onChange={(event) => updateBuenosAiresFact(index, "text", event.target.value)}
                    />
                  </label>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      ["backgroundColor", "Fondo"],
                      ["textColor", "Texto"],
                      ["accentColor", "Número"],
                      ["borderColor", "Borde"],
                    ].map(([key, label]) => (
                      <label
                        key={`${fact.id}-${key}`}
                        className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant"
                      >
                        {label}
                        <div className="flex overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-low">
                          <input
                            type="color"
                            value={(fact[key as keyof typeof fact] as string) || "#ffffff"}
                            onChange={(event) =>
                              updateBuenosAiresFact(
                                index,
                                key as keyof HomeContent["buenosAires"]["quickFacts"][number],
                                event.target.value
                              )
                            }
                            className="h-11 w-12 shrink-0 cursor-pointer border-0 bg-transparent p-1"
                          />
                          <input
                            value={(fact[key as keyof typeof fact] as string) ?? ""}
                            onChange={(event) =>
                              updateBuenosAiresFact(
                                index,
                                key as keyof HomeContent["buenosAires"]["quickFacts"][number],
                                event.target.value
                              )
                            }
                            placeholder="#ffffff"
                            className="min-w-0 flex-1 bg-transparent px-3 text-xs text-on-surface focus:outline-none"
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-4">
              {homeForm.buenosAires.sections.map((section, index) => (
                <motion.article
                  key={section.id}
                  layout
                  initial={{ opacity: 0, y: 14, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 180, damping: 22, delay: index * 0.02 }}
                  className="grid gap-4 rounded-3xl bg-surface-container-low p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                        Card animada
                      </p>
                      <h4 className="mt-1 text-lg font-headline font-bold text-primary">
                        {section.title || "Sección sin título"}
                      </h4>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-3 text-xs font-semibold text-primary">
                        <input
                          type="checkbox"
                          checked={section.active}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "active", event.target.checked)
                          }
                        />
                        Visible
                      </label>
                      <button
                        type="button"
                        onClick={() => removeBuenosAiresSection(section.id)}
                        className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest text-error hover:bg-error-container"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                    <div className="overflow-hidden rounded-2xl bg-surface-container-lowest">
                      {section.image ? (
                        <img
                          src={section.image}
                          alt={section.title}
                          className="h-44 w-full object-cover"
                        />
                      ) : (
                        <div className="brand-gradient flex h-44 items-center justify-center text-xs font-bold uppercase tracking-widest text-on-primary">
                          Imagen
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                        Título
                        <input
                          className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={section.title}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "title", event.target.value)
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                        Eyebrow
                        <input
                          className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={section.eyebrow}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "eyebrow", event.target.value)
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                        Icono Material
                        <input
                          className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={section.icon}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "icon", event.target.value)
                          }
                          placeholder="map, school, work..."
                        />
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                        Imagen card
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleBuenosAiresSectionImageUpload(section.id, event.target.files)
                          }
                          className="rounded-xl border border-dashed border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-sm"
                        />
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant md:col-span-2">
                        Texto breve
                        <textarea
                          className="min-h-24 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={section.text}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "text", event.target.value)
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant md:col-span-2">
                        Texto detalle
                        <textarea
                          className="min-h-28 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={section.detail}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "detail", event.target.value)
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                        CTA card
                        <input
                          className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={section.cardCtaLabel ?? ""}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "cardCtaLabel", event.target.value)
                          }
                          placeholder="Ver capítulo"
                        />
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                        Link CTA card
                        <input
                          className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={section.cardCtaHref ?? ""}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "cardCtaHref", event.target.value)
                          }
                          placeholder="#ba-guia o /pagina"
                        />
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant md:col-span-2">
                        Título capítulo
                        <input
                          className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={section.chapterTitle ?? ""}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "chapterTitle", event.target.value)
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant md:col-span-2">
                        Contenido capítulo
                        <textarea
                          className="min-h-36 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={section.chapterBody ?? ""}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "chapterBody", event.target.value)
                          }
                          placeholder="Texto largo, bullets o información ampliada."
                        />
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                        CTA principal
                        <input
                          className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={section.primaryCtaLabel ?? ""}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "primaryCtaLabel", event.target.value)
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                        Link CTA principal
                        <input
                          className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={section.primaryCtaHref ?? ""}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "primaryCtaHref", event.target.value)
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                        CTA secundario
                        <input
                          className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={section.secondaryCtaLabel ?? ""}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "secondaryCtaLabel", event.target.value)
                          }
                        />
                      </label>
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                        Link CTA secundario
                        <input
                          className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={section.secondaryCtaHref ?? ""}
                          onChange={(event) =>
                            updateBuenosAiresSection(section.id, "secondaryCtaHref", event.target.value)
                          }
                        />
                      </label>
                      {[
                        ["backgroundColor", "Color fondo capítulo"],
                        ["textColor", "Color texto capítulo"],
                        ["accentColor", "Color acento capítulo"],
                      ].map(([key, label]) => (
                        <label
                          key={`${section.id}-${key}`}
                          className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant"
                        >
                          {label}
                          <div className="flex overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
                            <input
                              type="color"
                              value={(section[key as keyof typeof section] as string) || "#1b365d"}
                              onChange={(event) =>
                                updateBuenosAiresSection(
                                  section.id,
                                  key as keyof HomeContent["buenosAires"]["sections"][number],
                                  event.target.value
                                )
                              }
                              className="h-12 w-14 shrink-0 cursor-pointer border-0 bg-transparent p-1"
                            />
                            <input
                              value={(section[key as keyof typeof section] as string) ?? ""}
                              onChange={(event) =>
                                updateBuenosAiresSection(
                                  section.id,
                                  key as keyof HomeContent["buenosAires"]["sections"][number],
                                  event.target.value
                                )
                              }
                              placeholder="#1b365d"
                              className="min-w-0 flex-1 bg-transparent px-3 text-sm text-on-surface focus:outline-none"
                            />
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="grid gap-4 rounded-3xl bg-surface-container-low p-5 lg:grid-cols-2">
              {[
                ["finalEyebrow", "Eyebrow cierre"],
                ["finalTitle", "Título cierre"],
                ["finalCtaLabel", "CTA cierre"],
                ["finalCtaHref", "Link CTA cierre"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant"
                >
                  {label}
                  <input
                    className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                    value={String(homeForm.buenosAires[key as keyof HomeContent["buenosAires"]] ?? "")}
                    onChange={(event) =>
                      updateBuenosAiresField(
                        key as keyof HomeContent["buenosAires"],
                        event.target.value as HomeContent["buenosAires"][keyof HomeContent["buenosAires"]]
                      )
                    }
                  />
                </label>
              ))}
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant lg:col-span-2">
                Texto cierre
                <textarea
                  className="min-h-28 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={homeForm.buenosAires.finalText}
                  onChange={(event) => updateBuenosAiresField("finalText", event.target.value)}
                />
              </label>
            </div>
          </div>
          ) : null}

          {activeTab === "work" ? (
          <div className="grid gap-6">
            <div className="grid gap-4 rounded-3xl bg-surface-container-low p-5 lg:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3 text-xs font-semibold text-primary lg:col-span-2">
                <input
                  type="checkbox"
                  checked={homeForm.workWithUs.active}
                  onChange={(event) => updateWorkWithUsField("active", event.target.checked)}
                />
                Mostrar página y formulario
              </label>

              {[
                ["eyebrow", "Eyebrow"],
                ["title", "Título principal"],
                ["introTitle", "Título introducción"],
                ["formTitle", "Título formulario"],
                ["submitLabel", "Texto botón"],
                ["successMessage", "Mensaje de éxito"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant"
                >
                  {label}
                  <input
                    className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                    value={String(homeForm.workWithUs[key as keyof HomeContent["workWithUs"]] ?? "")}
                    onChange={(event) =>
                      updateWorkWithUsField(
                        key as keyof HomeContent["workWithUs"],
                        event.target.value as HomeContent["workWithUs"][keyof HomeContent["workWithUs"]]
                      )
                    }
                  />
                </label>
              ))}

              {[
                ["subtitle", "Subtítulo hero"],
                ["introText", "Texto introducción"],
                ["formSubtitle", "Bajada formulario"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant lg:col-span-2"
                >
                  {label}
                  <textarea
                    className="min-h-24 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                    value={String(homeForm.workWithUs[key as keyof HomeContent["workWithUs"]] ?? "")}
                    onChange={(event) =>
                      updateWorkWithUsField(
                        key as keyof HomeContent["workWithUs"],
                        event.target.value as HomeContent["workWithUs"][keyof HomeContent["workWithUs"]]
                      )
                    }
                  />
                </label>
              ))}
            </div>

            <div className="grid gap-4 rounded-3xl bg-surface-container-low p-5 lg:grid-cols-2">
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Destino de consulta
                <select
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={homeForm.workWithUs.destinationType}
                  onChange={(event) =>
                    updateWorkWithUsField(
                      "destinationType",
                      event.target.value as HomeContent["workWithUs"]["destinationType"]
                    )
                  }
                >
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="both">Email y WhatsApp</option>
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3 text-xs font-semibold text-primary">
                <input
                  type="checkbox"
                  checked={homeForm.workWithUs.allowCvUpload}
                  onChange={(event) =>
                    updateWorkWithUsField("allowCvUpload", event.target.checked)
                  }
                />
                Permitir seleccionar CV
              </label>

              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                Email destino
                <input
                  type="email"
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  placeholder="rrhh@empresa.com"
                  value={homeForm.workWithUs.destinationEmail}
                  onChange={(event) =>
                    updateWorkWithUsField("destinationEmail", event.target.value)
                  }
                />
              </label>

              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                WhatsApp destino
                <input
                  inputMode="tel"
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  placeholder="5491123456789"
                  value={homeForm.workWithUs.destinationWhatsapp}
                  onChange={(event) =>
                    updateWorkWithUsField("destinationWhatsapp", event.target.value)
                  }
                />
              </label>

              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant lg:col-span-2">
                Mensaje inicial WhatsApp
                <textarea
                  className="min-h-24 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={homeForm.workWithUs.whatsappMessage}
                  onChange={(event) =>
                    updateWorkWithUsField("whatsappMessage", event.target.value)
                  }
                />
              </label>

              <p className="rounded-2xl bg-surface-container-lowest p-4 text-xs leading-5 text-on-surface-variant lg:col-span-2">
                Si el CV está activo, se sube a un bucket privado con límite de 3 MB y llega como link temporal al email o al mensaje de WhatsApp.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-sm font-bold uppercase tracking-[0.28em] text-primary">
                  Campos del formulario
                </h4>
                <button
                  type="button"
                  onClick={addWorkField}
                  className="rounded-full bg-surface-container-low px-4 py-2 text-xs font-bold text-primary transition hover:bg-primary-fixed"
                >
                  Agregar campo
                </button>
              </div>

              {homeForm.workWithUs.fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 170, damping: 22, delay: index * 0.02 }}
                  className="grid gap-4 rounded-3xl bg-surface-container-low p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-primary-fixed px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
                      Campo {index + 1}
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <input
                          type="checkbox"
                          checked={field.active}
                          onChange={(event) =>
                            updateWorkField(field.id, "active", event.target.checked)
                          }
                        />
                        Visible
                      </label>
                      <label className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(event) =>
                            updateWorkField(field.id, "required", event.target.checked)
                          }
                        />
                        Obligatorio
                      </label>
                      <button
                        type="button"
                        onClick={() => removeWorkField(field.id)}
                        className="rounded-full px-3 py-2 text-xs font-bold uppercase tracking-widest text-error hover:bg-error-container"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                      Label
                      <input
                        className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                        value={field.label}
                        onChange={(event) =>
                          updateWorkField(field.id, "label", event.target.value)
                        }
                      />
                    </label>
                    <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                      Tipo
                      <select
                        className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                        value={field.type}
                        onChange={(event) =>
                          updateWorkField(
                            field.id,
                            "type",
                            event.target.value as WorkWithUsFieldType
                          )
                        }
                      >
                        <option value="text">Texto</option>
                        <option value="email">Email</option>
                        <option value="tel">Teléfono</option>
                        <option value="textarea">Texto largo</option>
                        <option value="select">Dropdown</option>
                      </select>
                    </label>
                    <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant md:col-span-2">
                      Placeholder
                      <input
                        className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                        value={field.placeholder ?? ""}
                        onChange={(event) =>
                          updateWorkField(field.id, "placeholder", event.target.value)
                        }
                      />
                    </label>
                    {field.type === "select" ? (
                      <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant md:col-span-2">
                        Opciones, una por línea
                        <textarea
                          className="min-h-28 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                          value={(field.options ?? []).join("\n")}
                          onChange={(event) =>
                            updateWorkField(
                              field.id,
                              "options",
                              event.target.value.split("\n")
                            )
                          }
                        />
                      </label>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          ) : null}

          {activeTab === "banners" ? (
          <div className="grid gap-4">
            <div className="grid gap-4 rounded-2xl bg-surface-container-low p-4 md:grid-cols-2">
              {[
                ["bannerOverlayColor", "Color velo sobre la imagen", themeForm.primary],
                ["bannerFadeColor", "Color degradado inferior", themeForm.primary],
              ].map(([key, label, fallback]) => (
                <label
                  key={key}
                  className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant"
                >
                  {label}
                  <span className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-2">
                    <input
                      type="color"
                      value={String(homeForm[key as keyof HomeContent] || fallback || "#1b365d")}
                      onChange={(event) =>
                        updateHomeField(
                          key as keyof HomeContent,
                          event.target.value as HomeContent[keyof HomeContent]
                        )
                      }
                      className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                    />
                    <input
                      value={String(homeForm[key as keyof HomeContent] ?? "")}
                      onChange={(event) =>
                        updateHomeField(
                          key as keyof HomeContent,
                          event.target.value as HomeContent[keyof HomeContent]
                        )
                      }
                      placeholder={String(fallback || "#1b365d")}
                      className="min-w-0 flex-1 bg-transparent text-sm normal-case tracking-normal text-on-surface outline-none"
                    />
                  </span>
                </label>
              ))}
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
                Sombra del carrusel
                <input
                  value={homeForm.bannerShadow ?? ""}
                  onChange={(event) => updateHomeField("bannerShadow", event.target.value)}
                  placeholder="0 34px 70px -34px rgba(27,54,93,.32)"
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm normal-case tracking-normal text-on-surface"
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
                Sombra de botones
                <input
                  value={homeForm.bannerButtonShadow ?? ""}
                  onChange={(event) =>
                    updateHomeField("bannerButtonShadow", event.target.value)
                  }
                  placeholder="0 18px 40px -24px rgba(255,243,194,.9)"
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm normal-case tracking-normal text-on-surface"
                />
              </label>
              <p className="text-xs leading-5 text-on-surface-variant md:col-span-2">
                Los colores controlan los velos que permiten leer el texto sobre la imagen.
                En las sombras podés escribir <strong>none</strong> para quitarlas.
              </p>
            </div>
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
                    <span className="text-[11px] normal-case tracking-normal text-on-surface-variant">
                      Recomendado: 2400 x 1350 px o más, formato horizontal.
                    </span>
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
            <div className="grid gap-4 rounded-2xl bg-surface-container-low p-4 md:grid-cols-2">
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
                Color desvanecido lateral
                <span className="flex items-center gap-3 rounded-xl bg-surface-container-lowest p-2">
                  <input
                    type="color"
                    value={
                      homeForm.partnersFadeColor ||
                      themeForm.surface ||
                      themeForm.background ||
                      "#ffffff"
                    }
                    onChange={(event) =>
                      updateHomeField("partnersFadeColor", event.target.value)
                    }
                    className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent"
                  />
                  <input
                    value={homeForm.partnersFadeColor ?? ""}
                    onChange={(event) =>
                      updateHomeField("partnersFadeColor", event.target.value)
                    }
                    placeholder={themeForm.surface || "#ffffff"}
                    className="min-w-0 flex-1 bg-transparent text-sm normal-case tracking-normal text-on-surface outline-none"
                  />
                </span>
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-on-surface-variant">
                Sombra del bloque de logos
                <input
                  value={homeForm.partnersShadow ?? ""}
                  onChange={(event) => updateHomeField("partnersShadow", event.target.value)}
                  placeholder="0 34px 70px -34px rgba(27,54,93,.32)"
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm normal-case tracking-normal text-on-surface"
                />
              </label>
            </div>
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

          {activeTab === "footer" ? (
          <div className="grid gap-5">
            <div className="grid gap-4 rounded-3xl bg-surface-container-low p-5 md:grid-cols-2">
              <label className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-3 text-xs font-semibold text-primary md:col-span-2">
                <input
                  type="checkbox"
                  checked={homeForm.footer.active}
                  onChange={(event) => updateFooterField("active", event.target.checked)}
                />
                Mostrar footer en el sitio
              </label>
              {[
                ["backgroundColor", "Color fondo"],
                ["textColor", "Color texto"],
                ["accentColor", "Color acento/títulos"],
                ["linkColor", "Color links"],
                ["buttonBackgroundColor", "Fondo botones/redes"],
                ["buttonTextColor", "Texto botones/redes"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant"
                >
                  {label}
                  <div className="grid grid-cols-[48px_1fr] gap-2">
                    <input
                      type="color"
                      className="h-12 w-12 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-1"
                      value={String(homeForm.footer[key as keyof HomeContent["footer"]] || "#ffffff")}
                      onChange={(event) =>
                        updateFooterField(
                          key as keyof HomeContent["footer"],
                          event.target.value as HomeContent["footer"][keyof HomeContent["footer"]]
                        )
                      }
                    />
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={String(homeForm.footer[key as keyof HomeContent["footer"]] ?? "")}
                      onChange={(event) =>
                        updateFooterField(
                          key as keyof HomeContent["footer"],
                          event.target.value as HomeContent["footer"][keyof HomeContent["footer"]]
                        )
                      }
                      placeholder="#1b365d"
                    />
                  </div>
                </label>
              ))}
              {[
                ["eyebrow", "Eyebrow"],
                ["title", "Título"],
                ["cookiesLabel", "Texto link cookies"],
                ["cookiesHref", "Link cookies"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant"
                >
                  {label}
                  <input
                    className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                    value={String(homeForm.footer[key as keyof HomeContent["footer"]] ?? "")}
                    onChange={(event) =>
                      updateFooterField(
                        key as keyof HomeContent["footer"],
                        event.target.value as HomeContent["footer"][keyof HomeContent["footer"]]
                      )
                    }
                  />
                </label>
              ))}
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant md:col-span-2">
                Descripción
                <textarea
                  className="min-h-24 rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={homeForm.footer.description}
                  onChange={(event) => updateFooterField("description", event.target.value)}
                />
              </label>
              <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant md:col-span-2">
                Texto legal
                <input
                  className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                  value={homeForm.footer.legalText}
                  onChange={(event) => updateFooterField("legalText", event.target.value)}
                />
              </label>
            </div>

            <div className="grid gap-4">
              <h4 className="text-sm font-bold uppercase tracking-[0.28em] text-primary">
                Secciones del footer
              </h4>
              {homeForm.footer.sections.map((section, index) => (
                <motion.div
                  key={section.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 170, damping: 22, delay: index * 0.02 }}
                  className="grid gap-4 rounded-3xl bg-surface-container-low p-5"
                >
                  <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                    <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                      Título sección
                      <input
                        className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                        value={section.title}
                        onChange={(event) => updateFooterSection(section.id, "title", event.target.value)}
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-4 py-3 text-xs font-semibold text-primary">
                        <input
                          type="checkbox"
                          checked={section.active}
                          onChange={(event) =>
                            updateFooterSection(section.id, "active", event.target.checked)
                          }
                        />
                        Visible
                      </label>
                      <button
                        type="button"
                        onClick={() => addFooterLink(section.id)}
                        className="rounded-full bg-primary-fixed px-4 py-3 text-xs font-bold uppercase tracking-widest text-primary"
                      >
                        Agregar link
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFooterSection(section.id)}
                        className="rounded-full px-4 py-3 text-xs font-bold uppercase tracking-widest text-error transition hover:bg-error-container"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {section.links.map((link) => (
                      <div
                        key={link.id}
                        className="grid gap-3 rounded-2xl bg-surface-container-lowest p-4 md:grid-cols-[1fr_1fr_auto]"
                      >
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                          Texto link
                          <input
                            className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                            value={link.label}
                            onChange={(event) =>
                              updateFooterLink(section.id, link.id, "label", event.target.value)
                            }
                          />
                        </label>
                        <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                          URL
                          <input
                            className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                            value={link.href}
                            onChange={(event) =>
                              updateFooterLink(section.id, link.id, "href", event.target.value)
                            }
                          />
                        </label>
                        <div className="flex flex-wrap items-center gap-3 md:justify-end">
                          <label className="flex items-center gap-2 text-xs font-semibold text-primary">
                            <input
                              type="checkbox"
                              checked={link.active}
                              onChange={(event) =>
                                updateFooterLink(section.id, link.id, "active", event.target.checked)
                              }
                            />
                            Visible
                          </label>
                          <button
                            type="button"
                            onClick={() => removeFooterLink(section.id, link.id)}
                            className="rounded-full px-3 py-2 text-xs font-bold uppercase tracking-widest text-error"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid gap-4">
              <h4 className="text-sm font-bold uppercase tracking-[0.28em] text-primary">
                Redes sociales
              </h4>
              {homeForm.footer.socialLinks.map((link, index) => (
                <motion.div
                  key={link.id}
                  layout
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 170, damping: 22, delay: index * 0.02 }}
                  className="grid gap-3 rounded-3xl bg-surface-container-low p-5 md:grid-cols-[1fr_1fr_1fr_auto]"
                >
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Red
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={link.label}
                      onChange={(event) => updateSocialLink(link.id, "label", event.target.value)}
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Link
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={link.href}
                      onChange={(event) => updateSocialLink(link.id, "href", event.target.value)}
                      placeholder="https://..."
                    />
                  </label>
                  <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                    Icono Material
                    <input
                      className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                      value={link.icon}
                      onChange={(event) => updateSocialLink(link.id, "icon", event.target.value)}
                      placeholder="instagram, tiktok, linkedin, whatsapp, facebook, youtube, x"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <label className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <input
                        type="checkbox"
                        checked={link.active}
                        onChange={(event) => updateSocialLink(link.id, "active", event.target.checked)}
                      />
                      Visible
                    </label>
                    <button
                      type="button"
                      onClick={() => removeSocialLink(link.id)}
                      className="rounded-full px-3 py-2 text-xs font-bold uppercase tracking-widest text-error"
                    >
                      Eliminar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
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
              : activeTab === "ba"
                ? "Guardar Buenos Aires"
              : activeTab === "work"
                ? "Guardar Trabaja"
              : activeTab === "footer"
                ? "Guardar footer"
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
