"use client";

export function canHear(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Fetches only generated pronunciation; microphone audio is never captured or sent. */
export async function hear(word: string, signal: AbortSignal, onPlaying: () => void): Promise<void> {
  const audio = new Audio();
  const res = await fetch("/api/tts", {
    method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: word }), signal: AbortSignal.any([signal, AbortSignal.timeout(18000)]),
  });
  if (!res.ok || !res.headers.get("content-type")?.startsWith("audio/")) throw new Error("Pronunciation is unavailable");
  const blob = await res.blob();
  signal.throwIfAborted();
  if (!blob.size) throw new Error("Pronunciation is unavailable");
  const url = URL.createObjectURL(blob);
  audio.src = url;
  // A one-word clip at full speed is over before it registers; slow it like the browser voice (rate 0.8), pitch kept.
  audio.preservesPitch = true;
  audio.playbackRate = 0.75;
  try {
    await new Promise<void>((resolve, reject) => {
      const stop = () => { audio.pause(); reject(signal.reason); };
      signal.addEventListener("abort", stop, { once: true });
      const finish = (error?: unknown) => {
        signal.removeEventListener("abort", stop);
        if (error) reject(error); else resolve();
      };
      audio.onended = () => finish();
      audio.onerror = () => finish(new Error("Pronunciation could not play"));
      audio.play().then(onPlaying, finish);
    });
  } finally {
    audio.pause();
    audio.removeAttribute("src");
    URL.revokeObjectURL(url);
  }
}

/** Explicitly labeled browser fallback, offered only after OCI playback fails. */
export function hearInBrowser(word: string, signal: AbortSignal): Promise<void> {
  if (!canHear()) return Promise.reject(new Error("Browser voice is unavailable"));
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.8;
  return new Promise((resolve, reject) => {
    const stop = () => { speechSynthesis.cancel(); reject(signal.reason); };
    signal.addEventListener("abort", stop, { once: true });
    const finish = () => signal.removeEventListener("abort", stop);
    utterance.onend = () => { finish(); resolve(); };
    utterance.onerror = () => { finish(); reject(new Error("Browser voice could not play")); };
    speechSynthesis.speak(utterance);
  });
}
