"use client";

export const ADMIN_SESSION_KEY = "inmo-admin-session/v1";
export const CLIENT_SESSION_KEY = "inmo-client-session/v1";
const ADMIN_SESSION_MAX_AGE_MS = 8 * 60 * 60 * 1000;
const ADMIN_SESSION_IDLE_MS = 10 * 60 * 1000;

export type AdminSession = {
  adminId: string;
  email: string;
  issuedAt: string;
  lastActiveAt?: string;
  expiresAt?: string;
};

export type ClientSession = {
  clientId: string;
  email: string;
  issuedAt: string;
};

const isBrowser = typeof window !== "undefined";

const safeRead = <T>(key: string): T | null => {
  if (!isBrowser) return null;
  try {
    const storage = key === ADMIN_SESSION_KEY ? window.sessionStorage : window.localStorage;
    const value = storage.getItem(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("No se pudo leer sesión de storage", error);
    return null;
  }
};

const safeWrite = (key: string, value: unknown) => {
  if (!isBrowser) return;
  try {
    const storage = key === ADMIN_SESSION_KEY ? window.sessionStorage : window.localStorage;
    storage.setItem(key, JSON.stringify(value));
    if (key === ADMIN_SESSION_KEY) {
      window.localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn("No se pudo guardar sesión en storage", error);
  }
};

const safeRemove = (key: string) => {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  } catch (error) {
    console.warn("No se pudo eliminar sesión de storage", error);
  }
};

const isAdminSessionExpired = (session: AdminSession) => {
  const now = Date.now();
  const issuedAt = new Date(session.issuedAt).getTime();
  const lastActiveAt = new Date(session.lastActiveAt ?? session.issuedAt).getTime();
  const expiresAt = session.expiresAt ? new Date(session.expiresAt).getTime() : issuedAt + ADMIN_SESSION_MAX_AGE_MS;
  return (
    !Number.isFinite(issuedAt) ||
    !Number.isFinite(lastActiveAt) ||
    now > expiresAt ||
    now - lastActiveAt > ADMIN_SESSION_IDLE_MS
  );
};

export const readAdminSession = () => {
  if (isBrowser) {
    const legacy = window.localStorage.getItem(ADMIN_SESSION_KEY);
    if (legacy) {
      window.localStorage.removeItem(ADMIN_SESSION_KEY);
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }
  const session = safeRead<AdminSession>(ADMIN_SESSION_KEY);
  if (!session) return null;
  if (isAdminSessionExpired(session)) {
    clearAdminSession();
    return null;
  }
  return session;
};

export const writeAdminSession = (value: AdminSession) => {
  const issuedAt = value.issuedAt || new Date().toISOString();
  safeWrite(ADMIN_SESSION_KEY, {
    ...value,
    issuedAt,
    lastActiveAt: value.lastActiveAt ?? issuedAt,
    expiresAt:
      value.expiresAt ??
      new Date(new Date(issuedAt).getTime() + ADMIN_SESSION_MAX_AGE_MS).toISOString(),
  });
};

export const touchAdminSession = () => {
  const session = readAdminSession();
  if (!session) return null;
  const next = { ...session, lastActiveAt: new Date().toISOString() };
  writeAdminSession(next);
  return next;
};
export const clearAdminSession = () => safeRemove(ADMIN_SESSION_KEY);

export const readClientSession = () => safeRead<ClientSession>(CLIENT_SESSION_KEY);
export const writeClientSession = (value: ClientSession) =>
  safeWrite(CLIENT_SESSION_KEY, value);
export const clearClientSession = () => safeRemove(CLIENT_SESSION_KEY);
