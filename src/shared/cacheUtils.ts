const CACHE_PREFIX = 'display-calendar:';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export function loadFromCache<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return undefined;

    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return undefined;
    }
    return entry.data;
  } catch {
    return undefined;
  }
}

export function saveToCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, timestamp: Date.now() };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (e) {
    console.warn('[Cache] Failed to save:', e);
  }
}
