/**
 * In-memory cache with TTL for API responses (e.g. Gemini recipe/substitutions).
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

export class ResponseCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  /**
   * Returns cached data if the entry exists and is not expired, otherwise null.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  /**
   * Stores data with optional TTL. Default TTL: 30 minutes (1800000ms).
   */
  set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /** Removes a single entry by key. */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /** Removes all entries. */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Creates a deterministic cache key from arguments (e.g. sorted pantry names).
   * Sorts and stringifies args so order does not affect the key.
   */
  generateKey(...args: unknown[]): string {
    const normalized = args.map((a) => {
      if (Array.isArray(a)) return JSON.stringify([...a].sort());
      if (a !== null && typeof a === 'object') return JSON.stringify(a);
      return String(a);
    });
    return normalized.join('::');
  }
}

export const responseCache = new ResponseCache();
