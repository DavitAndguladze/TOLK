import { afterEach, expect, test, vi } from "vitest";
import type { ListeningEvent, Token } from "../types";
import { createListeningSource } from "./client";

// Fakes only replace browser/network interfaces, never Listening/alignment modules.
class Socket {
  static latest: Socket;
  readyState = 1;
  bufferedAmount = 0;
  sent: unknown[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  constructor(readonly url: string) {
    Socket.latest = this;
    queueMicrotask(() => { this.onopen?.(); this.message({ event: "CONNECT" }); });
  }
  send(data: unknown) { this.sent.push(data); }
  close() { this.readyState = 3; this.onclose?.(); }
  message(data: unknown) { this.onmessage?.({ data: JSON.stringify(data) }); }
  say(text: string, isFinal: boolean) {
    this.message({ event: "RESULT", transcriptions: [{ isFinal, tokens: text.split(" ").map((token, index) => ({
      token, type: "WORD", startTimeInMs: index * 100, endTimeInMs: index * 100 + 90, confidence: 97,
    })) }] });
  }
}
class Context {
  static latest: Context;
  sampleRate = 16000;
  closed = false;
  destination = {};
  audioWorklet = { addModule: async () => {} };
  constructor() { Context.latest = this; }
  resume() { return Promise.resolve(); }
  close() { this.closed = true; return Promise.resolve(); }
  createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
}
class Worklet {
  static latest: Worklet;
  port: { onmessage: ((event: { data: ArrayBuffer }) => void) | null; close: () => void } = { onmessage: null, close() {} };
  onprocessorerror: (() => void) | null = null;
  constructor() { Worklet.latest = this; }
  connect() {}
  disconnect() {}
}
const track = { stop: vi.fn() };
const chunk = { chapterVersionId: "gatsby", tokens: ["my", "father", "gave", "advice"].map((text, index) => ({ index: index + 20, text, normalized: text, sentenceIndex: 0 }) satisfies Token) };
function install() {
  vi.stubGlobal("WebSocket", Socket);
  vi.stubGlobal("AudioContext", Context);
  vi.stubGlobal("AudioWorkletNode", Worklet);
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [track] }) } });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    token: "test-session-token", region: "us-chicago-1", compartmentId: "test-compartment", expiresAt: "2099-01-01T00:00:00Z",
  }))));
}
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); vi.useRealTimers(); });

test("OCI streams PCM and aligns partial/final utterances through the same ListeningSource", async () => {
  install();
  const source = createListeningSource({ engine: "oci-realtime" });
  const events: ListeningEvent[] = [];
  await source.start(chunk, event => events.push(event));
  Worklet.latest.port.onmessage?.({ data: new ArrayBuffer(2048) });
  expect(Socket.latest.sent.some(value => value instanceof ArrayBuffer)).toBe(true);
  expect(Socket.latest.url).toContain("wss://realtime.aiservice.us-chicago-1.oci.oraclecloud.com/");
  expect(Socket.latest.url).not.toContain("test-session-token");
  Socket.latest.say("my mother", false);
  Socket.latest.say("my father", true);
  expect(events.some(event => event.type === "chunk-complete")).toBe(false);
  Socket.latest.say("gave advice", true);
  const summary = await source.stop();
  expect(summary.accuracy).toBe(1);
  expect(summary.wordResults.map(word => word.heard)).toEqual(["my", "father", "gave", "advice"]);
  expect(summary.wordResults.map(word => word.hesitationMs)).toEqual([0, 0, 0, 0]);
  expect(events.filter(event => event.type === "chunk-complete")).toHaveLength(1);
  expect(track.stop).toHaveBeenCalled();
  expect(Context.latest.closed).toBe(true);
});

