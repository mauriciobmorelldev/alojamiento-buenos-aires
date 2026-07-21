'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { Listing } from '@/lib/inmoData';
import { formatPrice } from '@/lib/pricing';
import AbaNav from './AbaNav';
import AbaScrollCinema from './AbaScrollCinema';
import AbaWhatsAppFloat from './AbaWhatsAppFloat';
import AbaOptimizedImage from './AbaOptimizedImage';
import { abaCultureImages, abaPropertyMoodImages } from '@/lib/abaMedia';
import { findNeighborhoodByName } from '@/lib/abaContent';

const fallbackImage = abaPropertyMoodImages[0];
const barrioImage = abaCultureImages[16];

const barrioText: Record<string, string> = {
  Palermo: 'Cafés, parques, diseño, gastronomía y movimiento urbano. Una base activa para tener vida social, trabajo y servicios siempre cerca.',
  'Palermo Soho': 'Ferias, librerías, barras y calles arboladas. Una rutina porteña activa sin perder escala de barrio.',
  Recoleta: 'Palacios, universidades, centros médicos y arquitectura clásica. Una base práctica y elegante para vivir Buenos Aires con calma.',
  'San Telmo': 'Mercados, tango, anticuarios y patrimonio. Una forma intensa, caminable y cultural de vivir el espíritu histórico porteño.',
};

const iconFor = (text: string) => {
  const value = text.toLowerCase();
  if (value.includes('balc') || value.includes('terra')) return 'balcony';
  if (value.includes('laundry') || value.includes('lav')) return 'local_laundry_service';
  if (value.includes('pet')) return 'pets';
  if (value.includes('seguridad') || value.includes('security')) return 'verified_user';
  if (value.includes('cochera') || value.includes('parking')) return 'local_parking';
  return 'auto_awesome';
};

