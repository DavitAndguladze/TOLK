import { describe, expect, test } from "vitest";
import { createOciQuota, metered } from "./oci-quota";

describe("per-Reader OCI quota", () => {
  test("allows the limit per minute, then says when to retry", () => {
    const take = createOciQuota(3);
    expect([take("a", 0), take("a", 1_000), take("a", 2_000)]).toEqual([null, null, null]);
    expect(take("a", 30_000)).toBe(30); // oldest call frees at 60s
    expect(take("b", 30_000)).toBeNull(); // Readers don't share a budget
    expect(take("a", 60_000)).toBeNull();
  });

  test("a refused call doesn't spend budget", () => {
    const take = createOciQuota(1);
    expect(take("a", 0)).toBeNull();
    expect(take("a", 10_000)).toBe(50);
    expect(take("a", 59_999)).toBe(1);
    expect(take("a", 60_000)).toBeNull();
  });
});

describe("metered", () => {
  test("uses the free path once the Reader's budget is spent", async () => {
    const readerId = `metered-${Math.random()}`;
    const call = metered(readerId, async () => "paid", async () => "free");
    const results = await Promise.all(Array.from({ length: 31 }, () => call()));
    expect(results.filter((r) => r === "paid")).toHaveLength(30);
    expect(results.at(-1)).toBe("free");
  });
});
