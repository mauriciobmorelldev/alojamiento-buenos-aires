"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import CustomPageRenderer from "@/components/inmo/CustomPageRenderer";
import AbaNav from "@/components/aba/AbaNav";
import AbaWhatsAppFloat from "@/components/aba/AbaWhatsAppFloat";
import AbaFooter from "@/components/aba/AbaFooter";
import { abaCultureImages } from "@/lib/abaMedia";

export default function DynamicCustomPage() {
  const params = useParams<{ slug: string | string[] }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug || "";

  return (
    <CustomPageRenderer
      slug={slug}
      fallback={
        <main className="aba-public min-h-screen bg-[#111] text-white">
          <AbaNav transparent fixed />
          <section className="relative flex min-h-screen items-center overflow-hidden px-6 py-32 md:px-20">
            <img src={abaCultureImages[20]} alt="" className="aba-ken-burns absolute inset-0 h-full w-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#111]/84 to-[#111]/52" />
            <div className="relative z-10 max-w-3xl">
              <p className="aba-label text-[#e2c19b]">Contenido en preparación</p>
              <h1 className="aba-display mt-6 text-white">Todavía estamos escribiendo esta parte de Buenos Aires.</h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-white/66">
                Esta sección no está publicada todavía. Mientras tanto, podés recorrer propiedades, barrios o la sección de Arte y Cultura.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/departamentos" className="aba-button">Ver propiedades</Link>
                <Link href="/barrios" className="aba-button-dark">Explorar barrios</Link>
                <Link href="/vivir-buenos-aires" className="aba-button-dark">Arte y Cultura</Link>
              </div>
            </div>
          </section>
          <AbaFooter />
          <AbaWhatsAppFloat />
        </main>
      }
    />
  );
}