import Link from 'next/link';
import AbaNav from '@/components/aba/AbaNav';
import AbaWhatsAppFloat from '@/components/aba/AbaWhatsAppFloat';
import { abaCultureImages } from '@/lib/abaMedia';

export default function NotFound() {
  return (
    <main className="aba-public min-h-screen bg-[#111] text-white">
      <AbaNav transparent fixed />
      <section className="relative flex min-h-screen items-center overflow-hidden px-6 py-32 md:px-20">
        <img src={abaCultureImages[16]} alt="" className="aba-ken-burns absolute inset-0 h-full w-full object-cover opacity-34" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#111]/82 to-[#111]/48" />
        <div className="relative z-10 max-w-3xl">
          <p className="aba-label text-[#e2c19b]">Sección no encontrada</p>
          <h1 className="aba-display mt-6 text-white">Esta puerta todavía no abre.</h1>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/66">
            La página puede estar en preparación o haber cambiado de dirección. Podés volver al catálogo, explorar barrios o escribirnos para orientarte.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/departamentos" className="aba-button">Ver propiedades</Link>
            <Link href="/barrios" className="aba-button-dark">Explorar barrios</Link>
            <Link href="/vivir-buenos-aires" className="aba-button-dark">Ir al magazine</Link>
          </div>
        </div>
      </section>
      <AbaWhatsAppFloat />
    </main>
  );
}