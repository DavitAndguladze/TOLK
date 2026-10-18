import { afterEach, expect, test, vi } from "vitest";
import { mockChapterVersion } from "../mocks";
import { alignWords } from "../listening/alignment";
import { saveReadAloudSummary } from "./save-read-aloud";

afterEach(() => vi.unstubAllGlobals());
test("summary POST uses the same browser Reader identity as the Chapter Check and requires confirmation", async () => {
  const version = mockChapterVersion(1);
  const summary = { chapterVersionId: version.id, ...alignWords(version.tokens, [{ text: "when" }], { complete: false }), startedAt: "2026-10-18T03:00:00Z", endedAt: "2026-10-18T03:01:00Z" };
  vi.stubGlobal("localStorage", { getItem: () => "reader-test-session" });
  const post = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
  vi.stubGlobal("fetch", post);
  await saveReadAloudSummary(summary);
  const [url, request] = post.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe(`/api/chapter-versions/${version.id}/read-aloud`);
  expect(request).toMatchObject({ method: "POST", credentials: "same-origin", headers: { "X-Reader-Session": "reader-test-session" } });
  expect(JSON.parse(request.body as string)).toEqual(summary);
});

test.each([
  [404, "missing route"],
  [200, JSON.stringify({ ok: false })],
  [200, "<html>not a save confirmation</html>"],
])("HTTP %s without a valid save acknowledgement never counts as saved", async (status, body) => {
  const version = mockChapterVersion(1);
  const summary = { chapterVersionId: version.id, ...alignWords(version.tokens, [{ text: "when" }], { complete: false }), startedAt: "2026-10-18T03:00:00Z", endedAt: "2026-10-18T03:01:00Z" };
  vi.stubGlobal("localStorage", { getItem: () => "reader-test-session" });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(body, { status })));
  await expect(saveReadAloudSummary(summary)).rejects.toThrow();
});
