import { afterEach, expect, test, vi } from "vitest";
import { getAnswerTranscriber } from "./transcription";

// Fake browser/network boundaries; exercise the real answer adapter and OCI transport together.
class Socket {
  static latest: Socket | undefined;
  readyState = 1;
  bufferedAmount = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  constructor(readonly url: string) {
    Socket.latest = this;
    queueMicrotask(() => { this.onopen?.(); this.message({ event: "CONNECT" }); });
  }
  send() {}
  close() { this.readyState = 3; this.onclose?.(); }
  message(data: unknown) { this.onmessage?.({ data: JSON.stringify(data) }); }
  say(text: string, isFinal: boolean) {
    this.message({ event: "RESULT", transcriptions: [{ isFinal, tokens: text.split(" ").filter(Boolean).map(token => ({ token, type: "WORD" })) }] });
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
  port = { onmessage: null, close() {} };
  connect() {}
  disconnect() {}
}
const track = { stop: vi.fn() };
function install() {
  Socket.latest = undefined;
  vi.stubGlobal("WebSocket", Socket);
  vi.stubGlobal("AudioContext", Context);
  vi.stubGlobal("AudioWorkletNode", Worklet);
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [track] }) } });
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    token: "test-session-token", region: "us-chicago-1", compartmentId: "test-compartment", expiresAt: "2099-01-01T00:00:00Z",
  }))));
}
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.clearAllMocks(); vi.useRealTimers(); });

async function connected() {
  await vi.waitFor(() => expect(Socket.latest).toBeDefined());
  return Socket.latest!;
}

test("OCI answer waits for corrected final words and releases capture after one utterance", async () => {
  install();
  vi.stubEnv("NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE", "oci-realtime");
  const result = getAnswerTranscriber().transcribe();
  let resolved = false;
  void result.then(() => { resolved = true; });
  const socket = await connected();
  socket.say("Gatsby wanted a dog", false);
  await Promise.resolve();
  expect(resolved).toBe(false);
  socket.say("Gatsby wanted to see Daisy again", true);
  expect(await result).toBe("Gatsby wanted to see Daisy again");
  expect(track.stop).toHaveBeenCalledOnce();
  expect(Context.latest.closed).toBe(true);
  expect(socket.readyState).toBe(3);
});

test.each([401, 429, 503])("OCI token HTTP %s fails without a fabricated transcript and closes audio", async status => {
  install();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status })));
  await expect(getAnswerTranscriber("oci-realtime").transcribe()).rejects.toThrow();
  expect(Context.latest.closed).toBe(true);
  expect(Socket.latest).toBeUndefined();
});

test("a dropped OCI connection rejects and releases the active microphone", async () => {
  install();
  const result = getAnswerTranscriber("oci-realtime").transcribe();
  const rejected = expect(result).rejects.toThrow("connection failed");
  const socket = await connected();
  socket.onerror?.();
  await rejected;
  expect(track.stop).toHaveBeenCalledOnce();
  expect(Context.latest.closed).toBe(true);
  expect(socket.readyState).toBe(3);
});

test("cancelling an OCI answer rejects even after provisional text and ignores late results", async () => {
  install();
  const controller = new AbortController();
  const result = getAnswerTranscriber("oci-realtime").transcribe(undefined, controller.signal);
  const rejected = expect(result).rejects.toMatchObject({ name: "AbortError" });
  const socket = await connected();
  socket.say("provisional answer", false);
  controller.abort();
  socket.say("late final answer", true);
  await rejected;
  expect(track.stop).toHaveBeenCalledOnce();
  expect(Context.latest.closed).toBe(true);
});

test("an already cancelled answer starts no audio, token request or socket", async () => {
  install();
  const controller = new AbortController();
  controller.abort();
  await expect(getAnswerTranscriber("oci-realtime").transcribe(undefined, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  expect(fetch).not.toHaveBeenCalled();
  expect(Socket.latest).toBeUndefined();
});

test("connected silence or partial-only speech times out instead of accepting an unfinished answer", async () => {
  install();
  vi.useFakeTimers();
  const result = getAnswerTranscriber("oci-realtime").transcribe();
  const rejected = expect(result).rejects.toThrow("No completed answer heard");
  const socket = await connected();
  socket.say("", true);
  socket.say("unfinished answer", false);
  await vi.advanceTimersByTimeAsync(30000);
  await rejected;
  expect(track.stop).toHaveBeenCalledOnce();
  expect(Context.latest.closed).toBe(true);
  expect(socket.readyState).toBe(3);
});

test("a microphone granted after cancellation is immediately released", async () => {
  install();
  let grant!: (stream: { getTracks: () => Array<typeof track> }) => void;
  const permission = new Promise<{ getTracks: () => Array<typeof track> }>(resolve => { grant = resolve; });
  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia: () => permission } });
  const controller = new AbortController();
  const result = getAnswerTranscriber("oci-realtime").transcribe(undefined, controller.signal);
  const rejected = expect(result).rejects.toMatchObject({ name: "AbortError" });
  await connected();
  controller.abort();
  grant({ getTracks: () => [track] });
  await rejected;
  await Promise.resolve();
  expect(track.stop).toHaveBeenCalledOnce();
  expect(Context.latest.closed).toBe(true);
});
