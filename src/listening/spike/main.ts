import {
  AIServiceSpeechRealtimeApi, RealtimeParametersModelDomainEnum,
  RealtimeParametersStabilizePartialResultsEnum, RealtimeWebSocketState,
} from "@oracle/oci-ai-speech-realtime-web";
import { mockChapterVersion } from "../../mocks/fixtures";
import type { Api } from "../../types";

const start = document.querySelector<HTMLButtonElement>("#start")!;
const stop = document.querySelector<HTMLButtonElement>("#stop")!;
const final = document.querySelector<HTMLButtonElement>("#final")!;
const status = document.querySelector<HTMLElement>("#status")!;
const evidence = document.querySelector<HTMLElement>("#evidence")!;
const words = document.querySelector<HTMLTableSectionElement>("#words")!;
const probeButton = document.querySelector<HTMLButtonElement>("#probe")!;
const probePrompt = document.querySelector<HTMLElement>("#probe-prompt")!;
type Probe = {
  id: string;
  baselineMs: number; noiseTotal: number; noiseFrames: number; maxFrameMs: number;
  threshold?: number; speechEndMs?: number; quietConfirmed?: boolean;
  recognitionMs?: number; domMs?: number; renderOpportunityMs?: number;
  elementRenderMs?: number; presentationMs?: number; observer?: PerformanceObserver;
  reportedInputLatencyMs?: number;
  timer?: ReturnType<typeof setTimeout>;
};
let activeProbe: Probe | undefined;
let probeSequence = 0;
const probeHistory: object[] = [];
document.querySelector("#chapter")!.textContent = mockChapterVersion(1).text;

let client: AIServiceSpeechRealtimeApi | undefined;
let tokenRequest: AbortController | undefined;
let firstAudioAt: number | undefined;
let finished = "";
let utterance = 0;
let entries: object[] = [];
const firstSeen = new Map<string, number>();

function record(event: string, details: object = {}) {
  entries.push({ event, at: new Date().toISOString(), ...details });
  evidence.textContent = JSON.stringify(entries, null, 2);
}

function release(session: AIServiceSpeechRealtimeApi) {
  session.mediaStream?.getTracks().forEach(track => track.stop());
  // SDK 2.2.0 disconnects audio nodes but does not close its AudioContext.
  const context = session.audioStreamer?.audioContext;
  session.close();
  if (typeof context?.close === "function" && context.state !== "closed") void context.close();
}

function cleanup() {
  clearTimeout(activeProbe?.timer);
  activeProbe?.observer?.disconnect();
  activeProbe = undefined;
  tokenRequest?.abort();
  tokenRequest = undefined;
  const session = client;
  client = undefined;
  if (session) release(session);
  start.disabled = false;
  probeButton.disabled = false;
  stop.disabled = final.disabled = true;
}

function finishProbe(probe: Probe, reason?: string) {
  if (activeProbe !== probe) return;
  const measured = !reason && probe.speechEndMs !== undefined && probe.renderOpportunityMs !== undefined;
  const details = {
    outcome: measured ? "measured" : "inconclusive", reason: reason ?? null,
    method: "isolated father; PCM energy endpoint; DOM and second rendering opportunity",
    speechEndEstimateMs: probe.speechEndMs ?? null,
    recognitionDelayEstimateMs: measured ? Math.round(probe.recognitionMs! - probe.speechEndMs!) : null,
    domDelayEstimateMs: measured ? Math.round(probe.domMs! - probe.speechEndMs!) : null,
    renderOpportunityDelayEstimateMs: measured ? Math.round(probe.renderOpportunityMs! - probe.speechEndMs!) : null,
    elementRenderDelayEstimateMs: measured && probe.elementRenderMs !== undefined ? Math.round(probe.elementRenderMs - probe.speechEndMs!) : null,
    browserPresentationDelayEstimateMs: measured && probe.presentationMs !== undefined ? Math.round(probe.presentationMs - probe.speechEndMs!) : null,
    maxPcmFrameDurationMs: probe.maxFrameMs, energyThreshold: probe.threshold ?? null,
    reportedInputLatencyMs: probe.reportedInputLatencyMs ?? null,
  };
  record("latency-probe", details);
  probeHistory.push({ at: new Date().toISOString(), ...details });
  record("probe-history", { trials: probeHistory });
  document.querySelector("#probe-result")!.textContent = JSON.stringify(probeHistory, null, 2);
  probePrompt.textContent = measured ? "Measurement captured. The microphone has stopped." : `Inconclusive: ${reason}`;
  cleanup();
  status.textContent = measured ? "Probe complete. Review the local latency estimates below." : "Probe stopped without a valid measurement.";
}