export default function AbaPropertyDetail({ property }: { property: Listing }) {
  const [status, setStatus] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const images = property.images.length ? property.images : [fallbackImage];
  const heroImage = images[selectedImage] || images[0];
  const zoomImage = zoomIndex === null ? '' : images[zoomIndex] || images[0];
  const amenities = property.attributes.comodidades ?? [];
  const refined = (amenities.length ? amenities : ['Climatización central', 'Acceso privado', 'Balcón / terraza', 'Cocina equipada']).slice(0, 4);
  const specs = [property.rooms + ' ambientes', property.area + ' m2', formatPrice(property.price, property.priceUnit, property.currency), amenities.includes('Seguridad 24h') ? 'Seguridad 24h' : 'Contrato claro'];
  const neighborhoodGuide = findNeighborhoodByName(property.neighborhood);
  const neighborhoodHref = neighborhoodGuide ? '/barrios/' + neighborhoodGuide.slug : '/barrios';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus('Enviando...');
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadType: 'tenant', propertyId: property.id, name: formData.get('name'), email: formData.get('email'), phone: formData.get('phone'), message: formData.get('message') }),
    });
    setStatus(response.ok ? 'Consulta enviada. Te vamos a contactar.' : 'No pudimos enviar la consulta.');
    if (response.ok) event.currentTarget.reset();
  };

  const moveZoom = (offset: number) => setZoomIndex((current) => ((current ?? selectedImage) + offset + images.length) % images.length);

  return (
    <main className='aba-public min-h-screen bg-[#131313] text-white'>
      <AbaNav dark />
      <section className='relative min-h-[760px] overflow-hidden bg-black md:min-h-[900px]'>
        <button type='button' onClick={() => setZoomIndex(selectedImage)} className='absolute inset-0 cursor-zoom-in' aria-label='Ampliar imagen principal'>
          <AbaOptimizedImage src={heroImage} alt={property.title} width={1800} height={1200} priority quality={76} sizes='100vw' className='aba-ken-burns h-full w-full object-cover opacity-62' />
        </button>
        <div className='absolute inset-0 bg-gradient-to-b from-black/30 via-black/36 to-[#131313]' />
        <div className='absolute bottom-16 left-0 right-0 z-10 px-6 md:px-20'>
          <div className='mx-auto max-w-[1440px]'>
            <div className='grid gap-4 sm:grid-cols-4 md:w-[78%]'>
              {images.slice(0, 4).map((image, index) => (
                <button key={image + index} type='button' onClick={() => setSelectedImage(index)} className={['aspect-[1.45/1] overflow-hidden border bg-black transition', selectedImage === index ? 'border-white' : 'border-white/12 hover:border-white/45'].join(' ')} aria-label={'Ver imagen ' + (index + 1)}>
                  <AbaOptimizedImage src={image} alt='' width={420} height={290} priority={index < 3} quality={68} sizes='(max-width: 768px) 25vw, 18vw' className='h-full w-full object-cover opacity-90' />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>


      <section className='mx-auto max-w-[1440px] px-6 py-24 md:px-20'>
        <div className='mx-auto max-w-5xl'>
          <div className='grid gap-8 border-b border-white/10 pb-10 md:grid-cols-[1fr_auto] md:items-end'>
            <div>
              <p className='aba-label text-[var(--aba-bronze)]'>{property.neighborhood} / {formatPrice(property.price, property.priceUnit, property.currency)}</p>
              <h1 className='mt-4 max-w-3xl font-editorial text-6xl leading-none text-white md:text-7xl'>{property.title}</h1>
            </div>
            <div className='flex gap-3 md:justify-end'>
              <button type='button' className='flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-white/70 hover:border-white hover:text-white' aria-label='Guardar'><span className='material-symbols-outlined text-lg'>favorite</span></button>
              <button type='button' className='flex h-10 w-10 items-center justify-center rounded-full border border-white/12 text-white/70 hover:border-white hover:text-white' aria-label='Compartir'><span className='material-symbols-outlined text-lg'>share</span></button>
            </div>
          </div>
          <div className='flex flex-wrap gap-7 border-b border-white/10 py-7 text-[10px] font-bold uppercase tracking-[0.16em] text-white/72'>
            {specs.map((item) => <span key={item}>{item}</span>)}
          </div>
          <article className='max-w-3xl py-20'>
            <p className='font-editorial text-2xl leading-snug text-white/88'>“{property.highlight ? property.highlight : 'Una residencia amoblada para integrarse a Buenos Aires con comodidad, calma y contexto.'}”</p>
            <p className='mt-8 text-sm leading-8 text-white/68'>{property.description}</p>
            <p className='mt-6 text-sm leading-8 text-white/68'>Pensada para estadías de mediano plazo, esta propiedad combina ubicación, equipamiento y una lectura clara del barrio para que la llegada a la ciudad sea más simple.</p>
          </article>
        </div>
      </section>

      <section className='relative overflow-hidden bg-[#101010] px-6 py-28 md:px-20'>
        <AbaOptimizedImage src={barrioImage} alt='' width={1600} height={900} quality={66} sizes='100vw' className='absolute inset-0 h-full w-full object-cover opacity-18' />
        <div className='absolute inset-0 bg-gradient-to-r from-[#101010] via-[#101010]/86 to-[#101010]/68' />
        <div className='relative z-10 mx-auto grid max-w-[1440px] gap-12 md:grid-cols-12 md:items-center'>
          <div className='md:col-span-5'>
            <h2 className='font-editorial text-5xl leading-none text-white'>Vivir en {property.neighborhood}</h2>
            <p className='mt-6 max-w-md text-sm leading-7 text-white/68'>{barrioText[property.neighborhood] ?? 'Una ubicación pensada para vivir Buenos Aires con rutina: cafés, transporte, cultura cercana y servicios diarios.'}</p>
            <Link href={neighborhoodHref} className='mt-8 inline-flex border-b border-white pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white'>Explorar barrio</Link>
          </div>
          <div className='md:col-span-6 md:col-start-7'>
            <AbaOptimizedImage src={images[1] || heroImage} alt='' width={900} height={760} quality={72} sizes='(max-width: 768px) 100vw, 48vw' className='aspect-[1.18/1] w-full object-cover' />
          </div>
        </div>
      </section>

      <section className='mx-auto grid max-w-[1440px] gap-12 px-6 py-28 md:grid-cols-12 md:px-20'>
        <div className='md:col-span-4'>
          <h2 className='font-editorial text-4xl text-white'>Detalles refinados</h2>
          <p className='mt-4 max-w-xs text-sm leading-7 text-white/58'>Cada elemento fue curado para ofrecer una experiencia amoblada clara, práctica y lista para habitar.</p>
        </div>
        <div className='grid gap-8 md:col-span-7 md:col-start-6 md:grid-cols-2'>
          {refined.map((item) => (
            <div key={item} className='grid grid-cols-[auto_1fr] gap-4'>
              <span className='material-symbols-outlined text-lg text-[var(--aba-bronze)]'>{iconFor(item)}</span>
              <div><h3 className='text-[10px] font-bold uppercase tracking-[0.18em] text-white'>{item}</h3><p className='mt-2 text-xs leading-5 text-white/52'>Disponible dentro de una propuesta lista para estadías de 3 meses a 2 años.</p></div>
            </div>
          ))}
        </div>
      </section>


      <AbaScrollCinema
        kicker='Secuencia de llegada'
        title='De la calle al interior, sin cortar la atmósfera.'
        frames={[
          { image: abaCultureImages[22], eyebrow: property.neighborhood, title: 'La arquitectura del entorno', text: 'La ficha deja de ser solo una galería y empieza a mostrar por qué este barrio acompaña la estadía.' },
          { image: images[0] || abaPropertyMoodImages[0], eyebrow: 'Propiedad', title: 'El espacio como refugio', text: 'Imágenes, amenities y consulta conviven con una lectura más emocional del lugar.' },
          { image: abaCultureImages[25], eyebrow: 'Ritual porteño', title: 'La vida alrededor', text: 'Un café, una librería o una avenida cercana pueden definir tanto como los metros cuadrados.' },
        ]}
      />
      <section className='bg-[#0f0f0f] px-6 py-28 md:px-20'>
        <div className='mx-auto grid max-w-[1240px] gap-10 rounded-md bg-[#2a2927] p-8 md:grid-cols-12 md:p-16'>
          <div className='md:col-span-5'>
            <h2 className='font-editorial text-5xl text-white'>Consultar</h2>
            <p className='mt-5 max-w-sm text-sm leading-7 text-white/68'>Para coordinar una visita privada o pedir más detalles, dejanos tu consulta. También podés escribirnos por WhatsApp.</p>
            <Link href={'https://wa.me/?text=' + encodeURIComponent('Hola, quiero consultar por ' + property.title)} className='mt-8 inline-flex border border-white/28 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white hover:border-white'>Contactar por WhatsApp</Link>
          </div>
          <form onSubmit={submit} className='grid gap-5 md:col-span-6 md:col-start-7'>
            <input name='name' required placeholder='Nombre' className='border-b border-white/14 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[var(--aba-bronze)]' />
            <input name='email' required type='email' placeholder='Email' className='border-b border-white/14 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[var(--aba-bronze)]' />
            <input name='phone' required placeholder='Teléfono' className='border-b border-white/14 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[var(--aba-bronze)]' />
            <textarea name='message' rows={4} placeholder='Mensaje' className='border-b border-white/14 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[var(--aba-bronze)]' />
            <button className='w-fit border border-white/28 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white hover:border-white'>Solicitar visita</button>
            {status ? <p className='text-xs text-white/72'>{status}</p> : null}
          </form>
        </div>
      </section>

      <footer className='border-t border-white/8 bg-[#0b0b0b] px-6 py-12 text-center md:px-20'>
        <Link href='/' className='font-editorial text-2xl text-white'>Alojamiento BA</Link>
        <nav className='mt-6 flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-[0.16em] text-white/48'><Link href='/contacto'>Privacidad</Link><Link href='/contacto'>Términos</Link><Link href='/contacto'>Prensa</Link><Link href='/contacto'>Contacto</Link></nav>
        <p className='mt-6 text-[10px] text-white/38'>© 2026 Alojamiento Buenos Aires. Todos los derechos reservados.</p>
      </footer>

      {zoomImage ? (
        <div className='fixed inset-0 z-[1000] bg-[#070604]/95 p-4 backdrop-blur-md sm:p-8'>
          <button type='button' onClick={() => setZoomIndex(null)} className='absolute right-5 top-5 z-10 border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition hover:bg-white hover:text-black'>Cerrar</button>
          {images.length > 1 ? <><button type='button' onClick={() => moveZoom(-1)} className='absolute left-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white hover:text-black' aria-label='Imagen anterior'><span className='material-symbols-outlined'>chevron_left</span></button><button type='button' onClick={() => moveZoom(1)} className='absolute right-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white hover:text-black' aria-label='Imagen siguiente'><span className='material-symbols-outlined'>chevron_right</span></button></> : null}
          <button type='button' className='flex h-full w-full cursor-zoom-out items-center justify-center' onClick={() => setZoomIndex(null)} aria-label='Cerrar imagen ampliada'><img src={zoomImage} alt='' className='max-h-full max-w-full object-contain shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)]' /></button>
          <div className='absolute inset-x-0 bottom-5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/45'>{(zoomIndex ?? selectedImage) + 1} / {images.length}</div>
        </div>
      ) : null}
      <AbaWhatsAppFloat message={'Hola, quiero consultar por ' + property.title + '.'} />
    </main>
  );
}
