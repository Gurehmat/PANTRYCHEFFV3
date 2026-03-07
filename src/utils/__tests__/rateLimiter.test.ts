import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from '../rateLimiter';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests when under limit', () => {
    const limiter = new RateLimiter(2, 60000);
    expect(limiter.canMakeRequest()).toBe(true);
    limiter.recordRequest();
    expect(limiter.canMakeRequest()).toBe(true);
    limiter.recordRequest();
    expect(limiter.canMakeRequest()).toBe(false);
  });

  it('getRemainingRequests decreases as requests are recorded', () => {
    const limiter = new RateLimiter(3, 60000);
    expect(limiter.getRemainingRequests()).toBe(3);
    limiter.recordRequest();
    expect(limiter.getRemainingRequests()).toBe(2);
    limiter.recordRequest();
    expect(limiter.getRemainingRequests()).toBe(1);
    limiter.recordRequest();
    expect(limiter.getRemainingRequests()).toBe(0);
  });

  it('getTimeUntilNextSlot returns 0 when under limit', () => {
    const limiter = new RateLimiter(2, 60000);
    expect(limiter.getTimeUntilNextSlot()).toBe(0);
    limiter.recordRequest();
    expect(limiter.getTimeUntilNextSlot()).toBe(0);
  });

  it('getTimeUntilNextSlot returns positive when at limit', () => {
    const limiter = new RateLimiter(1, 60000);
    limiter.recordRequest();
    const ms = limiter.getTimeUntilNextSlot();
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(60000);
  });

  it('after window passes, slot opens up', () => {
    const limiter = new RateLimiter(1, 1000);
    limiter.recordRequest();
    expect(limiter.canMakeRequest()).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(limiter.canMakeRequest()).toBe(true);
    expect(limiter.getTimeUntilNextSlot()).toBe(0);
  });

  it('recordRequest adds timestamp', () => {
    const limiter = new RateLimiter(2, 60000);
    limiter.recordRequest();
    limiter.recordRequest();
    expect(limiter.canMakeRequest()).toBe(false);
  });

  it('default constructor uses 10 and 60000', () => {
    const limiter = new RateLimiter();
    for (let i = 0; i < 10; i++) limiter.recordRequest();
    expect(limiter.canMakeRequest()).toBe(false);
    expect(limiter.getRemainingRequests()).toBe(0);
  });

  it('prune removes old timestamps', () => {
    const limiter = new RateLimiter(1, 1000);
    limiter.recordRequest();
    vi.advanceTimersByTime(1001);
    expect(limiter.canMakeRequest()).toBe(true);
    limiter.recordRequest();
    expect(limiter.canMakeRequest()).toBe(false);
  });
});
