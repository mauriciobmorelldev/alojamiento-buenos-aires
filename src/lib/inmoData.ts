export type PropertyType = "tradicional" | "temporario" | "pozo" | "listo";
export type PropertyStatus = "disponible" | "pausado" | "reservado" | "vendido";
export type PriceUnit = "venta" | "mensual" | "noche";
export type PriceCurrency = "ARS" | "USD";
export type FilterMode = "single" | "multi";

export type FilterGroup = {
  id: string;
  label: string;
  options: string[];
  mode: FilterMode;
};

export type Agent = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  photo?: string;
};

export type ThemeSettings = {
  name: string;
  primary: string;
  secondary: string;
  accent?: string;
  dark?: string;
  neutral?: string;
  surface?: string;
  logo?: string;
  heroImage?: string;
  whatsappPhone?: string;
  whatsappMessage?: string;
  usdToArsRate?: number;
};

export type HomeBanner = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaLabel: string;
  ctaHref: string;
  active: boolean;
};

export type HomeMenuItem = {
  id: string;
  label: string;
  href: string;
  active: boolean;
};

export type PartnerLogo = {
  id: string;
  name: string;
  image: string;
  href: string;
  active: boolean;
};

export type BuenosAiresSection = {
  id: string;
  title: string;
  eyebrow: string;
  text: string;
  detail: string;
  icon: string;
  image: string;
  active: boolean;
};

export type BuenosAiresContent = {
  active: boolean;
  menuLabel: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  heroImage: string;
  heroVideo: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  introEyebrow: string;
  introTitle: string;
  introText: string;
  quickFacts: string[];
  sections: BuenosAiresSection[];
  finalEyebrow: string;
  finalTitle: string;
  finalText: string;
  finalCtaLabel: string;
  finalCtaHref: string;
};

export type VisitFormContent = {
  title: string;
  subtitle: string;
  nameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  idNumberLabel: string;
  nationalityLabel: string;
  ageLabel: string;
  moveInDateLabel: string;
  durationLabel: string;
  occupationLabel: string;
  peopleCountLabel: string;
  petsLabel: string;
  petsCountLabel: string;
  visitAvailabilityLabel: string;
  messageLabel: string;
  requirementsText: string;
  requirementsHighlight: string;
  acknowledgementLabel: string;
  submitLabel: string;
  successMessage: string;
};

export type CustomPageBlockType = "hero" | "text" | "image" | "cta" | "cards";

export type CustomPageBlock = {
  id: string;
  type: CustomPageBlockType;
  title: string;
  subtitle?: string;
  body?: string;
  image?: string;
  ctaLabel?: string;
  ctaHref?: string;
  items?: {
    id: string;
    title: string;
    text: string;
    icon?: string;
  }[];
};

export type CustomPage = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  active: boolean;
  blocks: CustomPageBlock[];
};

export type HomeContent = {
  eyebrow: string;
  title: string;
  italicTitle: string;
  subtitle: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  statsTitle: string;
  featuredTitle: string;
  featuredSubtitle: string;
  teamTitle: string;
  teamSubtitle: string;
  recentTitle: string;
  recentSubtitle: string;
  menuItems: HomeMenuItem[];
  visitForm: VisitFormContent;
  partnersTitle: string;
  partnersSubtitle: string;
  partnerLogos: PartnerLogo[];
  banners: HomeBanner[];
  buenosAires: BuenosAiresContent;
};

export type AdminRole = "owner" | "colaborador";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: AdminRole;
  phone?: string;
  active: boolean;
};

export type ClientUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  idNumber: string;
  emailVerified: boolean;
  verificationToken?: string;
  active: boolean;
};

export type PropertyFavorite = {
  id: string;
  clientId: string;
  propertyId: string;
  createdAt: string;
};

export type ClientContractType = "alquiler" | "pozo";
export type ClientContractStatus = "activo" | "finalizado" | "en_mora";

