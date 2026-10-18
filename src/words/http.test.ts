import { beforeEach, expect, test, vi } from "vitest";
import { mockChapter, mockChapterVersion } from "../mocks";

const deps = vi.hoisted(() => ({ reader: vi.fn(), version: vi.fn(), chapter: vi.fn(), define: vi.fn(), speak: vi.fn(), list: vi.fn(), flag: vi.fn(), unflag: vi.fn() }));
vi.mock("../platform/auth", () => ({ getReader: deps.reader }));
vi.mock("../db", () => ({ getChapterVersion: deps.version, getChapter: deps.chapter }));
vi.mock("./server", () => ({ defineWord: deps.define, synthesizeWord: deps.speak }));
vi.mock("./mysql-flags", () => ({ listFlags: deps.list, saveFlag: deps.flag, removeFlag: deps.unflag }));
import { wordMeaning, speakWord, getFlags, postFlag, deleteFlag } from "./http";

const context = (tokenIndex = "5") => ({ params: Promise.resolve({ versionId: "gatsby-ch1-L1", tokenIndex }) });
const request = (body: unknown) => new Request("https://tolk.test/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.resetAllMocks();
  deps.reader.mockResolvedValue({ id: "reader-a" });
  deps.version.mockResolvedValue(mockChapterVersion(1));
  deps.chapter.mockResolvedValue(mockChapter);
  deps.define.mockResolvedValue({ meaning: "A father is a male parent.", source: "oci-generative-ai" });
  deps.list.mockResolvedValue([]);
});

test("signed-out and foreign Reader requests never reach word services", async () => {
  deps.reader.mockResolvedValue(null);
  expect((await wordMeaning(new Request("https://tolk.test"), context())).status).toBe(401);
  expect((await speakWord(request({ text: "father" }))).status).toBe(401);
  deps.reader.mockResolvedValue({ id: "reader-a" });
  deps.version.mockResolvedValue({ ...mockChapterVersion(1), readerId: "reader-b" });
  expect((await wordMeaning(new Request("https://tolk.test"), context())).status).toBe(404);
  expect(deps.define).not.toHaveBeenCalled();
  expect(deps.speak).not.toHaveBeenCalled();
});

test("meaning uses the authorized served sentence and rejects invalid tokens or unfinished content", async () => {
  const response = await wordMeaning(new Request("https://tolk.test"), context());
  expect(await response.json()).toEqual({ meaning: "A father is a male parent.", source: "oci-generative-ai" });
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(deps.define.mock.calls[0].slice(1)).toEqual([5, mockChapter]);
  for (const index of ["-1", "1.5", "", "99999"]) expect((await wordMeaning(new Request("https://tolk.test"), context(index))).status).toBe(400);
  deps.version.mockResolvedValue({ ...mockChapterVersion(1), status: "generating" });
  expect((await wordMeaning(new Request("https://tolk.test"), context())).status).toBe(404);
});

test("pronunciation returns private MP3 bytes and safe errors for invalid input or provider failure", async () => {
  deps.speak.mockResolvedValue(new Uint8Array([0x49, 0x44, 0x33]).buffer);
  const response = await speakWord(request({ text: "father" }));
  expect(response.headers.get("content-type")).toBe("audio/mpeg");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([0x49, 0x44, 0x33]);
  expect((await speakWord(request({ text: "read the entire chapter" }))).status).toBe(400);
  deps.speak.mockRejectedValue(new Error("secret provider request"));
  const failure = await speakWord(request({ text: "father" }));
  expect(failure.status).toBe(502);
  expect(await failure.text()).not.toContain("secret");
});

test("flags use the signed-in Reader and canonical version, ignoring spoofed headers and words", async () => {
  const version = mockChapterVersion(1);
  const saved = { word: "father", chapterVersionId: version.id, tokenIndex: 5, at: "2026-10-17T12:00:00Z" };
  deps.flag.mockResolvedValue(saved);
  const req = request({ word: "spoof", tokenIndex: 5 });
  req.headers.set("x-reader-session", "reader-b");
  expect((await postFlag(req, context())).status).toBe(200);
  expect(deps.flag).toHaveBeenCalledWith("reader-a", version, 5);
  deps.list.mockResolvedValue([saved]);
  expect(await (await getFlags(req, context())).json()).toEqual({ flags: [saved] });
  expect(deps.list).toHaveBeenCalledWith("reader-a", version.id);
  expect(await (await deleteFlag(new Request("https://tolk.test", { method: "DELETE" }), context())).json()).toEqual({ ok: true });
  expect(deps.unflag).toHaveBeenCalledWith("reader-a", version.id, 5);
});

test("cross-origin writes cannot flag or spend speech requests", async () => {
  const req = request({ text: "father", tokenIndex: 5 });
  req.headers.set("origin", "https://elsewhere.test");
  expect((await postFlag(req, context())).status).toBe(403);
  expect((await speakWord(req)).status).toBe(403);
  expect(deps.flag).not.toHaveBeenCalled();
  expect(deps.speak).not.toHaveBeenCalled();
});
