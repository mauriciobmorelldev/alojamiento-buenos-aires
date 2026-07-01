import type { Metadata } from "next";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const host = (await headers()).get("host") ?? "";
  const isCatalog = host.includes("catalogopropiedades.com");
  const title = isCatalog ? "Catálogo Propiedades" : "Conexa";
  const description = isCatalog
    ? "Catálogo de propiedades disponibles para consultar."
    : "Propiedades disponibles de Conexa.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: title,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function PropiedadesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
