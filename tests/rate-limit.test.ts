import { beforeEach, describe, expect, it } from "vitest";

import { clearAllRateLimits, rateLimit, resetRateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  it("allows requests up to the limit then blocks", () => {
    const key = "login:user@example.com";

    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(rateLimit(key, 3, 60_000).allowed).toBe(true);

    const blocked = rateLimit(key, 3, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks keys independently", () => {
    rateLimit("a", 1, 60_000);
    expect(rateLimit("a", 1, 60_000).allowed).toBe(false);
    expect(rateLimit("b", 1, 60_000).allowed).toBe(true);
  });

  it("resets a bucket after a successful login", () => {
    rateLimit("c", 1, 60_000);
    expect(rateLimit("c", 1, 60_000).allowed).toBe(false);

    resetRateLimit("c");
    expect(rateLimit("c", 1, 60_000).allowed).toBe(true);
  });
});
