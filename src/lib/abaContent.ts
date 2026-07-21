import type { EditorialPost } from './inmoData';

export type AbaEditorialSection = {
  id: string;
  title: string;
  eyebrow: string;
  text: string;
  categories: string[];
  image: string;
  heroTitle: string;
  heroText: string;
};

export type AbaNeighborhood = {
  slug: string;
  name: string;
  summary: string;
  image: string;
  vibe: string;
  bestFor: string[];
  anchors: string[];
  body: string;
  microzones: string[];
  dailyRituals: string[];
  transport: string;
  propertyAngle: string;
};

const now = '2026-07-05T00:00:00.000Z';

export const abaEditorialSections: AbaEditorialSection[] = [
  {
    id: 'barrios',
    title: 'Barrios',
    eyebrow: 'Elegir zona',
    text: 'Recoleta, Palermo, San Telmo y las rutinas que hacen que una dirección se vuelva hogar.',
    categories: ['Barrios', 'Guías', 'Mudanza'],
    image: '/aba-media/WhatsApp Image 2026-07-10 at 11.52.44 AM.jpeg',
    heroTitle: 'Barrios para vivir, no solo visitar',
    heroText: 'Guías honestas para entender ritmo, movilidad, cafés, universidades y vida alrededor antes de elegir departamento.',
  },
  {
    id: 'comer-beber',
    title: 'Comer y beber',
    eyebrow: 'Rituales porteños',
    text: 'Cafés notables, bodegones, barras y mesas donde Buenos Aires se vuelve pertenencia.',
    categories: ['Cafés', 'Cafes', 'Gastronomía', 'Gastronomia', 'Comer y beber'],
    image: '/aba-media/WhatsApp Image 2026-07-10 at 11.52.47 AM (1).jpeg',
    heroTitle: 'La ciudad también se elige por sus mesas',
    heroText: 'De un café de esquina a una barra de autor: una selección para armar rutina cuando llegás a Buenos Aires.',
  },
  {
    id: 'cultura-entretenimiento',
    title: 'Cultura y entretenimiento',
    eyebrow: 'Agenda viva',
    text: 'Teatro, música, arquitectura, universidades y agenda para entender qué pasa alrededor.',
    categories: ['Cultura', 'Arquitectura', 'Universidades'],
    image: '/aba-media/WhatsApp Image 2026-07-10 at 11.52.39 AM.jpeg',
    heroTitle: 'Cultura cerca de casa',
    heroText: 'Museos, librerías, teatros, salas independientes y edificios que cambian la manera de habitar cada barrio.',
  },
];

