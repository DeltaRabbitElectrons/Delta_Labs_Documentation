'use client';

/**
 * In-memory page cache for instant Notion-style navigation.
 * Pages are cached after the first fetch so subsequent visits are instant.
 */

interface CachedPage {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CachedPage>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const pageCache = {
  get(slug: string): any | null {
    const entry = cache.get(slug);
    if (!entry) return null;
    // Return cached data even if stale (we'll refresh in background)
    return entry.data;
  },

  set(slug: string, data: any) {
    cache.set(slug, { data, timestamp: Date.now() });
  },

  isStale(slug: string): boolean {
    const entry = cache.get(slug);
    if (!entry) return true;
    return Date.now() - entry.timestamp > CACHE_TTL;
  },

  invalidate(slug: string) {
    cache.delete(slug);
  },

  clear() {
    cache.clear();
  }
};
