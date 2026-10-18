import { beforeEach, expect, test, vi } from "vitest";
import { mockChapterVersion } from "../mocks";
import { nextChapterPollResponse } from "../reading/result";

const deps = vi.hoisted(() => ({ reader: vi.fn(), version: vi.fn(), generation: vi.fn(), generationVersion: vi.fn() }));
vi.mock("../platform/auth", () => ({ getReader: deps.reader }));
vi.mock("../db", () => ({ getChapterVersion: deps.version }));
vi.mock("../db/generation", () => ({ resolveGeneration: deps.generation, getGenerationVersion: deps.generationVersion }));
import { getVersion } from "./http";

const get = (id = "gatsby-ch1-L1") => getVersion(new Request(`https://tolk.test/api/chapter-versions/${id}`), {
  params: Promise.resolve({ versionId: id }),
});

beforeEach(() => {
  vi.resetAllMocks();
  deps.reader.mockResolvedValue({ id: "reader-a" });
  deps.version.mockResolvedValue(mockChapterVersion(1));
  deps.generation.mockResolvedValue(null);
  deps.generationVersion.mockResolvedValue(null);
});

test("Chapter lookup requires a signed-in Reader and keeps shared content private to the session", async () => {
  deps.reader.mockResolvedValue(null);
  const denied = await get();
  expect(denied.status).toBe(401);
  expect(denied.headers.get("cache-control")).toBe("private, no-store");
  deps.reader.mockResolvedValue({ id: "reader-a" });
  const response = await get();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(mockChapterVersion(1));
  expect(response.headers.get("cache-control")).toBe("private, no-store");
});

test("polling a pending Chapter waits, then returns its real immutable Version without artifact details", async () => {
  deps.version.mockResolvedValue(null);
  const version = { ...mockChapterVersion(1), id: "generated-version", readerId: "reader-a" };
  let ready = false;
  deps.generation.mockImplementation(async (readerId, id) => readerId === "reader-a" && id === "pending-one" ? {
    status: ready ? "ready" : "pending", artifact: ready ? { version, fidelity: { internalEvidence: "not public" } } : null,
  } : null);
  const waiting = await get("pending-one");
  expect(waiting.status).toBe(503);
  expect(waiting.headers.get("retry-after")).toBe("2");
  expect(waiting.headers.get("cache-control")).toBe("private, no-store");
  ready = true;
  const response = await get("pending-one");
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(version);
});

test("private Versions and pending jobs cannot be read through another Reader or spoofed headers", async () => {
  const version = { ...mockChapterVersion(1), readerId: "reader-a" };
  deps.version.mockResolvedValue(version);
  expect((await get()).status).toBe(200);
  deps.reader.mockResolvedValue({ id: "reader-b" });
  expect((await get()).status).toBe(404);
  deps.version.mockResolvedValue(null);
  deps.generation.mockImplementation(async (readerId) => readerId === "reader-a" ? {
    status: "ready", artifact: { version },
  } : null);
  const response = await getVersion(new Request("https://tolk.test", { headers: { "x-reader-session": "reader-a" } }), {
    params: Promise.resolve({ versionId: "pending-one" }),
  });
  expect(response.status).toBe(404);
  expect(await response.json()).toEqual({ error: "Chapter Version not found" });
});

test("an owned failed generation offers explicit retry through the real poll contract", async () => {
  deps.version.mockResolvedValue(null);
  deps.generation.mockImplementation(async (readerId) => readerId === "reader-a" ? {
    status: "failed", artifact: null, failureReason: "private provider diagnostic",
  } : null);
  const failed = { ...mockChapterVersion(1), id: "pending-one", readerId: "reader-a", status: "failed",
    text: "", sentences: [], tokens: [], reinforcedWords: [] };
  deps.generationVersion.mockImplementation(async (readerId, id) => readerId === "reader-a" && id === "pending-one" ? failed : null);
  const response = await get("pending-one");
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(await response.clone().json()).toEqual(failed);
  expect(await nextChapterPollResponse(response)).toBe("retry");
  expect(deps.generationVersion).toHaveBeenCalledWith("reader-a", "pending-one");

  deps.reader.mockResolvedValue({ id: "reader-b" });
  const foreign = await get("pending-one");
  expect(foreign.status).toBe(404);
  expect(await nextChapterPollResponse(foreign)).toBe("stop");
});

test("missing and incomplete artifacts stop polling without revealing internal evidence", async () => {
  deps.version.mockResolvedValue(null);
  for (const generation of [null, { status: "failed", artifact: null }, { status: "ready", artifact: null },
    { status: "ready", artifact: { version: { ...mockChapterVersion(1), readerId: "another-reader" } } },
    { status: "ready", artifact: { version: { ...mockChapterVersion(1), status: "generating" } } }]) {
    deps.generation.mockResolvedValue(generation);
    const response = await get("pending-one");
    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ error: "Chapter Version not found" });
  }
});

test("a Reader can follow their pending link to a shared fallback without changing its ID", async () => {
  const version = { ...mockChapterVersion(1), id: "shared-fallback" };
  deps.version.mockResolvedValue(null);
  deps.generation.mockResolvedValue({ status: "ready", artifact: { version } });
  expect(await (await get("pending-one")).json()).toEqual(version);
});
