import type { RecognizedWord } from "./alignment";
import type { OpenRecognition } from "./recognition";
import { pcmWorklet } from "./pcm-worklet";

// Wire protocol: Oracle's oci-ai-speech-realtime-web SDK, 2.2.0.
// Native browser capture avoids the SDK package's missing compiled distribution.
type OciResult = { event: string; transcriptions?: Array<{ isFinal: boolean; tokens: Array<{
  type: string; token: string; startTimeInMs?: number; endTimeInMs?: number; confidence?: number;
}> }> };

export const openOciSpeech: OpenRecognition = (signal, onSnapshot, onError) => new Promise((resolve, reject) => {
  if (!globalThis.AudioContext || !globalThis.AudioWorkletNode || !navigator.mediaDevices?.getUserMedia) {
    reject(new Error("OCI listening needs microphone access over HTTPS in a browser with AudioWorklet support.")); return;
  }
  // Create/resume while still inside the Reader's Start gesture (before fetching a token).
  const context = new AudioContext({ sampleRate: 16000 });
  let socket: WebSocket | undefined;
  let stream: MediaStream | undefined;
  let input: MediaStreamAudioSourceNode | undefined;
  let processor: AudioWorkletNode | undefined;
  let ready = false;
  let connectingAudio = false;
  const committed: RecognizedWord[] = [];
  const fail = (message: string) => {
    clearTimeout(timeout);
    if (signal.aborted) return;
    if (ready) onError(message);
    else reject(new Error(message));
  };
  const timeout = setTimeout(() => fail("OCI listening did not start. Check microphone permission and connection, then retry."), 30000);
  const cancel = () => {
    clearTimeout(timeout);
    if (socket) {
      socket.onopen = socket.onmessage = socket.onclose = socket.onerror = null;
      socket.close();
    }
    if (processor) { processor.port.onmessage = null; processor.port.close(); processor.disconnect(); }
    input?.disconnect();
    stream?.getTracks().forEach(track => track.stop());
    void context.close().catch(() => {});
    reject(new DOMException("Listening stopped", "AbortError"));
  };
  signal.addEventListener("abort", cancel, { once: true });

  const startAudio = async () => {
    if (connectingAudio || signal.aborted) return;
    connectingAudio = true;
    const acquired = await navigator.mediaDevices.getUserMedia({ audio: {
      channelCount: { ideal: 1 }, noiseSuppression: { ideal: true },
      echoCancellation: { ideal: true }, autoGainControl: { ideal: false },
    } });
    if (signal.aborted) { acquired.getTracks().forEach(track => track.stop()); return; }
    stream = acquired;
    const moduleUrl = URL.createObjectURL(new Blob([pcmWorklet], { type: "text/javascript" }));
    try { await context.audioWorklet.addModule(moduleUrl); }
    finally { URL.revokeObjectURL(moduleUrl); }
    if (signal.aborted) return;
    processor = new AudioWorkletNode(context, "reading-pcm", { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1] });
    processor.onprocessorerror = () => fail("Microphone processing stopped. Resume to keep reading.");
    processor.port.onmessage = ({ data }: MessageEvent<ArrayBuffer>) => {
      if (signal.aborted || socket?.readyState !== 1) return;
      // At 32 KB/s this allows roughly two seconds, then stops rather than queueing audio indefinitely.
      if (socket.bufferedAmount > 64000) { fail("Listening connection is too slow. Resume when the connection improves."); return; }
      socket.send(data);
    };
    input = context.createMediaStreamSource(stream);
    input.connect(processor);
    processor.connect(context.destination); // Worklet output is silence; microphone audio is never played back.
    ready = true;
    clearTimeout(timeout);
    resolve();
  };

  void (async () => {
    await context.resume();
    if (signal.aborted) return;
    if (context.sampleRate !== 16000) throw new Error("sample-rate");
    const response = await fetch("/api/speech/token", { method: "POST", credentials: "same-origin", cache: "no-store", signal });
    if (response.status === 401) { fail("Sign in again to read aloud. You can still read silently."); return; }
    if (response.status === 429) {
      const seconds = Number(response.headers.get("Retry-After"));
      const retry = Number.isSafeInteger(seconds) && seconds > 0
        ? `Try again in ${seconds} ${seconds === 1 ? "second" : "seconds"}` : "Wait a moment and try again";
      fail(`Read-aloud is temporarily limited. ${retry}, or keep reading silently.`);
      return;
    }
    if (!response.ok) { fail("OCI listening could not get a session token. Check sign-in and Speech configuration."); return; }
    const token = await response.json() as { token: string; region: string; compartmentId: string; expiresAt: string };
    if (signal.aborted) return;
    if (typeof token.token !== "string" || !token.token || typeof token.compartmentId !== "string" || !token.compartmentId
      || typeof token.region !== "string" || !/^[a-z]{2}-[a-z]+-\d+$/.test(token.region)
      || !(Date.parse(token.expiresAt) > Date.now())) {
      fail("OCI listening received an invalid or expired session token."); return;
    }
    const parameters = new URLSearchParams({
      encoding: "audio/raw;rate=16000", languageCode: "en-US", modelDomain: "GENERIC",
      partialSilenceThresholdInMs: "0", finalSilenceThresholdInMs: "1000", stabilizePartialResults: "NONE",
    });
    socket = new WebSocket(`wss://realtime.aiservice.${token.region}.oci.oraclecloud.com/ws/transcribe/stream?${parameters}`);
    socket.onopen = () => socket?.send(JSON.stringify({ authenticationType: "TOKEN", compartmentId: token.compartmentId, token: token.token }));
    socket.onerror = () => fail("OCI listening connection failed. Check the connection and retry.");
    socket.onclose = () => fail("OCI listening disconnected. Resume to keep reading.");
    socket.onmessage = ({ data }) => {
      if (signal.aborted) return;
      try {
        const message = JSON.parse(data) as OciResult;
        if (message.event === "CONNECT") {
          void startAudio().catch(() => fail("OCI could not start the microphone. Check permission and retry."));
        } else if (message.event === "ERROR") {
          fail("OCI rejected the listening session. Check Speech configuration and retry.");
        } else if (message.event === "RESULT") {
          const utterance = message.transcriptions?.[0];
          if (!utterance || !Array.isArray(utterance.tokens) || typeof utterance.isFinal !== "boolean") throw new Error("result");
          const words = utterance.tokens.filter(word => word.type === "WORD" && typeof word.token === "string").map(word => ({
            text: word.token, startMs: word.startTimeInMs, endMs: word.endTimeInMs, confidence: word.confidence,
          }));
          // OCI clocks reset between utterances; no clockId or invented hesitation is assigned.
          if (committed.length + words.length > 1000) { fail("This listening session is too long. Pause and resume at the next unread word."); return; }
          onSnapshot({ words: [...committed, ...words], final: utterance.isFinal });
          if (utterance.isFinal) committed.push(...words);
        }
      } catch { fail("OCI returned an unreadable listening result. Resume to retry."); }
    };
  })().catch(() => fail("OCI listening could not start. Check microphone support, sign-in and connection."));
  if (signal.aborted) cancel();
});
