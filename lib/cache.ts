// Simple in-memory cache with 1-hour expiration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

  set<T>(key: string, data: T): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry: now + this.ONE_HOUR,
    });
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
export const cache = new Cache();

// Helper function to generate cache keys
export const generateCacheKey = (prefix: string, ...params: (string | string[])[]): string => {
  return `${prefix}:${params.map(p => Array.isArray(p) ? p.join('→') : p).join(':')}`;
};
