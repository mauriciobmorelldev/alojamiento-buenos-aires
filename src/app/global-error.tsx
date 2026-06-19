"use client";

import { useEffect } from "react";
import { RealEstateMessage } from "@/components/inmo/RealEstateStatus";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Fallo global de la aplicacion", error);
  }, [error]);

  return (
    <html lang="es" data-theme="light" style={{ colorScheme: "light" }}>
      <body className="min-h-screen bg-background font-body text-on-background">
        <RealEstateMessage
          eyebrow="Oops"
          title="No pudimos abrir la puerta"
          message="La web tuvo un problema inesperado. Reintentamos la carga para volver al recorrido."
          actions={[{ label: "Reintentar", onClick: reset }]}
        />
      </body>
    </html>
  );
}
