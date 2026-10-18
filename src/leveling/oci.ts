import { createHash, createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";

export interface OciTextGeneratorConfig {
  tenancyOcid: string;
  userOcid: string;
  fingerprint: string;
  privateKeyPath: string;
  compartmentOcid: string;
  region: string;
  modelId: string;
  maxTokens?: number;
  timeoutMs?: number;
}

export class OciGenerationError extends Error {
  constructor(readonly code: "configuration" | "request" | "http" | "network" | "response" | "truncated" | "aborted" | "timeout", readonly status?: number) {
    super(`OCI generation failed (${code}${status === undefined ? "" : `, HTTP ${status}`})`);
    this.name = "OciGenerationError";
  }
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new OciGenerationError("response");
  return value as Record<string, unknown>;
}

function responseText(value: unknown): string {
  const chat = record(record(value).chatResponse);
  if (chat.apiFormat !== "GENERIC" || !Array.isArray(chat.choices) || chat.choices.length !== 1) throw new OciGenerationError("response");
  const choice = record(chat.choices[0]);
  if (typeof choice.finishReason !== "string") throw new OciGenerationError("response");
  if (choice.finishReason.toLowerCase() === "length") throw new OciGenerationError("truncated");
  if (choice.finishReason.toLowerCase() !== "stop") throw new OciGenerationError("response");
  const message = record(choice.message);
  if (message.role !== "ASSISTANT" || !Array.isArray(message.content)) throw new OciGenerationError("response");
  const text = message.content.map((part: unknown) => {
    const content = record(part);
    if (content.type !== "TEXT" || typeof content.text !== "string") throw new OciGenerationError("response");
    return content.text;
  }).join("");
  if (!text.trim()) throw new OciGenerationError("response");
  return text;
}

export function createOciTextGenerator(config: OciTextGeneratorConfig) {
  config = { ...config };
  const maxTokens = config.maxTokens ?? 4000;
  const timeoutMs = config.timeoutMs ?? 20_000;
  if (
    ![config.tenancyOcid, config.userOcid, config.compartmentOcid, config.fingerprint, config.privateKeyPath, config.region, config.modelId].every((value) => typeof value === "string" && value.trim()) ||
    !/^ocid1\.tenancy\.[a-zA-Z0-9._-]+$/.test(config.tenancyOcid) ||
    !/^ocid1\.user\.[a-zA-Z0-9._-]+$/.test(config.userOcid) ||
    !/^ocid1\.(compartment|tenancy)\.[a-zA-Z0-9._-]+$/.test(config.compartmentOcid) ||
    !/^(?:[a-f0-9]{2}:){15}[a-f0-9]{2}$/i.test(config.fingerprint) ||
    !/^[a-z]+(?:-[a-z0-9]+)+-\d+$/.test(config.region) ||
    !isAbsolute(config.privateKeyPath) ||
    !Number.isSafeInteger(maxTokens) || maxTokens <= 0 ||
    !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 2 ** 31 - 1
  ) throw new OciGenerationError("configuration");

  let key;
  try {
    key = createPrivateKey(readFileSync(config.privateKeyPath));
    if (key.asymmetricKeyType !== "rsa" || (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048) {
      throw new OciGenerationError("configuration");
    }
  } catch {
    throw new OciGenerationError("configuration");
  }
  const url = new URL(`https://inference.generativeai.${config.region}.oci.oraclecloud.com/20231130/actions/chat`);
  return async (prompt: string, options: { signal?: AbortSignal } = {}): Promise<string> => {
    if (typeof prompt !== "string" || !prompt.trim()) throw new OciGenerationError("request");
    if (options.signal?.aborted) throw new OciGenerationError("aborted");
    const deadline = new AbortController();
    const timeoutError = new OciGenerationError("timeout");
    const timer = setTimeout(() => deadline.abort(timeoutError), timeoutMs);
    const signal = options.signal ? AbortSignal.any([options.signal, deadline.signal]) : deadline.signal;
    try {
      const body = JSON.stringify({
        compartmentId: config.compartmentOcid,
        servingMode: { servingType: "ON_DEMAND", modelId: config.modelId },
        chatRequest: {
          apiFormat: "GENERIC",
          messages: [{ role: "USER", content: [{ type: "TEXT", text: prompt }] }],
          isStream: false,
          numGenerations: 1,
          maxTokens,
          temperature: 0,
        },
      });
      const headers = new Headers({
        date: new Date().toUTCString(),
        host: url.host,
        "content-type": "application/json",
        "content-length": String(Buffer.byteLength(body)),
        "x-content-sha256": createHash("sha256").update(body).digest("base64"),
      });
      const signedHeaders = ["(request-target)", "host", "date", "x-content-sha256", "content-type", "content-length"];
      const signingString = signedHeaders.map((name) => `${name}: ${name === "(request-target)" ? `post ${url.pathname}` : headers.get(name)}`).join("\n");
      const signature = sign("RSA-SHA256", Buffer.from(signingString), key).toString("base64");
      headers.set("authorization", `Signature version="1",keyId="${config.tenancyOcid}/${config.userOcid}/${config.fingerprint}",algorithm="rsa-sha256",headers="${signedHeaders.join(" ")}",signature="${signature}"`);
      const response = await fetch(url, { method: "POST", headers, body, signal, redirect: "error" });
      signal.throwIfAborted();
      if (!response.ok) {
        void response.body?.cancel().catch(() => {});
        throw new OciGenerationError("http", response.status);
      }
      let result: unknown;
      try {
        result = await response.json();
      } catch {
        throw new OciGenerationError("response");
      }
      signal.throwIfAborted();
      return responseText(result);
    } catch (error) {
      if (signal.aborted) throw new OciGenerationError(signal.reason === timeoutError ? "timeout" : "aborted");
      if (error instanceof OciGenerationError) throw error;
      throw new OciGenerationError("network");
    } finally {
      clearTimeout(timer);
    }
  };
}
