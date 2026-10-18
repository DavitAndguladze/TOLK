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
    return replyText(await Promise.race([request, aborted]));
  };
}

/**
 * The text of a GENERIC chat response, only if OCI finished it normally (finishReason "stop") and
 * every part is text. A reply cut off at maxTokens ("length") or stopped for any other reason
 * throws, so callers fall back instead of parsing half an answer (comms 0016).
 */
export function replyText(response: unknown): string {
  const choice = (response as { chatResult?: { chatResponse?: { choices?: models.ChatChoice[] } } } | null)?.chatResult?.chatResponse?.choices?.[0];
  if (!choice) throw ociReplyError("OCI Generative AI sent no reply");
  if (choice.finishReason === "length") throw ociReplyError("OCI Generative AI's reply was cut off at maxTokens");
  if (choice.finishReason !== "stop") throw ociReplyError(`OCI Generative AI stopped its reply early (${choice.finishReason})`);

  const parts = choice.message.content ?? [];
  if (parts.some((part) => part.type !== "TEXT")) throw ociReplyError("OCI Generative AI's reply is not text");
  const text = parts.map((part) => (part as models.TextContent).text ?? "").join("");
  if (!text.trim()) throw ociReplyError("OCI Generative AI's reply is empty");
  return text;
}

const ociReplyError = (message: string) => Object.assign(new Error(message), { name: "OciReply" });