export const abaNeighborhoods: AbaNeighborhood[] = [
  {
    slug: 'palermo',
    name: 'Palermo',
    summary: 'Verde, gastronómico y muy conectado. Ideal para quienes quieren parques, bares, coworks y movimiento todos los días.',
    image: '/aba-media/WhatsApp Image 2026-07-10 at 11.52.44 AM.jpeg',
    vibe: 'Activo, verde, nocturno',
    bestFor: ['Profesionales', 'Nómades digitales', 'Estadías medianas'],
    anchors: ['Bosques de Palermo', 'Plaza Serrano', 'Distrito Arcos'],
    microzones: ['Soho', 'Hollywood', 'Botánico', 'Las Cañitas'],
    dailyRituals: ['Café de mañana', 'Parques para caminar', 'Barras y restaurantes', 'Diseño independiente'],
    transport: 'Subte, tren, Metrobus y avenidas amplias conectan Palermo con Recoleta, Centro, Belgrano y zona norte.',
    propertyAngle: 'Funciona muy bien para estadías de 3 meses a 2 años porque permite armar rutina social, trabajo remoto y vida diaria sin depender del auto.',
    body: 'Palermo es una ciudad dentro de la ciudad. Cambia de tono cada pocas cuadras: puede ser verde y residencial cerca del Botánico, más nocturno en Hollywood o más caminable y de diseño en Soho. Para quien llega a Buenos Aires, esa variedad permite probar una vida urbana intensa sin perder servicios cotidianos.\n\nLa clave está en elegir microzona según rutina. No es lo mismo buscar silencio que vida social, cercanía a parques o salida gastronómica. Por eso Palermo pide una lectura fina antes de elegir departamento.',
  },
  {
    slug: 'recoleta',
    name: 'Recoleta',
    summary: 'Clásico, caminable y elegante. Una base cómoda para estudiantes, médicos y profesionales que valoran ubicación.',
    image: '/aba-media/WhatsApp Image 2026-07-10 at 11.52.39 AM.jpeg',
    vibe: 'Histórico, académico, sereno',
    bestFor: ['Estudiantes', 'Médicos', 'Primer aterrizaje'],
    anchors: ['Facultad de Medicina', 'Cementerio de Recoleta', 'Avenida Alvear'],
    microzones: ['Alvear', 'Facultad de Medicina', 'Recoleta baja', 'Plaza Francia'],
    dailyRituals: ['Cafés clásicos', 'Museos cerca', 'Calles caminables', 'Servicios a mano'],
    transport: 'Avenidas centrales, subte y colectivos facilitan moverse hacia Palermo, Microcentro, Retiro y universidades.',
    propertyAngle: 'Es una base estable para llegadas académicas, médicas o profesionales: ubicaciones claras, edificios clásicos y una rutina fácil de sostener.',
    body: 'Recoleta combina escala europea, cercanía académica y una vida cotidiana que se resuelve caminando. Para quienes llegan por estudio, salud o trabajo, el barrio ofrece una primera base clara: avenidas conectadas, cafés de rutina y servicios a pocas cuadras.\n\nLa experiencia no está solo en sus postales. Está en bajar a comprar algo rápido, cruzar por una librería, caminar hasta una facultad o volver de noche por calles iluminadas.',
  },
  {
    slug: 'san-telmo',
    name: 'San Telmo',
    summary: 'Patrimonio, mercados y vida cultural. Para quienes buscan una Buenos Aires más bohemia y muy fotográfica.',
    image: '/aba-media/WhatsApp Image 2026-07-10 at 11.52.43 AM (1).jpeg',
    vibe: 'Bohemio, histórico, cultural',
    bestFor: ['Creativos', 'Viajeros largos', 'Amantes de mercados'],
    anchors: ['Mercado de San Telmo', 'Plaza Dorrego', 'Defensa'],
    microzones: ['Defensa', 'Plaza Dorrego', 'Parque Lezama', 'Casco histórico'],
    dailyRituals: ['Mercado', 'Anticuarios', 'Tango', 'Cafés antiguos'],
    transport: 'Cercano a Centro, Puerto Madero y La Boca, con colectivos y accesos rápidos hacia avenidas principales.',
    propertyAngle: 'Ideal para quienes quieren una experiencia más cultural y caminable, con departamentos de carácter y una Buenos Aires muy presente alrededor.',
    body: 'San Telmo tiene espesor. Sus calles guardan mercado, tango, arquitectura, bares pequeños y una vida de vereda que no necesita escenografía. Para una estadía media, ofrece una Buenos Aires intensa, histórica y muy caminable.\n\nConviene para quienes buscan carácter antes que neutralidad: espacios con detalles de época, cercanía cultural y una rutina donde siempre aparece algo para mirar.',
  },
  {
    slug: 'belgrano',
    name: 'Belgrano',
    summary: 'Residencial, verde y ordenado. Buena opción para estadías tranquilas con servicios, tren y avenidas cerca.',
    image: '/aba-media/WhatsApp Image 2026-07-10 at 11.52.41 AM (1).jpeg',
    vibe: 'Residencial, amplio, familiar',
    bestFor: ['Familias', 'Profesionales', 'Estadías largas'],
    anchors: ['Barrancas de Belgrano', 'Barrio Chino', 'Cabildo'],
    microzones: ['Barrancas', 'Belgrano R', 'Barrio Chino', 'Cabildo'],
    dailyRituals: ['Plazas', 'Compras diarias', 'Vida residencial', 'Cafés de barrio'],
    transport: 'Tren, Metrobus y avenidas conectan con Palermo, Núñez, Colegiales y el centro con buena previsibilidad.',
    propertyAngle: 'Una opción sólida para estadías largas o familias que priorizan calma, metros cómodos, servicios y buena conexión.',
    body: 'Belgrano baja el ritmo sin salir de la ciudad. Tiene escala residencial, árboles, servicios completos y una relación más amplia con el espacio. Para quienes llegan por trabajo o familia, permite organizar una vida cotidiana clara.\n\nLa zona funciona especialmente bien cuando la prioridad es sostener una estadía larga: supermercado cerca, transporte confiable, plazas, colegios, gimnasios y departamentos con mejores superficies.',
  },
];

