export type PropertyType = "tradicional" | "temporario" | "pozo" | "listo";
export type PropertyStatus =
  | "disponible"
  | "tasacion"
  | "pausado"
  | "reservado"
  | "vendido"
  | "no_disponible";
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
  background?: string;
  surface?: string;
  homePrimary?: string;
  homeSecondary?: string;
  homeAccent?: string;
  homeDark?: string;
  homeNeutral?: string;
  homeBackground?: string;
  homeSurface?: string;
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
  cardCtaLabel?: string;
  cardCtaHref?: string;
  chapterTitle?: string;
  chapterBody?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  icon: string;
  image: string;
  active: boolean;
};

export type BuenosAiresQuickFact = {
  id: string;
  text: string;
  active: boolean;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  borderColor?: string;
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
  quickFacts: BuenosAiresQuickFact[];
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

export type WorkWithUsFieldType = "text" | "email" | "tel" | "textarea" | "select";

export type WorkWithUsField = {
  id: string;
  label: string;
  type: WorkWithUsFieldType;
  required: boolean;
  active: boolean;
  placeholder?: string;
  options?: string[];
};

export type WorkWithUsContent = {
  active: boolean;
  eyebrow: string;
  title: string;
  subtitle: string;
  introTitle: string;
  introText: string;
  formTitle: string;
  formSubtitle: string;
  submitLabel: string;
  successMessage: string;
  allowCvUpload: boolean;
  destinationType: "email" | "whatsapp" | "both";
  destinationEmail: string;
  destinationWhatsapp: string;
  whatsappMessage: string;
  fields: WorkWithUsField[];
};

export type CustomPageBlockType =
  | "hero"
  | "text"
  | "image"
  | "video"
  | "cta"
  | "cards";

export type CustomPageBlock = {
  id: string;
  type: CustomPageBlockType;
  title: string;
  subtitle?: string;
  body?: string;
  image?: string;
  videoUrl?: string;
  videoUrls?: string[];
  videoLayout?: "stack" | "two" | "three";
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

export type FooterLink = {
  id: string;
  label: string;
  href: string;
  active: boolean;
};

export type FooterSection = {
  id: string;
  title: string;
  links: FooterLink[];
  active: boolean;
};

export type SocialLink = {
  id: string;
  label: string;
  href: string;
  icon: string;
  active: boolean;
};

export type FooterContent = {
  active: boolean;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  linkColor?: string;
  buttonBackgroundColor?: string;
  buttonTextColor?: string;
  eyebrow: string;
  title: string;
  description: string;
  legalText: string;
  cookiesLabel: string;
  cookiesHref: string;
  sections: FooterSection[];
  socialLinks: SocialLink[];
};

export type HomeContent = {
  eyebrow: string;
  title: string;
  italicTitle: string;
  subtitle: string;
  publicInventoryTotal?: number;
  publicInventoryAvailable?: number;
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
  workWithUs: WorkWithUsContent;
  partnersTitle: string;
  partnersSubtitle: string;
  bannerShadow?: string;
  bannerButtonShadow?: string;
  heroOverlayColor?: string;
  heroFadeColor?: string;
  bannerOverlayColor?: string;
  bannerFadeColor?: string;
  partnersShadow?: string;
  partnersFadeColor?: string;
  partnerLogos: PartnerLogo[];
  banners: HomeBanner[];
  buenosAires: BuenosAiresContent;
  footer: FooterContent;
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
  tasacion: "Tasación",
  pausado: "Pausado",
  reservado: "Reservado",
  vendido: "Vendido",
  no_disponible: "No disponible",
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
    background: "#ffffff",
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
    bannerShadow: "",
    bannerButtonShadow: "",
    heroOverlayColor: "",
    heroFadeColor: "",
    bannerOverlayColor: "",
    bannerFadeColor: "",
    partnersShadow: "",
    partnersFadeColor: "",
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
      {
        id: "menu-trabaja",
        label: "Trabaja con nosotros",
        href: "/trabaja-con-nosotros",
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
    workWithUs: {
      active: true,
      eyebrow: "Trabaja con nosotros",
      title: "Sumate a una red inmobiliaria pensada para crecer con claridad.",
      subtitle:
        "Buscamos asesores, colaboradores y aliados comerciales con foco profesional, seguimiento cuidado y propiedades bien presentadas.",
      introTitle: "Un espacio para perfiles comerciales, productores y aliados.",
      introText:
        "Si tenés experiencia en el rubro, cartera de propiedades, llegada a propietarios o querés desarrollar una unidad comercial inmobiliaria, queremos conocer tu perfil y evaluar una modalidad de colaboración.",
      formTitle: "Contanos sobre vos",
      formSubtitle:
        "Completá los datos principales y te contactamos para coordinar una primera conversación.",
      submitLabel: "Enviar postulación",
      successMessage: "Postulación enviada. El equipo va a revisarla y contactarte.",
      allowCvUpload: true,
      destinationType: "email",
      destinationEmail: "",
      destinationWhatsapp: "",
      whatsappMessage:
        "Hola, quiero enviar mi postulación para trabajar con Connexa.",
      fields: [
        {
          id: "work-name",
          label: "Nombre y apellido",
          type: "text",
          required: true,
          active: true,
          placeholder: "Ej: Mauricio Morell",
        },
        {
          id: "work-email",
          label: "Email",
          type: "email",
          required: true,
          active: true,
          placeholder: "nombre@email.com",
        },
        {
          id: "work-phone",
          label: "Teléfono / WhatsApp",
          type: "tel",
          required: true,
          active: true,
          placeholder: "Ej: +54 9 11 1234 5678",
        },
        {
          id: "work-profile",
          label: "Perfil de interés",
          type: "select",
          required: true,
          active: true,
          options: [
            "Asesor comercial",
            "Colaborador con propiedades",
            "Productor inmobiliario",
            "Alianza estratégica",
            "Administración / operaciones",
          ],
        },
        {
          id: "work-experience",
          label: "Experiencia o zona de trabajo",
          type: "textarea",
          required: false,
          active: true,
          placeholder: "Contanos brevemente tu experiencia, zona o cartera.",
        },
      ],
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
        {
          id: "ba-fact-zonas",
          text: "Zonas recomendadas según rutina y movilidad",
          active: true,
        },
        {
          id: "ba-fact-contexto",
          text: "Contexto para estudiantes, profesionales y familias",
          active: true,
        },
        {
          id: "ba-fact-cultura",
          text: "Agenda cultural y servicios para integrarte rápido",
          active: true,
        },
        {
          id: "ba-fact-requisitos",
          text: "Requisitos claros antes de reservar una propiedad",
          active: true,
        },
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
          cardCtaLabel: "Ver capítulo",
          cardCtaHref: "#ba-guia",
          chapterTitle: "Guía práctica para llegar y orientarte",
          chapterBody:
            "Antes de reservar una propiedad conviene entender tiempos de traslado, documentación, costos iniciales, servicios y zonas más prácticas según tu rutina. Este capítulo funciona como mapa inicial para tomar mejores decisiones desde el primer contacto.",
          primaryCtaLabel: "Consultar por una zona",
          primaryCtaHref: "/propiedades",
          secondaryCtaLabel: "Ver propiedades",
          secondaryCtaHref: "/propiedades",
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
          cardCtaLabel: "Ver capítulo",
          cardCtaHref: "#ba-cultura",
          chapterTitle: "Cultura, comunidad y vida de barrio",
          chapterBody:
            "La vida cotidiana también se decide por lo que pasa alrededor: teatros, cafés, ferias, polos gastronómicos, museos, eventos y redes de encuentro. Este capítulo ayuda a entender qué zonas acompañan mejor cada estilo de vida.",
          primaryCtaLabel: "Buscar por estilo de vida",
          primaryCtaHref: "/propiedades",
          secondaryCtaLabel: "Ver guía completa",
          secondaryCtaHref: "#guia-ba",
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
          cardCtaLabel: "Ver capítulo",
          cardCtaHref: "#ba-educacion",
          chapterTitle: "Educación y zonas convenientes para estudiar",
          chapterBody:
            "Universidades, centros educativos, accesos y recorridos diarios cambian mucho la experiencia de vivir en Buenos Aires. Este capítulo permite explicar qué barrios convienen según campus, horarios, transporte y presupuesto.",
          primaryCtaLabel: "Consultar opciones",
          primaryCtaHref: "/propiedades",
          secondaryCtaLabel: "Ver propiedades",
          secondaryCtaHref: "/propiedades",
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
          cardCtaLabel: "Ver capítulo",
          cardCtaHref: "#ba-recursos",
          chapterTitle: "Recursos para instalarte con menos fricción",
          chapterBody:
            "Reuní acá información sobre requisitos, servicios, conectividad, salud, medios de pago, movilidad, contratos y recomendaciones prácticas para que la llegada a la ciudad sea clara y ordenada.",
          primaryCtaLabel: "Hablar con un asesor",
          primaryCtaHref: "/propiedades",
          secondaryCtaLabel: "Ver requisitos",
          secondaryCtaHref: "#ba-recursos",
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
          cardCtaLabel: "Ver capítulo",
          cardCtaHref: "#ba-trabajo",
          chapterTitle: "Trabajo, networking y rutina profesional",
          chapterBody:
            "Este capítulo permite orientar a profesionales, freelancers y personas que trabajan remoto: zonas con coworkings, conectividad, movimiento comercial, acceso a reuniones y barrios con buena vida diaria.",
          primaryCtaLabel: "Buscar zona para trabajar",
          primaryCtaHref: "/propiedades",
          secondaryCtaLabel: "Ver propiedades",
          secondaryCtaHref: "/propiedades",
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
    footer: {
      active: true,
      backgroundColor: "#1b365d",
      textColor: "#ffffff",
      accentColor: "#fff3c2",
      linkColor: "#ffffff",
      buttonBackgroundColor: "#fff3c2",
      buttonTextColor: "#1b365d",
      eyebrow: "Connexa Real Estate",
      title: "Tu próximo lugar empieza con una consulta clara.",
      description:
        "Explorá propiedades, coordiná visitas y recibí acompañamiento comercial en cada paso.",
      legalText: "© Connexa Real Estate. Todos los derechos reservados.",
      cookiesLabel: "Política de cookies",
      cookiesHref: "/cookies",
      sections: [
        {
          id: "footer-secciones",
          title: "Secciones",
          active: true,
          links: [
            { id: "footer-inicio", label: "Inicio", href: "/", active: true },
            {
              id: "footer-propiedades",
              label: "Propiedades",
              href: "/propiedades",
              active: true,
            },
            {
              id: "footer-buenos-aires",
              label: "Buenos Aires",
              href: "/buenos-aires",
              active: true,
            },
            {
              id: "footer-trabaja",
              label: "Trabaja con nosotros",
              href: "/trabaja-con-nosotros",
              active: true,
            },
          ],
        },
        {
          id: "footer-legales",
          title: "Información",
          active: true,
          links: [
            { id: "footer-contacto", label: "Contacto", href: "/propiedades", active: true },
            { id: "footer-cookies", label: "Cookies", href: "/cookies", active: true },
          ],
        },
      ],
      socialLinks: [
        {
          id: "social-instagram",
          label: "Instagram",
          href: "",
          icon: "instagram",
          active: false,
        },
        {
          id: "social-linkedin",
          label: "LinkedIn",
          href: "",
          icon: "linkedin",
          active: false,
        },
        {
          id: "social-whatsapp",
          label: "WhatsApp",
          href: "",
          icon: "whatsapp",
          active: false,
        },
      ],
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
    {
      id: "page-cookies",
      title: "Política de cookies",
      slug: "cookies",
      excerpt: "Información sobre el uso de cookies técnicas y de medición en el sitio.",
      active: true,
      blocks: [
        {
          id: "page-cookies-hero",
          type: "hero",
          title: "Política de cookies",
          subtitle:
            "Usamos cookies para mejorar la navegación, medir el rendimiento del sitio y recordar preferencias básicas.",
        },
        {
          id: "page-cookies-text",
          type: "text",
          title: "Cómo usamos las cookies",
          body:
            "Las cookies técnicas permiten que el sitio funcione correctamente. Las cookies de medición nos ayudan a entender el uso general de la web para mejorar la experiencia. Podés configurar o bloquear cookies desde tu navegador.",
        },
      ],
    },
    {
      id: "page-trabaja",
      title: "Trabaja con nosotros",
      slug: "trabaja-con-nosotros",
      excerpt:
        "Sumate a una red inmobiliaria con foco en atención clara, propiedades verificadas y acompañamiento comercial.",
      active: true,
      blocks: [
        {
          id: "page-trabaja-hero",
          type: "hero",
          title: "Trabaja con nosotros",
          subtitle:
            "Buscamos colaboradores, asesores y aliados comerciales que quieran crecer con una plataforma pensada para ordenar oportunidades inmobiliarias.",
          ctaLabel: "Enviar consulta",
          ctaHref: "/propiedades",
        },
        {
          id: "page-trabaja-text",
          type: "text",
          title: "Qué buscamos",
          subtitle: "Perfiles comerciales, productores y aliados con mirada profesional.",
          body:
            "En Connexa valoramos la atención cuidada, el seguimiento claro y la capacidad de acompañar a cada cliente con información precisa. Si trabajás en el rubro, tenés cartera de propiedades o querés sumarte como colaborador, podemos evaluar una modalidad de trabajo conjunta.",
        },
        {
          id: "page-trabaja-cards",
          type: "cards",
          title: "Formas de colaborar",
          items: [
            {
              id: "page-trabaja-card-1",
              title: "Carga de propiedades",
              text: "Publicá inmuebles con fichas claras, imágenes, videos y seguimiento desde el panel.",
              icon: "real_estate_agent",
            },
            {
              id: "page-trabaja-card-2",
              title: "Gestión comercial",
              text: "Recibí consultas y acompañá visitas, reservas y conversaciones con clientes.",
              icon: "support_agent",
            },
            {
              id: "page-trabaja-card-3",
              title: "Alianzas",
              text: "Sumá servicios, beneficios o propuestas complementarias para clientes inmobiliarios.",
              icon: "handshake",
            },
          ],
        },
      ],
    },
  ],
};
