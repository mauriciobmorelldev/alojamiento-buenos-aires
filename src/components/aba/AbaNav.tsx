"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const leftLinks = [
  { label: "Propiedades", href: "/departamentos", match: "departamentos" },
  { label: "Barrios", href: "/barrios", match: "barrios" },
];

const rightLinks = [
  { label: "Arte y Cultura", href: "/vivir-buenos-aires", match: "vivir-buenos-aires" },
  { label: "Propietarios", href: "/contacto?tipo=propietario", match: "propietario" },
  { label: "Consultar", href: "/contacto", match: "contacto" },
];

export default function AbaNav({
  dark = false,
  transparent = false,
}: {
  dark?: boolean;
  transparent?: boolean;
  fixed?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const contactType = searchParams.get("tipo");
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const isActive = (match: string) => {
    if (match === "propietario") return pathname === "/contacto" && contactType === "propietario";
    if (match === "contacto") return pathname === "/contacto" && contactType !== "propietario";
    if (match === "barrios") return pathname === "/barrios" || pathname.startsWith("/barrios/");
    if (match === "vivir-buenos-aires") return pathname.startsWith("/vivir-buenos-aires");
    return pathname.startsWith("/" + match);
  };

  const linkClass = (match: string) => [
    "aba-nav-liquid__link aba-label",
    isActive(match) ? "is-active" : "",
  ].filter(Boolean).join(" ");

  const headerClass = [
    "aba-nav-liquid fixed left-0 right-0 top-0 w-full px-4 py-3 text-white md:px-8",
    transparent ? "is-transparent" : dark ? "is-dark" : "is-solid",
  ].join(" ");

  const needsSpacer = !transparent;

  const header = (
    <header className={headerClass}>
      <div className="aba-nav-liquid__inner mx-auto grid max-w-[1480px] grid-cols-[1fr_auto_1fr] items-center gap-4">
        <nav className="hidden items-center gap-7 md:flex" aria-label="Navegaci?n principal izquierda">
          {leftLinks.map((item) => (
            <Link key={item.href} className={linkClass(item.match)} href={item.href}>{item.label}</Link>
          ))}
        </nav>
        <Link href="/" className="aba-nav-liquid__brand text-white transition hover:opacity-90" aria-label="Alojamiento Buenos Aires">
          <span>Alojamiento Buenos Aires</span>
        </Link>
        <nav className="hidden items-center justify-end gap-7 md:flex" aria-label="Navegaci?n principal derecha">
          {rightLinks.map((item) => (
            <Link key={item.href} className={linkClass(item.match)} href={item.href}>{item.label}</Link>
          ))}
        </nav>
        <details className="group relative justify-self-end md:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-center rounded-full border border-white/18 bg-white/8 p-2 text-white marker:hidden" aria-label="Abrir men?">
            <span className="material-symbols-outlined text-xl">menu</span>
          </summary>
          <div className="aba-nav-liquid__mobile absolute right-0 top-12 w-72 p-5 shadow-2xl">
            <nav className="grid gap-4" aria-label="Navegaci?n m?vil">
              {[...leftLinks, ...rightLinks].map((item) => (
                <Link key={item.href} className={linkClass(item.match)} href={item.href}>{item.label}</Link>
              ))}
            </nav>
          </div>
        </details>
      </div>
    </header>
  );

  return (
    <>
      {portalTarget ? createPortal(header, portalTarget) : null}
      {needsSpacer ? <div className="aba-nav-spacer" aria-hidden="true" /> : null}
    </>
  );
}
