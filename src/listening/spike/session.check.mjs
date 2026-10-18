import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Exercise the page's real handlers with only browser and OCI boundaries replaced.
function page(elementTiming = false, tokenError = false) {
  const elements = new Map();
  const listeners = new Map();
  const frames = [];
  let renderCallback;
  const document = { visibilityState: "visible", addEventListener(event, callback) { listeners.set(event, callback); },
    createElement() { return { attributes: new Map(), setAttribute(name, value) { this.attributes.set(name, value); } }; }, querySelector(selector) {
    if (!elements.has(selector)) elements.set(selector, {
      textContent: "", disabled: false, checked: selector === "#reduce-background", scrollIntoView() {}, replaceChildren(child) { this.child = child; },
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
      this.mediaStream = { getTracks: () => [this.track], getAudioTracks: () => [this.track] };
      this.audioStreamer = { config: { callBack() {} }, audioContext: {
        state: "running", close() { this.state = "closed"; return Promise.resolve(); },
      }, pauseRecording() { this.paused = true; }, resumeRecording() { this.paused = false; } };
      if (this.configureTrack) this.configureTrack(this.track);
      return this.setWebSocketState(state);
    }
  }
  let clock = 1000;
  const source = ts.transpileModule(readFileSync(new URL("main.ts", import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(source, {
    exports: {}, document, AbortController, queueMicrotask, performance: { now: () => clock },
    navigator: { userAgent: "test", mediaDevices: { getUserMedia() {} } },
    window: { isSecureContext: true, addEventListener() {} }, setTimeout, clearTimeout,
    requestAnimationFrame: callback => { frames.push(callback); },
    PerformanceObserver: elementTiming ? class {
      static supportedEntryTypes = ["element"];
      constructor(callback) { renderCallback = callback; }
      observe() {} disconnect() {}
    } : undefined,
    fetch: async () => ({ ok: !tokenError, json: async () => tokenError ? { message: "Token unavailable" } : ({ token: "test", compartmentId: "test", region: "us-ashburn-1" }) }),
    require: name => name.includes("mocks") ? { mockChapterVersion: () => ({ id: "mock", text: "Read this." }) }
      : { AIServiceSpeechRealtimeApi: SDK, RealtimeWebSocketState: states,
        RealtimeParametersModelDomainEnum: { GENERIC: "GENERIC" },
        RealtimeParametersStabilizePartialResultsEnum: { NONE: "NONE" } },
  });
  return { elements, sessions, states, setClock(value) { clock = value; },
    start: () => elements.get("#start").onclick(), stop: () => elements.get("#stop").onclick(),
    probe: () => elements.get("#probe").onclick(),
    nextFrame(value) { clock = value; frames.shift()?.(value); },
    render(at) { renderCallback({ getEntries: () => [{ identifier: elements.get("#probe-word").child.attributes.get("elementtiming"), renderTime: at }] }); },
    async audio(at, amplitude) {
      clock = at;
      const samples = new Int16Array(1024).fill(amplitude);
      await sessions.at(-1).audioStreamer.config.callBack({ size: samples.byteLength, arrayBuffer: async () => samples.buffer });
    },
    hide() { document.visibilityState = "hidden"; listeners.get("visibilitychange")?.(); },
    evidence: () => JSON.parse(elements.get("#evidence").textContent) };
}

test("background reduction pauses audio until requested processing is applied and reports actual settings", async () => {
  const p = page();
  await p.start();
  const session = p.sessions[0];
  let resolveConstraints;
  let requested;
  session.configureTrack = track => {
    track.applyConstraints = constraints => { requested = constraints; return new Promise(resolve => { resolveConstraints = resolve; }); };
    track.getSettings = () => ({ noiseSuppression: true, echoCancellation: true, autoGainControl: false });
  };
  const ready = session.grantMicrophone(p.states.RUNNING);
  const paused = session.audioStreamer.paused;
  const startingStatus = p.elements.get("#status").textContent;
  resolveConstraints?.();
  await ready;
  p.stop();
  assert.equal(paused, true);
  assert.doesNotMatch(startingStatus, /^Listening\./);
  assert.equal(requested?.noiseSuppression.ideal, true);
  assert.equal(requested?.echoCancellation.ideal, true);
  assert.equal(requested?.autoGainControl.ideal, false);
  const applied = p.evidence().find(event => event.event === "microphone-settings");
  assert.equal(applied?.noiseSuppression, true);
  assert.equal(applied?.autoGainControl, false);
  assert.match(p.elements.get("#microphone-settings").textContent, /Automatic gain: off/);
});

test("Stop during microphone processing never resumes the stopped stream", async () => {
  const p = page();
  await p.start();
  const session = p.sessions[0];
  let resolveConstraints;
  session.configureTrack = track => {
    track.applyConstraints = () => new Promise(resolve => { resolveConstraints = resolve; });
  };
  const ready = session.grantMicrophone(p.states.RUNNING);
  p.stop();
  resolveConstraints();
  await ready;
  assert.equal(session.audioStreamer.paused, true);
  assert.equal(session.track.readyState, "ended");
  assert.equal(p.elements.get("#start").disabled, false);
  assert.match(p.elements.get("#status").textContent, /^Stopped\./);
});

test("unsupported or rejected microphone processing keeps listening with truthful settings", async () => {
  for (const mode of ["unsupported", "rejected", "defaults"]) {
    const p = page();
    if (mode === "defaults") p.elements.get("#reduce-background").checked = false;
    await p.start();
    const session = p.sessions[0];
    let requested = false;
    if (mode !== "unsupported") session.configureTrack = track => {
      track.applyConstraints = async () => { requested = true; throw new Error("Not available"); };
      track.getSettings = () => ({ noiseSuppression: false, autoGainControl: true });
    };
    await session.grantMicrophone(p.states.RUNNING);
    assert.match(p.elements.get("#status").textContent, /^Listening\./);
    const settings = p.elements.get("#microphone-settings").textContent;
    if (mode === "unsupported") assert.match(settings, /unavailable.*unreported/);
    else assert.match(settings, /Noise suppression: off.*Automatic gain: on/);
    assert.equal(requested, mode === "rejected");
    p.stop();
  }
});

test("isolated-word probe measures local speech end to rendering opportunities without OCI timestamps", async () => {
  const p = page();
  await p.probe();
  const session = p.sessions[0];
  session.grantMicrophone(p.states.RUNNING);
  const audio = p.audio;
  for (let frame = 0; frame < 16; frame++) await audio(1000 + frame * 64, 0);
  await audio(2100, 5000);
  p.setClock(2400);
  session.listener.onResult({ transcriptions: [{ isFinal: false, transcription: "father", tokens: [
    { type: "WORD", token: "father", startTimeInMs: 99999, endTimeInMs: 100100, confidence: 97 },
  ] }] });
  p.nextFrame(2416);
  p.nextFrame(2432);
  await audio(2500, 0);
  const result = p.evidence().find(event => event.event === "latency-probe");
  assert.equal(result.outcome, "measured");
  assert.equal(result.speechEndEstimateMs, 2100);
  assert.equal(result.recognitionDelayEstimateMs, 300);
  assert.equal(result.domDelayEstimateMs, 300);
  assert.equal(result.renderOpportunityDelayEstimateMs, 332);
  assert.equal(result.maxPcmFrameDurationMs, 64);
  assert.equal(session.closed, true);
});

test("isolated-word probe retains browser element-render timing when available", async () => {
  const p = page(true);
  await p.probe();
  const session = p.sessions[0];
  session.grantMicrophone(p.states.RUNNING);
  for (let frame = 0; frame < 16; frame++) await p.audio(1000 + frame * 64, 0);
  await p.audio(2100, 5000);
  p.setClock(2400);
  session.listener.onResult({ transcriptions: [{ isFinal: false, transcription: "father", tokens: [
    { type: "WORD", token: "father", startTimeInMs: 0, endTimeInMs: 100, confidence: 97 },
  ] }] });
  p.nextFrame(2416);
  p.render(2420);
  p.nextFrame(2432);
  await p.audio(2500, 0);
  const result = p.evidence().find(event => event.event === "latency-probe");
  assert.equal(result.elementRenderDelayEstimateMs, 320);
  assert.equal(result.browserPresentationDelayEstimateMs, null);
});

test("isolated-word probe rejects a revised multiword final before completion", async () => {
  const p = page();
  await p.probe();
  const session = p.sessions[0];
  session.grantMicrophone(p.states.RUNNING);
  for (let frame = 0; frame < 16; frame++) await p.audio(1000 + frame * 64, 0);
  await p.audio(2100, 5000);
  p.setClock(2400);
  const word = token => ({ type: "WORD", token, startTimeInMs: 0, endTimeInMs: 100, confidence: 97 });
  session.listener.onResult({ transcriptions: [{ isFinal: false, transcription: "father", tokens: [word("father")] }] });
  session.listener.onResult({ transcriptions: [{ isFinal: true, transcription: "father today", tokens: [word("father"), word("today")] }] });
  p.nextFrame(2416);
  p.nextFrame(2432);
  await p.audio(2500, 0);
  const result = p.evidence().find(event => event.event === "latency-probe");
  assert.equal(result.outcome, "inconclusive");
  assert.match(result.reason, /single word/);
  assert.equal(session.closed, true);
});

test("isolated-word probe rejects a trial when the page becomes hidden", async () => {
  const p = page();
  await p.probe();
  const session = p.sessions[0];
  session.grantMicrophone(p.states.RUNNING);
  p.hide();
  const result = p.evidence().find(event => event.event === "latency-probe");
  assert.equal(result.outcome, "inconclusive");
  assert.match(result.reason, /visible/);
  assert.equal(session.closed, true);
});

test("isolated-word probe records connection failures and replaces the waiting result", async () => {
  for (const failure of ["token", "sdk", "close", "microphone"]) {
    const p = page(false, failure === "token");
    await p.probe();
    const session = p.sessions[0];
    if (failure === "sdk") session.listener.onError({ message: "Speech unavailable" });
    if (failure === "close") session.listener.onClose({ code: 1006 });
    if (failure === "microphone") { session.grantMicrophone(p.states.ERROR); await Promise.resolve(); }
    // Stop also clears the timer on the unfixed implementation after capturing its output.
    const result = p.evidence().find(event => event.event === "latency-probe");
    const display = p.elements.get("#probe-result").textContent;
    const status = p.elements.get("#status").textContent;
    p.stop();
    assert.equal(result?.outcome, "inconclusive", failure);
    assert.match(display, /inconclusive/, failure);
    assert.match(status, /unavailable|closed|initialization failed/i, failure);
  }
});

test("isolated-word probe times out and releases the microphone without a result", async context => {
  context.mock.timers.enable({ apis: ["setTimeout"] });
  const p = page();
  await p.probe();
  const session = p.sessions[0];
  session.grantMicrophone(p.states.RUNNING);
  context.mock.timers.tick(20000);
  const result = p.evidence().find(event => event.event === "latency-probe");
  assert.equal(result.outcome, "inconclusive");
  assert.match(result.reason, /20 seconds/);
  assert.equal(session.track.readyState, "ended");
  assert.equal(session.closed, true);
});

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

test("later utterances retain raw clocks without presenting reset timestamps as latency", async () => {
  const p = page();
  await p.start();
  const session = p.sessions[0];
  session.grantMicrophone(p.states.RUNNING);
  session.audioStreamer.config.callBack({ size: 2048 });
  const word = { type: "WORD", token: "read", startTimeInMs: 0, endTimeInMs: 100, confidence: 97 };
  p.setClock(1200);
  session.listener.onResult({ transcriptions: [{ isFinal: true, transcription: "read", startTimeInMs: 0, endTimeInMs: 100, tokens: [word] }] });
  p.setClock(5200);
  session.listener.onResult({ transcriptions: [{ isFinal: false, transcription: "read", startTimeInMs: 4000, endTimeInMs: 4100, tokens: [word] }] });
  const later = p.evidence().filter(event => event.event === "word").at(-1);
  assert.equal(later.delayEstimateMs, null);
  assert.equal(later.firstArrivalDelayEstimateMs, null);
  assert.equal(later.utterance, 1);
  const transcription = p.evidence().filter(event => event.event === "transcription").at(-1);
  assert.equal(transcription.startTimeInMs, 4000);
  assert.equal(transcription.endTimeInMs, 4100);
  p.stop();
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
