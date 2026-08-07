"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import { motion } from "motion/react";
import { useInmoStore } from "@/lib/inmoStore";
import { formatPrice } from "@/lib/pricing";
import type { InmoState } from "@/lib/inmoData";
import AbaNav from "./AbaNav";
import AbaNewsletterForm from "./AbaNewsletterForm";
import AbaImageCollage from "./AbaImageCollage";
import AbaScrollCinema from "./AbaScrollCinema";
import AbaParallaxGallery from "./AbaParallaxGallery";
import AbaAboutBlock from "./AbaAboutBlock";
import AbaHomeFocusMenu from "./AbaHomeFocusMenu";
import { abaCityVideos, abaCultureImages, abaHeroDesktopVideo, abaPropertyMoodImages } from "@/lib/abaMedia";
import AbaWhatsAppFloat from "./AbaWhatsAppFloat";
import AbaOptimizedImage from "./AbaOptimizedImage";
import AbaFooter from "./AbaFooter";

const heroFallback = abaCultureImages[6];
const palermoImage = abaCultureImages[19];

const cityCollage = [
  { src: abaCultureImages[6], alt: "Avenida 9 de Julio al atardecer", label: "Avenida" },
  { src: abaCultureImages[24], alt: "Café notable porteño", label: "Café" },
  { src: abaPropertyMoodImages[1], alt: "Living amoblado con vista al Obelisco", label: "Interior" },
  { src: abaCultureImages[10], alt: "Librería porteña", label: "Librerías" },
  { src: abaCultureImages[7], alt: "Caminito en La Boca", label: "Color" },
  { src: abaCultureImages[21], alt: "Tango en un bar porteño", label: "Ritual" },
];


const parallaxArchive = [
  abaCultureImages[0],
  abaCultureImages[1],
  abaCultureImages[2],
  abaCultureImages[3],
  abaCultureImages[4],
  abaCultureImages[5],
  abaCultureImages[6],
  abaCultureImages[7],
  abaCultureImages[10],
  abaCultureImages[11],
  abaCultureImages[16],
  abaCultureImages[21],
];
const cardNarratives = [
  "Una base lista para llegar con valijas y empezar a construir rutina desde el primer día.",
  "El barrio aparece antes que la mudanza: cafés, transporte, luz y escala cotidiana.",
  "Pensado para estadías de 3 meses a 2 años, con contrato claro y orientación real.",
];

