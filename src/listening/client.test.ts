import { afterEach, expect, test, vi } from "vitest";
import type { ListeningEvent, Token } from "../types";
import { createListeningSource } from "./client";

class BrowserRecognition {
  static latest: BrowserRecognition;
  aborted = false;
  continuous = false;
  interimResults = false;
  lang = "";
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onresult: ((event: { results: Array<{ isFinal: boolean; 0: { transcript: string; confidence: number } }> }) => void) | null = null;
  constructor() { BrowserRecognition.latest = this; }
  start() { queueMicrotask(() => this.onstart?.()); }
  abort() { this.aborted = true; this.onend?.(); }
  say(...utterances: Array<[string, boolean]>) {
    this.onresult?.({ results: utterances.map(([transcript, isFinal]) => ({ isFinal, 0: { transcript, confidence: 0.9 } })) });
  }
}
const chunk = { chapterVersionId: "gatsby-ch1-L1", tokens: ["my", "father", "gave", "advice"].map((text, index) => ({ index: index + 20, text, normalized: text, sentenceIndex: 0 }) satisfies Token) };
afterEach(() => vi.unstubAllGlobals());

test("live partial revisions replace previous words and Pause leaves unread words pending", async () => {
  vi.stubGlobal("SpeechRecognition", BrowserRecognition);
  const source = createListeningSource({ engine: "web-speech" });
  const events: ListeningEvent[] = [];
  await source.start(chunk, event => events.push(event));
  BrowserRecognition.latest.say(["my mother gave", false]);
  BrowserRecognition.latest.say(["my father", false]);
  const summary = await source.stop();
  expect(summary.wordResults.map(word => [word.tokenIndex, word.outcome])).toEqual([
    [20, "correct"], [21, "correct"], [22, "pending"], [23, "pending"],
  ]);
  expect(summary.accuracy).toBe(0.5);
  expect(events).toContainEqual({ type: "word", result: { tokenIndex: 22, outcome: "pending", hesitationMs: 0 } });
  expect(events.some(event => event.type === "chunk-complete")).toBe(false);
});

test("Stop cancels a Start in the same turn rather than opening a late microphone", async () => {
  vi.stubGlobal("SpeechRecognition", BrowserRecognition);
  const source = createListeningSource({ engine: "web-speech" });
  const starting = source.start(chunk, () => {});
  await source.stop();
  await starting;
  expect(BrowserRecognition.latest.aborted).toBe(true);
});

test("finalized utterances accumulate without advancing until the Chunk's final word is confirmed", async () => {
  vi.stubGlobal("SpeechRecognition", BrowserRecognition);
  const source = createListeningSource({ engine: "web-speech" });
  const events: ListeningEvent[] = [];
  await source.start(chunk, event => events.push(event));
  BrowserRecognition.latest.say(["my father", true]);
  expect(events.some(event => event.type === "chunk-complete")).toBe(false);
  BrowserRecognition.latest.say(["my father", true], ["gave advice", false]);
  expect(events.some(event => event.type === "chunk-complete")).toBe(false);
  BrowserRecognition.latest.say(["my father", true], ["gave advice", true]);
  const completed = events.filter(event => event.type === "chunk-complete");
  expect(completed).toHaveLength(1);
  expect(completed[0].summary.accuracy).toBe(1);
  expect(BrowserRecognition.latest.aborted).toBe(true);
  expect(await source.stop()).toEqual(completed[0].summary);
});

test("microphone failure before readiness rejects Start so the Reader can retry", async () => {
  vi.stubGlobal("SpeechRecognition", class extends BrowserRecognition {
    start() { queueMicrotask(() => this.onerror?.()); }
  });
  const source = createListeningSource({ engine: "web-speech" });
  await expect(source.start(chunk, () => {})).rejects.toThrow("Browser listening failed");
  expect(BrowserRecognition.latest.aborted).toBe(true);
});

test("a new Chunk cancels the old session and ignores its late results", async () => {
  vi.stubGlobal("SpeechRecognition", BrowserRecognition);
  const source = createListeningSource({ engine: "web-speech" });
  const oldEvents: ListeningEvent[] = [], newEvents: ListeningEvent[] = [];
  await source.start(chunk, event => oldEvents.push(event));
  const old = BrowserRecognition.latest;
  const late = old.onresult;
  await source.start({ ...chunk, chapterVersionId: "next-version" }, event => newEvents.push(event));
  late?.({ results: [{ isFinal: true, 0: { transcript: "my father gave advice", confidence: 1 } }] });
  expect(old.aborted).toBe(true);
  expect(oldEvents).toEqual([]);
  expect(newEvents).toEqual([]);
  expect((await source.stop()).chapterVersionId).toBe("next-version");
});

test("an empty Chunk does not start a microphone", async () => {
  vi.stubGlobal("SpeechRecognition", BrowserRecognition);
  const source = createListeningSource({ engine: "web-speech" });
  await expect(source.start({ ...chunk, tokens: [] }, () => {})).rejects.toThrow("empty Chunk");
});

test("Stop from a word callback prevents later events and automatic completion", async () => {
  vi.stubGlobal("SpeechRecognition", BrowserRecognition);
  const source = createListeningSource({ engine: "web-speech" });
  const events: ListeningEvent[] = [];
  await source.start(chunk, event => { events.push(event); if (event.type === "word") void source.stop(); });
  BrowserRecognition.latest.say(["my father gave advice", true]);
  expect(events.map(event => event.type)).toEqual(["word"]);
});
