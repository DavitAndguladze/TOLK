import type { OpenRecognition } from "./recognition";

// The prefixed browser interface is not included in TypeScript's DOM library.
interface BrowserSpeech {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string; confidence: number } }> }) => void) | null;
  start(): void;
  abort(): void;
}

export const openBrowserSpeech: OpenRecognition = (signal, onSnapshot, onError) => new Promise((resolve, reject) => {
  const browser = globalThis as typeof globalThis & {
    SpeechRecognition?: new () => BrowserSpeech;
    webkitSpeechRecognition?: new () => BrowserSpeech;
  };
  const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
  if (!Constructor) { reject(new Error("Browser speech recognition is unavailable. Choose OCI listening.")); return; }
  const recognition = new Constructor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  let ready = false;
  const fail = (message: string) => {
    clearTimeout(timeout);
    if (ready) onError(message);
    else reject(new Error(message));
  };
  const timeout = setTimeout(() => fail("Browser listening did not start. Check microphone permission and try again."), 15000);
  const cancel = () => {
    clearTimeout(timeout);
    recognition.onstart = recognition.onend = recognition.onerror = recognition.onresult = null;
    recognition.abort();
    reject(new DOMException("Listening stopped", "AbortError"));
  };
  signal.addEventListener("abort", cancel, { once: true });
  recognition.onstart = () => { clearTimeout(timeout); ready = true; resolve(); };
  recognition.onerror = () => fail("Browser listening failed. Check microphone permission and try again.");
  recognition.onend = () => fail("Browser listening ended. Resume to keep reading.");
  recognition.onresult = ({ results }) => {
    if (signal.aborted) return;
    const utterances = Array.from(results);
    onSnapshot({
      words: utterances.flatMap(result => result[0].transcript.trim().split(/\s+/).filter(Boolean)
        .map(text => ({ text, confidence: result[0].confidence }))),
      final: utterances.length > 0 && utterances.every(result => result.isFinal),
    });
  };
  if (signal.aborted) cancel();
  else { try { recognition.start(); } catch { recognition.onerror(); } }
});
