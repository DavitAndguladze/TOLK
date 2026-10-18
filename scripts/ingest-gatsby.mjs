import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const [outputArgument, ...extra] = process.argv.slice(2);
if (outputArgument === "--help") {
  console.log("Usage: npm run ingest:gatsby -- [output.json]\nCreates validated Gatsby content only; never connects to the Reader database. Existing output is not overwritten. INGEST_PAUSE_MS spaces serial OCI calls; INGEST_VERSION_BUDGET_MS, INGEST_MAX_ATTEMPTS and INGEST_MAX_TOKENS tune offline generation.");
} else {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Gatsby ingestion failed.");
    for (let cause = error?.cause; cause; cause = cause?.cause) {
      console.error("  caused by:", cause instanceof Error ? cause.message : cause);
    }
    process.exitCode = 1;
  });
}

async function main() {
  if (extra.length || outputArgument?.startsWith("-")) throw new Error("Usage: npm run ingest:gatsby -- [output.json]");
  const output = resolve(outputArgument ?? ".scratch/gatsby-seed.json");
  try {
    await access(output);
    throw new Error(`Output already exists: ${output}. Choose a new file to preserve the previous seed.`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const transport = new URL("../src/comprehension/oci-chat.ts", import.meta.url);
  try {
    await access(transport);
  } catch {
    throw new Error("The shared R4 OCI client is not on this branch yet. Integrate PR #46 and its generation options before running ingestion.");
  }
  const { createOciChat } = await import(transport.href);
  const chat = createOciChat();
  if (!chat) throw new Error("OCI configuration or its private-key file is missing. Set the existing OCI_* variables from .env.example; never commit credentials.");

  const [{ ingestGatsby }, { createChapterGenerator, MAX_OFFLINE_GENERATION_ATTEMPTS }, { generateGatsbySeed }, { generateChapterCheck }, { createOciChapterCheckGenerator }] = await Promise.all([
    import("../src/leveling/ingestion.ts"),
    import("../src/leveling/generator.ts"),
    import("../src/leveling/seed.ts"),
    import("../src/comprehension/chapter-check-generator.ts"),
    import("../src/comprehension/oci-chapter-check-generator.ts"),
  ]);
  const source = await readFile(new URL("../src/data/gatsby/pg64317.txt", import.meta.url), "utf8");
  const vocabulary = JSON.parse(await readFile(new URL("../src/data/vocabulary/english-2018.json", import.meta.url), "utf8"));
  const controller = new AbortController();
  process.once("SIGINT", () => controller.abort(new Error("Ingestion cancelled; no seed was written.")));
  const pauseMs = Number(process.env.INGEST_PAUSE_MS ?? 2_000);
  const versionBudgetMs = Number(process.env.INGEST_VERSION_BUDGET_MS ?? 900_000);
  const maxAttempts = Number(process.env.INGEST_MAX_ATTEMPTS ?? MAX_OFFLINE_GENERATION_ATTEMPTS);
  const maxTokens = Number(process.env.INGEST_MAX_TOKENS ?? 4_096);
  if (!Number.isInteger(pauseMs) || pauseMs < 0) throw new Error("INGEST_PAUSE_MS must be a non-negative integer.");
  if (!Number.isInteger(versionBudgetMs) || versionBudgetMs < 30_000) throw new Error("INGEST_VERSION_BUDGET_MS must be an integer of at least 30000.");
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > MAX_OFFLINE_GENERATION_ATTEMPTS) {
    throw new Error(`INGEST_MAX_ATTEMPTS must be an integer from 1 to ${MAX_OFFLINE_GENERATION_ATTEMPTS}.`);
  }
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 4_096) throw new Error("INGEST_MAX_TOKENS must be an integer from 1 to 4096.");
  let inFlight = 0;
  let completedCalls = 0;
  let callQueue = Promise.resolve();
  const safeMessage = (value) => String(value ?? "(no provider message)")
    .replace(/ocid1\.[a-z0-9._:-]+/gi, "[redacted OCID]")
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/-----BEGIN [^-]*PRIVATE KEY-----[\s\S]*?-----END [^-]*PRIVATE KEY-----/g, "[redacted private key]");
  const safeChat = (prompt, options) => {
    const scheduled = callQueue.then(async () => {
      let rateLimitRetries = 0;
      while (true) {
        options?.signal?.throwIfAborted();
        if (pauseMs > 0) await delay(pauseMs, undefined, { signal: options?.signal });
        options?.signal?.throwIfAborted();
        inFlight++;
        try {
          const result = await chat(prompt, options);
          completedCalls++;
          if (completedCalls % 10 === 0) console.log(`OCI calls completed: ${completedCalls}; in flight: ${inFlight}.`);
          return result;
        } catch (error) {
          options?.signal?.throwIfAborted();
          const status = error?.statusCode ?? error?.status;
          console.error(JSON.stringify({
            event: "OCI call failed",
            timestamp: new Date().toISOString(),
            httpStatus: status ?? null,
            errorCode: error?.serviceCode ?? error?.code ?? null,
            message: safeMessage(error?.message),
            opcRequestId: error?.opcRequestId ?? error?.headers?.["opc-request-id"] ?? null,
            inFlight,
          }));
          if (Number(status) === 429 && rateLimitRetries < 3) {
            const backoffMs = 2_000 * (2 ** rateLimitRetries++);
            console.error(`OCI returned 429; backing off ${backoffMs}ms before the next serial call.`);
            await delay(backoffMs, undefined, { signal: options?.signal });
            continue;
          }
          throw new Error("OCI text generation failed. Verify the model, permissions and configuration without logging credentials or request bodies.");
        } finally {
          inFlight--;
        }
      }
    });
    callQueue = scheduled.catch(() => {});
    return scheduled;
  };
  const generateText = (prompt, options) => safeChat(prompt, { maxTokens, json: true, signal: options?.signal });
  const generateCheck = createOciChapterCheckGenerator({ chat: safeChat, fallback: generateChapterCheck, timeoutMs: 15_000 });
  console.log("Extracting contextual metadata from opening Gatsby excerpts 1-4...");
  const content = await ingestGatsby(source, { generateText, budgetMs: 300_000, signal: controller.signal });
  const generator = createChapterGenerator({
    generateText,
    generateCheck,
    budgetMs: versionBudgetMs,
    // Offline bootstrap has no fallback of its own, so allow extra self-correction time.
    maxAttempts,
    policyForChapter: (chapter) => ({ vocabulary, requiredNames: content.policies[chapter.id].requiredNames,
      retainedWords: content.policies[chapter.id].retainedWords,
      retainedWordEvidence: content.policies[chapter.id].retainedWordEvidence }),
  });
  console.log(`Generating shared L1 Chapter 1 excerpt and 12 validated fallback versions. Offline generation budget: ${Math.round(versionBudgetMs / 60_000)} minutes per version; attempts: ${maxAttempts}.`);
  const seed = await generateGatsbySeed(content, generator, { signal: controller.signal });
  controller.signal.throwIfAborted();
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(seed, null, 2) + "\n", { flag: "wx" });
  console.log(`Saved ${output}. Human review of prose and Checks is required before R6 imports it. No Reader state was changed.`);
}
