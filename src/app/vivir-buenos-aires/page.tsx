import Link from 'next/link';
import { readPublicEditorialPosts } from '@/lib/server/inmoRepository';
import { abaEditorialSections, mergeEditorialPosts } from '@/lib/abaContent';
import AbaNav from '@/components/aba/AbaNav';
import AbaNewsletterForm from '@/components/aba/AbaNewsletterForm';
import AbaLiteraryPrelude from '@/components/aba/AbaLiteraryPrelude';
import AbaImageRevealList from '@/components/aba/AbaImageRevealList';
import AbaWhatsAppFloat from '@/components/aba/AbaWhatsAppFloat';
import { abaCultureImages, abaPropertyMoodImages } from '@/lib/abaMedia';

export const revalidate = 120;

const heroImage = abaCultureImages[7];

const editorialImages = [
  abaCultureImages[24],
  abaCultureImages[23],
  abaCultureImages[25],
  abaCultureImages[16],
  abaCultureImages[13],
];

const railItems = [
  { label: 'Todo', href: '/vivir-buenos-aires' },
  { label: 'Barrios', href: '/vivir-buenos-aires/barrios' },
  { label: 'Comer y beber', href: '/vivir-buenos-aires/comer-beber' },
  { label: 'Cultura', href: '/vivir-buenos-aires/cultura-entretenimiento' },
  { label: 'Universidades', href: '/vivir-buenos-aires/cultura-entretenimiento' },
  { label: 'Agenda', href: '/vivir-buenos-aires/cultura-entretenimiento' },
];

const getPostImage = (coverImage: string | null | undefined, index: number) => coverImage || editorialImages[index % editorialImages.length];

