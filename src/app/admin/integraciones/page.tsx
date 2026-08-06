"use client";

import { useEffect, useState, type FormEvent } from "react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import { SHOW_TOKKO_ADMIN } from "@/lib/featureFlags";
import { readAdminSession } from "@/lib/session";
import { useInmoStore } from "@/lib/inmoStore";

type PublicTokkoSettings = {
  baseUrl: string;
  syncSecret?: string;
  autoSyncEnabled: boolean;
  lastTestedAt?: string;
  hasApiKey: boolean;
};

type PublicEmailSettings = {
  mode: "preview" | "resend";
  from: string;
  hasResendApiKey: boolean;
  configured: boolean;
};

type TokkoAuditResult = {
  total: number;
  withDescription: number;
  withoutDescription: number;
  samplesWithDescription: Array<{
    id: string;
    title: string;
    descriptionLength: number;
    descriptionPreview: string;
  }>;
  samplesWithoutDescription: Array<{
    id: string;
    title: string;
  }>;
};

const defaultSettings: PublicTokkoSettings = {
  baseUrl: "https://www.tokkobroker.com/api/v1",
  syncSecret: "",
  autoSyncEnabled: false,
  hasApiKey: false,
};

export default function AdminIntegracionesPage() {
  if (!SHOW_TOKKO_ADMIN) return null;

  return <AdminIntegracionesContent />;
}

