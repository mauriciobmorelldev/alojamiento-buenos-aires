"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import { useInmoStore } from "@/lib/inmoStore";

const socialIconPaths: Record<string, string> = {
  instagram:
    "M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 2A3.75 3.75 0 0 0 4 7.75v8.5A3.75 3.75 0 0 0 7.75 20h8.5A3.75 3.75 0 0 0 20 16.25v-8.5A3.75 3.75 0 0 0 16.25 4h-8.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.25-2.4a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z",
  tiktok:
    "M16.6 3c.35 2.32 1.68 3.7 3.9 3.95v3.02a7.28 7.28 0 0 1-3.84-1.18v5.93c0 4-2.63 6.28-6.07 6.28A5.78 5.78 0 0 1 4.7 15.2a5.7 5.7 0 0 1 6.74-5.62v3.18a2.77 2.77 0 0 0-1.04-.2 2.61 2.61 0 0 0-2.62 2.64 2.64 2.64 0 0 0 2.75 2.67c1.6 0 2.83-.91 2.83-3.18V3h3.24Z",
  linkedin:
    "M6.94 8.9H3.65V21h3.29V8.9ZM5.3 3a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8Zm15.7 11.06c0-3.25-1.74-5.35-4.57-5.35-2.1 0-3.04 1.15-3.56 1.96V8.9H9.72V21h3.28v-6.72c0-1.77.34-3.48 2.53-3.48 2.15 0 2.18 2.01 2.18 3.59V21H21v-6.94Z",
  facebook:
    "M14 8.3V6.6c0-.82.32-1.6 1.67-1.6H18V2.15C17.6 2.1 16.22 2 14.62 2 11.28 2 9 4.04 9 7.78V8.3H6v3.5h3V22h4.15V11.8h3.22L17 8.3h-3Z",
  youtube:
    "M21.58 7.19a2.75 2.75 0 0 0-1.94-1.95C17.93 4.78 12 4.78 12 4.78s-5.93 0-7.64.46a2.75 2.75 0 0 0-1.94 1.95A28.8 28.8 0 0 0 2 12a28.8 28.8 0 0 0 .42 4.81 2.75 2.75 0 0 0 1.94 1.95c1.71.46 7.64.46 7.64.46s5.93 0 7.64-.46a2.75 2.75 0 0 0 1.94-1.95A28.8 28.8 0 0 0 22 12a28.8 28.8 0 0 0-.42-4.81ZM10 15.27V8.73L15.45 12 10 15.27Z",
  whatsapp:
    "M12.04 2a9.82 9.82 0 0 0-8.51 14.75L2.45 22l5.38-1.04A9.8 9.8 0 1 0 12.04 2Zm0 2a7.8 7.8 0 0 1 0 15.6 7.72 7.72 0 0 1-3.73-.95l-.34-.18-2.72.53.54-2.65-.2-.35A7.8 7.8 0 0 1 12.04 4Zm-3.35 3.85c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.06s.9 2.4 1.02 2.57c.13.17 1.73 2.77 4.31 3.78 2.15.85 2.6.68 3.06.64.47-.04 1.5-.61 1.71-1.2.21-.6.21-1.1.15-1.21-.06-.11-.23-.17-.48-.3-.26-.13-1.5-.74-1.73-.82-.23-.09-.4-.13-.57.13-.17.25-.66.82-.8.99-.15.17-.3.19-.55.06-.25-.13-1.08-.4-2.06-1.27-.76-.68-1.27-1.51-1.42-1.76-.15-.26-.02-.4.11-.53.12-.12.26-.3.38-.45.13-.15.17-.25.26-.42.08-.17.04-.32-.02-.45-.06-.13-.57-1.37-.78-1.88-.2-.49-.41-.42-.57-.43Z",
  x:
    "M16.74 3h3.07l-6.7 7.66L21 21h-6.18l-4.84-6.33L4.44 21H1.36l7.17-8.2L1 3h6.34l4.38 5.79L16.74 3Zm-1.08 16.18h1.7L6.42 4.72H4.6l11.06 14.46Z",
  twitter:
    "M16.74 3h3.07l-6.7 7.66L21 21h-6.18l-4.84-6.33L4.44 21H1.36l7.17-8.2L1 3h6.34l4.38 5.79L16.74 3Zm-1.08 16.18h1.7L6.42 4.72H4.6l11.06 14.46Z",
};

const normalizeIconName = (value: string) =>
  value.toLowerCase().trim().replace(/\s+/g, "_");

const SocialIcon = ({ icon }: { icon: string }) => {
  const normalized = normalizeIconName(icon);
  const path = socialIconPaths[normalized];
  if (path) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
        <path d={path} />
      </svg>
    );
  }

  return <span className="material-symbols-outlined text-[20px]">{icon || "link"}</span>;
};

