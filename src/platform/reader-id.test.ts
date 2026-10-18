import { describe, expect, test } from "vitest";
import { readerIdFrom } from "./reader-id";

describe("readerIdFrom", () => {
  test("a signed-in Reader is their user id, whatever header is sent", () => {
    expect(readerIdFrom("user-1", "browser-abc")).toBe("user-1");
  });

  test("without a session, the header id is namespaced", () => {
    expect(readerIdFrom(undefined, "browser-abc")).toBe("anon:browser-abc");
  });

  test("an unsigned request that sends a Reader's user id as the header can't act as that Reader", () => {
    expect(readerIdFrom(undefined, "user-1")).not.toBe(readerIdFrom("user-1", null));
  });

  test("no, oversized or odd headers fall back to anonymous", () => {
    expect(readerIdFrom(undefined, null)).toBe("anonymous");
    expect(readerIdFrom(undefined, "")).toBe("anonymous");
    expect(readerIdFrom(undefined, "a".repeat(65))).toBe("anonymous");
    expect(readerIdFrom(undefined, "anon:user-1")).toBe("anonymous");
  });

  test("a browser id from crypto.randomUUID is accepted", () => {
    expect(readerIdFrom(undefined, "0b5f7c1e-6a2d-4c1b-9e8f-2a3b4c5d6e7f")).toBe("anon:0b5f7c1e-6a2d-4c1b-9e8f-2a3b4c5d6e7f");
  });
});
