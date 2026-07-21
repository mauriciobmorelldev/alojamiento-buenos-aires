"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";

type FrontHeaderProps = {
  active?: "home" | "catalog" | "detail";
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  hideBrand?: boolean;
};

const AbaWordmark = ({ compact = false }: { compact?: boolean }) => (
  <span
    className={`font-headline font-extrabold uppercase tracking-normal text-primary ${
      compact ? "text-lg" : "text-2xl sm:text-3xl"
    }`}
  >
    Alojamiento BA
  </span>
);

const normalizeWhatsAppPhone = (value?: string) =>
  (value ?? "").replace(/[^\d]/g, "");

const fallbackWhatsAppPhone = "5491123456789";

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

const opensPropertyModule = (href: string) =>
  href.startsWith("/propiedades") || href.startsWith("/departamentos");

const propertyModuleLinkProps = (href: string) =>
  opensPropertyModule(href) ? { target: "_blank", rel: "noreferrer" } : {};

const ensureBuenosAiresMenuItem = (
  items: Array<{ id: string; label: string; href: string; active: boolean }>,
  label = "Buenos Aires",
  active = true
) => {
  if (!active) return items;
  if (
    items.some((item) =>
      ["/buenos-aires", "/vivir-buenos-aires"].includes(normalizeMenuHref(item.href))
    )
  ) {
    return items;
  }

  const nextItems = [...items];
  const propertiesIndex = nextItems.findIndex(
    (item) => opensPropertyModule(normalizeMenuHref(item.href))
  );
  const item = {
    id: "menu-buenos-aires",
    label,
    href: "/vivir-buenos-aires",
    active: true,
  };

  if (propertiesIndex >= 0) {
    nextItems.splice(propertiesIndex, 0, item);
    return nextItems;
  }

  return [...nextItems, item];
};

const ensureWorkWithUsMenuItem = (
  items: Array<{ id: string; label: string; href: string; active: boolean }>
) => {
  if (
    items.some(
      (item) => normalizeMenuHref(item.href) === "/contacto"
    )
  ) {
    return items;
  }

  return [
    ...items,
    {
      id: "menu-contacto",
      label: "Contacto",
      href: "/contacto",
      active: true,
    },
  ];
};

