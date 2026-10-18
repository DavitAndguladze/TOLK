import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { mockChapterVersion } from "../mocks";

const deps = vi.hoisted(() => ({
  reader: vi.fn(), version: vi.fn(), complete: vi.fn(), loadCheck: vi.fn(), grade: vi.fn(),
  saveReading: vi.fn(), savedInput: vi.fn(), generate: vi.fn(), after: vi.fn(),
}));
vi.mock("@/platform/auth", () => ({ getReader: deps.reader, readerIdFor: vi.fn() }));
vi.mock("@/db", () => ({ getChapterVersion: deps.version, db: () => ({}) }));
vi.mock("@/comprehension/complete-chapter", () => ({
  completeChapter: deps.complete, generateCompletedChapter: deps.generate,
  getSavedGenerationInput: deps.savedInput, promotePendingProgress: vi.fn(),
  CompletionError: class extends Error {},
}));
vi.mock("@/comprehension/grade-on-check", () => ({ loadCheckForReader: deps.loadCheck, gradeAnswerOnCheck: deps.grade }));
vi.mock("@/platform/registry", () => ({ readAloudStore: { save: deps.saveReading } }));
vi.mock("../leveling/runtime", () => ({ runGeneration: deps.generate }));
vi.mock("next/server", async (original) => ({ ...await original<typeof import("next/server")>(), after: deps.after }));

import { POST as answers } from "../app/api/checks/[checkId]/answers/route";
import { POST as grade } from "../app/api/checks/[checkId]/questions/[questionId]/grade/route";
import { POST as readAloud } from "../app/api/chapter-versions/[versionId]/read-aloud/route";
import { retryVersion } from "../leveling/retry-http";

const handlers = [
  ["answers", (req: Request) => answers(req, { params: Promise.resolve({ checkId: "check-one" }) }), 200],
  ["grade", (req: Request) => grade(req, { params: Promise.resolve({ checkId: "check-one", questionId: "q-one" }) }), 200],
  ["read-aloud", (req: Request) => readAloud(req, { params: Promise.resolve({ versionId: "gatsby-ch1-L1" }) }), 200],
  ["retry", (req: Request) => retryVersion(req, { params: Promise.resolve({ versionId: "pending-one" }) }), 404],
] as const;
const request = (origin: string | null = "https://tolk.test", url = "http://0.0.0.0:3000/api/test") => new Request(url, {
  method: "POST", headers: { ...(origin === null ? {} : { origin }), "Content-Type": "application/json" },
  body: JSON.stringify({ chapterVersionId: "gatsby-ch1-L1", startedAt: "2026-10-18T12:00:00Z", endedAt: "2026-10-18T12:01:00Z",
    wordResults: [{ tokenIndex: 0, outcome: "correct", hesitationMs: 0 }] }),
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("DATABASE_URL", "");
  vi.stubEnv("LOCAL_DATABASE_URL", "configured");
  vi.stubEnv("BETTER_AUTH_URL", "https://tolk.test");
  deps.reader.mockResolvedValue({ id: "reader-a" });
  deps.version.mockResolvedValue(mockChapterVersion(1));
  deps.complete.mockResolvedValue({ nextVersionId: null });
  deps.loadCheck.mockResolvedValue({});
  deps.grade.mockResolvedValue({ grade: 2 });
  deps.savedInput.mockResolvedValue(null);
});
afterEach(() => vi.unstubAllEnvs());

test.each(handlers)("%s denies malformed public origin configuration without writes or grading", async (_name, handle) => {
  vi.stubEnv("BETTER_AUTH_URL", "invalid");
  const response = await handle(request());
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: "Invalid request origin" });
  for (const effect of [deps.complete, deps.loadCheck, deps.grade, deps.saveReading, deps.savedInput, deps.generate, deps.after]) {
    expect(effect).not.toHaveBeenCalled();
  }
});

test.each(handlers)("%s authenticates before checking the configured origin", async (_name, handle) => {
  deps.reader.mockResolvedValue(null);
  vi.stubEnv("BETTER_AUTH_URL", "invalid");
  expect((await handle(request())).status).toBe(401);
});

test.each(handlers)("%s rejects cross-origin writes despite forged proxy headers", async (_name, handle) => {
  const req = request("https://elsewhere.test");
  req.headers.set("x-forwarded-host", "elsewhere.test");
  expect((await handle(req)).status).toBe(403);
  for (const effect of [deps.complete, deps.grade, deps.saveReading, deps.savedInput, deps.generate]) expect(effect).not.toHaveBeenCalled();
});

test.each(handlers)("%s allows Caddy's public origin and preserves missing-Origin compatibility", async (_name, handle, allowedStatus) => {
  expect((await handle(request())).status).toBe(allowedStatus);
  vi.stubEnv("BETTER_AUTH_URL", "invalid");
  expect((await handle(request(null))).status).toBe(allowedStatus);
  vi.stubEnv("BETTER_AUTH_URL", "");
  expect((await handle(request("https://tolk.test", "https://tolk.test/api/test"))).status).toBe(allowedStatus);
});

test("retry retains its cross-site Fetch Metadata rejection without Origin", async () => {
  const req = request(null);
  req.headers.set("sec-fetch-site", "cross-site");
  expect((await retryVersion(req, { params: Promise.resolve({ versionId: "pending-one" }) })).status).toBe(403);
  expect(deps.savedInput).not.toHaveBeenCalled();
  expect(deps.generate).not.toHaveBeenCalled();
});
