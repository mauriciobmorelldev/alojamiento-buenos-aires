type AbaWhatsAppFloatProps = {
  phone?: string;
  message?: string;
  label?: string;
};

const normalizePhone = (value?: string) => (value ?? "").replace(/[^\d]/g, "");

const fallbackPhone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "";

export default function AbaWhatsAppFloat({
  phone,
  message = "Hola, quiero consultar por un departamento en Alojamiento Buenos Aires.",
  label = "WhatsApp",
}: AbaWhatsAppFloatProps) {
  const normalizedPhone = normalizePhone(phone) || fallbackPhone;
  const href = normalizedPhone
    ? "https://wa.me/" + normalizedPhone + "?text=" + encodeURIComponent(message)
    : "/contacto";
  const isExternal = href.startsWith("http");

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noreferrer" : undefined}
      className="aba-whatsapp-float fixed bottom-5 right-5 z-[120] flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-[#25d366] text-white shadow-[0_18px_45px_-18px_rgba(0,0,0,0.72)] transition hover:-translate-y-1 hover:bg-[#20bd5a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#25d366] md:bottom-8 md:right-8"
      aria-label={label}
    >
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7 fill-current"><path d="M16.04 3.2A12.73 12.73 0 0 0 5.25 22.68L3.2 28.8l6.33-2.02a12.77 12.77 0 1 0 6.51-23.58Zm0 2.15a10.62 10.62 0 1 1-5.42 19.75l-.4-.24-3.65 1.17 1.19-3.53-.26-.42a10.59 10.59 0 0 1 8.54-16.73Zm-4.7 4.72c-.24 0-.62.09-.94.44-.33.36-1.25 1.22-1.25 2.98 0 1.75 1.28 3.45 1.46 3.69.18.23 2.51 3.84 6.09 5.38.85.37 1.51.58 2.03.75.85.27 1.63.23 2.24.14.68-.1 2.1-.86 2.4-1.69.3-.83.3-1.54.21-1.69-.09-.14-.33-.23-.69-.41-.35-.18-2.1-1.04-2.42-1.16-.33-.12-.57-.18-.81.18-.23.35-.92 1.15-1.12 1.39-.21.23-.42.26-.78.08-.35-.17-1.5-.55-2.86-1.77a10.77 10.77 0 0 1-1.98-2.46c-.2-.36-.02-.55.16-.73.16-.16.35-.41.53-.62.18-.2.24-.35.36-.59.11-.24.05-.44-.03-.62-.09-.18-.8-1.94-1.1-2.65-.29-.7-.59-.61-.81-.62h-.69Z" /></svg>
    </a>
  );
}
