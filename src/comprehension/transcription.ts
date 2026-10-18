export interface AnswerTranscriber {
  /** Web Speech captures live from the mic rather than taking recorded audio, so implementations may ignore `input`. */
  transcribe(input?: Blob | ArrayBuffer): Promise<string>;
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
    transcribe() {
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
        recognition.onresult = (event) => {
          settled = true;
          resolve(event.results[0][0].transcript);
        };
        recognition.onerror = (event) => {
          settled = true;
          reject(new Error(event.error ?? "speech recognition error"));
        };
        // Silence (no speech, a timeout) ends recognition with neither onresult nor onerror -
        // without this, the caller's "Listening..." state would hang forever.
        recognition.onend = () => {
          if (!settled) reject(new Error("No speech detected"));
        };
        recognition.start();
      });
    },
  };
}

/** Stub until OCI Speech credentials exist (#02 OCI infra). A one-shot batch call - not R1's realtime session-token flow. */
export function createOciBatchTranscriber(): AnswerTranscriber {
  return {
    async transcribe() {
      throw new Error("OCI batch transcription is not implemented yet (needs #02's OCI credentials)");
    },
  };
}

export type AnswerTranscriptionEngine = "mock" | "web-speech" | "oci-batch";

function defaultEngine(): AnswerTranscriptionEngine {
  const configured = process.env.NEXT_PUBLIC_ANSWER_TRANSCRIPTION_ENGINE;
  return configured === "web-speech" || configured === "oci-batch" ? configured : "mock";
}

/** Mirrors the NEXT_PUBLIC_LISTENING_ENGINE flag pattern in .env.example. */
export function getAnswerTranscriber(engine: AnswerTranscriptionEngine = defaultEngine()): AnswerTranscriber {
  switch (engine) {
    case "web-speech":
      return createWebSpeechTranscriber();
    case "oci-batch":
      return createOciBatchTranscriber();
    default:
      return createMockTranscriber();
  }
}
