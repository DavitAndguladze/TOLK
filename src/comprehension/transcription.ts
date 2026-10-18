import { openOciSpeech } from "../listening/oci";

export interface AnswerTranscriber {
  /** Live engines capture the mic; abort when leaving the answer or switching to typing. */
  transcribe(input?: Blob | ArrayBuffer, signal?: AbortSignal): Promise<string>;
}

export function createMockTranscriber(reply = "mock transcription"): AnswerTranscriber {
  return {
    async transcribe() {
      return reply;
    },
  };
}

interface MinimalSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

type SpeechRecognitionCtor = new () => MinimalSpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/**
 * One short browser-mic utterance per Chapter Check answer (ADR-0002's own stated Web Speech
 * fallback). This is NOT Role 1's realtime word-alignment pipeline - a Chapter Check answer is
 * free-form, so there's no expected text to align it against, just a transcript to capture.
 */
export function createWebSpeechTranscriber(): AnswerTranscriber {
  return {
    transcribe(_input, signal) {
      return new Promise((resolve, reject) => {
        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) {
          reject(new Error("Web Speech API not available in this browser"));
          return;
        }
        const recognition = new Ctor();
        recognition.continuous = false;
        recognition.interimResults = false;
        let settled = false;
        const finish = (result: string | Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          signal?.removeEventListener("abort", cancel);
          recognition.onresult = recognition.onerror = recognition.onend = null;
          recognition.abort();
          if (typeof result === "string") resolve(result);
          else reject(result);
        };
        const cancel = () => finish(new DOMException("Answer recording stopped", "AbortError"));
        const timeout = setTimeout(() => finish(new Error("No speech detected")), 30000);
        signal?.addEventListener("abort", cancel, { once: true });
        if (signal?.aborted) { cancel(); return; }
        recognition.onresult = event => finish(event.results[0][0].transcript);
        recognition.onerror = event => finish(new Error(event.error ?? "speech recognition error"));
        // Silence (no speech, a timeout) ends recognition with neither onresult nor onerror -
        // without this, the caller's "Listening..." state would hang forever.
        recognition.onend = () => finish(new Error("No speech detected"));
        try { recognition.start(); }
        catch { finish(new Error("Speech recognition could not start")); }
      });
    },
  };
}

/** One free-form utterance over the same authenticated Speech transport as read-aloud. */
export function createOciRealtimeTranscriber(): AnswerTranscriber {
  return {
    transcribe(_input, signal) {
      return new Promise((resolve, reject) => {
        const capture = new AbortController();
        let settled = false;
        const finish = (result: string | Error) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          signal?.removeEventListener("abort", cancel);
          capture.abort();
          if (typeof result === "string") resolve(result);
          else reject(result);
        };
        const cancel = () => finish(new DOMException("Answer recording stopped", "AbortError"));
        // Include permission/connection time: silence must never leave the mic open indefinitely.
        const timeout = setTimeout(() => finish(new Error("No completed answer heard. Try again or type your answer.")), 30000);
        signal?.addEventListener("abort", cancel, { once: true });
        if (signal?.aborted) { cancel(); return; }
        void openOciSpeech(capture.signal, snapshot => {
          const text = snapshot.words.map(word => word.text).join(" ").trim();
          if (snapshot.final && text) finish(text);
        }, message => finish(new Error(message))).catch(error => finish(error instanceof Error ? error : new Error("Answer recording failed")));
      });
    },
  };
}

/** Batch transcription is unsupported; live answers use oci-realtime. */
export function createOciBatchTranscriber(): AnswerTranscriber {
  return {
    async transcribe() {
      throw new Error("OCI batch transcription is not implemented; use oci-realtime for live answers");
    },
  };
}

export type AnswerTranscriptionEngine = "mock" | "web-speech" | "oci-batch" | "oci-realtime";

function defaultEngine(): AnswerTranscriptionEngine {
  const configured = process.env.NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE;
  return configured === "web-speech" || configured === "oci-batch" || configured === "oci-realtime" ? configured : "mock";
}

/** Mirrors the NEXT_PUBLIC_LISTENING_ENGINE flag pattern in .env.example. */
export function getAnswerTranscriber(engine: AnswerTranscriptionEngine = defaultEngine()): AnswerTranscriber {
  switch (engine) {
    case "oci-realtime":
      return createOciRealtimeTranscriber();
    case "web-speech":
      return createWebSpeechTranscriber();
    case "oci-batch":
      return createOciBatchTranscriber();
    default:
      return createMockTranscriber();
  }
}
