import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AbaNav from "@/components/aba/AbaNav";
import AbaWhatsAppFloat from "@/components/aba/AbaWhatsAppFloat";
import { readPublicEditorialPosts, readPublicHomeListings } from "@/lib/server/inmoRepository";
import { formatPrice } from "@/lib/pricing";
import {
  abaEditorialSections,
  abaNeighborhoods,
  filterPostsBySection,
  findEditorialSection,
  mergeEditorialPosts,
} from "@/lib/abaContent";
import { abaCultureImages, abaPropertyMoodImages } from "@/lib/abaMedia";

const interiorBreakoutFallback = abaPropertyMoodImages[0];
const detailFallback = abaPropertyMoodImages[1];

type PageProps = {
  params: Promise<{ slug: string }>;
};

const sectionDetails: Record<string, { quote: string; beats: string[]; images: string[]; cta: string }> = {
  barrios: {
    quote: "Un barrio no es una ubicación: es la manera en que una semana empieza a tener forma.",
    beats: ["Movilidad real", "Rituales cotidianos", "Escala para vivir", "Servicios cerca"],
    images: [abaCultureImages[18], abaCultureImages[16], abaCultureImages[21]],
    cta: "Ver propiedades por barrio",
  },
  "comer-beber": {
    quote: "La primera pertenencia suele aparecer en una mesa: un café, una barra, un bodegón, una esquina.",
    beats: ["Cafés notables", "Bodegones", "Barras de autor", "Rutina de barrio"],
    images: [abaCultureImages[24], abaCultureImages[10], abaCultureImages[3]],
    cta: "Encontrar barrio con vida cerca",
  },
  "cultura-entretenimiento": {
    quote: "Buenos Aires se habita mejor cuando la cultura no queda para el fin de semana, sino a pocas cuadras.",
    beats: ["Teatros", "Librerías", "Arquitectura", "Universidades"],
    images: [abaCultureImages[4], abaCultureImages[12], abaCultureImages[23]],
    cta: "Vivir cerca de la cultura",
  },
};

const findPost = async (slug: string) => {
  const { data } = await readPublicEditorialPosts();
  return mergeEditorialPosts(data.editorialPosts ?? []).find((post) => post.published && post.slug === slug);
};

const getPosts = async () => {
  const { data } = await readPublicEditorialPosts();
  return mergeEditorialPosts(data.editorialPosts ?? []);
};

const formatDate = (value: string) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const section = findEditorialSection(slug);
  if (section) {
    return {
      title: section.heroTitle + " - Alojamiento Buenos Aires",
      description: section.heroText,
      openGraph: {
        title: section.heroTitle,
        description: section.heroText,
        images: [{ url: section.image }],
      },
    };
  }
  const post = await findPost(slug);
  if (!post) return {};
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  };
}

