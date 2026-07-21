const CHUNK_RELOAD_KEY = "aba:chunk-reload-attempted";

export const isChunkLoadError = (error: unknown) => {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === "string"
        ? error
        : "";

  return /ChunkLoadError|Failed to load chunk|dynamically imported module|Loading chunk/i.test(
    message
  );
};

export const reloadOnceForChunkError = () => {
  if (typeof window === "undefined") return false;
  if (window.sessionStorage.getItem(CHUNK_RELOAD_KEY) === "true") return false;

  window.sessionStorage.setItem(CHUNK_RELOAD_KEY, "true");
  const url = new URL(window.location.href);
  url.searchParams.set("_reload", String(Date.now()));
  window.location.replace(url.toString());
  return true;
};

export const clearChunkReloadMarker = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(CHUNK_RELOAD_KEY);
};
