import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AbaNav from '@/components/aba/AbaNav';
import AbaWhatsAppFloat from '@/components/aba/AbaWhatsAppFloat';
import { readPublicHomeListings } from '@/lib/server/inmoRepository';
import { formatPrice } from '@/lib/pricing';
import { abaNeighborhoods, findNeighborhood, normalizeAbaSlug } from '@/lib/abaContent';
import { abaCultureImages } from '@/lib/abaMedia';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return abaNeighborhoods.map((neighborhood) => ({ slug: neighborhood.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const neighborhood = findNeighborhood(slug);

  if (!neighborhood) return {};

  return {
    title: `${neighborhood.name} - Guía de barrio | Alojamiento Buenos Aires`,
    description: neighborhood.summary,
    openGraph: {
      title: `${neighborhood.name} para vivir Buenos Aires`,
      description: neighborhood.summary,
      images: [{ url: neighborhood.image }],
    },
  };
}

export default async function BarrioDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const neighborhood = findNeighborhood(slug);

  if (!neighborhood) notFound();

  const { data } = await readPublicHomeListings();
  const listings = (data.listings ?? []).filter((listing) => {
    const listingNeighborhood = normalizeAbaSlug(listing.neighborhood || '');
    return listing.status === 'disponible' && (listingNeighborhood === neighborhood.slug || listingNeighborhood.startsWith(neighborhood.slug));
  });

  const paragraphs = neighborhood.body.split(/\n+/).filter(Boolean);

  return (
    <main className="aba-public min-h-screen bg-[#111] text-white">
      <AbaNav transparent fixed />

      <section className="relative min-h-[820px] overflow-hidden px-6 pb-20 pt-36 md:px-20">
        <img src={neighborhood.image} alt={neighborhood.name} className="aba-ken-burns absolute inset-0 h-full w-full object-cover opacity-62" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] via-[#111]/64 to-[#111]/30" />
        <div className="relative z-10 mx-auto grid max-w-[1440px] gap-12 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <p className="aba-label text-[#e2c19b]">Guía de barrio</p>
            <h1 className="aba-display mt-6 text-white">Vivir en {neighborhood.name}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72">{neighborhood.summary}</p>
          </div>
          <aside className="border border-[#e2c19b]/42 bg-[#111]/70 p-7 backdrop-blur-xl md:col-span-4 md:col-start-9">
            <p className="aba-label">Clima urbano</p>
            <h2 className="mt-3 font-editorial text-4xl text-white">{neighborhood.vibe}</h2>
            <div className="mt-6 grid gap-3">
              {neighborhood.bestFor.map((item) => (
                <span key={item} className="rounded-full border border-white/12 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/62">{item}</span>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1440px] gap-16 px-6 py-24 md:grid-cols-12 md:px-20">
        <article className="md:col-span-6">
          <p className="aba-label text-[#e2c19b]">Lectura ABA</p>
          <h2 className="mt-5 font-editorial text-5xl leading-none text-white md:text-6xl">No es una zona: es una forma de semana.</h2>
          <div className="mt-10 grid gap-7 text-sm leading-8 text-white/66">
            {paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </article>

        <div className="md:col-span-5 md:col-start-8">
          <figure className="overflow-hidden border border-white/10 bg-white/[0.025] p-3">
            <img src={abaCultureImages[24]} alt="Ritual porteño cerca de casa" className="aspect-[4/5] w-full object-cover opacity-88" />
            <figcaption className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">Rituales, escalas y vida alrededor</figcaption>
          </figure>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0d0d0d] px-6 py-20 md:px-20">
        <div className="mx-auto grid max-w-[1440px] gap-10 md:grid-cols-3">
          <div>
            <p className="aba-label text-[#e2c19b]">Microzonas</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {neighborhood.microzones.map((item) => <span key={item} className="rounded-full border border-white/12 px-4 py-2 text-sm text-white/68">{item}</span>)}
            </div>
          </div>
          <div>
            <p className="aba-label text-[#e2c19b]">Rituales diarios</p>
            <ul className="mt-6 grid gap-3 text-sm text-white/66">
              {neighborhood.dailyRituals.map((item) => <li key={item}>— {item}</li>)}
            </ul>
          </div>
          <div>
            <p className="aba-label text-[#e2c19b]">Conexión</p>
            <p className="mt-6 text-sm leading-7 text-white/66">{neighborhood.transport}</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-6 py-24 md:px-20">
        <div className="grid gap-8 md:grid-cols-[0.75fr_1.25fr] md:items-end">
          <div>
            <p className="aba-label text-[#e2c19b]">Propiedades en {neighborhood.name}</p>
            <h2 className="mt-4 font-editorial text-5xl leading-none text-white">El departamento como base para entrar al barrio.</h2>
          </div>
          <p className="text-sm leading-8 text-white/62">{neighborhood.propertyAngle}</p>
        </div>

        {listings.length ? (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {listings.slice(0, 3).map((listing) => {
              const image = listing.images[listing.coverIndex] || listing.images[0] || neighborhood.image;
              return (
                <Link key={listing.id} href={`/departamentos/${listing.id}`} className="group block border border-white/10 bg-white/[0.025] p-3 transition duration-500 hover:-translate-y-1 hover:border-[#e2c19b]/60">
                  <img src={image} alt={listing.title} className="aspect-[4/3] w-full object-cover opacity-88 transition duration-700 group-hover:scale-[1.02] group-hover:opacity-100" />
                  <div className="p-4">
                    <p className="aba-label text-[#e2c19b]">{listing.neighborhood}</p>
                    <h3 className="mt-3 font-editorial text-3xl leading-tight text-white">{listing.title}</h3>
                    <p className="mt-3 text-sm text-white/58">{listing.rooms} ambientes · {listing.area} m2 · {formatPrice(listing.price, listing.priceUnit, listing.currency)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-12 border border-white/10 bg-white/[0.025] p-8">
            <p className="text-sm leading-7 text-white/62">Todavía no hay propiedades publicadas en {neighborhood.name}, pero la guía queda lista para cuando el inventario crezca.</p>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href={`/departamentos?barrio=${encodeURIComponent(neighborhood.name)}`} className="aba-button">Ver propiedades</Link>
          <Link href="/vivir-buenos-aires/barrios" className="aba-button-dark">Leer guías de barrios</Link>
        </div>
      </section>

      <section className="bg-[#0b0b0b] px-6 py-20 md:px-20">
        <div className="mx-auto grid max-w-[1440px] gap-8 md:grid-cols-4">
          {abaNeighborhoods.filter((item) => item.slug !== neighborhood.slug).map((item) => (
            <Link key={item.slug} href={`/barrios/${item.slug}`} className="group border border-white/10 p-4 transition hover:border-[#e2c19b]/60">
              <img src={item.image} alt={item.name} className="aspect-[4/3] w-full object-cover opacity-70 transition group-hover:opacity-100" />
              <p className="aba-label mt-4 text-[#e2c19b]">Otro barrio</p>
              <h3 className="mt-2 font-editorial text-3xl text-white">{item.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      <AbaWhatsAppFloat />
    </main>
  );
}