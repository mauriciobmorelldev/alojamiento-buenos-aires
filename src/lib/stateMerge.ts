import {
  defaultState,
  STATE_VERSION,
  type InmoState,
} from "./inmoData";

const appendLocalOnly = <T extends { id: string }>(incoming: T[], base: T[]) => [
  ...incoming,
  ...base.filter((baseItem) => !incoming.some((item) => item.id === baseItem.id)),
];

const oldBuenosAiresDefaults = {
  title: "Vivir la ciudad antes de elegir dónde vivir.",
  subtitle:
    "Una guía inmersiva para quienes llegan a Buenos Aires y necesitan entender cultura, educación, trámites, trabajo y ritmo urbano antes de tomar una decisión inmobiliaria.",
  introTitle: "Una brújula urbana para llegar mejor.",
  introText:
    "No es solo encontrar una propiedad. Es entender cómo se vive la ciudad: qué zonas conectan mejor, dónde estudiar, cómo moverse, qué trámites anticipar y qué redes activar desde el primer día.",
  quickFacts: [
    "Barrios con identidad propia",
    "Movilidad urbana amplia",
    "Oferta cultural diaria",
    "Ecosistema educativo internacional",
  ],
  sections: {
    "ba-guia": {
      text: "Información práctica para quienes llegan por primera vez a Buenos Aires.",
      detail:
        "Orientación por barrios, movilidad, moneda, conectividad, salud, documentación básica y hábitos cotidianos para instalarte con más claridad.",
    },
    "ba-cultura": {
      text: "Agenda de eventos culturales y actividades de networking en Buenos Aires.",
      detail:
        "Teatros, galerías, ciclos gastronómicos, ferias, charlas, encuentros de comunidad y experiencias para integrarte rápido al pulso local.",
    },
    "ba-educacion": {
      text: "Acceso a universidades y centros educativos destacados en la ciudad.",
      detail:
        "Universidades, posgrados, cursos ejecutivos, idiomas y zonas recomendadas para vivir cerca de polos educativos.",
    },
    "ba-recursos": {
      text: "Artículos y guías sobre trámites y vida cotidiana en la ciudad.",
      detail:
        "Guías sobre servicios, contratos, conectividad, bancos, transporte, requisitos de alquiler y organización de la llegada.",
    },
    "ba-trabajo": {
      text: "Oportunidades laborales y freelance para nuevos residentes y visitantes.",
      detail:
        "Mapa de espacios de coworking, comunidades profesionales, plataformas freelance, eventos de networking y sectores con movimiento.",
    },
  },
};

const getNewDefaultIfOld = (value: string | undefined, oldValue: string, newValue: string) =>
  !value || value === oldValue ? newValue : value;

