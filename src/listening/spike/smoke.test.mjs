import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";

test("spike serves its page and guards token minting without calling OCI", async () => {
  const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "5176"], {
    cwd: import.meta.dirname,
    env: { ...process.env, OCI_COMPARTMENT_OCID: "", OCI_SPEECH_REGION: "", OCI_REGION: "" },
    stdio: "pipe",
  });
  const origin = "http://127.0.0.1:5176";
  let output = "";
  server.stdout.on("data", chunk => { output += chunk; });
  server.stderr.on("data", chunk => { output += chunk; });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { ready = (await fetch(origin)).ok; } catch {}
      if (ready || server.exitCode !== null) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, output);
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
    server.kill();
  }
});
