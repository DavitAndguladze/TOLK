import { describe, expect, test } from "vitest";
import { createMockTranscriber, getAnswerTranscriber } from "./transcription";

describe("createMockTranscriber", () => {
  test("resolves to the configured reply regardless of input", async () => {
    const transcriber = createMockTranscriber("said this");

    expect(await transcriber.transcribe(new Blob())).toBe("said this");
  });

  test("defaults to a canned reply when none is configured", async () => {
    const transcriber = createMockTranscriber();

    expect(await transcriber.transcribe(new ArrayBuffer(0))).toBeTruthy();
  });
});

describe("getAnswerTranscriber", () => {
  test("defaults to the mock transcriber", async () => {
    const transcriber = getAnswerTranscriber("mock");

    expect(await transcriber.transcribe(new Blob())).toBeTruthy();
  });
});
