// History cache with 1-hour expiration for undo/redo functionality
interface HistoryEntry {
  nodes: any[];
  edges: any[];
  timestamp: number;
  expiry: number;
}

class HistoryCache {
  private cache = new Map<string, HistoryEntry>();
  private readonly ONE_HOUR = 60 * 60 * 1000; // 1 hour in milliseconds

  set(sessionId: string, nodes: any[], edges: any[]): void {
    const now = Date.now();
    this.cache.set(sessionId, {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      timestamp: now,
      expiry: now + this.ONE_HOUR,
    });
  }

  get(sessionId: string): HistoryEntry | null {
    const entry = this.cache.get(sessionId);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(sessionId);
      return null;
    }

    return entry;
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // Check if session exists
  has(sessionId: string): boolean {
    const entry = this.cache.get(sessionId);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(sessionId);
      return false;
    }

    return true;
  }

  // Delete specific session
  delete(sessionId: string): void {
    this.cache.delete(sessionId);
  }

  // Get all active sessions (non-expired)
  getActiveSessions(): string[] {
    const now = Date.now();
    const activeSessions: string[] = [];

    for (const [sessionId, entry] of this.cache.entries()) {
      if (now <= entry.expiry) {
        activeSessions.push(sessionId);
      } else {
        this.cache.delete(sessionId);
      }
    }

    return activeSessions;
  }
}

// Export a singleton instance
export const historyCache = new HistoryCache();

// Helper function to generate session ID
export const generateSessionId = (): string => {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
