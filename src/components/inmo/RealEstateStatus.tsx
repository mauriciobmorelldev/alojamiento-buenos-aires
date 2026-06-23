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

const HouseMark = ({ loading = false }: { loading?: boolean }) => (
  <div className="relative mx-auto h-28 w-28">
    <div className="absolute inset-x-4 bottom-3 h-16 rounded-b-3xl rounded-t-md border border-primary/15 bg-surface-container-lowest shadow-[0_24px_55px_-36px_rgba(27,54,93,0.55)]" />
    <div
      className={`absolute left-1/2 top-4 h-16 w-16 -translate-x-1/2 rotate-45 rounded-tl-2xl border-l border-t border-primary/20 bg-primary-fixed ${
        loading ? "animate-pulse" : ""
      }`}
    />
    <div className="absolute bottom-3 left-1/2 h-9 w-7 -translate-x-1/2 rounded-t-xl bg-primary" />
    <div className="absolute bottom-9 left-7 h-4 w-4 rounded-full bg-primary/15" />
    <div className="absolute bottom-9 right-7 h-4 w-4 rounded-full bg-primary/15" />
    {loading ? (
      <div className="absolute -right-2 top-0 h-5 w-5 animate-ping rounded-full bg-primary/35" />
    ) : (
      <div className="absolute -right-1 top-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-black text-on-primary">
        !
      </div>
    )}
  </div>
);

const LOTTIE_LOADER_EMBED =
  "https://lottie.host/embed/fb1730d2-9648-4008-ba55-f8a989c5e15e/E9ZNH6CJo7.lottie";

const PremiumLoaderMotion = ({
  size = "large",
}: {
  size?: "large" | "inline";
}) => (
  <div
    className={`relative mx-auto overflow-hidden ${
      size === "large" ? "h-56 w-56" : "h-40 w-40"
    }`}
  >
    <iframe
      src={LOTTIE_LOADER_EMBED}
      title="Animación de carga"
      aria-hidden="true"
      loading="eager"
      className="h-full w-full border-0"
    />
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
          Connexa
        </p>
        <h1 className="mt-3 font-headline text-3xl font-bold text-primary">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">
          {message}
        </p>
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
        Connexa
      </p>
      <h3 className="mt-3 font-headline text-2xl font-bold text-primary">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-on-surface-variant">
        {message}
      </p>
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
        <HouseMark />
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.32em] text-on-surface-variant">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-headline text-3xl font-bold text-primary sm:text-4xl">
          {title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-on-surface-variant">
          {message}
        </p>
        {children}
        {actions?.length ? (
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {actions.map((action) => (
              <StatusActionButton key={action.label} action={action} />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
