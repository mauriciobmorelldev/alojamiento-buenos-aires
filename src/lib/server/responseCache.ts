type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
const MAX_CACHE_ENTRIES = 160;
let cacheGeneration = 0;

const pruneCache = (now: number) => {
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  while (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    cache.delete(oldestKey);
  }
};

export const PUBLIC_CACHE_TTL = {
  shell: 120_000,
  homeListings: 60_000,
  catalogListings: 60_000,
  property: 120_000,
};

export const PUBLIC_CACHE_CONTROL = {
  shell: "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
  homeListings: "public, max-age=30, s-maxage=60, stale-while-revalidate=180",
  catalogListings: "public, max-age=30, s-maxage=60, stale-while-revalidate=180",
  property: "public, max-age=60, s-maxage=120, stale-while-revalidate=300",
  notFound: "public, max-age=30, s-maxage=60",
};

export const readThroughCache = async <T>(
  key: string,
  ttlMs: number,
  producer: () => Promise<T>
) => {
  const now = Date.now();
  const cached = cache.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > now) {
    cache.delete(key);
    cache.set(key, cached);
    return { value: cached.value, hit: true };
  }

  const existingRequest = inflight.get(key) as Promise<T> | undefined;
  if (existingRequest) return { value: await existingRequest, hit: true };

  const generation = cacheGeneration;
  const request = producer();
  inflight.set(key, request);
  const value = await request.finally(() => {
    inflight.delete(key);
  });

  if (generation === cacheGeneration) {
    pruneCache(Date.now());
    cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }
  return { value, hit: false };
};

export const clearResponseCache = (prefix?: string) => {
  cacheGeneration += 1;
  if (!prefix) {
    cache.clear();
    inflight.clear();
    return;
  }

  Array.from(cache.keys()).forEach((key) => {
    if (key.startsWith(prefix)) cache.delete(key);
  });
  Array.from(inflight.keys()).forEach((key) => {
    if (key.startsWith(prefix)) inflight.delete(key);
  });
};
