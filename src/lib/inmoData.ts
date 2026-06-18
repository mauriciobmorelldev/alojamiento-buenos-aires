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
