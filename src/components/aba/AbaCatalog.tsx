'use client';

import Link from 'next/link';
import { useMemo, useState, type CSSProperties } from 'react';
import type { InmoState, Listing } from '@/lib/inmoData';
import { useInmoStore } from '@/lib/inmoStore';
import { formatPrice } from '@/lib/pricing';
import AbaNav from './AbaNav';
import AbaScrollCinema from './AbaScrollCinema';
import AbaWhatsAppFloat from './AbaWhatsAppFloat';
import { abaCultureImages, abaPropertyMoodImages } from '@/lib/abaMedia';

const fallbackImage = abaPropertyMoodImages[0];
const defaultAmenities = ['Pet friendly', 'Laundry', 'Balcón', 'Cocina equipada'];

const listingHref = (item: Listing) => '/departamentos/' + item.id;
const listingImage = (item: Listing) => item.images[item.coverIndex] || item.images[0] || fallbackImage;
const availableLabel = (index: number) => index % 3 === 0 ? 'Disponible ahora' : index % 3 === 1 ? 'Oct 15' : 'Dic 01';

export default function AbaCatalog({ initialState }: { initialState: Partial<InmoState> }) {
  const { state } = useInmoStore(initialState);
  const [neighborhood, setNeighborhood] = useState('all');
  const [rooms, setRooms] = useState('all');
  const [price, setPrice] = useState('all');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const neighborhoods = useMemo(
    () => Array.from(new Set(state.listings.map((item) => item.neighborhood))).filter(Boolean),
    [state.listings]
  );

  const amenities = useMemo(() => {
    const fromListings = state.listings.flatMap((item) => item.attributes.comodidades ?? []);
    return Array.from(new Set([...defaultAmenities, ...fromListings])).filter(Boolean);
  }, [state.listings]);

  const listings = useMemo(
    () => state.listings.filter((item) => {
      if (item.status !== 'disponible') return false;
      if (neighborhood !== 'all' && item.neighborhood !== neighborhood) return false;
      if (rooms !== 'all' && item.rooms < Number(rooms)) return false;
      if (price === 'under-800' && item.price >= 800) return false;
      if (price === '800-1500' && (item.price < 800 || item.price > 1500)) return false;
      if (price === 'over-1500' && item.price <= 1500) return false;
      if (selectedAmenities.length) {
        const propertyAmenities = item.attributes.comodidades ?? [];
        if (!selectedAmenities.every((amenity) => propertyAmenities.includes(amenity))) return false;
      }
      return true;
    }),
    [neighborhood, price, rooms, selectedAmenities, state.listings]
  );

  const clearFilters = () => {
    setNeighborhood('all');
    setRooms('all');
    setPrice('all');
    setSelectedAmenities([]);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((current) => current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity]);
  };

  return (
    <main className='aba-public min-h-screen bg-[#131313] text-white'>
      <AbaNav dark />
      <section className='mx-auto max-w-[1440px] px-6 pb-32 pt-16 md:px-20 md:pt-20'>
        <div className='aba-filter-bar flex flex-col gap-6 border-b border-white/8 pb-10 md:flex-row md:items-start md:justify-between'>
          <div className='flex flex-wrap gap-8'>
            <label className='group relative aba-label text-white'>
              Barrios
              <select value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} className='absolute inset-0 h-full w-full cursor-pointer opacity-0'>
                <option value='all'>Todos</option>
                {neighborhoods.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <span className='ml-1 text-[var(--aba-bronze)]'>⌄</span>
            </label>
            <label className='group relative aba-label text-white'>
              Ambientes
              <select value={rooms} onChange={(event) => setRooms(event.target.value)} className='absolute inset-0 h-full w-full cursor-pointer opacity-0'>
                <option value='all'>Todos</option>
                <option value='1'>1+</option>
                <option value='2'>2+</option>
                <option value='3'>3+</option>
                <option value='4'>4+</option>
              </select>
              <span className='ml-1 text-[var(--aba-bronze)]'>⌄</span>
            </label>
            <label className='group relative aba-label text-white'>
              Precio
              <select value={price} onChange={(event) => setPrice(event.target.value)} className='absolute inset-0 h-full w-full cursor-pointer opacity-0'>
                <option value='all'>Todos</option>
                <option value='under-800'>Hasta USD 800</option>
                <option value='800-1500'>USD 800 / 1.500</option>
                <option value='over-1500'>Más de USD 1.500</option>
              </select>
              <span className='ml-1 text-[var(--aba-bronze)]'>⌄</span>
            </label>
            <details className='relative'>
              <summary className='aba-label cursor-pointer list-none text-white marker:hidden'>Comodidades <span className='text-[var(--aba-bronze)]'>⌄</span></summary>
              <div className='absolute left-0 top-8 z-30 grid min-w-64 gap-2 border border-white/10 bg-[#1b1a18] p-4 shadow-2xl'>
                {amenities.map((amenity) => (
                  <button key={amenity} type='button' onClick={() => toggleAmenity(amenity)} className={['text-left text-[10px] font-bold uppercase tracking-[0.16em] transition', selectedAmenities.includes(amenity) ? 'text-[var(--aba-bronze)]' : 'text-white/64 hover:text-white'].join(' ')}>
                    {amenity}
                  </button>
                ))}
              </div>
            </details>
            {(neighborhood !== 'all' || rooms !== 'all' || price !== 'all' || selectedAmenities.length) ? (
              <button type='button' onClick={clearFilters} className='aba-label text-white/45 hover:text-white'>Limpiar</button>
            ) : null}
          </div>
          <p className='aba-label text-white/72'>Mostrando {listings.length} propiedades</p>
        </div>

        <section className='grid grid-cols-1 gap-x-10 gap-y-16 pt-16 md:grid-cols-12 md:gap-y-20'>
          {listings.length ? listings.map((item, index) => {
            const pattern = index % 5;
            const isLarge = pattern === 0;
            const articleClass = pattern === 0
              ? 'md:col-span-7'
              : pattern === 1
                ? 'md:col-span-4 md:col-start-9 md:mt-4'
                : pattern === 2
                  ? 'md:col-span-5 md:mt-4'
                  : pattern === 3
                    ? 'md:col-span-7 md:col-start-6 md:-mt-16'
                    : 'md:col-span-5 md:col-start-7 md:-mt-8';
            const imageClass = isLarge ? 'aspect-[1.72/1]' : pattern === 2 ? 'aspect-[0.86/1]' : pattern === 1 ? 'aspect-[1/1]' : 'aspect-[1.08/1]';
            const motionStyle = { '--aba-delay': `${Math.min(index, 8) * 75}ms` } as CSSProperties;
            const details = [
              item.rooms + ' Ambientes',
              item.area + ' m2',
              ...(item.attributes.comodidades ?? []).slice(0, 2),
            ];

            return (
              <article key={item.id} className={['aba-cinematic-card', articleClass].join(' ')} style={motionStyle}>
                <Link href={listingHref(item)} className='group block'>
                  <div className={['overflow-hidden bg-black', imageClass].join(' ')}>
                    <img src={listingImage(item)} alt={item.title} className='h-full w-full object-cover opacity-92 transition duration-700 group-hover:opacity-100' />
                  </div>
                  <div className={isLarge ? 'relative mt-5 min-h-[130px]' : 'mt-4 grid gap-2'}>
                    <div className='flex items-center justify-between gap-4'>
                      <p className='aba-label text-[var(--aba-bronze)]'>{item.neighborhood}</p>
                      <p className='text-[9px] font-bold uppercase tracking-[0.16em] text-white/68'>{availableLabel(index)}</p>
                    </div>
                    <h2 className={isLarge ? 'aba-card-title max-w-[560px] font-editorial text-4xl leading-[0.95] text-white transition-colors duration-500 md:text-[3.05rem]' : 'aba-card-title font-editorial text-3xl leading-[0.95] text-white transition-colors duration-500 md:text-[2.55rem]'}>{item.title}</h2>
                    <p className='font-editorial text-xl italic text-white/86 md:text-2xl'>{formatPrice(item.price, item.priceUnit, item.currency)}</p>
                    <div className={isLarge ? 'mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/62 md:absolute md:bottom-2 md:right-0 md:max-w-[260px] md:justify-end md:text-right' : 'mt-2 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/62'}>
                      {details.map((detail) => <span key={detail}>{detail}</span>)}
                    </div>
                  </div>
                </Link>
              </article>
            );
          }) : (
            <div className='col-span-full border border-white/10 p-12 text-center'>
              <p className='aba-label'>Sin resultados</p>
              <h2 className='mt-4 font-editorial text-4xl text-white'>No encontramos propiedades con esos filtros.</h2>
              <button type='button' onClick={clearFilters} className='mt-8 border border-white px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white'>Ver todas las propiedades</button>
            </div>
          )}
        </section>

        {listings.length > 6 ? (
          <div className='mt-20 flex justify-center'>
            <button type='button' className='border-b border-white pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white'>Ver más propiedades</button>
          </div>
        ) : null}
      </section>


      <AbaScrollCinema
        kicker='Catálogo vivo'
        title='Propiedades con contexto, no fichas sueltas.'
        frames={[
          { image: abaPropertyMoodImages[1], eyebrow: 'Vista', title: 'La ciudad entra por la ventana', text: 'Cada departamento se entiende mejor cuando el barrio también forma parte de la decisión.' },
          { image: abaCultureImages[16], eyebrow: 'Arquitectura', title: 'Fachadas con historia', text: 'Recoleta, Palermo y San Telmo suman identidad antes de mirar metros cuadrados.' },
          { image: abaCultureImages[3], eyebrow: 'Rutina', title: 'Cafés, libros y caminatas', text: 'El catálogo empieza a contar cómo se vive alrededor de cada propiedad.' },
        ]}
      />
      <footer className='border-t border-white/8 bg-[#0e0e0e] px-6 py-28 md:px-20'>
        <div className='mx-auto grid max-w-[1440px] gap-12 md:grid-cols-12'>
          <div className='md:col-span-6'>
            <Link href='/' className='font-editorial text-4xl uppercase tracking-[0.04em] text-white'>Alojamiento Buenos Aires</Link>
          </div>
          <div className='grid grid-cols-2 gap-8 text-sm text-white/62 md:col-span-4'>
            <nav className='grid gap-3'><Link href='/barrios/palermo'>Palermo</Link><Link href='/barrios/recoleta'>Recoleta</Link><Link href='/barrios/san-telmo'>San Telmo</Link></nav>
            <nav className='grid gap-3'><Link href='/contacto'>Legal</Link><Link href='/contacto'>Contacto</Link><Link href='/vivir-buenos-aires'>Newsletter</Link></nav>
          </div>
          <p className='self-end text-xs uppercase tracking-[0.12em] text-white/58 md:col-span-2'>© 2026 Alojamiento Buenos Aires.</p>
        </div>
      </footer>
      <AbaWhatsAppFloat phone={state.theme.whatsappPhone} message={state.theme.whatsappMessage} />
    </main>
  );
}
