import { createHash, generateKeyPairSync, verify } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { createOciTextGenerator, OciGenerationError, type OciTextGeneratorConfig } from "./oci";

const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const directory = mkdtempSync(join(tmpdir(), "tolk-oci-test-"));
const config: OciTextGeneratorConfig = {
  tenancyOcid: "ocid1.tenancy.oc1..example",
  userOcid: "ocid1.user.oc1..example",
  fingerprint: "00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff",
  privateKeyPath: join(directory, "api-key.pem"),
  compartmentOcid: "ocid1.compartment.oc1..example",
  region: "us-chicago-1",
  modelId: "meta.llama-4-maverick-17b-128e-instruct-fp8",
};

function chatResponse(text = "Generated Chapter text", finishReason = "stop") {
  return {
    chatResponse: {
      apiFormat: "GENERIC",
      choices: [{ index: 0, finishReason, message: { role: "ASSISTANT", content: [{ type: "TEXT", text }] } }],
    },
  };
}

beforeAll(() => {
  writeFileSync(config.privateKeyPath, keys.privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

afterAll(() => rmSync(directory, { recursive: true, force: true }));

describe("OCI text generation", () => {
  test.each<Partial<OciTextGeneratorConfig>>([
    { tenancyOcid: 'ocid1.tenancy.oc1..bad",headers="injected' },
    { userOcid: "ocid1.user.oc1..bad/other" },
    { fingerprint: "invalid" },
    { compartmentOcid: "" },
    { region: "us-chicago-1.example.com/" },
    { modelId: " " },
    { privateKeyPath: "" },
    { privateKeyPath: "~/api-key.pem" },
    { maxTokens: 0 },
    { maxTokens: 1.5 },
    { maxTokens: Infinity },
    { timeoutMs: 0 },
    { timeoutMs: NaN },
    { timeoutMs: 2 ** 31 },
  ])("rejects unsafe or incomplete configuration before reading keys or sending a request: %j", (invalid) => {
    expect(() => createOciTextGenerator({ ...config, ...invalid })).toThrow("OCI generation failed (configuration)");
  });

  test("rejects missing, malformed, non-RSA, and undersized keys without exposing paths or key data", () => {
    const otherKeys = [
      "sensitive invalid key contents",
      generateKeyPairSync("ec", { namedCurve: "prime256v1" }).privateKey.export({ type: "pkcs8", format: "pem" }),
      generateKeyPairSync("rsa", { modulusLength: 1024 }).privateKey.export({ type: "pkcs8", format: "pem" }),
    ];
    const privateKeyPath = join(directory, "private-key.pem");
    expect(() => createOciTextGenerator({ ...config, privateKeyPath })).toThrow("OCI generation failed (configuration)");
    for (const contents of otherKeys) {
      writeFileSync(privateKeyPath, contents, { mode: 0o600 });
      expect(() => createOciTextGenerator({ ...config, privateKeyPath })).toThrow("OCI generation failed (configuration)");
    }
  });

  test("sends a verifiable signed generic chat request and returns the assistant's text", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T00:00:00Z"));
    let sent: Request | undefined;
    vi.stubGlobal("fetch", async (input: RequestInfo | URL, init?: RequestInit) => {
      sent = new Request(input, init);
      return Response.json(chatResponse());
    });

    const text = await createOciTextGenerator(config)("Rewrite Gatsby’s café scene.");

    expect(text).toBe("Generated Chapter text");
    expect(sent?.url).toBe("https://inference.generativeai.us-chicago-1.oci.oraclecloud.com/20231130/actions/chat");
    expect(sent?.method).toBe("POST");
    expect(sent?.redirect).toBe("error");
    const request = sent!;
    const body = await request.text();
    expect(JSON.parse(body)).toEqual({
      compartmentId: config.compartmentOcid,
      servingMode: { servingType: "ON_DEMAND", modelId: config.modelId },
      chatRequest: {
        apiFormat: "GENERIC",
        messages: [{ role: "USER", content: [{ type: "TEXT", text: "Rewrite Gatsby’s café scene." }] }],
        isStream: false,
        numGenerations: 1,
        maxTokens: 4000,
        temperature: 0,
      },
    });
    expect(request.headers.get("content-length")).toBe(String(Buffer.byteLength(body)));
    expect(request.headers.get("x-content-sha256")).toBe(createHash("sha256").update(body).digest("base64"));
    expect(request.headers.get("date")).toBe("Sun, 18 Oct 2026 00:00:00 GMT");
    expect(request.headers.get("host")).toBe(new URL(request.url).host);
    expect(request.headers.get("content-type")).toBe("application/json");
    const authorization = request.headers.get("authorization")!;
    expect(authorization).toContain(`keyId="${config.tenancyOcid}/${config.userOcid}/${config.fingerprint}"`);
    expect(authorization).toContain('version="1"');
    expect(authorization).toContain('algorithm="rsa-sha256"');
    const signedHeaders = /headers="([^"]+)"/.exec(authorization)![1].split(" ");
    expect([...signedHeaders].sort()).toEqual(["(request-target)", "content-length", "content-type", "date", "host", "x-content-sha256"]);
    const signingString = signedHeaders.map((name) => `${name}: ${name === "(request-target)" ? "post /20231130/actions/chat" : request.headers.get(name)}`).join("\n");
    const signature = Buffer.from(/signature="([^"]+)"/.exec(authorization)![1], "base64");
    expect(verify("RSA-SHA256", Buffer.from(signingString), keys.publicKey, signature)).toBe(true);
    expect(verify("RSA-SHA256", Buffer.from(signingString + "tampered"), keys.publicKey, signature)).toBe(false);
  });

  test("joins all text content parts without inventing separators and accepts an explicit token budget", async () => {
    const response = chatResponse("  first ", "STOP");
    response.chatResponse.choices[0].message.content.push({ type: "TEXT", text: "second  " });
    vi.stubGlobal("fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(JSON.parse(String(init?.body)).chatRequest.maxTokens).toBe(8000);
      return Response.json(response);
    });

    await expect(createOciTextGenerator({ ...config, maxTokens: 8000 })("prompt")).resolves.toBe("  first second  ");
  });

  test.each([401, 429, 500, 302])("keeps HTTP %s available without including the provider's response body", async (status) => {
    vi.stubGlobal("fetch", async () => new Response("private provider detail", { status }));

    const error = await createOciTextGenerator(config)("private prompt").catch((error: unknown) => error);

    expect(error).toBeInstanceOf(OciGenerationError);
    expect(error).toMatchObject({ code: "http", status, message: `OCI generation failed (http, HTTP ${status})` });
    expect(error).not.toHaveProperty("cause");
  });

  test("does not expose fetch error details", async () => {
    vi.stubGlobal("fetch", async () => { throw new Error("private network detail"); });

    await expect(createOciTextGenerator(config)("private prompt")).rejects.toMatchObject({ code: "network", message: "OCI generation failed (network)" });
  });

  test.each(["length", "LENGTH"])("rejects a %s completion even if its text looks valid", async (reason) => {
    vi.stubGlobal("fetch", async () => Response.json(chatResponse('{"apparently":"valid"}', reason)));

    await expect(createOciTextGenerator(config)("prompt")).rejects.toMatchObject({ code: "truncated" });
  });

  test.each([
    null,
    {},
    { chatResponse: { apiFormat: "COHERE", text: "wrong format" } },
    { chatResponse: { apiFormat: "GENERIC", choices: [] } },
    chatResponse(" \n\t"),
    chatResponse("partial", "content_filter"),
    { chatResponse: { apiFormat: "GENERIC", choices: [{ message: { role: "ASSISTANT", content: [{ type: "TEXT", text: "missing stop reason" }] } }] } },
    { chatResponse: { apiFormat: "GENERIC", choices: [{ finishReason: "stop", message: { role: "USER", content: [{ type: "TEXT", text: "not an answer" }] } }] } },
    { chatResponse: { apiFormat: "GENERIC", choices: [{ finishReason: "stop", message: { role: "ASSISTANT", content: [{ type: "IMAGE", text: "not text" }] } }] } },
    { chatResponse: { apiFormat: "GENERIC", choices: [{ finishReason: "stop", message: { role: "ASSISTANT", content: [{ type: "TEXT", text: 42 }] } }] } },
  ])("rejects unusable response data without trusting a typed cast: %j", async (payload) => {
    vi.stubGlobal("fetch", async () => Response.json(payload));

    await expect(createOciTextGenerator(config)("prompt")).rejects.toMatchObject({ code: "response" });
  });

  test("sanitizes malformed JSON errors", async () => {
    vi.stubGlobal("fetch", async () => new Response("private malformed response"));

    await expect(createOciTextGenerator(config)("prompt")).rejects.toMatchObject({ code: "response", message: "OCI generation failed (response)" });
  });

  test("rejects an empty prompt without sending a request", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    await expect(createOciTextGenerator(config)(" \n")).rejects.toMatchObject({ code: "request" });
    expect(fetch).not.toHaveBeenCalled();
  });

  test("does not send a pre-cancelled request or expose the caller's abort reason", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);

    await expect(createOciTextGenerator(config)("prompt", { signal: AbortSignal.abort("private reason") })).rejects.toMatchObject({ code: "aborted", message: "OCI generation failed (aborted)" });
    expect(fetch).not.toHaveBeenCalled();
  });

  test("cancels the in-flight fetch when the caller aborts", async () => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal | null | undefined;
    vi.stubGlobal("fetch", (_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      requestSignal = init?.signal;
      requestSignal?.addEventListener("abort", () => reject(requestSignal?.reason), { once: true });
    }));
    const controller = new AbortController();
    const pending = createOciTextGenerator(config)("prompt", { signal: controller.signal });
    const rejected = expect(pending).rejects.toMatchObject({ code: "aborted" });

    controller.abort(new Error("private reason"));

    await rejected;
    expect(requestSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  test.each([[undefined, 20_000], [50, 50]])("bounds an unfinished request using timeoutMs=%s", async (timeoutMs, duration) => {
    vi.useFakeTimers();
    let requestSignal: AbortSignal | null | undefined;
    vi.stubGlobal("fetch", (_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      requestSignal = init?.signal;
      requestSignal?.addEventListener("abort", () => reject(requestSignal?.reason), { once: true });
    }));
    const pending = createOciTextGenerator({ ...config, timeoutMs })("prompt");
    const rejected = expect(pending).rejects.toMatchObject({ code: "timeout" });

    await vi.advanceTimersByTimeAsync(duration!);

    await rejected;
    expect(requestSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("keeps the deadline active while the response body is being read", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", async (_input: RequestInfo | URL, init?: RequestInit) => new Response(new ReadableStream({
      start(controller) {
        init?.signal?.addEventListener("abort", () => controller.error(new Error("private body detail")), { once: true });
      },
    })));
    const pending = createOciTextGenerator({ ...config, timeoutMs: 50 })("prompt");
    const rejected = expect(pending).rejects.toMatchObject({ code: "timeout" });

    await vi.advanceTimersByTimeAsync(50);

    await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });
});
