import { afterEach, expect, test, vi } from "vitest";
import { mockChapterVersion } from "../mocks";
import { flagWord, isFlagged, loadFlags, unflagWord } from "./flagged-words";

afterEach(() => vi.unstubAllGlobals());

test("hydrates saved flags through the authenticated route and confirms changes before displaying them", async () => {
  const versionId = "saved-flags";
  const token = mockChapterVersion(1).tokens[5];
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ flags: [{ word: token.normalized, tokenIndex: token.index, chapterVersionId: versionId, at: "2026-10-18T00:00:00Z" }] }));
  vi.stubGlobal("fetch", fetcher);
  await loadFlags(versionId);
  expect(isFlagged(versionId, token.index)).toBe(true);
  expect(fetcher.mock.calls[0][1].credentials).toBe("same-origin");

  fetcher.mockResolvedValueOnce(Response.json({ error: "offline" }, { status: 503 }));
  await expect(unflagWord(versionId, token)).rejects.toThrow();
  expect(isFlagged(versionId, token.index)).toBe(true);

  fetcher.mockResolvedValueOnce(Response.json({ ok: true }));
  await unflagWord(versionId, token);
  expect(isFlagged(versionId, token.index)).toBe(false);

  fetcher.mockResolvedValueOnce(Response.json({ flagged: { tokenIndex: token.index, chapterVersionId: versionId }, meaning: "A parent." }));
  const saving = flagWord(versionId, token);
  expect(isFlagged(versionId, token.index)).toBe(false);
  await saving;
  expect(isFlagged(versionId, token.index)).toBe(true);
  expect(new Headers(fetcher.mock.calls.at(-1)![1].headers).has("X-Reader-Session")).toBe(false);
});

test("a fresh hydration cannot be overwritten by an older account request", async () => {
  const old = Promise.withResolvers<Response>();
  const current = Promise.withResolvers<Response>();
  vi.stubGlobal("fetch", vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise));
  const first = loadFlags("shared-version");
  const second = loadFlags("shared-version");
  current.resolve(Response.json({ flags: [] }));
  old.resolve(Response.json({ flags: [{ tokenIndex: 5, chapterVersionId: "shared-version" }] }));
  await Promise.all([first, second]);
  expect(isFlagged("shared-version", 5)).toBe(false);
});
