import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => resetRateLimit());

  it("allows requests up to the limit and blocks the next one", () => {
    const start = 1_000_000;
    const options = { limit: 2, windowMs: 60_000 };

    expect(rateLimit("login:1", options, start).allowed).toBe(true);
    expect(rateLimit("login:1", options, start + 1).allowed).toBe(true);

    const blocked = rateLimit("login:1", options, start + 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("isolates buckets by key", () => {
    const start = 2_000_000;
    const options = { limit: 1, windowMs: 1_000 };

    expect(rateLimit("a", options, start).allowed).toBe(true);
    expect(rateLimit("b", options, start).allowed).toBe(true);
    expect(rateLimit("a", options, start + 1).allowed).toBe(false);
  });

  it("resets after the window expires", () => {
    const start = 3_000_000;
    const options = { limit: 1, windowMs: 1_000 };

    expect(rateLimit("window", options, start).allowed).toBe(true);
    expect(rateLimit("window", options, start + 500).allowed).toBe(false);
    expect(rateLimit("window", options, start + 1_001).allowed).toBe(true);
  });

  it("resetRateLimit clears one key or all keys", () => {
    const start = 4_000_000;
    const options = { limit: 1, windowMs: 60_000 };

    rateLimit("one", options, start);
    rateLimit("two", options, start);
    resetRateLimit("one");

    expect(rateLimit("one", options, start + 1).allowed).toBe(true);
    expect(rateLimit("two", options, start + 1).allowed).toBe(false);

    resetRateLimit();
    expect(rateLimit("two", options, start + 2).allowed).toBe(true);
  });
});
