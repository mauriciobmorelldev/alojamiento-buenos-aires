"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type StatusAction = {
  href?: string;
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
};

const statusButtonClass = {
  primary:
    "inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-on-primary transition hover:bg-primary/90",
  secondary:
    "inline-flex h-11 items-center justify-center rounded-full border border-outline-variant/60 bg-surface-container-lowest px-5 text-sm font-bold text-primary transition hover:border-primary hover:bg-primary-fixed",
};

const StatusActionButton = ({ action }: { action: StatusAction }) => {
  const className = statusButtonClass[action.variant ?? "primary"];
  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  );
};

const PremiumLoaderMotion = ({ size = "large" }: { size?: "large" | "inline" }) => (
  <div
    className={`relative mx-auto grid place-items-center overflow-hidden rounded-full border border-primary/15 bg-primary-fixed/20 ${
      size === "large" ? "h-44 w-44" : "h-32 w-32"
    }`}
    aria-hidden="true"
  >
    <div className="absolute inset-4 rounded-full border border-primary/20" />
    <div className="absolute h-1/2 w-px origin-bottom animate-[abaPreloaderOrbit_1.4s_linear_infinite] bg-primary" />
    <span className="font-headline text-3xl font-bold text-primary">ABA</span>
  </div>
);

export function RealEstateLoader({
  title = "Preparando la visita",
  message = "Estamos abriendo la propiedad. Esto puede tardar unos segundos.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-on-background">
      <section className="w-full max-w-md text-center">
        <PremiumLoaderMotion />
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.32em] text-on-surface-variant">
          Alojamiento Buenos Aires
        </p>
        <h1 className="mt-3 font-headline text-3xl font-bold text-primary">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">{message}</p>
        <div className="mx-auto mt-8 h-1.5 w-44 overflow-hidden rounded-full bg-surface-container-high">
          <div className="h-full w-1/2 animate-[statusBar_1.15s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </section>
    </main>
  );
}

export function InlineRealEstateLoader({
  title = "Cargando propiedades",
  message = "Estamos preparando el catálogo.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="rounded-3xl bg-surface-container-lowest p-8 text-center shadow-[0_34px_75px_-58px_rgba(27,54,93,0.55)]">
      <PremiumLoaderMotion size="inline" />
      <p className="mt-2 text-xs font-bold uppercase tracking-[0.28em] text-on-surface-variant">
        Alojamiento Buenos Aires
      </p>
      <h3 className="mt-3 font-headline text-2xl font-bold text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">{message}</p>
      <div className="mx-auto mt-6 h-1.5 w-40 overflow-hidden rounded-full bg-surface-container-high">
        <div className="h-full w-1/2 animate-[statusBar_1.15s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
    </div>
  );
}

export function RealEstateMessage({
  eyebrow = "Oops",
  title,
  message,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  message: string;
  actions?: StatusAction[];
  children?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-on-background">
      <section className="w-full max-w-xl rounded-[2rem] border border-outline-variant/40 bg-surface-container-lowest p-8 text-center shadow-[0_34px_75px_-55px_rgba(27,54,93,0.55)] sm:p-10">
        <PremiumLoaderMotion size="inline" />
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.32em] text-on-surface-variant">{eyebrow}</p>
        <h1 className="mt-3 font-headline text-3xl font-bold text-primary sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-on-surface-variant">{message}</p>
        {children}
        {actions?.length ? (
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {actions.map((action) => <StatusActionButton key={action.label} action={action} />)}
          </div>
        ) : null}
      </section>
    </main>
  );
}