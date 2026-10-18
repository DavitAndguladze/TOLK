import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { createServer } from "vite";

test("spike serves its page and guards token minting without calling OCI", async () => {
  // This test file has its own Node process; blank credentials before loading config.
  Object.assign(process.env, { OCI_COMPARTMENT_OCID: "", OCI_SPEECH_REGION: "", OCI_REGION: "" });
  const cacheParent = resolve(tmpdir());
  const cacheDir = await mkdtemp(join(cacheParent, "tolk-spike-smoke-"));
  let server;
  try {
    server = await createServer({
      root: import.meta.dirname, cacheDir,
      server: { host: "127.0.0.1", port: 0, strictPort: true },
      logLevel: "error",
    });
    await server.listen();
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
    const page = await (await fetch(origin)).text();
    assert.match(page, /Live checks have not been run/);
    const module = await fetch(`${origin}/main.ts`);
    assert.equal(module.status, 200);
    assert.match(await module.text(), /AIServiceSpeechRealtimeApi/);
    assert.equal((await fetch(`${origin}/api/speech/token`)).status, 405);
    assert.equal((await fetch(`${origin}/api/speech/token`, { method: "POST" })).status, 403);
    assert.equal((await fetch(`${origin}/api/speech/token`, {
      method: "POST", headers: { Origin: "https://untrusted.example" },
    })).status, 403);
    const missingConfig = await fetch(`${origin}/api/speech/token`, { method: "POST", headers: { Origin: origin } });
    assert.equal(missingConfig.status, 503);
    assert.equal(missingConfig.headers.get("cache-control"), "no-store");
    assert.match((await missingConfig.json()).message, /OCI_COMPARTMENT_OCID/);
  } finally {
    await server?.close();
    assert.ok(resolve(cacheDir).startsWith(`${cacheParent}${sep}tolk-spike-smoke-`));
    await rm(cacheDir, { recursive: true, force: true });
  }
});
