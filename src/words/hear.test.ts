import { afterEach, expect, test, vi } from "vitest";
import { hear } from "./hear";

afterEach(() => vi.unstubAllGlobals());

test("OCI pronunciation failure remains a failure and does not silently use browser voice", async () => {
  const speak = vi.fn();
  vi.stubGlobal("speechSynthesis", { speak });
  vi.stubGlobal("Audio", class {});
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "unavailable" }, { status: 503 })));
  await expect(hear("advice", new AbortController().signal, () => {})).rejects.toThrow("Pronunciation is unavailable");
  expect(speak).not.toHaveBeenCalled();
});

test("closing the sheet stops its generated audio and releases the temporary audio URL", async () => {
  let audio: { pause: ReturnType<typeof vi.fn> };
  vi.stubGlobal("Audio", class {
    src = "";
    pause = vi.fn();
    removeAttribute() {}
    play() { return Promise.resolve(); }
    constructor() { audio = this; }
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(new Uint8Array([0xff, 0xfb]), { headers: { "Content-Type": "audio/mpeg" } })));
  const revoke = vi.spyOn(URL, "revokeObjectURL");
  const request = new AbortController();
  const started = Promise.withResolvers<void>();
  const playback = hear("advice", request.signal, started.resolve);
  await started.promise;
  request.abort();
  await expect(playback).rejects.toThrow();
  expect(audio!.pause).toHaveBeenCalled();
  expect(revoke).toHaveBeenCalledOnce();
  revoke.mockRestore();
});
