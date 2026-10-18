import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test, vi } from "vitest";
import { createOciSpeech, isSpeakableWord } from "./oci-speech";

test("pronunciation accepts one word, including names and contractions, but never a passage or SSML", () => {
  for (const word of ["advice", "Gatsby", "don't", "self-conscious"]) expect(isSpeakableWord(word)).toBe(true);
  for (const text of [null, "", "read this chapter", "<speak>hello</speak>", "x".repeat(81)]) expect(isSpeakableWord(text)).toBe(false);
});

test("missing Speech configuration remains unavailable rather than returning simulated audio", () => {
  expect(createOciSpeech({ NODE_ENV: "test" })).toBeNull();
});

test("reuses validated pronunciation for repeated and concurrent requests without retaining failures", async () => {
  const directory = mkdtempSync(join(tmpdir(), "tolk-speech-cache-"));
  const keyPath = join(directory, "test.pem");
  writeFileSync(keyPath, generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
  const bytes = new Uint8Array([0x49, 0x44, 0x33, 0x01]);
  const fetch = vi.fn(async () => new Response(bytes));
  vi.stubGlobal("fetch", fetch);
  try {
    const speak = createOciSpeech({ NODE_ENV: "test", OCI_TENANCY_OCID: "test-tenancy", OCI_USER_OCID: "test-user", OCI_FINGERPRINT: "test-fingerprint", OCI_PRIVATE_KEY_PATH: keyPath, OCI_COMPARTMENT_OCID: "test-compartment", OCI_REGION: "us-chicago-1" })!;
    const [first, second] = await Promise.all([speak("father"), speak("father")]);
    expect(new Uint8Array(first)).toEqual(bytes);
    expect(new Uint8Array(second)).toEqual(bytes);
    expect(fetch).toHaveBeenCalledOnce();
    fetch.mockRejectedValue(new Error("provider unavailable"));
    expect(new Uint8Array(await speak("father"))).toEqual(bytes);
    await expect(speak("mother")).rejects.toThrow("provider unavailable");
    fetch.mockImplementation(async () => new Response(bytes));
    expect(new Uint8Array(await speak("mother"))).toEqual(bytes);
    expect(fetch).toHaveBeenCalledTimes(3);
    fetch.mockImplementation(async () => new Response("invalid audio"));
    await expect(speak("advice")).rejects.toThrow("invalid audio");
    fetch.mockImplementation(async () => new Response(bytes));
    expect(new Uint8Array(await speak("advice"))).toEqual(bytes);
    for (let index = 0; index < 32; index++) await speak(`word${index}`);
    fetch.mockRejectedValue(new Error("old entry was evicted"));
    await expect(speak("father")).rejects.toThrow("old entry was evicted");
    await expect(speak("read this sentence")).rejects.toThrow("Choose one word");
  } finally {
    vi.unstubAllGlobals();
    rmSync(directory, { recursive: true });
  }
});
