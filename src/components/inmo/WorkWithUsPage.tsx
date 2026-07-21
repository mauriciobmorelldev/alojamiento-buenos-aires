"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import FrontHeader from "@/components/inmo/FrontHeader";
import SiteFooter from "@/components/inmo/SiteFooter";
import type { InmoState, WorkWithUsField } from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";
import { buildThemeStyles } from "@/lib/theme";

type WorkWithUsPageProps = {
  initialState: Partial<InmoState>;
};

const fieldControlClass =
  "peer w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 pb-3 pt-5 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

const labelClass =
  "pointer-events-none absolute left-4 top-0 -translate-y-1/2 rounded-full bg-surface-container-lowest px-2 text-[10px] font-black uppercase tracking-[0.24em] text-on-surface-variant transition peer-focus:text-primary";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const isValidPhone = (value: string) => value.replace(/[^\d]/g, "").length >= 8;

const normalizePhone = (value: string) => value.replace(/[^\d]/g, "");

const buildWhatsAppText = (
  intro: string,
  fields: WorkWithUsField[],
  values: Record<string, string>,
  cvName: string,
  cvUrl: string
) => {
  const lines = [
    intro.trim(),
    "",
    ...fields.map((field) => `${field.label}: ${values[field.id]?.trim() || "-"}`),
  ];
  if (cvName) {
    lines.push("", `CV: ${cvName}`);
  }
  if (cvUrl) {
    lines.push(`Link CV: ${cvUrl}`);
  }
  return lines.join("\n");
};

