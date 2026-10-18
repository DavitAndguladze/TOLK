import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const [outputArgument, ...extra] = process.argv.slice(2);
if (outputArgument === "--help") {
  console.log("Usage: npm run ingest:gatsby -- [output.json]\nCreates validated Gatsby content only; never connects to the Reader database. Existing output is not overwritten. Set INGEST_PAUSE_MS to pause before every OCI call.");
} else {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Gatsby ingestion failed.");
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
  const pauseMs = Number(process.env.INGEST_PAUSE_MS ?? 0);
  const safeChat = async (prompt, options) => {
    if (pauseMs > 0) await new Promise((done) => setTimeout(done, pauseMs));
    try {
      return await chat(prompt, options);
    } catch (error) {
      options?.signal?.throwIfAborted();
      // Status, code and request id only: enough for an OCI support ticket, never the prompt or credentials.
      console.error(`OCI call failed ${new Date().toISOString()} status=${error?.statusCode} code=${error?.serviceCode} opcRequestId=${error?.opcRequestId}`);
      throw new Error("OCI text generation failed. Verify the model, permissions and configuration without logging credentials or request bodies.");
    }
  };
  const generateText = (prompt, options) => safeChat(prompt, { maxTokens: 4000, json: true, signal: options?.signal });
  const generateCheck = createOciChapterCheckGenerator({ chat: safeChat, fallback: generateChapterCheck, timeoutMs: 15_000 });
  console.log("Extracting contextual metadata from complete Gatsby Chapters 1-4...");
  const content = await ingestGatsby(source, { generateText, budgetMs: 300_000, signal: controller.signal });
  const generator = createChapterGenerator({
    generateText,
    generateCheck,
    budgetMs: 300_000,
    maxAttempts: MAX_OFFLINE_GENERATION_ATTEMPTS,
    policyForChapter: (chapter) => ({ vocabulary, requiredNames: content.policies[chapter.id].requiredNames,
      retainedWords: content.policies[chapter.id].retainedWords,
      retainedWordEvidence: content.policies[chapter.id].retainedWordEvidence }),
  });
  console.log("Generating shared L1 Chapter 1 and 12 validated fallback versions. Offline generation uses a five-minute budget per version.");
  const seed = await generateGatsbySeed(content, generator, { signal: controller.signal });
  controller.signal.throwIfAborted();
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(seed, null, 2) + "\n", { flag: "wx" });
  console.log(`Saved ${output}. Human review of prose and Checks is required before R6 imports it. No Reader state was changed.`);
}
