"use client";

import { useState, type FormEvent } from "react";

type AbaNewsletterFormProps = {
  compact?: boolean;
};

export default function AbaNewsletterForm({ compact = false }: AbaNewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");

  const submitNewsletter = async (event: FormEvent) => {
    event.preventDefault();
    setStatus("Enviando...");
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    if (response.ok) {
      setEmail("");
      setName("");
      setStatus("Listo. Te sumamos a la lista cultural.");
      return;
    }
    setStatus("No pudimos guardar el email. Probá de nuevo.");
  };

  return (
    <form onSubmit={submitNewsletter} className={compact ? "mt-5 grid gap-2 sm:grid-cols-[1fr_auto]" : "mt-7 grid gap-3"}>
      {!compact ? (
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre"
          className="border-b border-white/20 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-white/42 focus:border-[var(--aba-bronze)]"
        />
      ) : null}
      <input
        required
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        className={
          compact
            ? "border-b border-white/25 bg-transparent px-0 py-3 text-xs text-white outline-none placeholder:text-white/55 focus:border-white"
            : "border-b border-white/20 bg-transparent px-0 py-3 text-sm text-white outline-none placeholder:text-white/42 focus:border-[var(--aba-bronze)]"
        }
      />
      <button className={compact ? "aba-button-dark px-5 py-3" : "aba-button-dark px-6 py-4"}>
        Suscribirme
      </button>
      {status ? (
        <p aria-live="polite" className={compact ? "text-xs text-white/85 sm:col-span-2" : "text-sm text-white/78"}>
          {status}
        </p>
      ) : null}
    </form>
  );
}
