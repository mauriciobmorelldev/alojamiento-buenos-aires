type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

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
