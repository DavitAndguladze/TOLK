import { afterEach, expect, test, vi } from "vitest";
import { mockChapterVersion } from "../mocks";
import { createFlagScope, disposeFlags, flagWord, isFlagged, loadFlags, unflagWord } from "./flagged-words";

afterEach(() => vi.unstubAllGlobals());

test("hydrates saved flags through the authenticated route and confirms changes before displaying them", async () => {
  const scope = createFlagScope();
  const versionId = "saved-flags";
  const token = mockChapterVersion(1).tokens[5];
  const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ flags: [{ word: token.normalized, tokenIndex: token.index, chapterVersionId: versionId, at: "2026-10-18T00:00:00Z" }] }));
  vi.stubGlobal("fetch", fetcher);
  await loadFlags(versionId, scope);
  expect(isFlagged(versionId, token.index, scope)).toBe(true);
  expect(fetcher.mock.calls[0][1].credentials).toBe("same-origin");

  fetcher.mockResolvedValueOnce(Response.json({ error: "offline" }, { status: 503 }));
  await expect(unflagWord(versionId, token, scope)).rejects.toThrow();
  expect(isFlagged(versionId, token.index, scope)).toBe(true);

  fetcher.mockResolvedValueOnce(Response.json({ ok: true }));
  await unflagWord(versionId, token, scope);
  expect(isFlagged(versionId, token.index, scope)).toBe(false);

  fetcher.mockResolvedValueOnce(Response.json({ flagged: { tokenIndex: token.index, chapterVersionId: versionId }, meaning: "A parent." }));
  const saving = flagWord(versionId, token, scope);
  expect(isFlagged(versionId, token.index, scope)).toBe(false);
  await saving;
  expect(isFlagged(versionId, token.index, scope)).toBe(true);
  expect(new Headers(fetcher.mock.calls.at(-1)![1].headers).has("X-Reader-Session")).toBe(false);
});

test("a fresh hydration cannot be overwritten by an older account request", async () => {
  const scope = createFlagScope();
  const old = Promise.withResolvers<Response>();
  const current = Promise.withResolvers<Response>();
  vi.stubGlobal("fetch", vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise));
  const first = loadFlags("shared-version", scope);
  const second = loadFlags("shared-version", scope);
  current.resolve(Response.json({ flags: [] }));
  old.resolve(Response.json({ flags: [{ tokenIndex: 5, chapterVersionId: "shared-version" }] }));
  await Promise.all([first, second]);
  expect(isFlagged("shared-version", 5, scope)).toBe(false);
});

test("a pending flag response cannot overwrite flags hydrated for the next Reader", async () => {
  const scope = createFlagScope();
  const versionId = "pending-old-reader";
  const token = mockChapterVersion(1).tokens[5];
  const old = Promise.withResolvers<Response>();
  const started = Promise.withResolvers<void>();
  const fetcher = vi.fn().mockImplementationOnce(() => {
    started.resolve();
    return old.promise;
  }).mockResolvedValueOnce(Response.json({ flags: [] }));
  vi.stubGlobal("fetch", fetcher);
  const saving = flagWord(versionId, token, scope);
  const settled = Promise.allSettled([saving]);
  await started.promise;
  await loadFlags(versionId, scope);
  old.resolve(Response.json({ flagged: { tokenIndex: token.index, chapterVersionId: versionId }, meaning: "A parent." }));
  await settled;
  expect(isFlagged(versionId, token.index, scope)).toBe(false);
});

test("disposing a Reader mount cancels queued writes before they can use the next Reader's cookie", async () => {
  const previous = createFlagScope();
  const current = createFlagScope();
  const versionId = "queued-old-reader";
  const token = mockChapterVersion(1).tokens[5];
  const old = Promise.withResolvers<Response>();
  const started = Promise.withResolvers<void>();
  const saved = () => Response.json({ flagged: { tokenIndex: token.index, chapterVersionId: versionId }, meaning: "A parent." });
  const fetcher = vi.fn().mockImplementationOnce(() => {
    started.resolve();
    return old.promise;
  }).mockResolvedValueOnce(Response.json({ flags: [] })).mockImplementation(() => saved());
  vi.stubGlobal("fetch", fetcher);
  const saving = flagWord(versionId, token, previous);
  await started.promise;
  const queued = unflagWord(versionId, token, previous);
  const settled = Promise.allSettled([saving, queued]);
  disposeFlags(previous);
  expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
  await loadFlags(versionId, current);
  await flagWord(versionId, token, current);
  expect(isFlagged(versionId, token.index, previous)).toBe(false);
  expect(isFlagged(versionId, token.index, current)).toBe(true);
  old.resolve(saved());
  expect((await settled).map((result) => result.status)).toEqual(["rejected", "rejected"]);
  expect(fetcher.mock.calls.map(([, init]) => init.method ?? "GET")).toEqual(["POST", "GET", "POST"]);
  expect(isFlagged(versionId, token.index, current)).toBe(true);
});

test("mounted Readers never share a flag cache for the same version", async () => {
  const first = createFlagScope();
  const second = createFlagScope();
  const versionId = "isolated-mounts";
  const token = mockChapterVersion(1).tokens[5];
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ flagged: { tokenIndex: token.index, chapterVersionId: versionId }, meaning: "A parent." })));
  await flagWord(versionId, token, first);
  expect(isFlagged(versionId, token.index, first)).toBe(true);
  expect(isFlagged(versionId, token.index, second)).toBe(false);
});

test("rehydration clears previous flags immediately and unmount prevents its late response from restoring them", async () => {
  const scope = createFlagScope();
  const versionId = "rehydration-boundary";
  const saved = () => Response.json({ flags: [{ tokenIndex: 5, chapterVersionId: versionId }] });
  const pending = Promise.withResolvers<Response>();
  const fetcher = vi.fn().mockResolvedValueOnce(saved()).mockReturnValueOnce(pending.promise).mockResolvedValueOnce(Response.json({ flags: [] }));
  vi.stubGlobal("fetch", fetcher);
  await loadFlags(versionId, scope);
  expect(isFlagged(versionId, 5, scope)).toBe(true);
  const refreshing = loadFlags(versionId, scope);
  expect(isFlagged(versionId, 5, scope)).toBe(false);
  disposeFlags(scope);
  expect(fetcher.mock.calls[1][1].signal.aborted).toBe(true);
  pending.resolve(saved());
  await refreshing;
  expect(isFlagged(versionId, 5, scope)).toBe(false);
  // React can replay mount effects after cleanup; hydration must establish a fresh lifetime.
  await loadFlags(versionId, scope);
  expect(fetcher.mock.calls[2][1].signal.aborted).toBe(false);
  expect(isFlagged(versionId, 5, scope)).toBe(false);
});