export default function WorkWithUsPage({ initialState }: WorkWithUsPageProps) {
  const { state } = useInmoStore(initialState);
  const themeStyles = useMemo(() => buildThemeStyles(state.theme), [state.theme]);
  const config = state.homeContent.workWithUs;
  const fields = useMemo(
    () => config.fields.filter((field) => field.active && field.label.trim()),
    [config.fields]
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const updateValue = (fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const value = values[field.id]?.trim() ?? "";
      if (field.required && !value) {
        nextErrors[field.id] = "Campo obligatorio.";
        return;
      }
      if (value && field.type === "email" && !isValidEmail(value)) {
        nextErrors[field.id] = "Ingresá un email válido.";
      }
      if (value && field.type === "tel" && !isValidPhone(value)) {
        nextErrors[field.id] = "Ingresá un teléfono válido.";
      }
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatusMessage("");
    if (!validate()) return;

    setStatus("sending");
    const shouldSendEmail =
      config.destinationType === "email" || config.destinationType === "both";
    const shouldOpenWhatsapp =
      config.destinationType === "whatsapp" || config.destinationType === "both";

    try {
      let uploadedCvName = cvFile?.name ?? "";
      let uploadedCvUrl = "";

      if (shouldSendEmail || cvFile) {
        const formData = new FormData();
        formData.set("values", JSON.stringify(values));
        if (cvFile) formData.set("cv", cvFile);

        const response = await fetch("/api/work-with-us", {
          method: "POST",
          body: formData,
        });
        const payload = (await response.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          cvName?: string;
          cvUrl?: string;
        } | null;
        if (!response.ok || !payload?.ok) {
          throw new Error(payload?.error ?? "No se pudo enviar la postulación.");
        }
        uploadedCvName = payload.cvName ?? uploadedCvName;
        uploadedCvUrl = payload.cvUrl ?? "";
      }

      if (shouldOpenWhatsapp) {
        const phone = normalizePhone(config.destinationWhatsapp);
        if (!phone) throw new Error("No hay WhatsApp destino configurado.");
        const text = buildWhatsAppText(
          config.whatsappMessage || "Hola, quiero enviar mi postulación.",
          fields,
          values,
          uploadedCvName,
          uploadedCvUrl
        );
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
      }

      setStatus("success");
      setStatusMessage(config.successMessage || "Postulación enviada.");
      setValues({});
      setCvFile(null);
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "No se pudo enviar la postulación.");
    }
  };

  if (!config.active) {
    return (
      <div style={themeStyles} className="min-h-screen bg-background text-on-surface">
        <FrontHeader active="home" />
        <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 pt-24 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
            Alojamiento Buenos Aires
          </p>
          <h1 className="mt-4 text-4xl font-headline font-extrabold text-primary">
            Esta sección no está disponible.
          </h1>
          <Link
            href="/propiedades"
            target="_blank"
            rel="noreferrer"
            className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-bold text-on-primary"
          >
            Ver propiedades
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div style={themeStyles} className="min-h-screen bg-background text-on-surface">
      <FrontHeader active="home" />
      <main className="pt-16 sm:pt-20">
        <section className="relative overflow-hidden bg-primary text-on-primary">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,243,194,0.28),transparent_28%),linear-gradient(135deg,rgba(27,54,93,0.98),rgba(47,93,161,0.82))]" />
          <div className="relative mx-auto grid min-h-[520px] max-w-screen-2xl content-end gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-20">
            <div className="max-w-3xl animate-[fadeUp_0.65s_ease-out_both]">
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary-fixed">
                {config.eyebrow}
              </p>
              <h1 className="mt-5 text-4xl font-headline font-extrabold leading-[0.95] sm:text-6xl lg:text-7xl">
                {config.title}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/82 sm:text-lg">
                {config.subtitle}
              </p>
            </div>

            <div className="self-end rounded-[2rem] border border-white/14 bg-white/10 p-6 backdrop-blur-xl animate-[fadeUp_0.75s_ease-out_0.1s_both]">
              <h2 className="text-2xl font-headline font-bold text-primary-fixed">
                {config.introTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/82">{config.introText}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-screen-xl gap-8 px-6 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-20">
          <aside className="rounded-[2rem] bg-surface-container-low p-6 lg:sticky lg:top-28 lg:h-fit">
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-primary">
              Postulación
            </p>
            <h2 className="mt-4 text-3xl font-headline font-extrabold text-primary">
              {config.formTitle}
            </h2>
            <p className="mt-4 text-sm leading-7 text-on-surface-variant">
              {config.formSubtitle}
            </p>
            <div className="mt-6 rounded-2xl bg-surface-container-lowest p-4 text-xs leading-6 text-on-surface-variant">
              Revisamos cada postulación con foco en zonas, experiencia, disponibilidad y forma de colaboración.
            </div>
          </aside>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 rounded-[2rem] bg-surface-container-lowest p-5 shadow-[0_34px_80px_-60px_rgba(27,54,93,0.55)] sm:p-7"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map((field) => {
                const isLong = field.type === "textarea" || field.type === "select";
                return (
                  <div key={field.id} className={isLong ? "sm:col-span-2" : ""}>
                    <label className="relative block">
                      {field.type === "textarea" ? (
                        <textarea
                          required={field.required}
                          value={values[field.id] ?? ""}
                          onChange={(event) => updateValue(field.id, event.target.value)}
                          placeholder={field.placeholder || " "}
                          className={`${fieldControlClass} min-h-36 resize-y`}
                        />
                      ) : field.type === "select" ? (
                        <select
                          required={field.required}
                          value={values[field.id] ?? ""}
                          onChange={(event) => updateValue(field.id, event.target.value)}
                          className={fieldControlClass}
                        >
                          <option value="">{field.placeholder || "Seleccionar"}</option>
                          {(field.options ?? []).map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          required={field.required}
                          type={field.type === "email" ? "email" : field.type === "tel" ? "tel" : "text"}
                          inputMode={field.type === "tel" ? "tel" : undefined}
                          value={values[field.id] ?? ""}
                          onChange={(event) => updateValue(field.id, event.target.value)}
                          placeholder={field.placeholder || " "}
                          className={fieldControlClass}
                        />
                      )}
                      <span className={labelClass}>
                        {field.label}
                        {field.required ? " *" : ""}
                      </span>
                    </label>
                    {errors[field.id] ? (
                      <p className="mt-2 text-xs font-semibold text-error">{errors[field.id]}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {config.allowCvUpload ? (
              <label className="grid gap-2 rounded-2xl border border-dashed border-outline-variant/50 bg-surface-container-low p-4 text-sm text-on-surface-variant">
                <span className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">
                  CV opcional
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && file.size > 3 * 1024 * 1024) {
                      setStatus("error");
                      setStatusMessage("El CV supera el límite de 3 MB.");
                      event.target.value = "";
                      setCvFile(null);
                      return;
                    }
                    setStatusMessage("");
                    setCvFile(file);
                  }}
                  className="text-sm"
                />
                <span className="text-xs">
                  {cvFile
                    ? `Seleccionado: ${cvFile.name}`
                    : "PDF, DOC o DOCX hasta 3 MB. El CV se comparte mediante un link privado temporal."}
                </span>
              </label>
            ) : null}

            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex min-h-12 w-fit items-center justify-center rounded-full bg-primary px-7 py-3 text-sm font-bold text-on-primary transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              {status === "sending" ? "Enviando..." : config.submitLabel}
            </button>

            {statusMessage ? (
              <p
                className={`rounded-2xl p-4 text-sm font-semibold ${
                  status === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-error-container text-error"
                }`}
              >
                {statusMessage}
              </p>
            ) : null}
          </form>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