function AdminIntegracionesContent() {
  const { updateState } = useInmoStore();
  const [settings, setSettings] = useState<PublicTokkoSettings>(defaultSettings);
  const [apiKey, setApiKey] = useState("");
  const [clearApiKey, setClearApiKey] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [auditingTokko, setAuditingTokko] = useState(false);
  const [tokkoAudit, setTokkoAudit] = useState<TokkoAuditResult | null>(null);
  const [emailSettings, setEmailSettings] = useState<PublicEmailSettings>({
    mode: "preview",
    from: "Alojamiento Buenos Aires <no-reply@alojamientobuenosaires.com>",
    hasResendApiKey: false,
    configured: true,
  });
  const [resendApiKey, setResendApiKey] = useState("");
  const [clearResendApiKey, setClearResendApiKey] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const getAdminHeaders = (): Record<string, string> => {
    const adminId = readAdminSession()?.adminId;
    return adminId ? { "x-admin-id": adminId } : {};
  };

  useEffect(() => {
    const loadSettings = async () => {
      const response = await fetch("/api/tokko/settings", {
        cache: "no-store",
        headers: getAdminHeaders(),
      });
      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        settings?: PublicTokkoSettings;
      } | null;
      if (response.ok && payload?.settings) {
        setSettings(payload.settings);
      }
      const emailResponse = await fetch("/api/email/settings", {
        cache: "no-store",
        headers: getAdminHeaders(),
      });
      const emailPayload = await emailResponse.json().catch(() => null) as {
        settings?: PublicEmailSettings;
      } | null;
      if (emailPayload?.settings) setEmailSettings(emailPayload.settings);
    };
    void loadSettings();
  }, []);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/tokko/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAdminHeaders(),
        },
        body: JSON.stringify({
          baseUrl: settings.baseUrl,
          apiKey,
          clearApiKey,
          syncSecret: settings.syncSecret,
          autoSyncEnabled: settings.autoSyncEnabled,
        }),
      });
      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        error?: string;
        settings?: PublicTokkoSettings;
      } | null;
      if (!response.ok || !payload?.ok || !payload.settings) {
        throw new Error(payload?.error || "No se pudo guardar Tokko.");
      }
      setSettings(payload.settings);
      setApiKey("");
      setClearApiKey(false);
      setNotice("Configuración Tokko guardada.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No se pudo guardar Tokko.");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/tokko/test", {
        method: "POST",
        headers: getAdminHeaders(),
      });
      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        error?: string;
        sampleCount?: number;
        sampleTitle?: string;
        sampleHasDescription?: boolean;
        sampleDescriptionLength?: number;
        settings?: PublicTokkoSettings;
      } | null;
      if (!response.ok || !payload?.ok || !payload.settings) {
        throw new Error(payload?.error || "No se pudo probar Tokko.");
      }
      setSettings(payload.settings);
      const descriptionStatus = payload.sampleHasDescription
        ? `Descripción detectada (${payload.sampleDescriptionLength ?? 0} caracteres).`
        : "La muestra no trae descripción publicable.";
      setNotice(
        `Tokko respondió correctamente. Muestra recibida: ${payload.sampleCount ?? 0}. ${descriptionStatus}`
      );
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "No se pudo probar Tokko.");
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/tokko/sync", {
        method: "POST",
        headers: getAdminHeaders(),
      });
      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        error?: string;
        log?: { importedCount?: number; message?: string };
      } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || "No se pudo sincronizar Tokko.");
      }
      const stateResponse = await fetch("/api/inmo-state?scope=admin&mode=properties", {
        cache: "no-store",
        headers: getAdminHeaders(),
      });
      if (stateResponse.ok) updateState(await stateResponse.json(), { silent: true });
      setNotice(payload.log?.message || `Sincronización ejecutada. Importadas: ${payload.log?.importedCount ?? 0}.`);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "No se pudo sincronizar Tokko.");
    } finally {
      setSyncing(false);
    }
  };

  const handleAuditTokko = async () => {
    setAuditingTokko(true);
    setError("");
    setNotice("");
    setTokkoAudit(null);
    try {
      const response = await fetch("/api/tokko/audit", {
        method: "POST",
        headers: getAdminHeaders(),
      });
      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        error?: string;
        audit?: TokkoAuditResult;
      } | null;
      if (!response.ok || !payload?.ok || !payload.audit) {
        throw new Error(payload?.error || "No se pudo auditar Tokko.");
      }
      setTokkoAudit(payload.audit);
      setNotice(
        `Auditoría Tokko lista: ${payload.audit.withDescription} de ${payload.audit.total} propiedades tienen descripción.`
      );
    } catch (auditError) {
      setError(auditError instanceof Error ? auditError.message : "No se pudo auditar Tokko.");
    } finally {
      setAuditingTokko(false);
    }
  };

  const handleEmailTest = async () => {
    setTestingEmail(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: getAdminHeaders(),
      });
      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        reason?: string;
        provider?: string;
      } | null;
      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.reason || "No se pudo enviar el email de prueba.");
      }
      setNotice(`Email de prueba enviado por ${payload.provider}.`);
    } catch (emailError) {
      setError(emailError instanceof Error ? emailError.message : "No se pudo probar email.");
    } finally {
      setTestingEmail(false);
    }
  };

  const handleEmailSave = async () => {
    setSavingEmail(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/email/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAdminHeaders(),
        },
        body: JSON.stringify({
          mode: emailSettings.mode,
          from: emailSettings.from,
          resendApiKey,
          clearResendApiKey,
        }),
      });
      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        error?: string;
        settings?: PublicEmailSettings;
      } | null;
      if (!response.ok || !payload?.ok || !payload.settings) {
        throw new Error(payload?.error || "No se pudo guardar email.");
      }
      setEmailSettings(payload.settings);
      setResendApiKey("");
      setClearResendApiKey(false);
      setNotice("Email transaccional actualizado.");
    } catch (emailError) {
      setError(emailError instanceof Error ? emailError.message : "No se pudo guardar email.");
    } finally {
      setSavingEmail(false);
    }
  };

  return (
    <AdminShell activeSection="integraciones" title="Integraciones">
      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSave}
          className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Tokko Broke
            </p>
            <h2 className="mt-3 text-2xl font-headline font-extrabold text-primary">
              Sincronización de propiedades
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
              Cargá las credenciales de Tokko para importar propiedades publicadas en Tokko dentro de Alojamiento Buenos Aires.
            </p>
          </div>

          <div className="mt-7 grid gap-4">
            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Base URL API
              <input
                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                value={settings.baseUrl}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, baseUrl: event.target.value }))
                }
              />
            </label>

            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              API key
              <input
                type="password"
                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                placeholder={settings.hasApiKey ? "API key guardada. Escribí una nueva para reemplazarla." : "Pegá la API key de Tokko"}
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4 text-sm font-semibold text-primary">
              <input
                type="checkbox"
                checked={clearApiKey}
                onChange={(event) => setClearApiKey(event.target.checked)}
              />
              Quitar API key guardada
            </label>

            <label className="grid gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              Secreto para cron/webhook
              <input
                className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface focus:border-primary focus:outline-none"
                value={settings.syncSecret ?? ""}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, syncSecret: event.target.value }))
                }
              />
            </label>

            <label className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4 text-sm font-semibold text-primary">
              <input
                type="checkbox"
                checked={settings.autoSyncEnabled}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, autoSyncEnabled: event.target.checked }))
                }
              />
              Dejar marcada como integración activa
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={loading}
              className="rounded-full bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-primary disabled:opacity-60"
            >
              {loading ? "Guardando" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !settings.hasApiKey}
              className="rounded-full border border-outline-variant/40 px-6 py-3 text-xs font-bold uppercase tracking-widest text-primary disabled:opacity-40"
            >
              {testing ? "Probando" : "Probar API"}
            </button>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing || !settings.hasApiKey}
              className="rounded-full bg-primary-fixed px-6 py-3 text-xs font-bold uppercase tracking-widest text-primary disabled:opacity-40"
            >
              {syncing ? "Sincronizando" : "Sincronizar ahora"}
            </button>
            <button
              type="button"
              onClick={handleAuditTokko}
              disabled={auditingTokko || !settings.hasApiKey}
              className="rounded-full border border-primary/30 bg-surface-container-low px-6 py-3 text-xs font-bold uppercase tracking-widest text-primary disabled:opacity-40"
            >
              {auditingTokko ? "Auditando" : "Auditar descripciones"}
            </button>
          </div>

          {tokkoAudit ? (
            <div className="mt-5 rounded-3xl bg-surface-container-low p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-surface-container-lowest p-4">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Total API</p>
                  <p className="mt-2 text-2xl font-bold text-primary">{tokkoAudit.total}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-lowest p-4">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Con descripción</p>
                  <p className="mt-2 text-2xl font-bold text-primary">{tokkoAudit.withDescription}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-lowest p-4">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Sin descripción</p>
                  <p className="mt-2 text-2xl font-bold text-primary">{tokkoAudit.withoutDescription}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">
                    Muestras con descripción
                  </p>
                  <div className="mt-3 grid gap-3">
                    {tokkoAudit.samplesWithDescription.length ? (
                      tokkoAudit.samplesWithDescription.map((sample) => (
                        <div key={sample.id} className="rounded-2xl bg-surface-container-lowest p-4">
                          <p className="text-sm font-bold text-primary">{sample.title}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
                            {sample.id} · {sample.descriptionLength} caracteres
                          </p>
                          <p className="mt-2 text-xs leading-5 text-on-surface-variant">
                            {sample.descriptionPreview}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                        No encontramos propiedades con descripción en la respuesta.
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">
                    Muestras sin descripción
                  </p>
                  <div className="mt-3 grid gap-3">
                    {tokkoAudit.samplesWithoutDescription.length ? (
                      tokkoAudit.samplesWithoutDescription.map((sample) => (
                        <div key={sample.id} className="rounded-2xl bg-surface-container-lowest p-4">
                          <p className="text-sm font-bold text-primary">{sample.title}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-widest text-on-surface-variant">
                            {sample.id}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
                        Todas las propiedades auditadas tienen descripción.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {notice ? (
            <p className="mt-5 rounded-2xl bg-surface-container-low px-4 py-3 text-sm text-primary">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p className="mt-5 rounded-2xl bg-error-container px-4 py-3 text-sm text-error">
              {error}
            </p>
          ) : null}
        </form>

        <aside className="rounded-3xl bg-surface-container-lowest p-8 shadow-[0_40px_60px_-15px_rgba(27,27,28,0.04)]">
          <h3 className="text-xl font-headline font-bold text-primary">Estado</h3>
          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">API key</p>
              <p className="mt-2 text-sm font-bold text-primary">
                {settings.hasApiKey ? "Guardada en servidor" : "Pendiente"}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Endpoint importación</p>
              <p className="mt-2 break-all text-sm font-semibold text-primary">
                /api/tokko/sync
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Última prueba</p>
              <p className="mt-2 text-sm font-bold text-primary">
                {settings.lastTestedAt
                  ? new Date(settings.lastTestedAt).toLocaleString("es-AR")
                  : "Sin pruebas registradas"}
              </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Email transaccional</p>
              <p className="mt-2 text-sm font-bold text-primary">
                {emailSettings.mode === "preview"
                  ? "Modo preview activo"
                  : emailSettings.hasResendApiKey
                    ? "Resend configurado"
                    : "Pendiente API key Resend"}
              </p>
              <div className="mt-4 grid gap-3">
                <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Modo
                  <select
                    className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-primary"
                    value={emailSettings.mode}
                    onChange={(event) =>
                      setEmailSettings((prev) => ({
                        ...prev,
                        mode: event.target.value === "resend" ? "resend" : "preview",
                      }))
                    }
                  >
                    <option value="preview">Preview sin enviar</option>
                    <option value="resend">Enviar con Resend</option>
                  </select>
                </label>
                <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  Remitente
                  <input
                    className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-primary"
                    value={emailSettings.from}
                    onChange={(event) =>
                      setEmailSettings((prev) => ({ ...prev, from: event.target.value }))
                    }
                  />
                </label>
                <label className="grid gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  API key Resend
                  <input
                    type="password"
                    className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-3 py-2 text-xs text-primary"
                    placeholder={emailSettings.hasResendApiKey ? "Key guardada. Escribí una nueva para reemplazarla." : "re_..."}
                    value={resendApiKey}
                    onChange={(event) => setResendApiKey(event.target.value)}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-primary">
                  <input
                    type="checkbox"
                    checked={clearResendApiKey}
                    onChange={(event) => setClearResendApiKey(event.target.checked)}
                  />
                  Quitar API key guardada
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleEmailSave}
                  disabled={savingEmail}
                  className="rounded-full bg-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-on-primary disabled:opacity-40"
                >
                  {savingEmail ? "Guardando" : "Guardar email"}
                </button>
                <button
                  type="button"
                  onClick={handleEmailTest}
                  disabled={testingEmail || (emailSettings.mode === "resend" && !emailSettings.hasResendApiKey)}
                  className="rounded-full border border-outline-variant/40 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-primary disabled:opacity-40"
                >
                  {testingEmail ? "Probando" : "Probar"}
                </button>
              </div>
              <p className="mt-3 text-xs text-on-surface-variant">
                En modo preview el OTP aparece en pantalla y en logs; sirve para probar sin dominio empresarial.
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm leading-relaxed text-on-surface-variant">
            Para automatizar, configurá un cron o webhook que haga POST a
            <span className="font-semibold text-primary"> /api/tokko/sync </span>
            enviando el header <span className="font-semibold text-primary">x-tokko-sync-secret</span>.
          </p>
        </aside>
      </section>
    </AdminShell>
  );
}
