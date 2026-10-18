import { existsSync, readFileSync } from "node:fs";
import { DefaultRequestSigner, Region, SimpleAuthenticationDetailsProvider, type HttpRequest } from "oci-common";
import { cacheSuccessful } from "./request-cache";

/** Pronunciation is one word, never a Chapter read aloud for the Reader. */
export function isSpeakableWord(text: unknown): text is string {
  return typeof text === "string" && text.length <= 80 && /^[\p{L}\p{N}]+(?:['’–-][\p{L}\p{N}]+)*$/u.test(text);
}

/** OCI Speech's synchronous SynthesizeSpeech API; API keys stay on the server. */
export function createOciSpeech(env: NodeJS.ProcessEnv = process.env) {
  const {
    OCI_TENANCY_OCID: tenancy, OCI_USER_OCID: user, OCI_FINGERPRINT: fingerprint,
    OCI_PRIVATE_KEY_PATH: keyPath, OCI_COMPARTMENT_OCID: compartmentId,
  } = env;
  const regionId = env.OCI_SPEECH_REGION ?? env.OCI_REGION;
  if (!tenancy || !user || !fingerprint || !keyPath || !compartmentId || !regionId || !existsSync(keyPath)) return null;
  const region = Region.fromRegionId(regionId);
  const signer = new DefaultRequestSigner(new SimpleAuthenticationDetailsProvider(tenancy, user, fingerprint, readFileSync(keyPath, "utf8"), null, region));
  const uri = `https://speech.aiservice.${region.regionId}.oci.oraclecloud.com/20220101/actions/synthesizeSpeech`;
  const cached = cacheSuccessful<ArrayBuffer>(32);

  return async (text: string): Promise<ArrayBuffer> => {
    if (!isSpeakableWord(text)) throw new RangeError("Choose one word to hear");
    return cached(text, async () => {
      const request: HttpRequest = {
        method: "POST", uri, headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          text, compartmentId, isStreamEnabled: false,
          configuration: {
            modelFamily: "ORACLE",
            modelDetails: { modelName: "TTS_1_STANDARD", voiceId: "Bob" },
            speechSettings: { textType: "TEXT", sampleRateInHz: 24000, outputFormat: "MP3" },
          },
        }),
      };
      await signer.signHttpRequest(request);
      const response = await fetch(uri, { method: request.method, headers: request.headers, body: request.body, signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw Object.assign(new Error("OCI pronunciation is unavailable"), { name: "OciSpeech", statusCode: response.status });
      const audio = await response.arrayBuffer();
      const bytes = new Uint8Array(audio);
      const mp3 = (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
      if (!mp3 || audio.byteLength > 1024 * 1024) throw new Error("OCI pronunciation returned invalid audio");
      return audio;
    });
  };
}
