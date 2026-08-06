import type { Metadata } from "next";

const title = "Catálogo Propiedades";
const description = "Catálogo de propiedades disponibles para consultar.";

export const metadata: Metadata = {
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

export default function PropiedadesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
