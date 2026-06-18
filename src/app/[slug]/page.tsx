"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import CustomPageRenderer from "@/components/inmo/CustomPageRenderer";
import FrontHeader from "@/components/inmo/FrontHeader";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";

export default function DynamicCustomPage() {
  const params = useParams<{ slug: string | string[] }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug || "";
  const { state } = useInmoStore();
  const themeStyles = buildThemeStyles(state.theme);

  return (
    <CustomPageRenderer
      slug={slug}
      fallback={
        <div style={themeStyles} className="min-h-screen bg-background text-on-background">
          <FrontHeader active="detail" />
          <main className="mx-auto max-w-screen-md px-6 py-28 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Página no encontrada
            </p>
            <h1 className="mt-4 text-3xl font-headline font-bold text-primary">
              No encontramos este contenido
            </h1>
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              Puede estar pausado o pendiente de publicación.
            </p>
            <Link
              href="/propiedades"
              className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary"
              style={{ color: "var(--color-on-primary)" }}
            >
              Ver propiedades
            </Link>
          </main>
        </div>
      }
    />
  );
}