export type ClientContract = {
  id: string;
  clientId: string;
  listingId?: string;
  type: ClientContractType;
  status: ClientContractStatus;
  startDate: string;
  endDate?: string;
  monthlyAmount: number;
  totalInstallments?: number;
  paidInstallments?: number;
  notes?: string;
  paymentMethods?: string[];
  payments?: {
    id: string;
    date: string;
    amount: number;
    method: string;
  }[];
};

export type LeadStatus = "nuevo" | "visita" | "reservado" | "cerrado";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId?: string;
  agentId?: string;
  clientId?: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

export type LeadEvent = {
  id: string;
  leadId: string;
  fromStatus?: LeadStatus;
  toStatus: LeadStatus;
  note?: string;
  createdAt: string;
};

export type PropertyMetric = {
  id: string;
  propertyId: string;
  views: number;
  leads: number;
  favorites: number;
  lastViewedAt?: string;
};

export type TokkoSyncLog = {
  id: string;
  status: "mocked" | "success" | "failed";
  message: string;
  importedCount: number;
  startedAt: string;
  finishedAt: string;
};

export type Listing = {
  id: string;
  createdByAdminId?: string;
  title: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  priceUnit: PriceUnit;
  currency: PriceCurrency;
  neighborhood: string;
  area: number;
  rooms: number;
  tag: string;
  highlight: string;
  description: string;
  images: string[];
  videos?: string[];
  coverIndex: number;
  agentId?: string;
  attributes: Record<string, string[]>;
};

export const STATE_VERSION = 4;

export type InmoState = {
  version: number;
  theme: ThemeSettings;
  homeContent: HomeContent;
  adminUsers: AdminUser[];
  clientUsers: ClientUser[];
  clientContracts: ClientContract[];
  propertyFavorites: PropertyFavorite[];
  leads: Lead[];
  leadEvents: LeadEvent[];
  propertyMetrics: PropertyMetric[];
  tokkoSyncLogs: TokkoSyncLog[];
  agents: Agent[];
  filterGroups: FilterGroup[];
  listings: Listing[];
  customPages: CustomPage[];
};

export const propertyTypeLabels: Record<PropertyType, string> = {
  tradicional: "Tradicional",
  temporario: "Temporario",
  pozo: "En pozo",
  listo: "Listo",
};

export const statusLabels: Record<PropertyStatus, string> = {
  disponible: "Disponible",
  pausado: "Pausado",
  reservado: "Reservado",
  vendido: "Vendido",
};

export const priceUnitLabels: Record<PriceUnit, string> = {
  venta: "Venta",
  mensual: "Mensual",
  noche: "Por noche",
};

