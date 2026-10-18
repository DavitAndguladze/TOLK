import { expect, test } from "vitest";
import { createOciSpeech, isSpeakableWord } from "./oci-speech";

test("pronunciation accepts one word, including names and contractions, but never a passage or SSML", () => {
  for (const word of ["advice", "Gatsby", "don't", "self-conscious"]) expect(isSpeakableWord(word)).toBe(true);
  for (const text of [null, "", "read this chapter", "<speak>hello</speak>", "x".repeat(81)]) expect(isSpeakableWord(text)).toBe(false);
});

test("missing Speech configuration remains unavailable rather than returning simulated audio", () => {
  expect(createOciSpeech({ NODE_ENV: "test" })).toBeNull();
});
