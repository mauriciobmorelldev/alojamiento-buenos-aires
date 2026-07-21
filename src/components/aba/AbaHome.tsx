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
import { abaCultureImages, abaPropertyMoodImages } from "@/lib/abaMedia";
import AbaWhatsAppFloat from "./AbaWhatsAppFloat";

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

const heroFrames = [
  { src: abaCultureImages[6], label: "Avenida" },
  { src: abaCultureImages[24], label: "Café" },
  { src: abaPropertyMoodImages[1], label: "Interior" },
];

const heroAtmosphere = [
  { src: abaCultureImages[16], label: "Avenida" },
  { src: abaCultureImages[3], label: "Café" },
  { src: abaCultureImages[11], label: "Río" },
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
  const { homeContent, listings, theme } = state;
  const featuredListings = useMemo(
    () => listings.filter((item) => item.status === "disponible").slice(0, 3),
    [listings]
  );
  const heroImage = theme.heroImage || homeContent.buenosAires?.heroImage || heroFallback;
  return (
    <main className="aba-public aba-motion-scope">
      <section className="aba-home-hero aba-home-hero--collage relative overflow-hidden">
        <AbaNav transparent fixed />
        <div className="aba-home-hero__backdrop" aria-hidden="true">
          <img src={heroImage} alt="" className="aba-home-hero__poster aba-ken-burns" />
          <div className="aba-home-hero__atmosphere">
            {heroAtmosphere.map((item) => (
              <figure key={item.src}>
                <img src={item.src} alt="" loading="eager" />
                <figcaption>{item.label}</figcaption>
              </figure>
            ))}
          </div>
          <div className="aba-home-hero__grain" />
        </div>
        <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-[1600px] grid-cols-12 content-end gap-6 px-5 pb-12 pt-32 md:content-center md:px-16 md:pb-16 md:pt-32">
          <div className="col-span-12 md:col-span-7">
            <p className="aba-label mb-7 text-[#e2c19b]">Alquiler temporario · Buenos Aires</p>
            <h1 className="aba-home-hero__title text-white">
              Buenos Aires,
              <em>desde adentro.</em>
            </h1>
            <p className="mt-9 max-w-xl text-base leading-8 text-white/72 md:ml-1 md:text-lg">
              Departamentos amoblados, barrios leídos con precisión y una llegada pensada para estadías de 3 meses a 2 años.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link href="/departamentos" className="aba-button-dark w-full sm:w-auto">Ver propiedades</Link>
              <Link href="/vivir-buenos-aires" className="aba-button w-full sm:w-auto">Leer la ciudad</Link>
            </div>
          </div>

          <div className="aba-home-hero__stack col-span-12 md:col-span-5">
            {heroFrames.map((frame, index) => (
              <motion.figure
                key={frame.src}
                className={"aba-home-hero__stack-card aba-home-hero__stack-card--" + (index + 1)}
                initial={{ opacity: 0, y: 36, rotate: index === 1 ? 3 : -3 }}
                animate={{ opacity: 1, y: 0, rotate: index === 1 ? 1.4 : -1.4 }}
                transition={{ duration: 0.75, delay: 0.22 + index * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                <img src={frame.src} alt="" />
                <figcaption>{frame.label}</figcaption>
              </motion.figure>
            ))}
            <div className="aba-home-hero__quote">“Una llave abre un departamento. Un barrio abre Buenos Aires.”</div>
          </div>

          <div className="aba-home-hero__film-rail col-span-12 mt-10">
            <span>34°36′ S</span>
            <span className="col-start-3">Edición 01 · 2026</span>
          </div>
        </div>
      </section>

      <section className="aba-design-section text-center">
        <h2 className="aba-headline mx-auto max-w-3xl text-white">“La ciudad es la protagonista.”</h2>
        <p className="mx-auto mt-8 max-w-xl text-base leading-7 text-white/62">
          Nuestros espacios son el umbral. Departamentos amoblados con estética sobria, contrato claro y contexto cultural para sumergirse en el ritmo porteño.
        </p>
      </section>

      <AbaHomeFocusMenu />

      <AbaAboutBlock />

      <AbaImageCollage
        eyebrow="Buenos Aires en capas"
        title="Antes de elegir departamento, hay que sentir el barrio."
        text="Cafés, librerías, avenidas, interiores y rituales diarios conectan cada propiedad con una manera concreta de vivir la ciudad."
        images={cityCollage}
        cta={<Link href="/vivir-buenos-aires" className="aba-button">Explorar magazine</Link>}
      />

      <AbaScrollCinema
        kicker="De la ciudad a la llave"
        title="Elegir dónde vivir también es una escena."
        description="Tres momentos precisos: llegar al pulso, encontrar una pausa y empezar a sentirse parte."
        frames={[
          { image: abaCultureImages[6], eyebrow: "Avenida", title: "Llegar al pulso", text: "La primera impresión no es un plano: es luz, movimiento, escala y cercanía con lo que pasa todos los días." },
          { image: abaPropertyMoodImages[1], eyebrow: "Interior", title: "Encontrar pausa", text: "La propiedad aparece como refugio: equipada, clara y lista para una estadía de 3 meses a 2 años." },
          { image: abaCultureImages[21], eyebrow: "Ritual", title: "Habitar la cultura", text: "Cafés, tango, librerías y esquinas que hacen que Buenos Aires se sienta propia desde la primera semana." },
        ]}
      />

      <AbaParallaxGallery
        eyebrow="Archivo vivo"
        title="Una ciudad para mirar antes de elegir llave."
        text="Imágenes reales de cafés, avenidas, interiores y rituales porteños se mueven a distintas velocidades para cortar la repetición y construir atmósfera."
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
                    <img src={image} alt={item.title} />
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
          <img src={palermoImage} alt="Palermo" className="aba-ken-burns absolute inset-0 h-full w-full object-cover opacity-70" />
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
            Buscamos espacios con carácter e historia para un público que llega a Buenos Aires por estudio, trabajo, cultura o una nueva etapa.
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

      <footer className="w-full border-t border-white/10 bg-[#0e0e0e] px-6 py-24 md:px-20">
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <div className="font-editorial text-4xl leading-tight text-white">Alojamiento Buenos Aires</div>
            <p className="mt-6 text-sm leading-6 text-white/48">© 2026 Alojamiento Buenos Aires. La ciudad como protagonista.</p>
          </div>
          <div className="col-span-12 grid grid-cols-2 gap-8 md:col-span-8 md:grid-cols-4">
            {[
              ["Barrios", "Palermo", "Recoleta", "San Telmo"],
              ["Propiedades", "Catálogo", "Pet friendly", "Amoblados"],
              ["Magazine", "Qué hacer", "Comer y beber", "Cultura"],
              ["Contacto", "Consultar", "Publicar", "WhatsApp"],
            ].map((group) => (
              <div key={group[0]} className="flex flex-col gap-4">
                <span className="aba-label">{group[0]}</span>
                {group.slice(1).map((item) => (
                  <span key={item} className="text-sm text-white/58">{item}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>
      <AbaWhatsAppFloat phone={state.theme.whatsappPhone} message={state.theme.whatsappMessage} />
    </main>
  );
}