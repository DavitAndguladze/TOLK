// Short-lived OCI Speech realtime token for the signed-in Reader's browser (0004, 0022). The API key stays here.
import { existsSync, readFileSync } from "node:fs";
import { AIServiceSpeechClient } from "oci-aispeech";
import { Region, SimpleAuthenticationDetailsProvider } from "oci-common";
import { getReader } from "@/platform/auth";
import type { Api } from "@/types";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST() {
  if (!(await getReader())) return json({ message: "Sign in to read aloud." }, 401);

  const { OCI_TENANCY_OCID: tenancy, OCI_USER_OCID: user, OCI_FINGERPRINT: fingerprint, OCI_PRIVATE_KEY_PATH: keyPath, OCI_COMPARTMENT_OCID: compartmentId } = process.env;
  const regionId = process.env.OCI_SPEECH_REGION || process.env.OCI_REGION;
  if (!tenancy || !user || !fingerprint || !keyPath || !compartmentId || !regionId || !existsSync(keyPath)) {
    return json({ message: "OCI Speech is not configured on this server." }, 503);
  }

  try {
    const region = Region.fromRegionId(regionId);
    const client = new AIServiceSpeechClient({
      authenticationDetailsProvider: new SimpleAuthenticationDetailsProvider(tenancy, user, fingerprint, readFileSync(keyPath, "utf8"), null, region),
    });
    client.region = region;
    const { realtimeSessionToken } = await client.createRealtimeSessionToken({ createRealtimeSessionTokenDetails: { compartmentId } });
    const { token } = realtimeSessionToken;
    // Oracle's realtime JWT `exp` is epoch milliseconds (verified live in R1's spike, #34).
    const { exp } = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()) as { exp: number };
    const body: Api["POST /api/speech/token"]["res"] = { token, region: region.regionId, compartmentId, expiresAt: new Date(exp).toISOString() };
    return json(body);
  } catch (err) {
    console.warn("speech token failed:", err instanceof Error ? err.name : "unknown");
    return json({ message: "OCI Speech token request failed." }, 502);
  }
}