function EditorialSectionPage({ slug }: { slug: string }) {
  const section = findEditorialSection(slug);
  if (!section) return null;
  const detail = sectionDetails[section.id];
  const relatedNeighborhoods = section.id === "barrios" ? abaNeighborhoods : abaNeighborhoods.slice(0, 3);
  const imageRail = detail.images.length ? detail.images : [section.image];

  return (
    <main className="aba-public aba-motion-scope bg-[#111]">
      <AbaNav transparent fixed />
      <section className="aba-section-issue-hero">
        <img src={section.image} alt={section.title} className="aba-ken-burns" />
        <div className="aba-section-issue-hero__shade" />
        <div className="aba-section-issue-hero__content">
          <p className="aba-label">{section.eyebrow}</p>
          <h1>{section.heroTitle}</h1>
          <p>{section.heroText}</p>
        </div>
        <div className="aba-section-issue-hero__folio">VBA / {section.title}</div>
      </section>

      <section className="aba-section-issue-manifesto">
        <blockquote>{detail.quote}</blockquote>
        <div className="aba-section-issue-beats">
          {detail.beats.map((beat, index) => (
            <span key={beat}>{String(index + 1).padStart(2, "0")} · {beat}</span>
          ))}
        </div>
      </section>

      <section className="aba-section-issue-grid">
        {imageRail.map((image, index) => (
          <figure key={image} className={index === 1 ? "is-tall" : ""}>
            <img src={image} alt="" />
            <figcaption>{section.title} · escena {String(index + 1).padStart(2, "0")}</figcaption>
          </figure>
        ))}
      </section>

      <section className="aba-section-issue-neighborhoods">
        <div>
          <p className="aba-label">Cómo se traduce en una mudanza</p>
          <h2>Elegir bien es elegir una rutina posible.</h2>
        </div>
        <div className="aba-section-issue-neighborhood-list">
          {relatedNeighborhoods.map((neighborhood) => (
            <Link key={neighborhood.slug} href={`/barrios/${neighborhood.slug}`} className="aba-section-issue-neighborhood">
              <img src={neighborhood.image} alt={neighborhood.name} />
              <div>
                <span>{neighborhood.vibe}</span>
                <h3>{neighborhood.name}</h3>
                <p>{neighborhood.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="aba-section-issue-cta">
        <p className="aba-label">Propiedades + ciudad</p>
        <h2>{detail.cta}</h2>
        <Link href="/departamentos" className="aba-button-dark">Ver departamentos</Link>
      </section>
      <AbaWhatsAppFloat />
    </main>
  );
}

export default async function EditorialPostPage({ params }: PageProps) {
  const { slug } = await params;
  const section = findEditorialSection(slug);
  if (section) return <EditorialSectionPage slug={slug} />;

  const post = await findPost(slug);
  if (!post) notFound();

  const [{ data: listingData }, posts] = await Promise.all([readPublicHomeListings(), getPosts()]);
  const relatedProperty = (listingData.listings ?? []).find((item) => item.status === "disponible");
  const relatedPosts = posts.filter((item) => item.slug !== post.slug).slice(0, 3);
  const paragraphs = post.body.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const firstParagraph = paragraphs[0] || post.excerpt;
  const secondParagraph = paragraphs[1] || "Buenos Aires no se entiende solo por sus direcciones. Se entiende por la luz de sus avenidas, por sus edificios, por los cafés de esquina y por la manera en que cada barrio propone una rutina distinta.";
  const restParagraphs = paragraphs.slice(2);
  const publishedDate = formatDate(post.publishedAt || post.createdAt);
  const coverImage = post.coverImage || abaCultureImages[16];
  const relatedImage = relatedProperty?.images[relatedProperty.coverIndex] || relatedProperty?.images[0] || detailFallback;

  return (
    <main className="aba-public aba-motion-scope bg-[#131313]">
      <AbaNav transparent fixed />
      <article className="pt-[104px]">
        <header className="relative h-[716px] overflow-hidden md:h-[870px]">
          <div className="absolute inset-0 bg-[#131313]">
            <img src={coverImage} alt="" className="aba-ken-burns h-full w-full object-cover opacity-70" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-[#131313]/42 to-transparent" />
          <div className="absolute bottom-0 left-0 z-10 flex w-full flex-col items-center px-6 pb-16 text-center md:px-20">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
              <span className="aba-label">{post.category}</span>
              {publishedDate ? <><span className="h-1 w-1 rounded-full bg-white/32" /><span className="aba-label text-white/56">{publishedDate}</span></> : null}
              <span className="h-1 w-1 rounded-full bg-white/32" />
              <span className="aba-label text-white/56">8 min lectura</span>
            </div>
            <h1 className="aba-display mx-auto max-w-4xl text-white">{post.title}</h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/68">{post.excerpt}</p>
          </div>
        </header>

        <section className="mx-auto max-w-3xl px-6 py-28 md:px-0">
          <p className="mb-8 text-lg leading-9 text-white/70 first-letter:float-left first-letter:mr-3 first-letter:font-editorial first-letter:text-7xl first-letter:text-white">
            {firstParagraph}
          </p>
          <p className="mb-14 text-lg leading-9 text-white/70">{secondParagraph}</p>

          <figure className="relative my-16 h-[614px] overflow-hidden md:-mx-[20vw]">
            <img src={interiorBreakoutFallback} alt="Interior editorial en Buenos Aires" className="h-full w-full object-cover" />
            <figcaption className="absolute bottom-4 right-4 border border-white/10 bg-[#131313]/45 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
              La luz, el volumen y la ciudad como parte de la experiencia.
            </figcaption>
          </figure>

          <h2 className="aba-headline mb-8 mt-16 text-white">La materia viva de Buenos Aires</h2>
          <p className="mb-8 text-lg leading-9 text-white/70">
            {restParagraphs[0] || "Cada barrio propone una relación distinta con la ciudad: algunos invitan a caminar, otros a estudiar, otros a construir una rutina alrededor de cafés, parques, universidades y teatros."}
          </p>

          <blockquote className="my-12 border-l-2 border-[var(--aba-bronze)] py-2 pl-8">
            <p className="font-editorial text-2xl italic leading-snug text-[var(--aba-bronze)]">
              “No elegimos solo un departamento; elegimos el volumen de ciudad que queremos sentir todos los días.”
            </p>
            <footer className="mt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/48">Alojamiento Buenos Aires</footer>
          </blockquote>

          {restParagraphs.slice(1).map((paragraph) => (
            <p key={paragraph} className="mb-8 text-lg leading-9 text-white/70">{paragraph}</p>
          ))}

          <div className="my-16 flex flex-col items-center gap-8 border border-white/10 bg-[#1c1b1b] p-8 md:flex-row md:p-12">
            <div className="w-full md:w-1/2">
              <img src={relatedImage} alt={relatedProperty?.title || "Departamento en Buenos Aires"} className="h-[400px] w-full object-cover" />
            </div>
            <div className="flex w-full flex-col justify-center md:w-1/2">
              <span className="aba-label mb-4">Vivir la historia</span>
              <h3 className="aba-headline text-white">{relatedProperty?.title || "Encontrá una base para vivir Buenos Aires"}</h3>
              <p className="mb-8 mt-4 text-sm leading-7 text-white/62">
                {relatedProperty ? relatedProperty.highlight || relatedProperty.description : "Explorá departamentos amoblados y elegí barrio con contexto, contrato claro y una mirada cultural de la ciudad."}
              </p>
              {relatedProperty ? <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.18em] text-white/48">{relatedProperty.neighborhood} · {formatPrice(relatedProperty.price, relatedProperty.priceUnit, relatedProperty.currency)}</p> : null}
              <Link href={relatedProperty ? "/departamentos/" + relatedProperty.id : "/departamentos"} className="aba-button w-fit">
                Ver propiedad <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>

          {relatedPosts.length ? (
            <div className="grid gap-4 border-t border-white/10 pt-10">
              <p className="aba-label">Seguir leyendo</p>
              {relatedPosts.map((item) => (
                <Link key={item.slug} href={"/vivir-buenos-aires/" + item.slug} className="group flex items-center justify-between gap-6 border-b border-white/10 py-5">
                  <span className="font-editorial text-2xl text-white group-hover:text-[var(--aba-bronze)]">{item.title}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/48">Leer</span>
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      </article>

      <footer className="w-full bg-[#0e0e0e] px-6 py-28 md:px-20">
        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6">
          <div className="col-span-12 mb-12 md:col-span-4 md:mb-0">
            <Link href="/" className="font-editorial text-4xl uppercase leading-tight tracking-[0.08em] text-white">Alojamiento<br />Buenos Aires</Link>
            <p className="mt-8 text-xs leading-6 text-white/50">© 2026 Alojamiento Buenos Aires. La ciudad como protagonista.</p>
          </div>
          <div className="col-span-6 md:col-span-2 md:col-start-7">
            <h4 className="aba-label mb-6">Barrios</h4>
            <ul className="grid gap-4 text-sm text-white/58"><li>Palermo</li><li>Recoleta</li><li>San Telmo</li></ul>
          </div>
          <div className="col-span-6 md:col-span-2">
            <h4 className="aba-label mb-6">Información</h4>
            <ul className="grid gap-4 text-sm text-white/58"><li>Legal</li><li>Contacto</li><li>Newsletter</li></ul>
          </div>
        </div>
      </footer>
      <AbaWhatsAppFloat />
    </main>
  );
}