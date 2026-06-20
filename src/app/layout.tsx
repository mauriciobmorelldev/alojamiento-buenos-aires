import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import ChunkRecoveryReset from "@/components/providers/ChunkRecoveryReset";
import MaterialSymbolsLoader from "@/components/providers/MaterialSymbolsLoader";
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

export const metadata: Metadata = {
  title: "Connexa · Inmobiliaria",
  description: "Propiedades para comprar, alquilar y consultar en Connexa.",
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
      className={`${inter.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-on-background font-body selection:bg-primary-fixed selection:text-on-primary-fixed">
        <ChunkRecoveryReset />
        {children}
        <MaterialSymbolsLoader />
      </body>
    </html>
  );
}
