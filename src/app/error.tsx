"use client";

import { useEffect } from "react";
import { RealEstateMessage } from "@/components/inmo/RealEstateStatus";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("La pagina fallo", error);
  }, [error]);

  return (
    <RealEstateMessage
      eyebrow="Oops"
      title="Se trabo la visita"
      message="No pudimos abrir esta parte de la web. Probemos nuevamente sin que pierdas el recorrido."
      actions={[
        { label: "Reintentar", onClick: reset },
        { href: "/propiedades", label: "Ver propiedades", variant: "secondary" },
      ]}
    />
  );
}
