import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CLASSIC_BOOKS, GATSBY_COVER } from "./books";
import audit from "./cover-audit.json";

const sha256 = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

describe("cover audit", () => {
  it("records every committed cover with its exact hash and a public-domain licence", () => {
    const slugs = [...CLASSIC_BOOKS.filter(b => "coverArt" in b).map(b => b.cover), GATSBY_COVER.src.slice("/covers/".length, -".jpg".length)];
    expect(audit.map(a => a.cover).sort()).toEqual([...slugs].sort());
    for (const entry of audit) {
      expect(entry.file).toBe(`public/covers/${entry.cover}.jpg`);
      expect(sha256(entry.file)).toBe(entry.sha256);
      expect(entry.licence).toMatch(/^PD-/);
      expect(entry.commonsPage).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
    }
  });
});
