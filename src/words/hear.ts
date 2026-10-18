"use client";

export function canHear(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Stand-in for the AI gateway's OCI Speech text-to-speech (spec: "Every AI call runs on OCI"), next in #9.
 * Says the word aloud with the browser's voice, a little slower than speech so it's easy to copy.
 */
export function hear(word: string): void {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "en-US";
  utterance.rate = 0.8;
  speechSynthesis.speak(utterance);
}
