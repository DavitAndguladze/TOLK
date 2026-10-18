import { describe, expect, test } from "vitest";
import type { ListeningEvent, WordOutcome } from "../types";
import { mockChapterVersion } from "../mocks";
import { chunkChapterVersion } from "./chunk";
import { initialReadingState, readingReducer, unreadTokens, type ReadingAction, type ReadingState } from "./session";

const word = (tokenIndex: number, outcome: WordOutcome): ReadingAction => ({
  type: "listening",
  event: { type: "word", result: { tokenIndex, outcome, hesitationMs: 0 } },
});
const run = (state: ReadingState, ...actions: ReadingAction[]) => actions.reduce(readingReducer, state);

describe("readingReducer", () => {
  test("marks each word's outcome as the listening source reports it, leaving the rest pending", () => {
    const state = run(initialReadingState(2), { type: "read-aloud" }, word(0, "correct"), word(1, "mispronounced"), word(2, "skipped"));

    expect(state.status).toBe("listening");
    expect(state.outcomes).toEqual({ 0: "correct", 1: "mispronounced", 2: "skipped" });
    expect(state.outcomes[3]).toBeUndefined();
  });

  test("flags the word the Reader is stuck on until that word is read", () => {
    const hesitation: ReadingAction = { type: "listening", event: { type: "hesitation", tokenIndex: 21, ms: 3200 } };

    const stuck = run(initialReadingState(2), { type: "read-aloud" }, word(20, "correct"), hesitation);
    expect(stuck.stuckOn).toBe(21);

    expect(run(stuck, word(21, "correct")).stuckOn).toBeNull();
  });

  const chunkComplete: ReadingAction = {
    type: "listening",
    event: { type: "chunk-complete", summary: { chapterVersionId: "v", accuracy: 1, wordResults: [], misses: [], startedAt: "", endedAt: "" } },
  };

  test("finishing a chunk moves to the next one and keeps listening", () => {
    const state = run(initialReadingState(3), { type: "read-aloud" }, word(0, "correct"), chunkComplete);

    expect(state).toMatchObject({ chunkIndex: 1, status: "listening", outcomes: { 0: "correct" } });
  });

  test("finishing the last chunk ends the Chapter", () => {
    const state = run(initialReadingState(2), { type: "read-aloud" }, chunkComplete, chunkComplete);

    expect(state).toMatchObject({ chunkIndex: 1, status: "chapter-done" });
  });

  test("pausing keeps the words read so far and ignores events that arrive late", () => {
    const state = run(initialReadingState(2), { type: "read-aloud" }, word(0, "correct"), word(1, "correct"), { type: "pause" }, word(2, "correct"));

    expect(state).toMatchObject({ status: "paused", chunkIndex: 0, outcomes: { 0: "correct", 1: "correct" } });
    expect(state.outcomes[2]).toBeUndefined();
  });

  test("resuming picks up at the first unread word of the chunk", () => {
    const [first] = chunkChapterVersion(mockChapterVersion(1));
    const paused = run(initialReadingState(2), { type: "read-aloud" }, word(0, "correct"), word(1, "skipped"), { type: "pause" });

    const resumed = run(paused, { type: "read-aloud" });

    expect(resumed.status).toBe("listening");
    expect(unreadTokens(first, resumed).map((t) => t.index)).toEqual(first.tokens.slice(2).map((t) => t.index));
  });

  test("moving to another chunk while paused shows it ready to read and keeps what was read", () => {
    const paused = run(initialReadingState(3), { type: "read-aloud" }, word(0, "correct"), { type: "pause" });

    const moved = run(paused, { type: "go-to-chunk", index: 1 });

    expect(moved).toMatchObject({ chunkIndex: 1, status: "ready", outcomes: { 0: "correct" } });
  });

  test("a listening error pauses the session so the Reader can resume", () => {
    const failed = run(initialReadingState(2), { type: "read-aloud" }, word(0, "correct"), {
      type: "listening",
      event: { type: "error", message: "network lost" },
    });

    expect(failed).toMatchObject({ status: "paused", outcomes: { 0: "correct" } });
  });
});