test("a late microphone permission grant after Stop releases the track without resuming capture", async () => {
  install();
  let grant!: (stream: { getTracks: () => Array<typeof track> }) => void;
  const permission = new Promise<{ getTracks: () => Array<typeof track> }>(resolve => { grant = resolve; });
  const getUserMedia = vi.fn(() => permission);
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
  const source = createListeningSource({ engine: "oci-realtime" });
  const events: ListeningEvent[] = [];
  const starting = source.start(chunk, event => events.push(event));
  await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalled());
  await source.stop();
  await starting;
  grant({ getTracks: () => [track] });
  await vi.waitFor(() => expect(track.stop).toHaveBeenCalled());
  expect(Socket.latest.readyState).toBe(3);
  expect(events).toEqual([]);
});

test("a runtime OCI error stops capture and emits a safe message without server details", async () => {
  install();
  const source = createListeningSource({ engine: "oci-realtime" });
  const events: ListeningEvent[] = [];
  await source.start(chunk, event => events.push(event));
  Socket.latest.say("my father", false);
  Socket.latest.message({ event: "ERROR", message: "private server details and test-session-token" });
  expect(events.filter(event => event.type === "error")).toEqual([
    { type: "error", message: "OCI rejected the listening session. Check Speech configuration and retry." },
  ]);
  expect(Socket.latest.readyState).toBe(3);
  expect(track.stop).toHaveBeenCalled();
  expect((await source.stop()).accuracy).toBe(0.5);
});

test("a failed OCI token request rejects Start without silently using browser speech", async () => {
  install();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("private server response", { status: 503 })));
  const source = createListeningSource({ engine: "oci-realtime" });
  await expect(source.start(chunk, () => {})).rejects.toThrow("could not get a session token");
  expect(Context.latest.closed).toBe(true);
});

test("an expired Reader sign-in explains recovery and does not request the microphone", async () => {
  install();
  const microphone = vi.fn();
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: microphone } });
  vi.stubGlobal("fetch", vi.fn(async () => new Response("private response", { status: 401 })));
  const source = createListeningSource({ engine: "oci-realtime" });
  await expect(source.start(chunk, () => {})).rejects.toThrow("Sign in again to read aloud");
  expect(microphone).not.toHaveBeenCalled();
  expect(Context.latest.closed).toBe(true);
});

test("a speech quota limit explains the wait and keeps the microphone off", async () => {
  install();
  const microphone = vi.fn();
  const socket = vi.fn();
  const fetchToken = vi.fn(async () => new Response("private response", { status: 429, headers: { "Retry-After": "45" } }));
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: microphone } });
  vi.stubGlobal("fetch", fetchToken);
  vi.stubGlobal("WebSocket", socket);
  const source = createListeningSource({ engine: "oci-realtime" });
  await expect(source.start(chunk, () => {})).rejects.toThrow("Try again in 45 seconds, or keep reading silently");
  expect(fetchToken).toHaveBeenCalledTimes(1);
  expect(microphone).not.toHaveBeenCalled();
  expect(socket).not.toHaveBeenCalled();
  expect(Context.latest.closed).toBe(true);
});

test("a quota response without a usable delay offers a safe manual retry", async () => {
  install();
  vi.stubGlobal("fetch", vi.fn(async () => new Response("private details", { status: 429, headers: { "Retry-After": "not-a-delay" } })));
  const source = createListeningSource({ engine: "oci-realtime" });
  await expect(source.start(chunk, () => {})).rejects.toThrow("Wait a moment and try again, or keep reading silently");
  expect(Context.latest.closed).toBe(true);
});

test("denied microphone permission releases OCI resources and the same source can retry", async () => {
  install();
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => { throw new DOMException("Not allowed", "NotAllowedError"); } } });
  const source = createListeningSource({ engine: "oci-realtime" });
  await expect(source.start(chunk, () => {})).rejects.toThrow("Check permission and retry");
  expect(Context.latest.closed).toBe(true);
  expect(Socket.latest.readyState).toBe(3);
  install();
  const events: ListeningEvent[] = [];
  await source.start(chunk, event => events.push(event));
  expect(events).toEqual([]); // A connected but silent microphone earns no word results.
  const summary = await source.stop();
  expect(summary.wordResults.map(word => word.outcome)).toEqual(["pending", "pending", "pending", "pending"]);
  expect(summary.misses).toEqual([]);
  expect(track.stop).toHaveBeenCalled();
});
