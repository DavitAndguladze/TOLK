import { describe, expect, it } from "vitest";
import { tokenize } from "../mocks/fixtures";
import type { ReadAloudSummary, WordResult } from "../types";
import { mergeReadAloudSummaries, ReadAloudValidationError, validateReadAloudSummary } from "./summary";

const version = { id: "gatsby-ch1-L1", tokens: tokenize(["my father gave advice"]).map(token => ({ ...token, index: token.index + 40 })) };
const part = (wordResults: WordResult[], startedAt = "2026-10-17T20:00:00Z", endedAt = "2026-10-17T20:01:00Z"): ReadAloudSummary => ({
  chapterVersionId: version.id, wordResults, startedAt, endedAt,
  accuracy: 999, misses: [{ word: "untrusted", tokenIndex: 999, kind: "skipped" }],
});

describe("Chapter read-aloud summaries", () => {
  it("merges Chunk results in version order and derives accuracy and misses from word outcomes", () => {
    const summary = mergeReadAloudSummaries(version, [
      part([{ tokenIndex: 40, outcome: "correct", hesitationMs: 0 }, { tokenIndex: 41, outcome: "mispronounced", heard: "fadder", hesitationMs: 0 }]),
      part([{ tokenIndex: 42, outcome: "correct", hesitationMs: 0 }, { tokenIndex: 43, outcome: "skipped", hesitationMs: 0 }], "2026-10-17T20:02:00Z", "2026-10-17T20:03:00Z"),
    ]);
    expect(summary).toMatchObject({
      chapterVersionId: version.id, accuracy: .5,
      startedAt: "2026-10-17T20:00:00.000Z", endedAt: "2026-10-17T20:03:00.000Z",
      misses: [{ word: "father", tokenIndex: 41, kind: "mispronounced" }, { word: "advice", tokenIndex: 43, kind: "skipped" }],
    });
    expect(summary?.wordResults.map(word => word.tokenIndex)).toEqual([40, 41, 42, 43]);
  });

  it("replaces earlier outcomes on correction without double-counting a token", () => {
    const summary = mergeReadAloudSummaries(version, [
      part([{ tokenIndex: 41, outcome: "mispronounced", heard: "fadder", hesitationMs: 0 }]),
      part([{ tokenIndex: 41, outcome: "correct", heard: "father", hesitationMs: 0 }]),
    ]);
    expect(summary?.accuracy).toBe(.25);
    expect(summary?.misses).toEqual([]);
    expect(summary?.wordResults[1]).toMatchObject({ outcome: "correct", heard: "father" });
    expect(summary?.wordResults[2].outcome).toBe("pending");
  });

  it("keeps silent reading and failed starts without scored words as no summary", () => {
    expect(mergeReadAloudSummaries(version, [])).toBeNull();
    expect(mergeReadAloudSummaries(version, [part([]), part([{ tokenIndex: 40, outcome: "pending", hesitationMs: 0 }])])).toBeNull();
  });

  it("validates a submitted summary against server tokens and strips unrecognized fields", () => {
    const summary = validateReadAloudSummary(version, {
      ...part([{ tokenIndex: 40, outcome: "correct", hesitationMs: 0, heard: "my", deviceId: "do-not-store" } as WordResult]),
      audio: "do-not-store",
    });
    expect(summary.accuracy).toBe(.25);
    expect(summary.misses).toEqual([]);
    expect(summary.wordResults[0]).toEqual({ tokenIndex: 40, outcome: "correct", hesitationMs: 0, heard: "my" });
    expect(summary).not.toHaveProperty("audio");
  });

  it("rejects the wrong Chapter Version, unknown tokens, and duplicate token results", () => {
    const valid = part([{ tokenIndex: 40, outcome: "correct", hesitationMs: 0 }]);
    for (const input of [
      { ...valid, chapterVersionId: "another-reader-version" },
      { ...valid, wordResults: [{ tokenIndex: 999, outcome: "correct", hesitationMs: 0 }] },
      { ...valid, wordResults: [...valid.wordResults, ...valid.wordResults] },
    ]) expect(() => validateReadAloudSummary(version, input)).toThrow(ReadAloudValidationError);
  });

  it.each([null, [], {}, { wordResults: "bad" }, part([null as unknown as WordResult]), part([{ tokenIndex: 40, outcome: "invented", hesitationMs: 0 } as unknown as WordResult])])("rejects malformed request bodies through its public validation error", input => {
    expect(() => validateReadAloudSummary(version, input)).toThrow(ReadAloudValidationError);
  });

  it.each([
    { startMs: -1, endMs: 100 }, { startMs: 200, endMs: 100 }, { startMs: 0 }, { endMs: 100 },
    { startMs: Infinity, endMs: 100 }, { confidence: NaN }, { hesitationMs: -1 }, { hesitationMs: Infinity }, { heard: 123 },
  ])("rejects invalid word timing and evidence", evidence => {
    const input = part([{ tokenIndex: 40, outcome: "correct", hesitationMs: 0, ...evidence } as WordResult]);
    expect(() => validateReadAloudSummary(version, input)).toThrow(ReadAloudValidationError);
  });

  it.each([
    ["not-a-date", "2026-10-17T20:01:00Z"],
    ["2026-10-17T20:00:00", "2026-10-17T20:01:00Z"],
    ["2026-10-17T20:02:00Z", "2026-10-17T20:01:00Z"],
  ])("rejects invalid, ambiguous, or reversed session times", (startedAt, endedAt) => {
    expect(() => validateReadAloudSummary(version, part([{ tokenIndex: 40, outcome: "correct", hesitationMs: 0 }], startedAt, endedAt))).toThrow(ReadAloudValidationError);
  });

  it("preserves valid word evidence and normalizes explicit timezone offsets", () => {
    const summary = validateReadAloudSummary(version, part([
      { tokenIndex: 40, outcome: "correct", heard: "my", hesitationMs: 3200, startMs: 3500, endMs: 3600, confidence: 97.4 },
    ], "2026-10-17T15:00:00-05:00", "2026-10-17T15:01:00-05:00"));
    expect(summary.startedAt).toBe("2026-10-17T20:00:00.000Z");
    expect(summary.wordResults[0]).toEqual({ tokenIndex: 40, outcome: "correct", heard: "my", hesitationMs: 3200, startMs: 3500, endMs: 3600, confidence: 97.4 });
  });

  it("does not let an empty failed restart overwrite earlier scored words", () => {
    const summary = mergeReadAloudSummaries(version, [
      part([{ tokenIndex: 40, outcome: "correct", hesitationMs: 0 }]),
      part([{ tokenIndex: 40, outcome: "pending", hesitationMs: 0 }], "2026-10-17T20:02:00Z", "2026-10-17T20:03:00Z"),
    ]);
    expect(summary?.accuracy).toBe(.25);
    expect(summary?.wordResults[0].outcome).toBe("correct");
    expect(summary?.endedAt).toBe("2026-10-17T20:01:00.000Z");
  });

  it("rejects an empty submitted summary instead of storing a zero-accuracy attempt", () => {
    expect(() => validateReadAloudSummary(version, part([]))).toThrow(ReadAloudValidationError);
  });

  it.each(["2026-02-31T20:00:00Z", "2025-02-29T20:00:00-05:00", "2026-04-31T20:00:00Z", "2026-10-17T24:00:00Z"])("rejects impossible local calendar components before timezone normalization: %s", startedAt => {
    expect(() => validateReadAloudSummary(version, part([{ tokenIndex: 40, outcome: "correct", hesitationMs: 0 }], startedAt, "2026-12-01T20:00:00Z"))).toThrow(ReadAloudValidationError);
  });

  it("accepts a real leap day with a timezone offset crossing a UTC date boundary", () => {
    const summary = validateReadAloudSummary(version, part([{ tokenIndex: 40, outcome: "correct", hesitationMs: 0 }], "2024-02-29T00:30:00+01:00", "2024-02-29T01:30:00+01:00"));
    expect(summary.startedAt).toBe("2024-02-28T23:30:00.000Z");
    expect(summary.endedAt).toBe("2024-02-29T00:30:00.000Z");
  });
});
