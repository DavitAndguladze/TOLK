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
document.querySelector("#chapter")!.textContent = mockChapterVersion(1).text;

let client: AIServiceSpeechRealtimeApi | undefined;
let tokenRequest: AbortController | undefined;
let firstAudioAt: number | undefined;
let finished = "";
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
  tokenRequest?.abort();
  tokenRequest = undefined;
  const session = client;
  client = undefined;
  if (session) release(session);
  start.disabled = false;
  stop.disabled = final.disabled = true;
}

start.onclick = async () => {
  start.disabled = true;
  stop.disabled = false;
  const request = new AbortController();
  tokenRequest = request;
  entries = [];
  firstSeen.clear();
  firstAudioAt = undefined;
  finished = "";
  words.replaceChildren();
  document.querySelector("#transcript")!.textContent = "No recognized words yet.";
  document.querySelector("#stream-check")!.textContent = "Browser streaming: pending.";
  document.querySelector("#fields-check")!.textContent = "Word timing and confidence: pending.";
  document.querySelector("#delay-check")!.textContent = "Delay under one second: pending.";
  record("start", { browser: navigator.userAgent, chapterVersionId: mockChapterVersion(1).id });
  status.textContent = "Requesting an OCI session token…";
  try {
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
        status.textContent = `Listening failed: ${error.message}`;
        record("error", { message: error.message });
        cleanup();
      },
      onClose(event) {
        if (client !== session) return;
        record("closed", { code: event.code });
        cleanup();
        status.textContent = `Connection closed (${event.code}). Copy the evidence or start again.`;
      },
      onResult(result) {
        if (client !== session) return;
        const arrivedAt = performance.now();
        const transcription = result.transcriptions[0];
        if (!transcription) return;
        document.querySelector("#stream-check")!.textContent = "Browser streaming: YES — OCI returned recognized text.";
        document.querySelector("#transcript")!.textContent = `${finished} ${transcription.transcription}`;
        words.replaceChildren();
        for (const word of transcription.tokens ?? []) {
          if (word.type !== "WORD") continue;
          const key = `${word.startTimeInMs}:${word.token}`;
          if (!firstSeen.has(key)) firstSeen.set(key, arrivedAt);
          const valid = Number.isFinite(word.startTimeInMs) && Number.isFinite(word.endTimeInMs)
            && word.endTimeInMs >= word.startTimeInMs && Number.isFinite(word.confidence);
          const delay = firstAudioAt === undefined || !valid ? null
            : Math.round(firstSeen.get(key)! - firstAudioAt - word.endTimeInMs);
          const row = words.insertRow();
          for (const value of [word.token, word.startTimeInMs, word.endTimeInMs, word.confidence,
            transcription.isFinal ? "Final" : "Partial", delay ?? "Unavailable"]) {
            row.insertCell().textContent = String(value);
          }
          if (valid) document.querySelector("#fields-check")!.textContent = "Word timing and confidence: observed — inspect partial and final rows in evidence.";
          record("word", { ...word, isFinal: transcription.isFinal, delayEstimateMs: delay });
        }
        if (transcription.isFinal) finished += ` ${transcription.transcription}`;
        document.querySelector("#delay-check")!.textContent = "Delay under one second: review first-arrival estimates in evidence, then confirm externally.";
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
      if (state !== RealtimeWebSocketState.RUNNING) return;
      // A permission prompt may resolve after a socket failure or page teardown.
      if (client !== session) { release(session); return; }
      const sendAudio = session.audioStreamer.config.callBack!;
      session.audioStreamer.config.callBack = (data: Blob) => {
        if (firstAudioAt === undefined) {
          const frameDurationMs = data.size / 2 / 16000 * 1000;
          firstAudioAt = performance.now() - frameDurationMs;
          record("first-audio", { clock: "performance.now minus PCM frame duration", frameDurationMs });
        }
        sendAudio(data);
      };
      stop.disabled = final.disabled = false;
      status.textContent = "Listening. Read the Chapter Version aloud.";
    };
    session.connect();
  } catch (error) {
    if (request.signal.aborted) return;
    status.textContent = error instanceof Error ? error.message : String(error);
    record("error", { message: status.textContent });
    cleanup();
  }
};

stop.onclick = () => { record("stop"); cleanup(); status.textContent = "Stopped. Copy the evidence before starting again."; };
final.onclick = () => client?.requestFinalResult();
document.querySelector<HTMLButtonElement>("#copy")!.onclick = async () => {
  try { await navigator.clipboard.writeText(JSON.stringify(entries, null, 2)); }
  catch { status.textContent = "Clipboard unavailable. Select and copy the evidence below."; }
};
window.addEventListener("pagehide", cleanup);
