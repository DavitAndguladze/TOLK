"use client";

export function canHear(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Says the word aloud with the browser's voice, a little slower than speech so it's easy to copy. */
export function hear(word: string): void {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.8;
  speechSynthesis.speak(utterance);
}
