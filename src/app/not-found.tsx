import { RealEstateMessage } from "@/components/inmo/RealEstateStatus";

export default function NotFound() {
  return (
    <RealEstateMessage
      eyebrow="Oops"
      title="No encontramos esta propiedad"
      message="Puede haberse pausado, reservado o cambiado de direccion. El catalogo tiene las publicaciones disponibles."
      actions={[
        { href: "/propiedades", label: "Ver propiedades" },
        { href: "/", label: "Ir al inicio", variant: "secondary" },
      ]}
    />
  );
}
