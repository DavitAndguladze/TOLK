import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Exercise the page's real handlers with only browser and OCI boundaries replaced.
function page() {
  const elements = new Map();
  const document = { querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, {
      textContent: "", disabled: false, replaceChildren() {},
      insertRow() { return { insertCell() { return {}; } }; },
    });
    return elements.get(selector);
  } };
  const sessions = [];
  const states = { RUNNING: 1, ERROR: 4 };
  class SDK {
    constructor(listener) { this.listener = listener; sessions.push(this); }
    setWebSocketState = state => { this.state = state; };
    connect() {}
    close() { this.closed = true; }
    grantMicrophone(state) {
      this.track = { readyState: "live", stop() { this.readyState = "ended"; } };
      this.mediaStream = { getTracks: () => [this.track] };
      this.audioStreamer = { config: { callBack() {} }, audioContext: {
        state: "running", close() { this.state = "closed"; return Promise.resolve(); },
      } };
      this.setWebSocketState(state);
    }
  }
  let clock = 1000;
  const source = ts.transpileModule(readFileSync(new URL("main.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, {
    exports: {}, document, AbortController, queueMicrotask, performance: { now: () => clock },
    navigator: { userAgent: "test", mediaDevices: { getUserMedia() {} } },
    window: { isSecureContext: true, addEventListener() {} },
    fetch: async () => ({ ok: true, json: async () => ({ token: "test", compartmentId: "test", region: "us-ashburn-1" }) }),
    require: name => name.includes("mocks") ? { mockChapterVersion: () => ({ id: "mock", text: "Read this." }) }
      : { AIServiceSpeechRealtimeApi: SDK, RealtimeWebSocketState: states,
        RealtimeParametersModelDomainEnum: { GENERIC: "GENERIC" },
        RealtimeParametersStabilizePartialResultsEnum: { NONE: "NONE" } },
  });
  return { elements, sessions, states, setClock(value) { clock = value; },
    start: () => elements.get("#start").onclick(), stop: () => elements.get("#stop").onclick(),
    evidence: () => JSON.parse(elements.get("#evidence").textContent) };
}

test("final delay uses its own callback clock and retains first partial delay", async () => {
  const p = page();
  await p.start();
  const session = p.sessions[0];
  session.grantMicrophone(p.states.RUNNING);
  session.audioStreamer.config.callBack({ size: 2048 });
  const word = { type: "WORD", token: "read", startTimeInMs: 0, endTimeInMs: 100, confidence: .9 };
  const emit = isFinal => session.listener.onResult({ transcriptions: [{ isFinal, transcription: "read", tokens: [word] }] });
  p.setClock(1200);
  emit(false);
  p.setClock(2200);
  emit(true);
  const [partial, final] = p.evidence().filter(event => event.event === "word");
  assert.equal(partial.delayEstimateMs, 164);
  assert.equal(final.delayEstimateMs, 1164);
  assert.equal(final.firstArrivalDelayEstimateMs, 164);
  assert.equal(final.arrivedAtMs, 2200);
  assert.equal(final.audioOriginEstimateMs, 936);
  p.stop();
});

test("Stop releases a late stream even when SDK recording initialization fails", async () => {
  const p = page();
  await p.start();
  const session = p.sessions[0];
  p.stop();
  session.grantMicrophone(p.states.ERROR);
  await Promise.resolve();
  assert.equal(session.track.readyState, "ended");
  assert.equal(session.audioStreamer.audioContext.state, "closed");
  assert.equal(session.closed, true);
});

test("silent SDK initialization failure releases the active stream and permits restart", async () => {
  const p = page();
  await p.start();
  const session = p.sessions[0];
  session.grantMicrophone(p.states.ERROR);
  await Promise.resolve();
  assert.equal(session.track.readyState, "ended");
  assert.equal(p.elements.get("#start").disabled, false);
  assert.match(p.elements.get("#status").textContent, /Audio initialization failed/);
});
