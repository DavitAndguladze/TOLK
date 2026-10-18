import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, loadEnv } from "vite";
import * as common from "oci-common";
import * as speech from "oci-aispeech";

const repoRoot = resolve(import.meta.dirname, "../../..");

export default defineConfig(() => {
  const env = { ...loadEnv("development", repoRoot, ""), ...process.env };
  return {
    // Keep this standalone experiment independent of the app's Tailwind pipeline.
    css: { postcss: { plugins: [] } },
    server: { port: 5175, strictPort: true, fs: { allow: [repoRoot] } },
    plugins: [{
      name: "spike-speech-token",
      configureServer(server) {
        server.middlewares.use("/api/speech/token", async (req, res) => {
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          // Local experiment only; never expose this unauthenticated route publicly.
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end(JSON.stringify({ message: "Use POST." }));
            return;
          }
          if (!req.headers.origin || req.headers.origin !== `http://${req.headers.host}`) {
            res.statusCode = 403;
            res.end(JSON.stringify({ message: "Same-origin requests only." }));
            return;
          }
          if (!env.OCI_COMPARTMENT_OCID || !(env.OCI_SPEECH_REGION || env.OCI_REGION)) {
            res.statusCode = 503;
            res.end(JSON.stringify({ message: "Set OCI_COMPARTMENT_OCID and OCI_SPEECH_REGION in the repo's .env.local; see the spike README." }));
            return;
          }
          try {
            const region = common.Region.fromRegionId(env.OCI_SPEECH_REGION || env.OCI_REGION!);
            const provider = env.OCI_PRIVATE_KEY_PATH
              ? new common.SimpleAuthenticationDetailsProvider(
                env.OCI_TENANCY_OCID!, env.OCI_USER_OCID!, env.OCI_FINGERPRINT!,
                readFileSync(resolve(repoRoot, env.OCI_PRIVATE_KEY_PATH), "utf8"), null, region,
              )
              : new common.ConfigFileAuthenticationDetailsProvider();
            const client = new speech.AIServiceSpeechClient({ authenticationDetailsProvider: provider });
            client.region = region;
            const response = await client.createRealtimeSessionToken({
              createRealtimeSessionTokenDetails: { compartmentId: env.OCI_COMPARTMENT_OCID },
            });
            const token = response.realtimeSessionToken.token;
            const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
            res.end(JSON.stringify({
              token, region: region.regionId, compartmentId: env.OCI_COMPARTMENT_OCID,
              // Oracle's realtime JWT exp is epoch milliseconds (verified live).
              expiresAt: new Date(payload.exp).toISOString(),
            }));
          } catch {
            res.statusCode = 502;
            res.end(JSON.stringify({ message: "OCI token request failed. Check the server's OCI profile or .env.local credentials, region, and Speech policy." }));
          }
        });
      },
    }],
  };
});
