// In-memory TTL cache for repeated Gemini calls. Intentionally per-instance:
// the service runs on Cloud Run with min-instances=1 and identical inputs are
// common (quick-action questions), so a shared cache is unnecessary — see
// docs/decisions.md.

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** Minimal time-to-live cache with a bounded entry count (FIFO eviction). */
export class TtlCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
  ) {}

  /** Returns the cached value for `key`, or undefined when absent/expired. */
  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /** Stores `value` under `key`, evicting the oldest entry when full. */
  set(key: string, value: T): void {
    if (this.entries.size >= this.maxEntries && !this.entries.has(key)) {
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey !== undefined) {
        this.entries.delete(oldestKey);
      }
    }
    this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /** Removes every entry (used by tests). */
  clear(): void {
    this.entries.clear();
  }
}
