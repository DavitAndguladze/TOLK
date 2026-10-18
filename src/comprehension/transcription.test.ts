import { afterEach, describe, expect, test, vi } from "vitest";
import { createMockTranscriber, getAnswerTranscriber } from "./transcription";

afterEach(() => { vi.unstubAllGlobals(); });

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

test("leaving a spoken answer stops browser fallback capture and rejects late results", async () => {
  const abort = vi.fn();
  let recognition!: { onresult: ((event: { results: Array<Array<{ transcript: string }>> }) => void) | null };
  vi.stubGlobal("window", { SpeechRecognition: class {
    continuous = false;
    interimResults = false;
    onresult = null;
    onerror = null;
    onend = null;
    abort = abort;
    constructor() { recognition = this; }
    start() {}
  } });
  const controller = new AbortController();
  const result = getAnswerTranscriber("web-speech").transcribe(undefined, controller.signal);
  const rejected = expect(result).rejects.toMatchObject({ name: "AbortError" });
  controller.abort();
  recognition.onresult?.({ results: [[{ transcript: "late answer" }]] });
  await rejected;
  expect(abort).toHaveBeenCalledOnce();
});