export default function FrontHeader({
  active = "home",
  showSearch = false,
  searchValue,
  onSearchChange,
  hideBrand = false,
}: FrontHeaderProps) {
  const { state } = useInmoStore();
  const { theme, homeContent } = state;
  const themeStyles = useMemo(() => buildThemeStyles(theme), [theme]);
  const [mounted, setMounted] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuItems = useMemo(
    () =>
      ensureWorkWithUsMenuItem(
        ensureBuenosAiresMenuItem(
          homeContent.menuItems?.length
            ? homeContent.menuItems
            : [
                { id: "menu-inicio", label: "Inicio", href: "/", active: true },
                {
                  id: "menu-propiedades",
                  label: "Propiedades",
                  href: "/departamentos",
                  active: true,
                },
              ],
          homeContent.buenosAires?.menuLabel?.trim() || "Buenos Aires",
          homeContent.buenosAires?.active !== false
        )
      )
        .filter((item) => item.active && item.label.trim() && item.href.trim())
        .map((item) => ({ ...item, href: normalizeMenuHref(item.href) })),
    [homeContent.buenosAires?.active, homeContent.buenosAires?.menuLabel, homeContent.menuItems]
  );
  const whatsappPhone =
    normalizeWhatsAppPhone(theme.whatsappPhone) || fallbackWhatsAppPhone;
  const whatsappUrl = whatsappPhone
    ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        theme.whatsappMessage?.trim() ||
          "Hola, quiero consultar por una propiedad."
      )}`
    : "";

  useEffect(() => {
    const hydrate = () => setMounted(true);
    if (typeof queueMicrotask === "function") {
      queueMicrotask(hydrate);
    } else {
      window.setTimeout(hydrate, 0);
    }
  }, []);

  return (
    <>
    <nav
      style={themeStyles}
      className="fixed top-0 z-50 w-full bg-background/80 backdrop-blur-xl shadow-[0_40px_60px_-15px_rgba(27,27,28,0.06)]"
    >
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setShowMobileMenu(true)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-surface-container-low text-primary shadow-[0_16px_35px_-25px_rgba(27,54,93,0.55)] md:hidden"
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined" data-icon="menu">
              menu
            </span>
          </button>
          {hideBrand ? null : (
            <Link
              href="/"
              className="flex min-w-0 items-center gap-3"
            >
              {theme.logo ? (
                <img
                  src={theme.logo}
                  alt={theme.name || "Logo"}
                  width={144}
                  height={36}
                  loading="eager"
                  decoding="async"
                  className="h-9 w-auto object-contain"
                />
              ) : (
                <AbaWordmark />
              )}
            </Link>
          )}
        </div>

        <div className="hidden items-center rounded-full border border-outline-variant/25 bg-surface-container-lowest/90 px-6 py-2 shadow-[0_25px_50px_-35px_rgba(27,27,28,0.35)] backdrop-blur md:flex">
          {menuItems.map((item) => {
            const isActive =
              (active === "home" && item.href === "/") ||
              (active === "catalog" && opensPropertyModule(item.href)) ||
              (active === "detail" && opensPropertyModule(item.href));
            return (
              <Link
                key={item.id}
                className={`${
                  isActive
                    ? "text-primary"
                    : "text-primary/60 hover:text-primary"
                } rounded-full px-3 py-1 transition-all hover:-translate-y-0.5`}
                href={item.href}
                {...propertyModuleLinkProps(item.href)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
          {showSearch ? (
            <div className="hidden items-center rounded-full bg-surface-container px-4 py-2 ghost-border lg:flex">
              <span className="material-symbols-outlined mr-2 text-on-surface-variant">
                search
              </span>
              <input
                className="w-48 border-none bg-transparent text-sm font-label focus:ring-0"
                placeholder="Buscar propiedades..."
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
            </div>
          ) : null}
          {mounted ? (
            <Link
              href="/propiedades"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-on-primary sm:inline-flex"
              style={{ color: "var(--color-on-primary)" }}
              suppressHydrationWarning
            >
              Ver propiedades
            </Link>
          ) : null}
        </div>
      </div>

      <div
        className={`fixed inset-0 z-50 bg-primary/45 backdrop-blur-md transition-opacity duration-300 md:hidden ${
          showMobileMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0" onClick={() => setShowMobileMenu(false)} />
        <div
          className={`absolute left-3 right-3 top-3 max-h-[calc(100dvh-24px)] overflow-y-auto rounded-[2rem] bg-surface-container-lowest p-5 shadow-[0_40px_80px_-28px_rgba(27,54,93,0.55)] transition-all duration-300 ${
            showMobileMenu
              ? "translate-y-0 opacity-100"
              : "-translate-y-5 opacity-0"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hideBrand ? (
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
                  Menú
                </span>
              ) : theme.logo ? (
                <img
                  src={theme.logo}
                  alt={theme.name || "Logo"}
                  width={128}
                  height={32}
                  loading="eager"
                  decoding="async"
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <AbaWordmark compact />
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowMobileMenu(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-primary"
              aria-label="Cerrar menú"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
          <div className="mt-5 grid gap-2 rounded-3xl bg-surface-container-low p-3 text-sm font-semibold text-primary">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                {...propertyModuleLinkProps(item.href)}
                onClick={() => setShowMobileMenu(false)}
                className="rounded-2xl px-4 py-3 transition-all hover:-translate-y-0.5 hover:bg-surface-container-high"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/propiedades"
              target="_blank"
              rel="noreferrer"
              onClick={() => setShowMobileMenu(false)}
              className="rounded-2xl bg-primary px-4 py-3 text-on-primary transition-all hover:-translate-y-0.5"
            >
              Ver propiedades
            </Link>
          </div>
        </div>
      </div>
    </nav>
    {mounted && whatsappUrl ? (
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_35px_-16px_rgba(37,211,102,0.9)] ring-4 ring-white/85 transition hover:-translate-y-1 hover:shadow-[0_28px_55px_-20px_rgba(37,211,102,0.95)] sm:bottom-7 sm:right-7 sm:h-16 sm:w-16"
        aria-label="Consultar por WhatsApp"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 32 32"
          className="h-7 w-7 sm:h-8 sm:w-8"
          fill="currentColor"
        >
          <path d="M16.01 3.2c-7.03 0-12.75 5.63-12.75 12.56 0 2.21.59 4.37 1.71 6.26L3.2 28.8l6.98-1.73a12.9 12.9 0 0 0 5.83 1.42c7.03 0 12.75-5.63 12.75-12.56S23.04 3.2 16.01 3.2Zm0 22.98c-1.84 0-3.65-.48-5.23-1.39l-.38-.22-4.14 1.03 1.07-4.01-.25-.41a10.16 10.16 0 0 1-1.51-5.32c0-5.65 4.68-10.24 10.44-10.24s10.44 4.59 10.44 10.24-4.68 10.32-10.44 10.32Zm5.73-7.66c-.31-.15-1.85-.9-2.14-1-.29-.11-.5-.15-.71.15-.21.31-.82 1-.99 1.2-.18.21-.36.23-.67.08-.31-.15-1.31-.47-2.5-1.51-.92-.81-1.55-1.81-1.73-2.12-.18-.31-.02-.48.13-.63.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.54-.08-.15-.71-1.68-.97-2.3-.26-.6-.52-.52-.71-.53h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.06-1.1 2.59 0 1.52 1.13 2.99 1.29 3.2.16.21 2.23 3.36 5.41 4.71.76.32 1.35.51 1.81.65.76.24 1.45.2 2 .12.61-.09 1.85-.75 2.11-1.47.26-.72.26-1.34.18-1.47-.08-.13-.29-.21-.6-.36Z" />
        </svg>
      </a>
    ) : null}
    </>
  );
}