export const mergeState = (
  base: InmoState = defaultState,
  incoming: Partial<InmoState>
): InmoState => {
  const incomingBuenosAires = incoming.homeContent?.buenosAires;
  const mergedBuenosAires = {
    ...base.homeContent.buenosAires,
    ...(incomingBuenosAires ?? {}),
    title: getNewDefaultIfOld(
      incomingBuenosAires?.title,
      oldBuenosAiresDefaults.title,
      base.homeContent.buenosAires.title
    ),
    subtitle: getNewDefaultIfOld(
      incomingBuenosAires?.subtitle,
      oldBuenosAiresDefaults.subtitle,
      base.homeContent.buenosAires.subtitle
    ),
    introTitle: getNewDefaultIfOld(
      incomingBuenosAires?.introTitle,
      oldBuenosAiresDefaults.introTitle,
      base.homeContent.buenosAires.introTitle
    ),
    introText: getNewDefaultIfOld(
      incomingBuenosAires?.introText,
      oldBuenosAiresDefaults.introText,
      base.homeContent.buenosAires.introText
    ),
    quickFacts:
      Array.isArray(incomingBuenosAires?.quickFacts) &&
      incomingBuenosAires.quickFacts.join("|") !== oldBuenosAiresDefaults.quickFacts.join("|")
        ? incomingBuenosAires.quickFacts
        : base.homeContent.buenosAires.quickFacts,
    sections: Array.isArray(incomingBuenosAires?.sections)
      ? incomingBuenosAires.sections.map((section) => {
          const baseSection = base.homeContent.buenosAires.sections.find(
            (item) => item.id === section.id
          );
          const oldSection =
            oldBuenosAiresDefaults.sections[
              section.id as keyof typeof oldBuenosAiresDefaults.sections
            ];
          return {
            ...section,
            text:
              oldSection && section.text === oldSection.text
                ? baseSection?.text ?? section.text
                : section.text,
            detail:
              oldSection && section.detail === oldSection.detail
                ? baseSection?.detail ?? section.detail
                : section.detail,
            active: section.active ?? true,
          };
        })
      : base.homeContent.buenosAires.sections,
  };

  return {
  ...base,
  ...incoming,
  version: STATE_VERSION,
  theme: {
    ...base.theme,
    ...(incoming.theme ?? {}),
  },
  homeContent: {
    ...base.homeContent,
    ...(incoming.homeContent ?? {}),
    menuItems: Array.isArray(incoming.homeContent?.menuItems)
      ? incoming.homeContent.menuItems.map((item) => ({
          ...item,
          active: item.active ?? true,
        }))
      : base.homeContent.menuItems,
    visitForm: {
      ...base.homeContent.visitForm,
      ...(incoming.homeContent?.visitForm ?? {}),
    },
    workWithUs: {
      ...base.homeContent.workWithUs,
      ...(incoming.homeContent?.workWithUs ?? {}),
      fields: Array.isArray(incoming.homeContent?.workWithUs?.fields)
        ? incoming.homeContent.workWithUs.fields.map((field) => ({
            ...field,
            type:
              field.type === "email" ||
              field.type === "tel" ||
              field.type === "textarea" ||
              field.type === "select"
                ? field.type
                : "text",
            active: field.active ?? true,
            required: field.required ?? false,
            options: Array.isArray(field.options) ? field.options : [],
          }))
        : base.homeContent.workWithUs.fields,
    },
    footer: {
      ...base.homeContent.footer,
      ...(incoming.homeContent?.footer ?? {}),
      sections: Array.isArray(incoming.homeContent?.footer?.sections)
        ? incoming.homeContent.footer.sections.map((section) => ({
            ...section,
            active: section.active ?? true,
            links: Array.isArray(section.links)
              ? section.links.map((link) => ({
                  ...link,
                  active: link.active ?? true,
                }))
              : [],
          }))
        : base.homeContent.footer.sections,
      socialLinks: Array.isArray(incoming.homeContent?.footer?.socialLinks)
        ? incoming.homeContent.footer.socialLinks.map((link) => ({
            ...link,
            active: link.active ?? true,
          }))
        : base.homeContent.footer.socialLinks,
    },
    buenosAires: mergedBuenosAires,
    partnerLogos: Array.isArray(incoming.homeContent?.partnerLogos)
      ? incoming.homeContent.partnerLogos.map((logo) => ({
          ...logo,
          active: logo.active ?? true,
        }))
      : base.homeContent.partnerLogos,
    banners: Array.isArray(incoming.homeContent?.banners)
      ? incoming.homeContent.banners.map((banner) => ({
          ...banner,
          active: banner.active ?? true,
        }))
      : base.homeContent.banners,
  },
  adminUsers: Array.isArray(incoming.adminUsers)
    ? appendLocalOnly(incoming.adminUsers, base.adminUsers).map((admin) => ({
        ...admin,
        password:
          admin.password ||
          base.adminUsers.find((item) => item.id === admin.id)?.password ||
          "",
        role: admin.role === "owner" ? "owner" : "colaborador",
        phone: admin.phone ?? "",
      }))
    : base.adminUsers,
  clientUsers: Array.isArray(incoming.clientUsers)
    ? appendLocalOnly(incoming.clientUsers, base.clientUsers).map((client) => ({
        ...client,
        password:
          client.password ||
          base.clientUsers.find((item) => item.id === client.id)?.password ||
          "",
        idNumber: client.idNumber ?? "",
        emailVerified: client.emailVerified ?? true,
        active: client.active ?? true,
      }))
    : base.clientUsers,
  clientContracts: Array.isArray(incoming.clientContracts)
    ? incoming.clientContracts.map((contract) => ({
        ...contract,
        payments: contract.payments ?? [],
        paymentMethods: contract.paymentMethods ?? [],
      }))
    : base.clientContracts,
  propertyFavorites: Array.isArray(incoming.propertyFavorites)
    ? incoming.propertyFavorites
    : base.propertyFavorites,
  leads: Array.isArray(incoming.leads) ? incoming.leads : base.leads,
  leadEvents: Array.isArray(incoming.leadEvents)
    ? incoming.leadEvents
    : base.leadEvents,
  propertyMetrics: Array.isArray(incoming.propertyMetrics)
    ? incoming.propertyMetrics
    : base.propertyMetrics,
  tokkoSyncLogs: Array.isArray(incoming.tokkoSyncLogs)
    ? incoming.tokkoSyncLogs
    : base.tokkoSyncLogs,
  agents: Array.isArray(incoming.agents) ? incoming.agents : base.agents,
  filterGroups: Array.isArray(incoming.filterGroups)
    ? incoming.filterGroups
    : base.filterGroups,
  listings: Array.isArray(incoming.listings)
    ? appendLocalOnly(incoming.listings, base.listings).map((listing) => ({
        ...listing,
        currency: listing.currency ?? "ARS",
        createdByAdminId: listing.createdByAdminId,
      }))
    : base.listings,
  customPages: Array.isArray(incoming.customPages)
    ? appendLocalOnly(incoming.customPages, base.customPages).map((page) => ({
        ...page,
        slug: page.slug?.replace(/^\/+/, "") ?? "",
        active: page.active ?? true,
        blocks: Array.isArray(page.blocks) ? page.blocks : [],
      }))
    : base.customPages,
  };
};