const normalizeHref = (href: string) => {
  const value = href.trim();
  if (!value) return "#";
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

const linkProps = (href: string) =>
  href.startsWith("http://") || href.startsWith("https://")
    ? { target: "_blank", rel: "noreferrer" }
    : {};

export default function SiteFooter() {
  const { state } = useInmoStore();
  const { theme, homeContent } = state;
  const footer = homeContent.footer;

  const footerStyles = useMemo(
    () =>
      ({
        "--footer-bg": footer.backgroundColor || theme.primary || "#1b365d",
        "--footer-text": footer.textColor || "#ffffff",
        "--footer-accent": footer.accentColor || theme.accent || "#fff3c2",
        "--footer-link": footer.linkColor || footer.textColor || "#ffffff",
        "--footer-button-bg":
          footer.buttonBackgroundColor || footer.accentColor || theme.accent || "#fff3c2",
        "--footer-button-text": footer.buttonTextColor || theme.primary || "#1b365d",
      }) as CSSProperties,
    [
      footer.accentColor,
      footer.backgroundColor,
      footer.buttonBackgroundColor,
      footer.buttonTextColor,
      footer.linkColor,
      footer.textColor,
      theme.accent,
      theme.primary,
    ]
  );

  if (!footer?.active) return null;

  const rawSections = footer.sections ?? [];
  const hasWorkWithUsLink = rawSections.some((section) =>
    section.links.some((link) => normalizeHref(link.href) === "/trabaja-con-nosotros")
  );
  const sectionsWithWorkWithUs = hasWorkWithUsLink
    ? rawSections
    : rawSections.map((section, index) =>
        index === 0
          ? {
              ...section,
              links: [
                ...section.links,
                {
                  id: "footer-trabaja",
                  label: "Trabaja con nosotros",
                  href: "/trabaja-con-nosotros",
                  active: true,
                },
              ],
            }
          : section
      );

  const sections = sectionsWithWorkWithUs.filter(
    (section) => section.active && section.title.trim()
  );
  const socialLinks = (footer.socialLinks ?? []).filter(
    (link) => link.active && link.label.trim()
  );
  const cookiesHref = normalizeHref(footer.cookiesHref || "/cookies");

  return (
    <footer
      style={footerStyles}
      className="border-t border-white/10 bg-[var(--footer-bg)] text-[var(--footer-text)]"
    >
      <div className="mx-auto grid max-w-screen-2xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_1.5fr] lg:px-8 lg:py-16">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--footer-accent)]/85">
            {footer.eyebrow}
          </p>
          <h2 className="mt-4 max-w-xl text-3xl font-headline font-bold tracking-tight sm:text-4xl">
            {footer.title}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--footer-text)]/78">
            {footer.description}
          </p>

          {socialLinks.length ? (
            <div className="mt-7 flex flex-wrap gap-3">
              {socialLinks.map((item) => {
                const href = normalizeHref(item.href);
                return (
                  <Link
                    key={item.id}
                    href={href}
                    {...linkProps(href)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--footer-text)]/15 bg-[var(--footer-text)]/8 text-[var(--footer-link)] transition hover:-translate-y-0.5 hover:bg-[var(--footer-button-bg)] hover:text-[var(--footer-button-text)]"
                    aria-label={item.label}
                  >
                    <SocialIcon icon={item.icon} />
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const links = section.links.filter((link) => link.active && link.label.trim());
            if (!links.length) return null;
            return (
              <div key={section.id}>
                <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--footer-accent)]">
                  {section.title}
                </h3>
                <div className="mt-4 grid gap-3">
                  {links.map((item) => {
                    const href = normalizeHref(item.href);
                    return (
                      <Link
                        key={item.id}
                        href={href}
                        {...linkProps(href)}
                        className="w-fit text-sm text-[var(--footer-link)]/76 transition hover:text-[var(--footer-accent)]"
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--footer-accent)]">
              Cookies
            </h3>
            <p className="mt-4 text-sm leading-6 text-[var(--footer-text)]/76">
              Usamos cookies técnicas y de medición para mejorar la experiencia del sitio.
            </p>
            <Link
              href={cookiesHref}
              {...linkProps(cookiesHref)}
              className="mt-4 inline-flex w-fit rounded-full border border-[var(--footer-text)]/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--footer-link)] transition hover:bg-[var(--footer-button-bg)] hover:text-[var(--footer-button-text)]"
            >
              {footer.cookiesLabel || "Ver cookies"}
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--footer-text)]/10">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-4 py-5 text-xs text-[var(--footer-text)]/62 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>{footer.legalText}</span>
          <span>{theme.name || "Connexa"}</span>
        </div>
      </div>
    </footer>
  );
}
