type AbaWhatsAppFloatProps = {
  phone?: string;
  message?: string;
  label?: string;
};

const normalizePhone = (value?: string) => (value ?? "").replace(/[^\d]/g, "");

export default function AbaWhatsAppFloat({
  phone,
  message = "Hola, quiero consultar por un departamento en Alojamiento Buenos Aires.",
  label = "WhatsApp",
}: AbaWhatsAppFloatProps) {
  const normalizedPhone = normalizePhone(phone);
  const href = normalizedPhone
    ? "https://wa.me/" + normalizedPhone + "?text=" + encodeURIComponent(message)
    : "/contacto";

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-[#20201f]/90 text-[var(--aba-bronze)] shadow-[0_18px_45px_-24px_rgba(0,0,0,0.8)] backdrop-blur-xl transition hover:border-[var(--aba-bronze)] hover:bg-[var(--aba-bronze)] hover:text-[#101828]"
      aria-label={label}
    >
      <span className="material-symbols-outlined">chat</span>
    </a>
  );
}
