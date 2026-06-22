type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

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
    return { value: cached.value, hit: true };
  }

  const value = await producer();
  cache.set(key, {
    value,
    expiresAt: now + ttlMs,
  });
  return { value, hit: false };
};

export const clearResponseCache = (prefix?: string) => {
  if (!prefix) {
    cache.clear();
    return;
  }

  Array.from(cache.keys()).forEach((key) => {
    if (key.startsWith(prefix)) cache.delete(key);
  });
};
