import { describe, expect, it } from "vitest";
import { tokenize } from "../mocks/fixtures";
import { alignWords } from "./alignment";

const heard = (text: string) => text.split(/\s+/).map(text => ({ text }));

describe("expected Chapter Version word alignment", () => {
  it("recognizes a fluent Gatsby Chunk with punctuation and case differences", () => {
    const result = alignWords(
      tokenize(["When I was young, my father gave me advice."]),
      heard("when I was young my father gave me advice"),
      { complete: true },
    );
    expect(result.accuracy).toBe(1);
    expect(result.misses).toEqual([]);
    expect(result.wordResults.map(word => word.outcome)).toEqual(Array(9).fill("correct"));
  });

  it("records a substituted word at its Chapter Version token index", () => {
    const tokens = tokenize(["my father gave advice"]).map(token => ({ ...token, index: token.index + 40 }));
    const result = alignWords(tokens, heard("my fadder gave advice"), { complete: true });
    expect(result.wordResults[1]).toMatchObject({ tokenIndex: 41, outcome: "mispronounced", heard: "fadder" });
    expect(result.misses).toEqual([{ word: "father", tokenIndex: 41, kind: "mispronounced" }]);
    expect(result.accuracy).toBe(.75);
  });

  it("marks a skipped word without shifting all later results", () => {
    const result = alignWords(tokenize(["my father gave me advice"]), heard("my father me advice"), { complete: true });
    expect(result.wordResults.map(word => word.outcome)).toEqual(["correct", "correct", "skipped", "correct", "correct"]);
    expect(result.misses).toEqual([{ word: "gave", tokenIndex: 2, kind: "skipped" }]);
    expect(result.accuracy).toBe(.8);
  });

  it.each(["my my father gave advice", "my fadder father gave advice"])("accepts a repetition or self-correction: %s", speech => {
    const result = alignWords(tokenize(["my father gave advice"]), heard(speech), { complete: true });
    expect(result.accuracy).toBe(1);
    expect(result.misses).toEqual([]);
  });

  it("keeps unread words pending during a partial transcript, including unrelated trailing speech", () => {
    const result = alignWords(tokenize(["my father gave me advice"]), heard("my father nearby conversation"), { complete: false });
    expect(result.wordResults.map(word => word.outcome)).toEqual(["correct", "correct", "pending", "pending", "pending"]);
    expect(result.misses).toEqual([]);
    expect(result.accuracy).toBe(.4);
  });

  it("revises the same partial word after a self-correction without retaining the old miss", () => {
    const tokens = tokenize(["my father gave advice"]);
    const partial = alignWords(tokens, heard("my fadder gave"), { complete: false });
    expect(partial.misses).toEqual([{ word: "father", tokenIndex: 1, kind: "mispronounced" }]);
    const revised = alignWords(tokens, heard("my father gave advice"), { complete: true });
    expect(revised.misses).toEqual([]);
    expect(revised.accuracy).toBe(1);
  });

  it("normalizes curly apostrophes without treating contractions as different words", () => {
    const result = alignWords(tokenize(["Don't judge people."]), heard("don’t judge people"), { complete: true });
    expect(result.accuracy).toBe(1);
    expect(result.misses).toEqual([]);
  });

  it("handles curly apostrophes in displayed expected text even when the tokenizer dropped them", () => {
    const result = alignWords(tokenize(["Don’t judge."]), heard("don't judge"), { complete: true });
    expect(result.accuracy).toBe(1);
    expect(result.misses).toEqual([]);
  });

  it("ignores single quotation marks around expected dialogue while retaining internal contractions", () => {
    const result = alignWords(tokenize(["‘Don't judge,’ he said."]), heard("don't judge he said"), { complete: true });
    expect(result.accuracy).toBe(1);
    expect(result.misses).toEqual([]);
  });

  it("retains valid raw word evidence and measures hesitation only within a confirmed clock", () => {
    const result = alignWords(tokenize(["my father gave"]), [
      { text: "my", startMs: 100, endMs: 250, confidence: 97.2, clockId: "utterance-1" },
      { text: "father", startMs: 3550, endMs: 4000, confidence: 96.8, clockId: "utterance-1" },
      { text: "gave", startMs: 50, endMs: 200, confidence: 98, clockId: "utterance-2" },
    ], { complete: true });
    expect(result.wordResults[1]).toMatchObject({ startMs: 3550, endMs: 4000, confidence: 96.8, hesitationMs: 3300 });
    expect(result.wordResults[2].hesitationMs).toBe(0);
    expect(result.accuracy).toBe(1);
  });

  it("does not count extra spoken words as silence before an expected word", () => {
    const result = alignWords(tokenize(["my father"]), [
      { text: "my", startMs: 0, endMs: 100, clockId: "one" },
      { text: "uh", startMs: 100, endMs: 4000, clockId: "one" },
      { text: "father", startMs: 4200, endMs: 4400, clockId: "one" },
    ], { complete: true });
    expect(result.wordResults[1].hesitationMs).toBe(200);
    expect(result.accuracy).toBe(1);
  });

  it.each([
    [{ text: "my", startMs: 0, endMs: 100 }, { text: "father", startMs: 5000, endMs: 5200 }],
    [{ text: "my", startMs: 5000, endMs: 5200, clockId: "same" }, { text: "father", startMs: 0, endMs: 100, clockId: "same" }],
  ])("does not invent a hesitation from unknown or backward clocks", (first, second) => {
    const result = alignWords(tokenize(["my father"]), [first, second], { complete: true });
    expect(result.wordResults[1].hesitationMs).toBe(0);
  });

  it("does not expose invalid timing or nonfinite confidence as word evidence", () => {
    const result = alignWords(tokenize(["father"]), [{ text: "father", startMs: 200, endMs: 100, confidence: NaN }], { complete: true });
    expect(result.wordResults).toEqual([{ tokenIndex: 0, outcome: "correct", heard: "father", hesitationMs: 0 }]);
  });

  it("keeps unfinished words pending until the caller explicitly finishes the Chunk", () => {
    const tokens = tokenize(["my father gave advice"]);
    const partial = alignWords(tokens, heard("my father"), { complete: false });
    expect(partial.wordResults.map(word => word.outcome)).toEqual(["correct", "correct", "pending", "pending"]);
    const complete = alignWords(tokens, heard("my father"), { complete: true });
    expect(complete.misses).toEqual([
      { word: "gave", tokenIndex: 2, kind: "skipped" },
      { word: "advice", tokenIndex: 3, kind: "skipped" },
    ]);
  });

  it("does not score unrelated speech or silence as progress in an ongoing Chunk", () => {
    const tokens = tokenize(["my father gave advice"]);
    for (const words of [[], heard("nearby people talking")]) {
      const result = alignWords(tokens, words, { complete: false });
      expect(result.wordResults.map(word => word.outcome)).toEqual(Array(4).fill("pending"));
      expect(result.misses).toEqual([]);
      expect(result.accuracy).toBe(0);
    }
    expect(alignWords([], [], { complete: true })).toEqual({ wordResults: [], misses: [], accuracy: 0 });
  });

  it("preserves repeated words in the expected text as separate tokens", () => {
    const result = alignWords(tokenize(["very very young"]), heard("very young"), { complete: true });
    expect(result.wordResults.map(word => word.outcome)).toEqual(["correct", "skipped", "correct"]);
    expect(result.misses).toEqual([{ word: "very", tokenIndex: 1, kind: "skipped" }]);
  });
});
