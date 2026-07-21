"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import AbaNav from "@/components/aba/AbaNav";
import AbaWhatsAppFloat from "@/components/aba/AbaWhatsAppFloat";

const leadTypeLabels = {
  tenant: "Busco departamento",
  owner: "Quiero publicar",
  contact: "Consulta general",
};

const introByType = {
  tenant:
    "Contanos fecha estimada, duración, barrio ideal y motivo de llegada. Te orientamos con propiedades y contexto de ciudad.",
  owner:
    "Publicamos tu propiedad con una presentación profesional, consulta ordenada y una marca que diferencia por experiencia de ciudad.",
  contact:
    "Escribinos por disponibilidad, barrios, contratos, prensa, alianzas o cualquier duda sobre Alojamiento Buenos Aires.",
};

export default function ContactoPage() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get("tipo") === "propietario" ? "owner" : "tenant";
  const [leadType, setLeadType] = useState<"tenant" | "owner" | "contact">(initialType);
  const [status, setStatus] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    moveReason: "",
    duration: "",
    neighborhood: "",
    propertyAddress: "",
    propertyType: "",
    message: "",
  });

  const title = useMemo(() => {
    if (leadType === "owner") return "Publicá tu propiedad con una marca distinta.";
    if (leadType === "contact") return "Hablemos de tu llegada a Buenos Aires.";
    return "Encontrá un departamento para vivir Buenos Aires.";
  }, [leadType]);

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("Enviando...");
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, leadType }),
    });
    if (response.ok) {
      setStatus("Consulta enviada. Te vamos a contactar.");
      setForm({
        name: "",
        email: "",
        phone: "",
        moveReason: "",
        duration: "",
        neighborhood: "",
        propertyAddress: "",
        propertyType: "",
        message: "",
      });
      return;
    }
    setStatus("No pudimos enviar la consulta. Probá de nuevo.");
  };

  return (
    <main className="aba-public aba-motion-scope">
      <section className="relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1599167758481-83f550bb49b3?auto=format&fit=crop&w=2200&q=85"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-black/66" />
        <AbaNav transparent fixed />
        <div className="aba-reveal relative z-10 mx-auto grid max-w-screen-2xl gap-12 px-5 pb-20 pt-36 sm:px-8 lg:grid-cols-[0.85fr_1fr] lg:pb-28 lg:pt-44">
          <div className="aba-reveal-soft">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d7b66f]">
              Contacto
            </p>
            <h1 className="mt-5 font-editorial text-5xl font-normal leading-none sm:text-7xl">
              {title}
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-white/72">
              {introByType[leadType]}
            </p>
            <div className="mt-8 grid gap-3 text-sm leading-7 text-white/62">
              <p>Alquileres amoblados desde 3 meses hasta 2 años.</p>
              <p>Contratos claros, orientación por barrio y acompañamiento real.</p>
            </div>
          </div>
          <form onSubmit={submit} className="aba-reveal-soft border border-[#d7b66f]/30 bg-black/50 p-6 text-white shadow-[0_24px_70px_-50px_rgba(0,0,0,0.95)] backdrop-blur-xl sm:p-8">
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(leadTypeLabels).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLeadType(id as "tenant" | "owner" | "contact")}
                  className={`rounded-full px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] transition ${
                    leadType === id ? "bg-white text-black" : "border border-white/15 bg-white/10 text-white/62 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Nombre" className="aba-sharp-input px-0 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#d7b66f]" />
              <input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="Email" className="aba-sharp-input px-0 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#d7b66f]" />
              <input required value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Teléfono" className="aba-sharp-input px-0 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#d7b66f]" />
            </div>
            {leadType === "owner" ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input value={form.propertyAddress} onChange={(event) => update("propertyAddress", event.target.value)} placeholder="Dirección de la propiedad" className="aba-sharp-input px-0 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#d7b66f]" />
                <input value={form.propertyType} onChange={(event) => update("propertyType", event.target.value)} placeholder="Tipo de inmueble" className="aba-sharp-input px-0 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#d7b66f]" />
              </div>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <input value={form.moveReason} onChange={(event) => update("moveReason", event.target.value)} placeholder="Motivo de mudanza" className="aba-sharp-input px-0 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#d7b66f]" />
                <input value={form.duration} onChange={(event) => update("duration", event.target.value)} placeholder="Duración estimada" className="aba-sharp-input px-0 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#d7b66f]" />
                <input value={form.neighborhood} onChange={(event) => update("neighborhood", event.target.value)} placeholder="Barrio de interés" className="aba-sharp-input px-0 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#d7b66f]" />
              </div>
            )}
            <textarea
              value={form.message}
              onChange={(event) => update("message", event.target.value)}
              placeholder="Mensaje"
              rows={6}
              className="mt-3 w-full aba-sharp-input px-0 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#d7b66f]"
            />
            <button className="mt-4 aba-button-dark text-xs font-bold uppercase tracking-[0.22em] text-black transition hover:bg-[#d7b66f]">
              Enviar consulta
            </button>
            {status ? <p className="mt-4 text-sm text-white/78">{status}</p> : null}
          </form>
        </div>
      </section>
      <AbaWhatsAppFloat />
      <footer className="border-t border-white/10 px-5 py-8 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-white/42 sm:px-8">
        Alojamiento Buenos Aires · Propiedades · Vivir Buenos Aires · Contacto
      </footer>
    </main>
  );
}