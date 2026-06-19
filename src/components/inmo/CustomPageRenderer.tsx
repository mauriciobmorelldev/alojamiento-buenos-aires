"use client";

import Link from "next/link";
import FrontHeader from "@/components/inmo/FrontHeader";
import type { CustomPage, CustomPageBlock } from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";

type CustomPageRendererProps = {
  slug: string;
  fallback?: React.ReactNode;
};

const paragraphize = (body = "") =>
  body
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const renderBlock = (block: CustomPageBlock, page: CustomPage) => {
  if (block.type === "hero") {
    return (
      <section
        key={block.id}
        className="overflow-hidden rounded-3xl bg-primary px-6 py-12 text-on-primary sm:px-10 lg:px-14"
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-primary-fixed">
          {page.title}
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl font-headline font-extrabold leading-tight sm:text-5xl">
          {block.title || page.title}
        </h1>
        {block.subtitle ? (
          <p className="mt-5 max-w-2xl text-base leading-8 text-on-primary/78">
            {block.subtitle}
          </p>
        ) : null}
      </section>
    );
  }

  if (block.type === "image") {
    return (
      <section key={block.id} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        {block.image ? (
          <img
            src={block.image}
            alt={block.title || page.title}
            width={980}
            height={640}
            loading="lazy"
            decoding="async"
            className="min-h-72 w-full rounded-3xl object-cover"
          />
        ) : (
          <div className="flex min-h-72 items-center justify-center rounded-3xl bg-surface-container-low text-sm font-semibold text-on-surface-variant">
            Imagen pendiente
          </div>
        )}
        <div>
          <h2 className="text-3xl font-headline font-bold text-primary">
            {block.title}
          </h2>
          {block.subtitle ? (
            <p className="mt-3 text-base leading-8 text-on-surface-variant">
              {block.subtitle}
            </p>
          ) : null}
        </div>
      </section>
    );
  }

  if (block.type === "cta") {
    return (
      <section
        key={block.id}
        className="rounded-3xl bg-surface-container-low p-8 text-center sm:p-10"
      >
        <h2 className="text-3xl font-headline font-bold text-primary">
          {block.title}
        </h2>
        {block.subtitle ? (
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-on-surface-variant">
            {block.subtitle}
          </p>
        ) : null}
        {block.ctaLabel ? (
          <Link
            href={block.ctaHref || "/propiedades"}
            className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary"
            style={{ color: "var(--color-on-primary)" }}
          >
            {block.ctaLabel}
          </Link>
        ) : null}
      </section>
    );
  }

  if (block.type === "cards") {
    return (
      <section key={block.id}>
        <div className="max-w-3xl">
          <h2 className="text-3xl font-headline font-bold text-primary">
            {block.title}
          </h2>
          {block.subtitle ? (
            <p className="mt-3 text-base leading-8 text-on-surface-variant">
              {block.subtitle}
            </p>
          ) : null}
        </div>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(block.items?.length
            ? block.items
            : [{ id: `${block.id}-empty`, title: "Contenido pendiente", text: "Agregá cards desde el administrador." }]
          ).map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-6"
            >
              <span className="material-symbols-outlined text-2xl text-primary">
                {item.icon || "stars"}
              </span>
              <h3 className="mt-4 text-lg font-bold text-primary">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                {item.text}
              </p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      key={block.id}
      className="rounded-3xl bg-surface-container-lowest p-8 sm:p-10"
    >
      <h2 className="text-3xl font-headline font-bold text-primary">
        {block.title}
      </h2>
      {block.subtitle ? (
        <p className="mt-3 text-base leading-8 text-on-surface-variant">
          {block.subtitle}
        </p>
      ) : null}
      <div className="mt-6 space-y-4 text-base leading-8 text-on-surface-variant">
        {paragraphize(block.body).map((paragraph, index) => (
          <p key={`${block.id}-p-${index}`}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
};

export default function CustomPageRenderer({ slug, fallback }: CustomPageRendererProps) {
  const { state } = useInmoStore();
  const { theme, customPages } = state;
  const themeStyles = buildThemeStyles(theme);
  const normalizedSlug = slug.replace(/^\/+|\/+$/g, "");
  const page = customPages.find(
    (item) => item.active && item.slug.replace(/^\/+|\/+$/g, "") === normalizedSlug
  );

  if (!page) return <>{fallback ?? null}</>;

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-on-background">
      <FrontHeader active="detail" />
      <main className="mx-auto grid max-w-screen-2xl gap-10 px-6 pb-20 pt-24 lg:px-8">
        {page.blocks.length ? (
          page.blocks.map((block) => renderBlock(block, page))
        ) : (
          <section className="rounded-3xl bg-surface-container-lowest p-10">
            <h1 className="text-3xl font-headline font-bold text-primary">
              {page.title}
            </h1>
            <p className="mt-3 text-on-surface-variant">
              {page.excerpt || "Contenido pendiente de carga."}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