export default function AbaHome({ initialState }: { initialState: Partial<InmoState> }) {
  const { state } = useInmoStore(initialState);
  const { listings } = state;
  const featuredListings = useMemo(
    () => listings.filter((item) => item.status === "disponible").slice(0, 3),
    [listings]
  );
  return (
    <main className="aba-public aba-motion-scope">
      <section className="aba-home-hero aba-home-hero--collage relative overflow-hidden">
        <AbaNav transparent fixed />
        <div className="aba-home-hero__backdrop" aria-hidden="true">
          <video className="aba-home-hero__video" autoPlay muted loop playsInline preload="metadata" disablePictureInPicture tabIndex={-1}>
            <source src={abaHeroDesktopVideo} type="video/mp4" media="(min-width: 761px)" />
            <source src={abaCityVideos[0]} type="video/mp4" />
          </video>
        </div>
        <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-[1600px] grid-cols-12 content-end gap-6 px-5 pb-12 pt-32 md:content-center md:px-16 md:pb-16 md:pt-32">
          <div className="col-span-12 md:col-span-8">
            <p className="aba-label mb-7 text-[#e2c19b]">Alquiler temporario · Buenos Aires</p>
            <h1 className="aba-home-hero__title text-white" style={{ maxWidth: "10ch", fontSize: "clamp(3.6rem, 7.6vw, 8.2rem)", lineHeight: 0.84 }}>
              Nadie busca solo un lugar para vivir en Buenos Aires.
            </h1>
            <p className="mt-9 max-w-xl text-base leading-8 text-white/72 md:ml-1 md:text-lg">
              Departamentos amoblados en los barrios emblemáticos de Buenos Aires.
            </p>
            <p className="aba-label mt-4 text-[#e2c19b]">Estadías de 3 meses a 2 años</p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link href="/departamentos" className="aba-button-dark w-full sm:w-auto">Ver propiedades</Link>
              <Link href="/vivir-buenos-aires" className="aba-button w-full sm:w-auto">Descubrí la ciudad</Link>
            </div>
          </div>

          <div className="aba-home-hero__statement col-span-12 md:col-span-4">
            “Una llave abre un departamento. Un barrio abre Buenos Aires.”
          </div>

          <div className="aba-home-hero__film-rail col-span-12 mt-10">
            <span>34°36′ S</span>
            <span className="col-start-3">Edición 01 · 2026</span>
          </div>
        </div>
      </section>

      <section className="aba-design-section text-center">
        <h2 className="aba-headline mx-auto max-w-3xl text-white">“La ciudad también es la protagonista.”</h2>
        <p className="mx-auto mt-8 max-w-xl text-base leading-7 text-white/62">
          Nuestros departamentos son el punto de partida. Amoblados y contratos claros. Lo que sigue: Buenos Aires.
        </p>
      </section>

      <AbaHomeFocusMenu />

      <AbaAboutBlock />

      <AbaImageCollage
        eyebrow="Buenos Aires en capas"
        title="Antes de elegir departamento, elegí el barrio."
        text="Cada barrio de Buenos Aires funciona como un pequeño país, con su propia identidad, su ritmo de vida y su esencia inconfundible."
        images={cityCollage}
        cta={<Link href="/vivir-buenos-aires" className="aba-button">Explorar arte y cultura</Link>}
      />

      <AbaScrollCinema
        kicker="De la ciudad a la llave"
        title="Elegir dónde vivir también es elegir quién querés ser."
        description="Tres momentos precisos: vivir el ritmo de la ciudad, encontrar pausa y empezar a sentirse parte."
        frames={[
          { image: abaCultureImages[6], eyebrow: "Avenida", title: "Llegar al pulso", text: "La primera impresión no es un plano: es luz, movimiento, escala y cercanía con lo que pasa todos los días." },
          { image: abaPropertyMoodImages[1], eyebrow: "Interior", title: "Encontrar pausa", text: "La propiedad aparece como refugio: equipada, clara y lista para una estadía de 3 meses a 2 años." },
          { image: abaCultureImages[21], eyebrow: "Ritual", title: "Habitar la cultura", text: "Cafés, tango, librerías y esquinas que hacen que Buenos Aires se sienta propia desde la primera semana." },
        ]}
      />

      <AbaParallaxGallery
        eyebrow="Archivo vivo"
        title="Una ciudad para mirar antes de elegir llave."
        text="La atmósfera de Buenos Aires en su día a día. Imágenes reales de una ciudad que no necesita maquillaje."
        images={parallaxArchive}
      />
      <section className="aba-design-section bg-[#0e0e0e]">
        <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-5">
          <div>
            <p className="aba-label mb-3">Propiedades con relato</p>
            <h2 className="aba-headline text-white">Selección exclusiva</h2>
          </div>
          <Link href="/departamentos" className="aba-label text-white hover:text-[var(--aba-bronze)]">Ver todas</Link>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featuredListings.map((item, index) => {
            const image = item.images[item.coverIndex] || item.images[0] || heroFallback;
            const staggerClass = index === 1 ? "aba-stagger-2" : index === 2 ? "aba-stagger-3" : "aba-stagger-1";
            const style = { "--aba-delay": `${index * 120}ms` } as CSSProperties;
            return (
              <motion.article
                key={item.id}
                className={["aba-home-property-reveal", staggerClass].join(" ")}
                style={style}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.24 }}
                transition={{ duration: 0.65, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link href={"/departamentos/" + item.id} className="group block h-full">
                  <div className="aba-home-property-reveal__image">
                    <AbaOptimizedImage src={image} alt={item.title} width={720} height={560} quality={72} sizes="(max-width: 768px) 100vw, 32vw" />
                  </div>
                  <div className="aba-home-property-reveal__copy">
                    <div className="flex items-center justify-between gap-4">
                      <p className="aba-label">{item.neighborhood}</p>
                      <span>{item.rooms} ambientes</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p className="aba-home-property-reveal__price">{formatPrice(item.price, item.priceUnit, item.currency)}</p>
                    <blockquote>{cardNarratives[index] || cardNarratives[0]}</blockquote>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="w-full">
        <div className="group relative flex h-[80vh] min-h-[560px] items-center overflow-hidden border-y border-white/10">
          <AbaOptimizedImage src={palermoImage} alt="Palermo" width={1800} height={1100} quality={72} sizes="100vw" className="aba-ken-burns absolute inset-0 h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-[#131313]/48 transition duration-700 group-hover:bg-[#131313]/28" />
          <div className="relative z-10 mx-auto w-full max-w-[1440px] px-6 md:px-20">
            <h2 className="aba-display text-white">Palermo</h2>
            <p className="mt-4 max-w-lg text-lg leading-8 text-white/70">
              El epicentro del diseño, la gastronomía y la vida nocturna. Vanguardia, cafés, parques y rutina porteña en cada esquina.
            </p>
            <Link href="/vivir-buenos-aires/barrios" className="aba-button mt-8">Ver guía de barrio</Link>
          </div>
        </div>
      </section>

      <section className="aba-design-section">
        <div className="aba-card mx-auto flex max-w-4xl flex-col items-center p-12 text-center md:p-24">
          <h2 className="aba-headline text-white">Publique su propiedad con nosotros.</h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/62">
            Buscamos propiedades con carácter e historia para gestionar con el mismo cuidado que si fueran propias.
          </p>
          <Link href="/contacto?tipo=propietario" className="aba-button mt-10">Contáctenos</Link>
        </div>
      </section>

      <section className="aba-design-section border-t border-white/10">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <p className="aba-label">Despacho cultural</p>
            <h2 className="aba-headline mt-3 text-white">Recibí Buenos Aires en tu email.</h2>
          </div>
          <AbaNewsletterForm compact />
        </div>
      </section>

      <AbaFooter />
      <AbaWhatsAppFloat phone={state.theme.whatsappPhone} message={state.theme.whatsappMessage} />
    </main>
  );
}