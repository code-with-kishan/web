import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TtlCache } from '../../src/lib/ttl-cache.js';

describe('TtlCache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a stored value before its TTL expires', () => {
    const cache = new TtlCache<string>(1000, 10);
    cache.set('k', 'v');
    expect(cache.get('k')).toBe('v');
  });

  it('expires values after the TTL', () => {
    const cache = new TtlCache<string>(1000, 10);
    cache.set('k', 'v');
    vi.advanceTimersByTime(1001);
    expect(cache.get('k')).toBeUndefined();
  });

  it('returns undefined for a key that was never set', () => {
    const cache = new TtlCache<string>(1000, 10);
    expect(cache.get('missing')).toBeUndefined();
  });

  it('evicts the oldest entry once the max size is reached', () => {
    const cache = new TtlCache<number>(10_000, 2);
    cache.set('first', 1);
    cache.set('second', 2);
    cache.set('third', 3);
    expect(cache.get('first')).toBeUndefined();
    expect(cache.get('second')).toBe(2);
    expect(cache.get('third')).toBe(3);
  });

  it('clear removes every entry', () => {
    const cache = new TtlCache<string>(1000, 10);
    cache.set('k', 'v');
    cache.clear();
    expect(cache.get('k')).toBeUndefined();
  });
});
