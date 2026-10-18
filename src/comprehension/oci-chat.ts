import { existsSync, readFileSync } from "node:fs";
import { Region, SimpleAuthenticationDetailsProvider } from "oci-common";
import { GenerativeAiInferenceClient, type models } from "oci-generativeaiinference";
import type { Chat } from "./oci-key-point-grader";

/**
 * One-prompt chat with OCI Generative AI's on-demand model (OCI_GENAI_MODEL_ID in OCI_GENAI_REGION),
 * signed with the API key in .env.local. Null when that config or the key file isn't on this
 * machine, so grading falls back to the stand-in instead of failing.
 */
export function createOciChat(env: NodeJS.ProcessEnv = process.env): Chat | null {
  const {
    OCI_TENANCY_OCID: tenancy, OCI_USER_OCID: user, OCI_FINGERPRINT: fingerprint, OCI_PRIVATE_KEY_PATH: keyPath,
    OCI_COMPARTMENT_OCID: compartmentId, OCI_GENAI_REGION: regionId, OCI_GENAI_MODEL_ID: modelId,
  } = env;
  if (!tenancy || !user || !fingerprint || !keyPath || !compartmentId || !regionId || !modelId || !existsSync(keyPath)) return null;

  const region = Region.fromRegionId(regionId);
  const client = new GenerativeAiInferenceClient({
    authenticationDetailsProvider: new SimpleAuthenticationDetailsProvider(tenancy, user, fingerprint, readFileSync(keyPath, "utf8"), null, region),
  });
  client.region = region;

  return async (prompt, { maxTokens = 200, signal } = {}) => {
    signal?.throwIfAborted();
    const text: models.TextContent = { type: "TEXT", text: prompt };
    const request = client.chat({
      chatDetails: {
        compartmentId,
        servingMode: { servingType: "ON_DEMAND", modelId },
        chatRequest: {
          apiFormat: "GENERIC",
          messages: [{ role: "USER", content: [text] }],
          maxTokens,
          temperature: 0,
        },
      },
    });
    // The SDK can't cancel an HTTP call, so an abort only stops waiting for it.
    const aborted = new Promise<never>((_, reject) => signal?.addEventListener("abort", () => reject(signal.reason), { once: true }));
    const response = await Promise.race([request, aborted]);
    if (!response || !("chatResult" in response)) throw new Error("OCI Generative AI returned no chat result");
    const choice = "choices" in response.chatResult.chatResponse ? response.chatResult.chatResponse.choices[0] : undefined;
    const reply = choice?.message.content?.map((c) => ("text" in c ? (c as models.TextContent).text : "")).join("");
    if (!reply) throw new Error("OCI Generative AI returned an empty reply");
    return reply;
  };
}