function maybeFinishProbe(probe: Probe) {
  if (activeProbe !== probe || !probe.quietConfirmed || probe.renderOpportunityMs === undefined || probe.speechEndMs === undefined) return;
  finishProbe(probe, probe.domMs! < probe.speechEndMs ? "Sound continued after the word appeared; repeat in a quiet room." : undefined);
}

function failListening(message: string) {
  record("error", { message });
  if (activeProbe) finishProbe(activeProbe, message);
  else cleanup();
  status.textContent = message;
}

async function startListening(isProbe = false) {
  start.disabled = true;
  probeButton.disabled = true;
  stop.disabled = false;
  const probe: Probe | undefined = isProbe ? { id: `r1-probe-${++probeSequence}`, baselineMs: 0, noiseTotal: 0, noiseFrames: 0, maxFrameMs: 0 } : undefined;
  activeProbe = probe;
  if (probe) {
    probePrompt.textContent = "Keep quiet for the microphone baseline, then say father once when prompted.";
    document.querySelector("#probe-result")!.textContent = "Waiting for a measurement.";
    document.querySelector("#probe-word")!.textContent = "";
    probe.timer = setTimeout(() => finishProbe(probe, "No complete isolated-word measurement within 20 seconds."), 20000);
    if (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes.includes("element")) {
      try {
        probe.observer = new PerformanceObserver(list => {
          if (activeProbe !== probe) return;
          for (const item of list.getEntries()) {
            const entry = item as PerformanceEntry & { identifier?: string; renderTime?: number; presentationTime?: number };
            if (entry.identifier !== probe.id) continue;
            if (Number.isFinite(entry.renderTime) && entry.renderTime! > 0) probe.elementRenderMs = entry.renderTime;
            if (Number.isFinite(entry.presentationTime) && entry.presentationTime! > 0) probe.presentationMs = entry.presentationTime;
          }
        });
        probe.observer.observe({ type: "element", buffered: false });
      } catch {
        probe.observer?.disconnect();
        probe.observer = undefined;
      }
    }
  }
  const request = new AbortController();
  tokenRequest = request;
  entries = [];
  firstSeen.clear();
  firstAudioAt = undefined;
  finished = "";
  utterance = 0;
  words.replaceChildren();
  document.querySelector("#transcript")!.textContent = "No recognized words yet.";
  document.querySelector("#stream-check")!.textContent = "Browser streaming: pending.";
  document.querySelector("#fields-check")!.textContent = "Word timing and confidence: pending.";
  document.querySelector("#delay-check")!.textContent = "Delay under one second: pending.";
  record("start", { browser: navigator.userAgent, chapterVersionId: mockChapterVersion(1).id });
  status.textContent = "Requesting an OCI session token…";
  try {
    if (probe && document.visibilityState !== "visible") {
      finishProbe(probe, "The page must remain visible during a probe.");
      return;
    }
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone access needs localhost or trusted HTTPS in a supported browser.");
    }
    const response = await fetch("/api/speech/token", { method: "POST", signal: request.signal });
    if (!response.ok) throw new Error((await response.json()).message);
    const token: Api["POST /api/speech/token"]["res"] = await response.json();
    if (request.signal.aborted) return;
    if (!token.token || !token.compartmentId || !/^[a-z]+-[a-z]+-\d+$/.test(token.region)) {
      throw new Error("The token endpoint returned invalid session details.");
    }
    record("token-ready", { region: token.region, expiresAt: token.expiresAt });
    status.textContent = "Connecting to OCI; allow the microphone when prompted…";
    const session = new AIServiceSpeechRealtimeApi({
      onAckAudio() {},
      onConnect() { if (client === session) record("websocket-open"); },
      onConnectMessage() { if (client === session) record("authenticated"); },
      onError(error) {
        if (client !== session) return;
        failListening(`Listening failed: ${error.message}`);
      },
      onClose(event) {
        if (client !== session) return;
        record("closed", { code: event.code });
        failListening(`Connection closed (${event.code}). Copy the evidence or start again.`);
      },
      onResult(result) {
        if (client !== session) return;
        const arrivedAt = performance.now();
        const transcription = result.transcriptions[0];
        if (!transcription) return;
        record("transcription", { utterance, isFinal: transcription.isFinal,
          startTimeInMs: transcription.startTimeInMs, endTimeInMs: transcription.endTimeInMs,
          arrivedAtMs: arrivedAt });
        document.querySelector("#stream-check")!.textContent = "Browser streaming: YES — OCI returned recognized text.";
        document.querySelector("#transcript")!.textContent = `${finished} ${transcription.transcription}`;
        if (probe && activeProbe === probe) {
          const recognized = transcription.tokens?.filter(word => word.type === "WORD") ?? [];
          const matches = recognized.length === 1 && recognized[0].token.toLowerCase().replace(/[^a-z]/g, "") === "father";
          if (transcription.isFinal && recognized.length && !matches) {
            finishProbe(probe, "This trial needs exactly the single word father.");
            return;
          }
          if (matches && probe.recognitionMs === undefined) {
            if (probe.threshold === undefined || probe.speechEndMs === undefined) {
              finishProbe(probe, "The word arrived before a usable microphone endpoint was observed.");
              return;
            }
            probe.recognitionMs = arrivedAt;
            const displayedWord = document.createElement("span");
            displayedWord.setAttribute("elementtiming", probe.id);
            displayedWord.textContent = "father";
            document.querySelector("#probe-word")!.replaceChildren(displayedWord);
            probe.domMs = performance.now();
            requestAnimationFrame(() => requestAnimationFrame(() => {
              if (activeProbe !== probe) return;
              probe.renderOpportunityMs = performance.now();
              maybeFinishProbe(probe);
            }));
          }
        }
        words.replaceChildren();
        for (const word of transcription.tokens ?? []) {
          if (word.type !== "WORD") continue;
          const key = `${utterance}:${word.startTimeInMs}:${word.token}`;
          if (!firstSeen.has(key)) firstSeen.set(key, arrivedAt);
          const valid = Number.isFinite(word.startTimeInMs) && Number.isFinite(word.endTimeInMs)
            && word.endTimeInMs >= word.startTimeInMs && Number.isFinite(word.confidence);
          // Live token clocks can restart; later utterance origins are unverified.
          const delay = firstAudioAt === undefined || !valid || utterance > 0 ? null
            : Math.round(firstSeen.get(key)! - firstAudioAt - word.endTimeInMs);
          const arrivalDelay = firstAudioAt === undefined || !valid || utterance > 0 ? null
            : Math.round(arrivedAt - firstAudioAt - word.endTimeInMs);
          const row = words.insertRow();
          for (const value of [word.token, word.startTimeInMs, word.endTimeInMs, word.confidence,
            transcription.isFinal ? "Final" : "Partial", arrivalDelay ?? "Unavailable"]) {
            row.insertCell().textContent = String(value);
          }
          if (valid) document.querySelector("#fields-check")!.textContent = "Word timing and confidence: observed — inspect partial and final rows in evidence.";
          record("word", { ...word, utterance, isFinal: transcription.isFinal, arrivedAtMs: arrivedAt,
            audioOriginEstimateMs: firstAudioAt ?? null, delayEstimateMs: arrivalDelay,
            firstArrivalDelayEstimateMs: delay });
        }
        if (transcription.isFinal) { finished += ` ${transcription.transcription}`; utterance++; }
        document.querySelector("#delay-check")!.textContent = utterance > 0
          ? "Delay: later utterance clocks need calibration; use raw bounds in evidence."
          : "Delay under one second: review first-arrival estimates in evidence, then confirm externally.";
      },
    }, token.token, token.compartmentId,
    `wss://realtime.aiservice.${token.region}.oci.oraclecloud.com/ws/transcribe/stream`, {
      languageCode: "en-US", modelType: "ORACLE", modelDomain: RealtimeParametersModelDomainEnum.GENERIC,
      stabilizePartialResults: RealtimeParametersStabilizePartialResultsEnum.NONE,
      partialSilenceThresholdInMs: 0, finalSilenceThresholdInMs: 1000,
      encoding: "audio/raw;rate=16000",
    });
    client = session;
    // SDK 2.2.0 has no recording-ready callback; observe its public state transition.
    const setState = session.setWebSocketState;
    session.setWebSocketState = state => {
      setState(state);
      if (state === RealtimeWebSocketState.ERROR) {
        // Normal SDK errors call onError synchronously; capture silent startRecording failures too.
        queueMicrotask(() => {
          if (client === session) {
            failListening("Audio initialization failed. Check microphone access and start again.");
          } else if (session.mediaStream?.getTracks().some(track => track.readyState !== "ended")) {
            release(session);
          }
        });
        return;
      }
      if (state !== RealtimeWebSocketState.RUNNING) return;
      // A permission prompt may resolve after a socket failure or page teardown.
      if (client !== session) { release(session); return; }
      if (probe) {
        const settings = session.mediaStream?.getAudioTracks?.()[0]?.getSettings?.() as (MediaTrackSettings & { latency?: number }) | undefined;
        if (typeof settings?.latency === "number" && Number.isFinite(settings.latency)) probe.reportedInputLatencyMs = settings.latency * 1000;
      }
      const sendAudio = session.audioStreamer.config.callBack!;
      session.audioStreamer.config.callBack = (data: Blob) => {
        const frameReceivedAt = performance.now();
        if (firstAudioAt === undefined) {
          const frameDurationMs = data.size / 2 / 16000 * 1000;
          firstAudioAt = performance.now() - frameDurationMs;
          record("first-audio", { clock: "performance.now minus PCM frame duration", frameDurationMs });
        }
        sendAudio(data);
        if (!probe || activeProbe !== probe) return;
        return data.arrayBuffer().then(buffer => {
          if (activeProbe !== probe || client !== session) return;
          const samples = new DataView(buffer);
          const count = samples.byteLength / 2;
          if (!count) return;
          const durationMs = count / 16000 * 1000;
          probe.maxFrameMs = Math.max(probe.maxFrameMs, durationMs);
          let energy = 0;
          let lastActive = -1;
          for (let index = 0; index < count; index++) {
            const sample = samples.getInt16(index * 2, true) / 32768;
            energy += sample * sample;
            if (Math.abs(sample) > (probe.threshold ?? Infinity)) lastActive = index;
          }
          const rms = Math.sqrt(energy / count);
          if (probe.threshold === undefined) {
            probe.noiseTotal += rms;
            probe.noiseFrames++;
            probe.baselineMs += durationMs;
            if (probe.baselineMs >= 1000) {
              probe.threshold = Math.max(.015, probe.noiseTotal / probe.noiseFrames * 4);
              record("probe-ready", { energyThreshold: probe.threshold, baselineMs: probe.baselineMs });
              probePrompt.textContent = "Say father once, then stay quiet. The microphone stops automatically.";
              probePrompt.scrollIntoView({ block: "center" });
            }
            return;
          }
          if (rms >= probe.threshold && lastActive >= 0) {
            probe.speechEndMs = Math.max(probe.speechEndMs ?? 0, frameReceivedAt - durationMs + (lastActive + 1) / 16000 * 1000);
            probe.quietConfirmed = false;
          } else if (probe.speechEndMs !== undefined && frameReceivedAt - probe.speechEndMs >= 300) {
            probe.quietConfirmed = true;
            maybeFinishProbe(probe);
          }
        }).catch(() => finishProbe(probe, "Microphone frame inspection failed."));
      };
      stop.disabled = final.disabled = false;
      status.textContent = "Listening. Read the Chapter Version aloud.";
    };
    session.connect();
  } catch (error) {
    if (request.signal.aborted) return;
    failListening(error instanceof Error ? error.message : String(error));
  }
}

start.onclick = () => startListening();
probeButton.onclick = () => startListening(true);
document.addEventListener("visibilitychange", () => {
  if (activeProbe && document.visibilityState !== "visible") finishProbe(activeProbe, "The page must remain visible during a probe.");
});

stop.onclick = () => { record("stop"); if (activeProbe) finishProbe(activeProbe, "Stopped before the measurement completed."); else cleanup(); status.textContent = "Stopped. Copy the evidence before starting again."; };
final.onclick = () => client?.requestFinalResult();
document.querySelector<HTMLButtonElement>("#copy")!.onclick = async () => {
  try { await navigator.clipboard.writeText(JSON.stringify(entries, null, 2)); }
  catch { status.textContent = "Clipboard unavailable. Select and copy the evidence below."; }
};
window.addEventListener("pagehide", cleanup);
