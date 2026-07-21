import type { Metadata } from "next";
import { Allura, Cormorant_Garamond, Inter, Manrope, Playfair_Display } from "next/font/google";
import ChunkRecoveryReset from "@/components/providers/ChunkRecoveryReset";
import MaterialSymbolsLoader from "@/components/providers/MaterialSymbolsLoader";
import AbaPreloader from "@/components/aba/AbaPreloader";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const signature = Allura({
  variable: "--font-signature",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Alojamiento Buenos Aires",
  description:
    "Departamentos amoblados de mediano plazo y guías culturales para vivir Buenos Aires.",
  openGraph: {
    title: "Alojamiento Buenos Aires",
    description:
      "Departamentos amoblados de mediano plazo y guías culturales para vivir Buenos Aires.",
    siteName: "Alojamiento Buenos Aires",
  },
  twitter: {
    card: "summary_large_image",
    title: "Alojamiento Buenos Aires",
    description:
      "Departamentos amoblados de mediano plazo y guías culturales para vivir Buenos Aires.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-theme="light"
      style={{ colorScheme: "light" }}
      className={[
        inter.variable,
        manrope.variable,
        playfair.variable,
        cormorant.variable,
        signature.variable,
        "h-full antialiased",
      ].join(" ")}
    >
      <body className="min-h-full flex flex-col bg-background text-on-background font-body selection:bg-primary-fixed selection:text-on-primary-fixed">
        <ChunkRecoveryReset />
        <AbaPreloader />
        {children}
        <MaterialSymbolsLoader />
      </body>
    </html>
  );
}
