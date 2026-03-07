import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResponseCache } from '../cache';

describe('ResponseCache', () => {
  let cache: ResponseCache;

  beforeEach(() => {
    cache = new ResponseCache();
    vi.useFakeTimers();
  });

  it('returns null for missing key', () => {
    expect(cache.get('missing')).toBeNull();
  });

  it('returns data when set and get within TTL', () => {
    cache.set('k', { value: 42 });
    expect(cache.get<{ value: number }>('k')).toEqual({ value: 42 });
  });

  it('returns null after TTL has passed', () => {
    cache.set('k', 'data', 1000);
    vi.advanceTimersByTime(1500);
    expect(cache.get('k')).toBeNull();
  });

  it('returns data when custom TTL not yet expired', () => {
    cache.set('k', 'data', 5000);
    vi.advanceTimersByTime(2000);
    expect(cache.get('k')).toBe('data');
  });

  it('invalidate removes entry', () => {
    cache.set('k', 'v');
    cache.invalidate('k');
    expect(cache.get('k')).toBeNull();
  });

  it('clear removes all entries', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).toBeNull();
  });

  it('generateKey produces deterministic key for primitives', () => {
    const k1 = cache.generateKey('a', 'b');
    const k2 = cache.generateKey('a', 'b');
    expect(k1).toBe(k2);
  });

  it('generateKey produces same key for same array content in different order', () => {
    const k1 = cache.generateKey(['b', 'a']);
    const k2 = cache.generateKey(['a', 'b']);
    expect(k1).toBe(k2);
  });

  it('set overwrites existing key', () => {
    cache.set('k', 'first');
    cache.set('k', 'second');
    expect(cache.get('k')).toBe('second');
  });

  it('get returns correct type', () => {
    cache.set('k', { id: '1', name: 'test' });
    const v = cache.get<{ id: string; name: string }>('k');
    expect(v?.name).toBe('test');
  });
});
