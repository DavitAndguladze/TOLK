import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);

test("token route reports Oracle's millisecond expiry as the actual ISO date", async () => {
  // Live Oracle JWTs observed on 2026-10-17 use epoch milliseconds for exp.
  const token = `header.${Buffer.from(JSON.stringify({ exp: 1735689600000 })).toString("base64url")}.signature`;
  const module = { exports: {} };
  const source = readFileSync(new URL("vite.config.ts", import.meta.url), "utf8")
    .replaceAll("import.meta.dirname", JSON.stringify(import.meta.dirname));
  runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, {
    exports: module.exports, module, Buffer, process: { env: {} },
    require: name => {
      if (name === "vite") return { defineConfig: config => config, loadEnv: () => ({
        OCI_COMPARTMENT_OCID: "test-compartment", OCI_SPEECH_REGION: "us-chicago-1",
      }) };
      if (name === "oci-common") return {
        Region: { fromRegionId: regionId => ({ regionId }) },
        ConfigFileAuthenticationDetailsProvider: class {},
      };
      if (name === "oci-aispeech") return { AIServiceSpeechClient: class {
        async createRealtimeSessionToken() { return { realtimeSessionToken: { token } }; }
      } };
      return require(name);
    },
  });
  let handler;
  const config = module.exports.default();
  config.plugins[0].configureServer({ middlewares: { use(path, callback) {
    assert.equal(path, "/api/speech/token");
    handler = callback;
  } } });
  let body;
  await handler({ method: "POST", headers: { origin: "http://127.0.0.1:5175", host: "127.0.0.1:5175" } }, {
    setHeader() {}, end(value) { body = JSON.parse(value); },
  });
  assert.equal(body.expiresAt, "2025-01-01T00:00:00.000Z");
});
