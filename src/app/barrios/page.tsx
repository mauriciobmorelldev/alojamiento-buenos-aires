import Link from 'next/link';
import { abaNeighborhoods } from '@/lib/abaContent';
import AbaNav from '@/components/aba/AbaNav';
import AbaWhatsAppFloat from '@/components/aba/AbaWhatsAppFloat';
import AbaFooter from '@/components/aba/AbaFooter';

export const metadata = {
  title: 'Barrios de Buenos Aires - Alojamiento Buenos Aires',
  description: 'Guías de barrios para elegir donde vivir en Buenos Aires con contexto, movilidad y vida cotidiana.',
};

export default function BarriosPage() {
  const featured = abaNeighborhoods[0];

  return (
    <main className='aba-public bg-[#131313] text-white'>
      <AbaNav transparent fixed />
      <section className='relative min-h-[760px] overflow-hidden px-6 pb-16 pt-36 md:px-20'>
        <img src={featured.image} alt='' className='aba-ken-burns absolute inset-0 h-full w-full object-cover opacity-58' />
        <div className='absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/52 to-[#131313]/28' />
        <div className='relative z-10 mx-auto grid max-w-[1440px] gap-10 md:grid-cols-12 md:items-end'>
          <div className='md:col-span-7'>
            <p className='aba-label mb-6'>Barrios</p>
            <h1 className='aba-display text-white'>Cómo se traduce en una mudanza.</h1>
            <p className='mt-6 max-w-2xl text-lg leading-8 text-white/70'>
              Elegir bien es elegir una rutina posible.
            </p>
          </div>
          <div className='border border-[#e2c19b]/55 bg-[#131313]/70 p-7 backdrop-blur-xl md:col-span-4 md:col-start-9'>
            <p className='aba-label'>Destacado</p>
            <h2 className='mt-3 font-editorial text-4xl'>{featured.name}</h2>
            <p className='mt-4 text-sm leading-7 text-white/64'>{featured.summary}</p>
            <div className='mt-7 flex flex-wrap gap-3'><Link href={'/barrios/' + featured.slug} className='aba-button'>Ver guía</Link><Link href={'/departamentos?barrio=' + featured.name} className='aba-button-dark'>Ver propiedades</Link></div>
          </div>
        </div>
      </section>

      <section className='mx-auto max-w-[1440px] px-6 py-24 md:px-20'>
        <div className='grid gap-8 md:grid-cols-3'>
          {abaNeighborhoods.map((neighborhood, index) => (
            <article key={neighborhood.slug} className={['group border border-white/10 bg-white/[0.025] p-3 transition duration-500 hover:-translate-y-1 hover:border-[#e2c19b]/60', index === 1 ? 'md:mt-16' : '', index === 2 ? 'md:mt-8' : ''].join(' ')}>
              <div className='aspect-[4/5] overflow-hidden bg-black'>
                <img src={neighborhood.image} alt={neighborhood.name} className='h-full w-full object-cover opacity-82 transition duration-700 group-hover:scale-105 group-hover:opacity-100' />
              </div>
              <div className='p-4'>
                <p className='aba-label'>{neighborhood.vibe}</p>
                <h2 className='mt-3 font-editorial text-4xl'>{neighborhood.name}</h2>
                <p className='mt-4 text-sm leading-7 text-white/62'>{neighborhood.summary}</p>
                <div className='mt-6 flex flex-wrap gap-2'>
                  {neighborhood.bestFor.map((item) => (
                    <span key={item} className='border border-white/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/54'>{item}</span>
                  ))}
                </div>
                <div className='mt-6 border-t border-white/10 pt-5'>
                  <p className='aba-label mb-3 text-[9px]'>Cerca de</p>
                  <ul className='grid gap-2 text-sm text-white/58'>
                    {neighborhood.anchors.map((anchor) => <li key={anchor}>{anchor}</li>)}
                  </ul>
                </div>
                <div className='mt-7 flex flex-wrap gap-3'>
                  <Link href={'/departamentos?barrio=' + neighborhood.name} className='aba-button'>Propiedades</Link>
                  <Link href={'/vivir-buenos-aires?categoria=barrios'} className='border border-white/18 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/68 transition hover:border-white/45 hover:text-white'>Guías</Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className='mt-24 grid gap-8 border-y border-white/10 py-12 md:grid-cols-[0.8fr_1.2fr] md:items-center'>
          <h2 className='aba-headline text-white'>El barrio como parte del producto.</h2>
          <p className='text-sm leading-8 text-white/62'>
            Esta sección queda armada para escalar: hoy muestra barrios curados para demo; luego puede conectarse a slugs propios, conteo real de propiedades, guias SEO y filtros por zona sin rediseñar la experiencia.
          </p>
        </div>
      </section>
      <AbaFooter />
      <AbaWhatsAppFloat />
    </main>
  );
}
