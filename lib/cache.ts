// Simple in-memory cache with 1-hour expiration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export interface CacheMetadata {
  isCached: boolean;
  timestamp?: number;
  expiresIn?: number; // milliseconds until expiry
  expiresInMinutes?: number;
}

class Cache {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cache = new Map<string, CacheEntry<any>>();
  private readonly TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
  private readonly SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  set<T>(key: string, data: T): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + this.TWELVE_HOURS,
    });
  }

  // Set with custom duration
  setWithDuration<T>(key: string, data: T, durationMs: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + durationMs,
    });
  }

  // Set with 7-day duration (for descriptions)
  setDescription<T>(key: string, data: T): void {
    this.setWithDuration(key, data, this.SEVEN_DAYS);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  // Get cache metadata without retrieving the data
  getMetadata(key: string): CacheMetadata {
    const entry = this.cache.get(key);

    if (!entry) {
      return { isCached: false };
    }

    const now = Date.now();

    // Check if expired
    if (now > entry.expiry) {
      this.cache.delete(key);
      return { isCached: false };
    }

    const expiresIn = entry.expiry - now;
    const expiresInMinutes = Math.floor(expiresIn / (60 * 1000));

    return {
      isCached: true,
      timestamp: entry.timestamp,
      expiresIn,
      expiresInMinutes,
    };
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries (optional maintenance)
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Export a singleton instance
const globalForCache = globalThis as unknown as {
  cache: Cache | undefined;
};

export const cache = globalForCache.cache ?? new Cache();

if (process.env.NODE_ENV !== "production") {
  globalForCache.cache = cache;
}

// Helper function to generate cache keys
export const generateCacheKey = (
  prefix: string,
  ...params: (string | string[])[]
): string => {
  return `${prefix}:${params
    .map((p) => (Array.isArray(p) ? p.join("→") : p))
    .join(":")}`;
};