export const defaultState: InmoState = {
  version: STATE_VERSION,
  theme: {
    name: "Connexa",
    primary: "#1b365d",
    secondary: "#2f5da1",
    accent: "#fff3c2",
    dark: "#2e2e2e",
    neutral: "#e6c88f",
    surface: "#ffffff",
    heroImage: "",
    whatsappPhone: "5491123456789",
    whatsappMessage: "Hola, quiero consultar por una propiedad en Connexa.",
    usdToArsRate: 1000,
  },
  homeContent: {
    eyebrow: "Connexa Real Estate",
    title: "Connexa",
    italicTitle: "tu lugar empieza acá.",
    subtitle:
      "Encontrá propiedades y consultá con un equipo que te acompaña en cada paso de la decisión.",
    primaryCtaLabel: "Explorar catálogo",
    primaryCtaHref: "/propiedades",
    secondaryCtaLabel: "Consultar ahora",
    secondaryCtaHref: "/propiedades",
    statsTitle: "Propiedades",
    featuredTitle: "Propiedades destacadas",
    featuredSubtitle:
      "Cada ficha reúne ubicación, características, imágenes y consulta directa para decidir mejor.",
    teamTitle: "Elegí cómo avanzar",
    teamSubtitle: "Accesos simples para explorar propiedades y enviar consultas sin vueltas.",
    recentTitle: "Últimas propiedades publicadas",
    recentSubtitle: "Nuevas opciones para comprar o alquilar en Connexa.",
    partnersTitle: "Trabajamos con aliados estratégicos",
    partnersSubtitle:
      "Marcas, estudios y proveedores que acompañan la operación inmobiliaria.",
    menuItems: [
      {
        id: "menu-inicio",
        label: "Inicio",
        href: "/",
        active: true,
      },
      {
        id: "menu-propiedades",
        label: "Propiedades",
        href: "/propiedades",
        active: true,
      },
    ],
    visitForm: {
      title: "Solicitud de visita o reserva",
      subtitle:
        "Para coordinar una visita necesitamos algunos datos básicos. La documentación se solicita recién si avanzás con la reserva.",
      nameLabel: "Nombre y apellido",
      emailLabel: "Email",
      phoneLabel: "Teléfono",
      idNumberLabel: "DNI / CUIL / CUIT",
      nationalityLabel: "Nacionalidad",
      ageLabel: "Edad",
      moveInDateLabel: "Fecha de ingreso",
      durationLabel: "Duración",
      occupationLabel: "Ocupación o estudios",
      peopleCountLabel: "Cantidad de personas",
      petsLabel: "Mascotas",
      petsCountLabel: "Cantidad de mascotas",
      visitAvailabilityLabel: "Disponibilidad para visitar",
      messageLabel: "Mensaje adicional opcional",
      requirementsText:
        "Ingresos o certificado de estudios se toman solo de modo informativo y no se deben enviar ahora. La documentación se solicita únicamente si se avanza con la reserva.",
      requirementsHighlight:
        "Requisitos: 1 mes adelantado + 1 mes de depósito + honorarios inmobiliarios.",
      acknowledgementLabel:
        "Entiendo que la documentación se solicita solo al avanzar con la reserva y que la inmobiliaria opera con Martilleros Públicos y asesoramiento legal.",
      submitLabel: "Enviar solicitud",
      successMessage: "Consulta enviada. Un asesor va a contactarte.",
    },
    partnerLogos: [],
    banners: [
      {
        id: "home-banner-1",
        title: "Propiedades premium listas para visitar",
        subtitle: "Explorá opciones seleccionadas y consultá por disponibilidad en minutos.",
        image: "",
        ctaLabel: "Ver propiedades",
        ctaHref: "/propiedades",
        active: true,
      },
    ],
    buenosAires: {
      active: true,
      menuLabel: "Buenos Aires",
      eyebrow: "Buenos Aires para instalarte mejor",
      title: "Llegar a la ciudad con mapa, contexto y casa.",
      subtitle:
        "Una guía para entender dónde conviene vivir, cómo moverse, qué trámites anticipar y qué ritmo tiene cada zona antes de elegir propiedad.",
      heroImage:
        "https://images.unsplash.com/photo-1599167758481-83f550bb49b3?auto=format&fit=crop&w=2200&q=85",
      heroVideo: "",
      primaryCtaLabel: "Empezar la guía",
      primaryCtaHref: "#guia-ba",
      secondaryCtaLabel: "Ver propiedades",
      secondaryCtaHref: "/propiedades",
      introEyebrow: "Información BA",
      introTitle: "No alcanza con ver metros cuadrados: hay que entender la vida alrededor.",
      introText:
        "Buenos Aires cambia mucho de una cuadra a otra. Esta guía ordena lo importante para tomar una decisión inmobiliaria con menos dudas: conectividad, universidades, vida cotidiana, cultura, trabajo y requisitos básicos para instalarse.",
      quickFacts: [
        "Zonas recomendadas según rutina y movilidad",
        "Contexto para estudiantes, profesionales y familias",
        "Agenda cultural y servicios para integrarte rápido",
        "Requisitos claros antes de reservar una propiedad",
      ],
      sections: [
        {
          id: "ba-guia",
          title: "Guía",
          eyebrow: "Primeros pasos",
          text: "Lo básico para aterrizar sin perderte entre barrios, trámites y requisitos.",
          icon: "map",
          detail:
            "Te ayudamos a leer la ciudad: qué zonas conectan mejor con tu rutina, cómo estimar tiempos reales de traslado, qué documentación conviene tener preparada y qué costos aparecen además del alquiler.",
          image:
            "https://images.unsplash.com/photo-1612294037637-ec328d0e075e?auto=format&fit=crop&w=1200&q=80",
          active: true,
        },
        {
          id: "ba-cultura",
          title: "Cultura",
          eyebrow: "Agenda viva",
          text: "La ciudad se entiende saliendo: teatro, cafés, ferias, gastronomía y comunidad.",
          icon: "theater_comedy",
          detail:
            "Buenos Aires tiene planes todos los días. Reunimos referencias culturales y espacios de encuentro para que no elijas solo una dirección, sino también el tipo de vida que querés tener cerca.",
          image:
            "https://images.unsplash.com/photo-1577801599718-f4e3ad3fc794?auto=format&fit=crop&w=1200&q=80",
          active: true,
        },
        {
          id: "ba-educacion",
          title: "Educación",
          eyebrow: "Campus y ciudad",
          text: "Dónde vivir si venís a estudiar, cursar un posgrado o moverte entre campus.",
          icon: "school",
          detail:
            "Ubicamos universidades, centros de formación, zonas con buena conexión y barrios prácticos para estudiantes internacionales o argentinos que llegan por primera vez a la ciudad.",
          image:
            "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1200&q=80",
          active: true,
        },
        {
          id: "ba-recursos",
          title: "Recursos",
          eyebrow: "Vida cotidiana",
          text: "Checklist de llegada: servicios, conectividad, contratos y organización diaria.",
          icon: "article",
          detail:
            "Un espacio para ordenar lo que suele aparecer después de elegir: servicios básicos, medios de pago, requisitos de reserva, movilidad, salud, conectividad y recomendaciones para la primera semana.",
          image:
            "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
          active: true,
        },
        {
          id: "ba-trabajo",
          title: "Trabajo",
          eyebrow: "Oportunidades",
          text: "Zonas y redes para profesionales, freelancers y personas que trabajan remoto.",
          icon: "work",
          detail:
            "Buenos Aires funciona muy bien para trabajo remoto, networking y proyectos freelance. La guía conecta barrios, espacios de coworking y circuitos profesionales para elegir mejor dónde instalarte.",
          image:
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
          active: true,
        },
      ],
      finalEyebrow: "Próximo paso",
      finalTitle: "Cuando el barrio empieza a tener sentido, la propiedad se elige mejor.",
      finalText:
        "Usá esta guía como punto de partida y después explorá propiedades según rutina, conectividad, presupuesto y estilo de vida.",
      finalCtaLabel: "Explorar propiedades",
      finalCtaHref: "/propiedades",
    },
  },
  adminUsers: [
    {
      id: "admin-owner",
      name: "Admin Principal",
      email: "admin@connexa.com",
      password: "connexa-admin",
      role: "owner",
      phone: "",
      active: true,
    },
  ],
  clientUsers: [],
  clientContracts: [],
  propertyFavorites: [],
  leads: [],
  leadEvents: [],
  propertyMetrics: [],
  tokkoSyncLogs: [],
  agents: [],
  filterGroups: [
    {
      id: "comodidades",
      label: "Comodidades",
      mode: "multi",
      options: ["Baño completo", "Lavadero", "Cochera", "Balcón"],
    },
  ],
  listings: [],
  customPages: [
    {
      id: "page-equipo",
      title: "Equipo",
      slug: "equipo",
      excerpt: "Conocé el equipo comercial y cómo acompañamos cada operación.",
      active: false,
      blocks: [
        {
          id: "page-equipo-hero",
          type: "hero",
          title: "Asesores y especialistas",
          subtitle: "Equipo comercial disponible para ayudarte a encontrar la propiedad ideal.",
        },
      ],
    },
    {
      id: "page-barrios",
      title: "Barrios",
      slug: "barrios",
      excerpt: "Zonas y barrios con mayor presencia en el inventario activo.",
      active: false,
      blocks: [
        {
          id: "page-barrios-hero",
          type: "hero",
          title: "Zonas más consultadas",
          subtitle: "Barrios con mayor presencia en el inventario activo.",
        },
      ],
    },
  ],
};
