/**
 * Client-side rate limiter for AI requests (sliding or fixed window).
 * Tracks request timestamps and allows at most maxRequests per windowMs.
 */

export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /** Removes timestamps outside the current window. */
  private prune(): void {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    this.requests = this.requests.filter((t) => t > cutoff);
  }

  /** Returns true if under the limit (a new request is allowed). */
  canMakeRequest(): boolean {
    this.prune();
    return this.requests.length < this.maxRequests;
  }

  /** Records a new request timestamp. Call after a successful request. */
  recordRequest(): void {
    this.prune();
    this.requests.push(Date.now());
  }

  /** Returns ms until a slot opens up (oldest request exits the window), or 0 if a slot is available. */
  getTimeUntilNextSlot(): number {
    this.prune();
    if (this.requests.length < this.maxRequests) return 0;
    const oldest = Math.min(...this.requests);
    const exitTime = oldest + this.windowMs;
    const now = Date.now();
    return Math.max(0, Math.ceil((exitTime - now) / 1000) * 1000);
  }

  /** Returns how many requests are left in the current window. */
  getRemainingRequests(): number {
    this.prune();
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

export const aiRateLimiter = new RateLimiter(10, 60000);