export const abaDemoEditorialPosts: EditorialPost[] = [
  {
    id: 'demo-recoleta-sombras',
    slug: 'recoleta-arquitectura-y-rutina',
    title: 'Recoleta entre arquitectura, estudio y vida diaria',
    excerpt: 'Una guía para entender por qué Recoleta sigue siendo una de las bases más prácticas para vivir Buenos Aires.',
    body: 'Recoleta combina escala europea, cercanía académica y una vida cotidiana que se resuelve caminando. Para quienes llegan por estudio, salud o trabajo, el barrio ofrece una primera base clara: avenidas conectadas, cafés de rutina y servicios a pocas cuadras.\n\nLa experiencia no está solo en sus postales. Está en bajar a comprar algo rápido, cruzar por una librería, caminar hasta una facultad o volver de noche por calles iluminadas.\n\nElegir Recoleta es elegir previsibilidad sin perder ciudad. Los departamentos suelen funcionar bien para estadías de tres meses a dos años porque el barrio acompaña procesos de llegada, adaptación y permanencia.',
    coverImage: '/aba-media/WhatsApp Image 2026-07-10 at 11.52.42 AM.jpeg',
    category: 'Barrios',
    metaTitle: 'Vivir en Recoleta - Alojamiento Buenos Aires',
    metaDescription: 'Guía editorial para vivir en Recoleta, Buenos Aires, con foco en rutina, arquitectura y alquiler amoblado.',
    published: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'demo-palermo-cafes',
    slug: 'cafes-y-barras-para-armar-rutina-en-palermo',
    title: 'Cafés y barras para armar rutina en Palermo',
    excerpt: 'Una selección de rituales cotidianos para que Palermo no sea solo salida, sino también pertenencia.',
    body: 'Palermo se vive por capas. Por la mañana puede ser café, notebook y sombra de árboles; por la tarde, una vuelta por disquerías, galerías y tiendas; por la noche, barras y restaurantes que hacen que siempre haya algo pasando.\n\nPara una estadía mediana, esa mezcla importa. No alcanza con tener un departamento lindo: hace falta poder construir hábitos cerca. Un buen café a dos cuadras cambia la manera de empezar la semana.\n\nLa clave es elegir según microzona. Soho es más social, Hollywood más gastronómico, Botánico más verde y Las Cañitas más residencial.',
    coverImage: '/aba-media/WhatsApp Image 2026-07-10 at 11.52.30 AM.jpeg',
    category: 'Cafés',
    metaTitle: 'Cafés y bares en Palermo - Alojamiento Buenos Aires',
    metaDescription: 'Guía de cafés, bares y rutinas para vivir Palermo durante una estadía amoblada en Buenos Aires.',
    published: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'demo-cultura-agenda',
    slug: 'cultura-cerca-de-casa-en-buenos-aires',
    title: 'Cultura cerca de casa: teatros, libros y arquitectura',
    excerpt: 'Buenos Aires se entiende mejor cuando el teatro, la librería y el edificio de la esquina entran en la rutina.',
    body: 'Vivir Buenos Aires es convivir con una agenda que no siempre necesita planificación. Una sala independiente, una librería abierta tarde o un museo a veinte minutos pueden transformar una semana común.\n\nPor eso la ubicación de un departamento no se mide solo por distancia al trabajo. También se mide por el tipo de ciudad que deja disponible cuando termina el día.\n\nRecoleta ofrece patrimonio y museos. San Telmo suma historia y mercados. Palermo mezcla galerías, salas y gastronomía. Cada barrio propone una manera distinta de estar cerca de la cultura.',
    coverImage: '/aba-media/WhatsApp Image 2026-07-10 at 11.52.39 AM.jpeg',
    category: 'Cultura',
    metaTitle: 'Cultura en Buenos Aires - Alojamiento Buenos Aires',
    metaDescription: 'Guía cultural para elegir barrio y vivir Buenos Aires desde teatros, librerías, museos y arquitectura.',
    published: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'demo-mudanza-mediano-plazo',
    slug: 'como-elegir-barrio-para-tres-meses-a-dos-anos',
    title: 'Cómo elegir barrio para una estadía de 3 meses a 2 años',
    excerpt: 'Una guía práctica para definir zona, contrato, movilidad y vida cotidiana antes de reservar.',
    body: 'Una estadía mediana necesita otra lógica. No es turismo rápido, pero tampoco una mudanza definitiva. Lo importante es equilibrar contrato claro, ubicación y una rutina que pueda sostenerse.\n\nAntes de elegir, conviene mirar movilidad, supermercados, ruido, espacios verdes, cercanía a universidades o trabajo y el tipo de vida que aparece alrededor.\n\nAlojamiento Buenos Aires cruza propiedad y contexto para que cada consulta llegue con una recomendación más precisa.',
    coverImage: '/aba-media/WhatsApp Image 2026-07-10 at 11.52.47 AM.jpeg',
    category: 'Mudanza',
    metaTitle: 'Elegir barrio para estadía mediana - Alojamiento Buenos Aires',
    metaDescription: 'Consejos para elegir barrio en Buenos Aires para alquiler amoblado de 3 meses a 2 años.',
    published: true,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  },
];

export const mergeEditorialPosts = (posts: EditorialPost[]) => {
  const published = posts.filter((post) => post.published);
  const existingSlugs = new Set(published.map((post) => post.slug));
  return [...published, ...abaDemoEditorialPosts.filter((post) => !existingSlugs.has(post.slug))];
};

export const normalizeAbaSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const findEditorialSection = (id?: string) => abaEditorialSections.find((section) => section.id === id);

export const findNeighborhood = (slug?: string) => abaNeighborhoods.find((neighborhood) => neighborhood.slug === slug);

export const findNeighborhoodByName = (name?: string) => {
  if (!name) return undefined;
  const normalized = normalizeAbaSlug(name.replace(/\s+soho|\s+hollywood|\s+botanico|\s+botánico/gi, ''));
  return abaNeighborhoods.find((neighborhood) => neighborhood.slug === normalized || normalizeAbaSlug(neighborhood.name) === normalized);
};

export const filterPostsBySection = (posts: EditorialPost[], section?: AbaEditorialSection) => {
  if (!section) return posts;
  return posts.filter((post) => section.categories.includes(post.category));
};