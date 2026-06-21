"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { InmoState } from "./inmoData";
import { defaultState, STATE_VERSION } from "./inmoData";
import { readAdminSession } from "./session";
import { mergeState } from "./stateMerge";

const STORAGE_KEY = "connexa-state/v6";
const LEGACY_STORAGE_KEYS = ["connexa-state/v5", "connexa-state/v4"];
const UPDATE_EVENT = "inmo:updated";
const MAX_STORAGE_BYTES = 1_500_000;

const isBrowser = typeof window !== "undefined";
let inMemoryState: InmoState | null = null;

const safeParse = (value: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value) as Partial<InmoState>;
  } catch (error) {
    console.warn("No se pudo leer el estado guardado", error);
    return null;
  }
};

const readStorage = () => {
  if (!isBrowser) return null;
  try {
    LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Storage no disponible, usando memoria", error);
    return null;
  }
};

const writeStorage = (value: string) => {
  if (!isBrowser) return;
  if (value.length > MAX_STORAGE_BYTES) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // Storage may be unavailable; in-memory state is enough.
    }
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch (error) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      LEGACY_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
    } catch {
      // Ignore cleanup failures.
    }
    console.warn("No se pudo guardar en storage, usando memoria", error);
  }
};

const fetchRemoteState = async (
  scope: "public" | "admin" = "public",
  mode: "home" | "catalog" = "home"
) => {
  try {
    if (scope === "public") {
      const [shellResponse, listingsResponse] = await Promise.all([
        fetch(`/api/public/shell?mode=${mode}`, { cache: "no-store" }),
        fetch("/api/public/listings", { cache: "no-store" }),
      ]);
      if (!shellResponse.ok || !listingsResponse.ok) return null;
      const shellData = (await shellResponse.json()) as Partial<InmoState>;
      const listingsData = (await listingsResponse.json()) as Partial<InmoState>;
      const shellSource = shellResponse.headers.get("x-inmo-state-source");
      const listingsSource = listingsResponse.headers.get("x-inmo-state-source");
      return {
        data: {
          ...shellData,
          ...listingsData,
        },
        source:
          shellSource === "supabase" || listingsSource === "supabase"
            ? "supabase"
            : "fallback",
      };
    }

    const params = new URLSearchParams({ scope });
    const adminSession = readAdminSession();
    const response = await fetch(`/api/inmo-state?${params.toString()}`, {
      cache: "no-store",
      headers: {
        ...(adminSession?.adminId ? { "x-admin-id": adminSession.adminId } : {}),
      },
    });
    if (!response.ok) return null;
    return {
      data: (await response.json()) as Partial<InmoState>,
      source: response.headers.get("x-inmo-state-source") as "supabase" | "fallback" | null,
    };
  } catch (error) {
    console.warn("No se pudo cargar estado remoto, usando fallback local", error);
    return null;
  }
};

const persistRemoteState = async (state: InmoState) => {
  try {
    const adminSession = readAdminSession();
    await fetch("/api/inmo-state", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(adminSession?.adminId ? { "x-admin-id": adminSession.adminId } : {}),
      },
      body: JSON.stringify(state),
    });
  } catch (error) {
    console.warn("No se pudo persistir estado remoto, usando fallback local", error);
  }
};

const waitForNonCriticalRefresh = () =>
  new Promise<void>((resolve) => {
    if (!isBrowser) {
      resolve();
      return;
    }

    const run = () => window.setTimeout(resolve, 1200);
    if (document.readyState === "complete") {
      run();
      return;
    }
    window.addEventListener("load", run, { once: true });
  });

export const loadState = (): InmoState => {
  if (!isBrowser) return defaultState;
  if (inMemoryState) {
    if (inMemoryState.version === STATE_VERSION) return inMemoryState;
    inMemoryState = null;
  }
  const stored = safeParse(readStorage());
  if (!stored || stored.version !== STATE_VERSION) return defaultState;
  return mergeState(defaultState, stored);
};

export const saveState = (state: InmoState, options?: { silent?: boolean }) => {
  if (!isBrowser) return;
  inMemoryState = state;
  writeStorage(JSON.stringify(state));
  void persistRemoteState(state);

  // Dispatch async to avoid cross-component setState while React is rendering.
  const notify = () =>
    window.dispatchEvent(
      new CustomEvent(UPDATE_EVENT, { detail: { silent: Boolean(options?.silent) } })
    );
  if (typeof queueMicrotask === "function") {
    queueMicrotask(notify);
    return;
  }
  window.setTimeout(notify, 0);
};

export const resetState = () => {
  inMemoryState = defaultState;
  saveState(defaultState);
};

export const useInmoStore = (initialState?: Partial<InmoState>) => {
  const pathname = usePathname();
  const [state, setState] = useState<InmoState>(() =>
    initialState ? mergeState(defaultState, initialState) : defaultState
  );
  const [isReady, setIsReady] = useState(Boolean(initialState));

  useEffect(() => {
    const hydrate = async () => {
      const scope =
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/mi-cuenta") ||
        pathname?.startsWith("/confirmar") ||
        pathname?.startsWith("/registro")
          ? "admin"
          : "public";
      const mode = pathname?.startsWith("/propiedades") ? "catalog" : "home";
      if (initialState && scope === "public") {
        const mergedInitial = mergeState(defaultState, initialState);
        inMemoryState = mergedInitial;
        setState(mergedInitial);
        setIsReady(true);
        await waitForNonCriticalRefresh();
        const remote = await fetchRemoteState(scope, mode);
        if (remote?.source === "supabase") {
          const mergedRemote = mergeState(defaultState, remote.data);
          inMemoryState = mergedRemote;
          setState(mergedRemote);
        }
        return;
      }
      if (scope === "admin") {
        setIsReady(false);
        const remote = await fetchRemoteState(scope, mode);
        if (remote?.source === "supabase") {
          const mergedRemote = mergeState(defaultState, remote.data);
          inMemoryState = mergedRemote;
          setState(mergedRemote);
          setIsReady(true);
          return;
        }
        const local = loadState();
        setState(local);
        setIsReady(true);
        return;
      }
      const local = loadState();
      setState(local);
      const remote = await fetchRemoteState(scope, mode);
      if (!remote || remote.source === "fallback") {
        setIsReady(true);
        return;
      }
      const merged =
        remote.source === "supabase"
          ? mergeState(defaultState, remote.data)
          : mergeState(local, remote.data);
      inMemoryState = merged;
      setState(merged);
      setIsReady(true);
    };
    if (typeof queueMicrotask === "function") {
      queueMicrotask(() => void hydrate());
    } else {
      window.setTimeout(() => void hydrate(), 0);
    }
    const handleUpdate = () => {
      setState(loadState());
    };

    window.addEventListener(UPDATE_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [initialState, pathname]);

  const updateState = useCallback(
    (
      updater: InmoState | ((prev: InmoState) => InmoState),
      options?: { silent?: boolean }
    ) => {
      setState((prev) => {
        const nextState =
          typeof updater === "function" ? updater(prev) : updater;
        saveState(nextState, options);
        return nextState;
      });
    },
    []
  );

  const reset = useCallback(() => {
    resetState();
    setState(defaultState);
  }, []);

  return { state, updateState, reset, isReady };
};
