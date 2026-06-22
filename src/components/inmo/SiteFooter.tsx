"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";

const normalizeHref = (href: string) => {
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

const linkProps = (href: string) =>
  href.startsWith("http://") || href.startsWith("https://")
    ? { target: "_blank", rel: "noreferrer" }
    : {};

export default function SiteFooter() {
  const { state } = useInmoStore();
  const { theme, homeContent } = state;
  const themeStyles = useMemo(() => buildThemeStyles(theme), [theme]);
  const footer = homeContent.footer;

  if (!footer?.active) return null;

  const sections = (footer.sections ?? []).filter(
    (section) => section.active && section.title.trim()
  );
  const socialLinks = (footer.socialLinks ?? []).filter(
    (link) => link.active && link.href.trim() && link.label.trim()
  );
  const cookiesHref = normalizeHref(footer.cookiesHref || "/cookies");

  return (
    <footer
      style={themeStyles}
      className="border-t border-outline-variant/25 bg-primary text-on-primary"
    >
      <div className="mx-auto grid max-w-screen-2xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_1.5fr] lg:px-8 lg:py-16">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary-fixed/85">
            {footer.eyebrow}
          </p>
          <h2 className="mt-4 max-w-xl text-3xl font-headline font-bold tracking-tight sm:text-4xl">
            {footer.title}
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-on-primary/78">
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
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-on-primary/15 bg-on-primary/8 text-on-primary transition hover:-translate-y-0.5 hover:bg-primary-fixed hover:text-primary"
                    aria-label={item.label}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {item.icon || "link"}
                    </span>
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
                <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-primary-fixed">
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
                        className="w-fit text-sm text-on-primary/76 transition hover:text-primary-fixed"
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
            <h3 className="text-sm font-bold uppercase tracking-[0.22em] text-primary-fixed">
              Cookies
            </h3>
            <p className="mt-4 text-sm leading-6 text-on-primary/76">
              Usamos cookies técnicas y de medición para mejorar la experiencia del sitio.
            </p>
            <Link
              href={cookiesHref}
              {...linkProps(cookiesHref)}
              className="mt-4 inline-flex w-fit rounded-full border border-on-primary/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-primary transition hover:bg-primary-fixed hover:text-primary"
            >
              {footer.cookiesLabel || "Ver cookies"}
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-on-primary/10">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-4 py-5 text-xs text-on-primary/62 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>{footer.legalText}</span>
          <span>{theme.name || "Connexa"}</span>
        </div>
      </div>
    </footer>
  );
}