export default async function VivirBuenosAiresPage() {
  const { data } = await readPublicEditorialPosts();
  const posts = mergeEditorialPosts(data.editorialPosts ?? []);
  const [featured, ...rest] = posts;
  const revealItems = abaEditorialSections.map((section) => ({
    title: section.title,
    eyebrow: section.eyebrow,
    text: section.text,
    image: section.image,
    href: '/vivir-buenos-aires/' + section.id,
  }));

  return (
    <main className='aba-public aba-motion-scope min-h-screen bg-[#101010] text-white'>
      <AbaNav transparent fixed />

      <section className='aba-magazine-hero relative overflow-hidden border-b border-white/10'>
        <img src={heroImage} alt='Buenos Aires, escenario del magazine' className='aba-ken-burns absolute inset-0 h-full w-full object-cover opacity-72' />
        <div className='absolute inset-0 bg-[linear-gradient(90deg,rgba(12,10,9,0.86)_0%,rgba(12,10,9,0.36)_58%,rgba(12,10,9,0.18)_100%),linear-gradient(to_top,#120f0d_0%,transparent_62%)]' />
        <div className='relative z-10 mx-auto grid min-h-[92svh] max-w-[1600px] grid-cols-12 content-end gap-6 px-5 pb-16 pt-36 md:px-16 md:pb-20'>
          <div className='col-span-11 md:col-span-9'>
            <p className='aba-label mb-6 text-[#d8ae7d]'>Arte y cultura</p>
            <h1 className='max-w-[10ch] font-editorial text-[clamp(4.5rem,10vw,10rem)] leading-[0.78] text-[#f3eee5]'>
              Vivir Buenos Aires
            </h1>
            <p className='mt-8 max-w-2xl border-l border-[#d8ae7d]/70 pl-5 text-base leading-8 text-[#f3eee5]/76 md:text-lg'>
              El ritmo cultural de la ciudad, contado desde barrios, cafés, arquitectura y rituales porteños para elegir dónde vivir con algo más que un mapa.
            </p>
          </div>
          <div className='aba-magazine-hero__edition col-span-1 flex items-end text-[0.58rem] font-black uppercase tracking-[0.22em] text-[#d8ae7d]'>
            Volumen 01 · Buenos Aires
          </div>
        </div>
      </section>

      <nav className='sticky top-[72px] z-[80] border-y border-white/10 bg-[#101010]/92 px-6 py-4 backdrop-blur-xl md:px-16' aria-label='Categorías editoriales'>
        <div className='mx-auto flex max-w-[1440px] gap-5 overflow-x-auto text-[0.62rem] font-black uppercase tracking-[0.16em] text-white/58'>
          {railItems.map((item, index) => (
            <Link key={item.label} href={item.href} className={index === 0 ? 'aba-tab-link is-active text-[#e2c19b]' : 'aba-tab-link'}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <AbaLiteraryPrelude />

      <AbaImageRevealList
        eyebrow='Tres puertas de entrada'
        title='La ciudad se vuelve barrio, mesa y agenda.'
        items={revealItems}
      />

      <section className='mx-auto max-w-[1440px] px-6 py-20 md:px-16 md:py-28'>
        {featured ? (
          <Link href={'/vivir-buenos-aires/' + featured.slug} className='aba-editorial-feature group block overflow-hidden border border-white/10 bg-[#151515]'>
            <div className='relative min-h-[470px] overflow-hidden md:min-h-[620px]'>
              <img src={getPostImage(featured.coverImage, 0)} alt={featured.title} className='absolute inset-0 h-full w-full object-cover opacity-82 transition duration-700 group-hover:scale-105' />
              <div className='absolute inset-0 bg-gradient-to-r from-black/78 via-black/28 to-transparent' />
              <div className='absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/88 to-transparent p-6 md:p-12'>
                <p className='aba-label text-[#e2c19b]'>{featured.category}</p>
                <h2 className='mt-3 max-w-2xl font-editorial text-4xl leading-[0.96] text-white md:text-6xl'>{featured.title}</h2>
                <p className='mt-4 max-w-xl text-sm leading-7 text-white/72'>{featured.excerpt}</p>
                <span className='aba-button mt-7'>Leer historia</span>
              </div>
            </div>
          </Link>
        ) : null}

        <div className='mt-20 grid gap-7 md:grid-cols-[1.05fr_0.85fr] md:items-start'>
          <div className='grid gap-7'>
            {rest.slice(0, 2).map((post, index) => (
              <Link key={post.id} href={'/vivir-buenos-aires/' + post.slug} className='aba-editorial-card group grid overflow-hidden border border-white/10 bg-[#151515] md:grid-cols-[0.95fr_1fr]'>
                <img src={getPostImage(post.coverImage, index + 1)} alt={post.title} className='h-72 w-full object-cover transition duration-700 group-hover:scale-105 md:h-full' />
                <div className='flex min-h-[260px] flex-col justify-end p-6 md:p-8'>
                  <p className='aba-label text-[#e2c19b]'>{post.category}</p>
                  <h3 className='mt-3 font-editorial text-3xl leading-tight text-white md:text-4xl'>{post.title}</h3>
                  <p className='mt-3 text-sm leading-6 text-white/62'>{post.excerpt}</p>
                  <span className='mt-6 inline-flex items-center gap-2 text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/80'>
  Leer nota
  <svg className='h-3 w-3' viewBox='0 0 18 18' fill='none' aria-hidden='true'>
    <path d='M5 13L13 5M7 5h6v6' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
</span>
                </div>
              </Link>
            ))}
          </div>

          <div className='grid gap-7'>
            {abaEditorialSections.map((section) => (
              <Link key={section.id} href={'/vivir-buenos-aires/' + section.id} className='aba-editorial-card group overflow-hidden border border-white/10 bg-[#151515]'>
                <div className='relative aspect-[4/3] overflow-hidden'>
                  <img src={section.image} alt={section.title} className='h-full w-full object-cover opacity-85 transition duration-700 group-hover:scale-105 group-hover:opacity-100' />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/88 via-black/22 to-transparent' />
                  <div className='absolute bottom-5 left-5 right-5'>
                    <p className='aba-label text-[#e2c19b]'>{section.eyebrow}</p>
                    <h3 className='mt-2 font-editorial text-3xl leading-tight text-white'>{section.title}</h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className='border-y border-white/10 bg-[#141414] px-6 py-20 md:px-16'>
        <div className='mx-auto max-w-[1440px]'>
          <div className='mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
            <div>
              <p className='aba-label text-[#e2c19b]'>Colección lifestyle</p>
              <h2 className='mt-3 font-editorial text-4xl leading-tight text-white md:text-6xl'>Vivir cerca de lo que te mueve.</h2>
            </div>
            <Link href='/departamentos' className='aba-button'>Ver propiedades</Link>
          </div>

          <Link href='/departamentos' className='aba-lifestyle-strip group grid overflow-hidden border border-white/10 bg-[#0d0d0d] md:grid-cols-[1fr_1.15fr]'>
            <div className='flex min-h-[360px] flex-col justify-between p-7 md:p-10'>
              <div>
                <p className='aba-label text-[#e2c19b]'>Palermo · Recoleta · San Telmo</p>
                <h3 className='mt-4 max-w-xl font-editorial text-4xl leading-none text-white md:text-5xl'>Departamentos amoblados para habitar Buenos Aires desde adentro.</h3>
                <p className='mt-5 max-w-lg text-sm leading-7 text-white/62'>Contratos claros de 3 meses a 2 años, orientación por barrio y una curaduría pensada para estudiantes, profesionales y familias.</p>
              </div>
              <span className='mt-8 inline-flex items-center gap-2 text-[0.62rem] font-black uppercase tracking-[0.18em] text-white/80'>
  Explorar catálogo
  <svg className='h-3 w-3' viewBox='0 0 18 18' fill='none' aria-hidden='true'>
    <path d='M5 13L13 5M7 5h6v6' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
</span>
            </div>
            <div className='relative min-h-[360px] overflow-hidden'>
              <img src={abaPropertyMoodImages[0]} alt='Interior amoblado en Buenos Aires' className='absolute inset-0 h-full w-full object-cover opacity-88 transition duration-700 group-hover:scale-105' />
              <div className='absolute inset-0 bg-gradient-to-l from-transparent to-black/30' />
            </div>
          </Link>
        </div>
      </section>
      <section className='px-6 py-24 md:px-16'>
        <div className='mx-auto grid max-w-4xl gap-8 border border-[#e2c19b]/35 bg-[#151515] p-8 text-center shadow-[0_40px_120px_-80px_rgba(226,193,155,0.7)] md:p-12'>
          <p className='mx-auto flex h-11 w-11 items-center justify-center border border-[#e2c19b]/60 text-[#e2c19b]'>✉</p>
          <div>
            <p className='aba-label justify-center text-[#e2c19b]'>Despacho cultural</p>
            <h2 className='mt-3 font-editorial text-4xl leading-tight text-white md:text-5xl'>Una guía breve para entender la ciudad antes de elegir barrio.</h2>
            <p className='mx-auto mt-4 max-w-xl text-sm leading-7 text-white/62'>Novedades editoriales, propiedades destacadas y recomendaciones porteñas directamente en tu inbox.</p>
          </div>
          <div className='mx-auto w-full max-w-xl'>
            <AbaNewsletterForm compact />
          </div>
        </div>
      </section>

      <footer className='border-t border-white/10 bg-[#0b0b0b] px-6 py-16 md:px-16'>
        <div className='mx-auto grid max-w-[1440px] gap-10 md:grid-cols-[1.2fr_1fr_1fr] md:items-end'>
          <div>
            <h2 className='font-editorial text-4xl leading-none text-white md:text-5xl'>ALOJAMIENTO<br />BUENOS AIRES</h2>
            <p className='mt-5 max-w-sm text-[0.68rem] font-bold uppercase tracking-[0.12em] text-white/46'>© 2026 Alojamiento Buenos Aires. La ciudad como protagonista.</p>
          </div>
          <div className='grid grid-cols-2 gap-3 text-sm text-white/68'>
            <Link href='/vivir-buenos-aires/barrios'>Barrios</Link>
            <Link href='/contacto'>Contacto</Link>
            <Link href='/vivir-buenos-aires/comer-beber'>Comer y beber</Link>
            <Link href='/vivir-buenos-aires'>Newsletter</Link>
            <Link href='/vivir-buenos-aires/cultura-entretenimiento'>Cultura</Link>
            <Link href='/departamentos'>Propiedades</Link>
          </div>
          <p className='text-sm leading-7 text-white/52 md:text-right'>Magazine, propiedades y consultas conectadas al backend actual, listo para crecer desde el admin.</p>
        </div>
      </footer>

      <AbaWhatsAppFloat />
    </main>
  );
}