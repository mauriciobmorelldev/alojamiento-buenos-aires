import Link from "next/link";

const footerGroups = [
  { title: "Explorar", links: [{ label: "Propiedades", href: "/departamentos" }, { label: "Barrios", href: "/barrios" }, { label: "Arte y Cultura", href: "/vivir-buenos-aires" }] },
  { title: "Barrios", links: [{ label: "Palermo", href: "/barrios/palermo" }, { label: "Recoleta", href: "/barrios/recoleta" }, { label: "San Telmo", href: "/barrios/san-telmo" }] },
  { title: "Contacto", links: [{ label: "Consultar", href: "/contacto" }, { label: "Publicar una propiedad", href: "/contacto?tipo=propietario" }, { label: "Recibir novedades", href: "/vivir-buenos-aires#newsletter" }] },
];

export default function AbaFooter() {
  return (
    <footer className="w-full border-t border-white/10 bg-[#0b0b0b] px-6 py-16 text-white md:px-16 md:py-20">
      <div className="mx-auto grid max-w-[1440px] gap-14 md:grid-cols-[1.2fr_1.8fr]">
        <div>
          <Link href="/" className="inline-block font-editorial text-4xl leading-[0.92] text-white transition hover:text-[#e2c19b] md:text-5xl">
            Alojamiento<br />Buenos Aires
          </Link>
          <p className="mt-6 max-w-sm text-sm leading-7 text-white/52">Departamentos amoblados y una lectura sensible de la ciudad para elegir cómo vivir Buenos Aires.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title} className="grid content-start gap-4">
              <p className="aba-label text-[#e2c19b]">{group.title}</p>
              {group.links.map((link) => (
                <Link key={link.href + link.label} href={link.href} className="w-fit text-sm text-white/62 transition hover:text-white">{link.label}</Link>
              ))}
            </nav>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-14 flex max-w-[1440px] flex-col gap-3 border-t border-white/10 pt-6 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-white/38 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Alojamiento Buenos Aires</p>
        <p>Buenos Aires, Argentina</p>
      </div>
    </footer>
  );
}
