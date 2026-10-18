import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "vite";

test("spike serves its page and guards token minting without calling OCI", async () => {
  // This test file has its own Node process; blank credentials before loading config.
  Object.assign(process.env, { OCI_COMPARTMENT_OCID: "", OCI_SPEECH_REGION: "", OCI_REGION: "" });
  const server = await createServer({
    root: import.meta.dirname,
    server: { host: "127.0.0.1", port: 0, strictPort: true },
    logLevel: "error",
  });
  try {
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
    await server.close();
  }
});
