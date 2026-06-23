"use client";

import {
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import {
  createId,
  isValidEmail,
} from "@/lib/adminForms";
import type { Listing, ThemeSettings, VisitFormContent } from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";

type PropertyLeadFormProps = {
  property: Listing;
  theme: ThemeSettings;
  visitForm: VisitFormContent;
};

const emptyVisitRequest = {
  nationality: "",
  age: "",
  moveInDate: "",
  duration: "3 meses",
  occupation: "",
  peopleCount: "",
  pets: "No",
  petsCount: "",
  visitAvailability: "",
  message: "",
  incomeInfoAcknowledged: false,
};

const normalizeWhatsAppPhone = (value?: string) =>
  (value ?? "").replace(/[^\d]/g, "");

const normalizeCellPhone = (value: string) => value.replace(/\D/g, "");

const isValidCellPhone = (value: string) => {
  const digits = normalizeCellPhone(value);
  if (digits.length < 10 || digits.length > 15) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  return true;
};

const formatCellPhoneInput = (value: string) => {
  const raw = value.trim().startsWith("+") ? "+" : "";
  const digits = normalizeCellPhone(value).slice(0, 15);
  if (!digits) return raw;
  if (digits.startsWith("549") && digits.length > 3) {
    const area = digits.slice(3, 5);
    const first = digits.slice(5, 9);
    const second = digits.slice(9, 13);
    return [`+54 9 ${area}`, first, second].filter(Boolean).join(" ");
  }
  if (digits.startsWith("54") && digits.length > 2) {
    const area = digits.slice(2, 4);
    const first = digits.slice(4, 8);
    const second = digits.slice(8, 12);
    return [`+54 ${area}`, first, second].filter(Boolean).join(" ");
  }
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
};

const formatIntegerInput = (value: string, maxLength: number) =>
  value.replace(/\D/g, "").slice(0, maxLength);

const floatingControlClass =
  "peer w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 pb-3 pt-5 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

const floatingLabelClass =
  "pointer-events-none absolute left-3 top-0 -translate-y-1/2 rounded-full bg-surface-container-lowest px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:translate-y-[-50%] peer-placeholder-shown:text-xs peer-placeholder-shown:tracking-[0.12em] peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-[10px] peer-focus:tracking-[0.18em] peer-focus:text-primary";

const FloatingInput = ({
  label,
  className = "",
  error = "",
  isValid = false,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  isValid?: boolean;
}) => {
  const validationClass = error
    ? "border-error focus:border-error focus:ring-error/10"
    : isValid
      ? "border-emerald-500/70 focus:border-emerald-600 focus:ring-emerald-500/10"
      : "";

  return (
    <label className="relative block">
      <input
        {...props}
        aria-invalid={Boolean(error)}
        placeholder=" "
        className={`${floatingControlClass} ${validationClass} ${className}`}
      />
      <span className={floatingLabelClass}>{label}</span>
      {error ? (
        <span className="mt-1.5 block text-xs font-semibold text-error">
          {error}
        </span>
      ) : null}
    </label>
  );
};

const FloatingTextarea = ({
  label,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) => (
  <label className="relative block">
    <textarea
      {...props}
      placeholder=" "
      className={`${floatingControlClass} min-h-[92px] resize-y ${className}`}
    />
    <span className={floatingLabelClass}>{label}</span>
  </label>
);

const FloatingSelect = ({
  label,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) => (
  <label className="relative block">
    <select
      {...props}
      className={`${floatingControlClass} appearance-none pr-10 ${className}`}
    >
      {children}
    </select>
    <span className="pointer-events-none absolute left-3 top-0 -translate-y-1/2 rounded-full bg-surface-container-lowest px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
      {label}
    </span>
    <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-on-surface-variant">
      expand_more
    </span>
  </label>
);

export const PropertyLeadFormSkeleton = () => (
  <form className="mt-6 grid gap-4" aria-hidden="true">
    <div className="rounded-2xl bg-surface-container-low p-4">
      <div className="h-4 w-1/2 animate-pulse rounded-full bg-outline-variant/20" />
      <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-outline-variant/15" />
      <div className="mt-2 h-3 w-3/4 animate-pulse rounded-full bg-outline-variant/15" />
    </div>
    <div className="h-14 animate-pulse rounded-xl bg-surface-container-lowest" />
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="h-14 animate-pulse rounded-xl bg-surface-container-lowest" />
      <div className="h-14 animate-pulse rounded-xl bg-surface-container-lowest" />
    </div>
  </form>
);

export default function PropertyLeadForm({
  property,
  theme,
  visitForm,
}: PropertyLeadFormProps) {
  const { updateState } = useInmoStore();
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [visitRequest, setVisitRequest] = useState(emptyVisitRequest);
  const [leadNotice, setLeadNotice] = useState("");
  const [leadError, setLeadError] = useState("");

  const emailError =
    leadEmail.trim() && !isValidEmail(leadEmail)
      ? "Ingresá un email válido, por ejemplo nombre@mail.com."
      : "";
  const phoneError =
    leadPhone && !isValidCellPhone(leadPhone)
      ? "Ingresá un celular válido con código de área."
      : "";
  const ageNumber = Number(visitRequest.age);
  const ageError =
    visitRequest.age && (!Number.isInteger(ageNumber) || ageNumber < 18 || ageNumber > 100)
      ? "Debe ser mayor de edad."
      : "";
  const peopleNumber = Number(visitRequest.peopleCount);
  const peopleCountError =
    visitRequest.peopleCount &&
    (!Number.isInteger(peopleNumber) || peopleNumber < 1 || peopleNumber > 20)
      ? "Indicá un número entre 1 y 20."
      : "";
  const petsNumber = Number(visitRequest.petsCount);
  const petsCountError =
    visitRequest.pets === "Si" &&
    visitRequest.petsCount &&
    (!Number.isInteger(petsNumber) || petsNumber < 1 || petsNumber > 20)
      ? "Indicá un número entre 1 y 20."
      : "";
  const hasVisibleLeadValidationErrors = Boolean(
    emailError ||
      phoneError ||
      ageError ||
      peopleCountError ||
      petsCountError
  );

  const handleLeadSubmit = (event: FormEvent) => {
    event.preventDefault();
    setLeadError("");
    setLeadNotice("");
    const phone = normalizeCellPhone(leadPhone);
    const email = leadEmail.trim().toLowerCase();
    const age = Number(visitRequest.age);
    const peopleCount = Number(visitRequest.peopleCount);
    const petsCount = Number(visitRequest.petsCount);
    if (!leadName.trim()) {
      setLeadError("Ingresá tu nombre.");
      return;
    }
    if (!isValidEmail(email)) {
      setLeadError("Ingresá un email válido.");
      return;
    }
    if (!isValidCellPhone(leadPhone)) {
      setLeadError("Ingresá un celular válido con código de área.");
      return;
    }
    if (!visitRequest.nationality.trim()) {
      setLeadError("Ingresá tu nacionalidad.");
      return;
    }
    if (!Number.isInteger(age) || age < 18 || age > 100) {
      setLeadError("Ingresá una edad válida. La persona debe ser mayor de edad.");
      return;
    }
    if (!visitRequest.moveInDate) {
      setLeadError("Seleccioná una fecha estimada de ingreso.");
      return;
    }
    if (!visitRequest.occupation.trim()) {
      setLeadError("Ingresá tu ocupación o estudios.");
      return;
    }
    if (!Number.isInteger(peopleCount) || peopleCount < 1 || peopleCount > 20) {
      setLeadError("Indicá cuántas personas vivirían en la propiedad.");
      return;
    }
    if (
      visitRequest.pets === "Si" &&
      (!Number.isInteger(petsCount) || petsCount < 1 || petsCount > 20)
    ) {
      setLeadError("Indicá cuántas mascotas.");
      return;
    }
    if (!visitRequest.visitAvailability.trim()) {
      setLeadError("Indicá tu disponibilidad para visitar.");
      return;
    }
    if (!visitRequest.incomeInfoAcknowledged) {
      setLeadError("Confirmá que entendiste la información sobre requisitos y documentación.");
      return;
    }
    const notes = [
      "Solicitud de visita o reserva directa",
      "",
      `Nacionalidad: ${visitRequest.nationality.trim()}`,
      `Edad: ${age}`,
      `Fecha estimada de ingreso: ${visitRequest.moveInDate}`,
      `Duración solicitada: ${visitRequest.duration}`,
      `Ocupación o estudios: ${visitRequest.occupation.trim()}`,
      `Cantidad de personas: ${peopleCount}`,
      `Mascotas: ${
        visitRequest.pets === "Si"
          ? `Si, ${petsCount}`
          : "No"
      }`,
      `Disponibilidad para visitar: ${visitRequest.visitAvailability.trim()}`,
      "",
      `Información económica: ${visitForm.requirementsText}`,
      `Requisitos informados: ${visitForm.requirementsHighlight}`,
      `Confirmación: ${visitForm.acknowledgementLabel}`,
      visitRequest.message.trim() ? "" : null,
      visitRequest.message.trim() ? `Mensaje adicional: ${visitRequest.message.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    const whatsappPhone = normalizeWhatsAppPhone(theme.whatsappPhone);
    const propertyUrl = window.location.href;
    const whatsappMessage = [
      "Hola, recibieron una nueva solicitud de visita o reserva desde la web.",
      "",
      `Propiedad: ${property.title}`,
      `URL: ${propertyUrl}`,
      "",
      `Nombre: ${leadName.trim()}`,
      `Email: ${email}`,
      `Teléfono: ${phone}`,
      "",
      notes,
    ].join("\n");
    const now = new Date().toISOString();
    updateState((prev) => ({
      ...prev,
      leads: [
        ...prev.leads,
        {
          id: createId(),
          name: leadName.trim(),
          email,
          phone,
          propertyId: property.id,
          agentId: property.agentId,
          status: "nuevo",
          createdAt: now,
          updatedAt: now,
          notes,
        },
      ],
      propertyMetrics: prev.propertyMetrics.some(
        (metric) => metric.propertyId === property.id
      )
        ? prev.propertyMetrics.map((metric) =>
            metric.propertyId === property.id
              ? { ...metric, leads: metric.leads + 1 }
              : metric
          )
        : [
            ...prev.propertyMetrics,
            {
              id: createId(),
              propertyId: property.id,
              views: 0,
              leads: 1,
              favorites: 0,
            },
          ],
    }));
    if (whatsappPhone) {
      window.open(
        `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappMessage)}`,
        "_blank",
        "noopener,noreferrer"
      );
      setLeadNotice(`${visitForm.successMessage} También abrimos WhatsApp para enviar la solicitud.`);
    } else {
      setLeadNotice(
        `${visitForm.successMessage} Falta configurar el WhatsApp del sitio en Branding para enviarla por WhatsApp.`
      );
    }
    setVisitRequest(emptyVisitRequest);
    setLeadName("");
    setLeadEmail("");
    setLeadPhone("");
  };

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleLeadSubmit}>
      <div className="rounded-2xl bg-surface-container-low p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
          {visitForm.title}
        </p>
        <p className="mt-2 text-xs leading-5 text-on-surface-variant">
          {visitForm.subtitle}
        </p>
      </div>

      <FloatingInput
        required
        label={visitForm.nameLabel}
        value={leadName}
        onChange={(event) => setLeadName(event.target.value)}
        isValid={Boolean(leadName.trim())}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <FloatingInput
          required
          type="email"
          label={visitForm.emailLabel}
          value={leadEmail}
          onChange={(event) =>
            setLeadEmail(event.target.value.replace(/\s/g, "").toLowerCase())
          }
          error={emailError}
          isValid={Boolean(leadEmail && !emailError)}
        />
        <FloatingInput
          required
          type="tel"
          inputMode="tel"
          label={visitForm.phoneLabel}
          value={leadPhone}
          onChange={(event) => setLeadPhone(formatCellPhoneInput(event.target.value))}
          error={phoneError}
          isValid={Boolean(leadPhone && !phoneError)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FloatingInput
          required
          label={visitForm.nationalityLabel}
          value={visitRequest.nationality}
          onChange={(event) =>
            setVisitRequest((prev) => ({
              ...prev,
              nationality: event.target.value,
            }))
          }
          isValid={Boolean(visitRequest.nationality.trim())}
        />
        <FloatingInput
          required
          type="number"
          inputMode="numeric"
          min="18"
          max="100"
          label={visitForm.ageLabel}
          value={visitRequest.age}
          onChange={(event) =>
            setVisitRequest((prev) => ({
              ...prev,
              age: formatIntegerInput(event.target.value, 3),
            }))
          }
          error={ageError}
          isValid={Boolean(visitRequest.age && !ageError)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FloatingInput
          required
          type="date"
          label={visitForm.moveInDateLabel}
          value={visitRequest.moveInDate}
          onChange={(event) =>
            setVisitRequest((prev) => ({
              ...prev,
              moveInDate: event.target.value,
            }))
          }
          isValid={Boolean(visitRequest.moveInDate)}
        />
        <FloatingSelect
          label={visitForm.durationLabel}
          value={visitRequest.duration}
          onChange={(event) =>
            setVisitRequest((prev) => ({ ...prev, duration: event.target.value }))
          }
        >
          <option>3 meses</option>
          <option>6 meses</option>
          <option>12 meses</option>
        </FloatingSelect>
      </div>

      <FloatingInput
        required
        label={visitForm.occupationLabel}
        value={visitRequest.occupation}
        onChange={(event) =>
          setVisitRequest((prev) => ({
            ...prev,
            occupation: event.target.value,
          }))
        }
        isValid={Boolean(visitRequest.occupation.trim())}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <FloatingInput
          required
          type="number"
          inputMode="numeric"
          min="1"
          max="20"
          label={visitForm.peopleCountLabel}
          value={visitRequest.peopleCount}
          onChange={(event) =>
            setVisitRequest((prev) => ({
              ...prev,
              peopleCount: formatIntegerInput(event.target.value, 2),
            }))
          }
          error={peopleCountError}
          isValid={Boolean(visitRequest.peopleCount && !peopleCountError)}
        />
        <FloatingSelect
          label={visitForm.petsLabel}
          value={visitRequest.pets}
          onChange={(event) =>
            setVisitRequest((prev) => ({
              ...prev,
              pets: event.target.value,
              petsCount: event.target.value === "Si" ? prev.petsCount : "",
            }))
          }
        >
          <option>No</option>
          <option value="Si">Sí</option>
        </FloatingSelect>
      </div>

      {visitRequest.pets === "Si" ? (
        <div className="animate-[fadeUp_0.28s_ease-out_both]">
          <FloatingInput
            required
            type="number"
            inputMode="numeric"
            min="1"
            max="20"
            label={visitForm.petsCountLabel}
            value={visitRequest.petsCount}
            onChange={(event) =>
              setVisitRequest((prev) => ({
                ...prev,
                petsCount: formatIntegerInput(event.target.value, 2),
              }))
            }
            error={petsCountError}
            isValid={Boolean(visitRequest.petsCount && !petsCountError)}
          />
        </div>
      ) : null}

      <FloatingTextarea
        required
        label={visitForm.visitAvailabilityLabel}
        value={visitRequest.visitAvailability}
        onChange={(event) =>
          setVisitRequest((prev) => ({
            ...prev,
            visitAvailability: event.target.value,
          }))
        }
      />
      <FloatingTextarea
        label={visitForm.messageLabel}
        value={visitRequest.message}
        onChange={(event) =>
          setVisitRequest((prev) => ({ ...prev, message: event.target.value }))
        }
      />

      <div className="rounded-2xl border border-outline-variant/25 bg-surface-container-low p-4 text-xs leading-5 text-on-surface-variant">
        <p>{visitForm.requirementsText}</p>
        <p className="mt-2 font-semibold text-primary">
          {visitForm.requirementsHighlight}
        </p>
      </div>

      <label className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-4 text-xs font-semibold leading-5 text-primary">
        <input
          required
          type="checkbox"
          checked={visitRequest.incomeInfoAcknowledged}
          onChange={(event) =>
            setVisitRequest((prev) => ({
              ...prev,
              incomeInfoAcknowledged: event.target.checked,
            }))
          }
          className="mt-1"
        />
        {visitForm.acknowledgementLabel}
      </label>
      {leadError ? <p className="text-sm text-error">{leadError}</p> : null}
      {leadNotice ? <p className="text-sm text-primary">{leadNotice}</p> : null}
      <button
        type="submit"
        disabled={hasVisibleLeadValidationErrors}
        className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-on-primary transition disabled:cursor-not-allowed disabled:opacity-50"
        style={{ color: "var(--color-on-primary)" }}
      >
        {visitForm.submitLabel}
      </button>
    </form>
  );
}
