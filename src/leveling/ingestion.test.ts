import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseGatsby } from "./gatsby.ts";
import { splitOriginalSentences } from "./content.ts";
import { ingestGatsby } from "./ingestion.ts";

const source = readFileSync(new URL("../data/gatsby/pg64317.txt", import.meta.url), "utf8");
const originals = parseGatsby(source).slice(0, 4);
function metadata(number: number) {
  const sentences = splitOriginalSentences(originals[number - 1].originalText);
  const complexWords: { word: string; meaning: string; originalSentenceIndex: number; quote: string }[] = [];
  for (const [originalSentenceIndex, quote] of sentences.entries()) {
    for (const word of quote.match(/[a-zA-Z]{7,}/g) ?? []) {
      if (complexWords.length < 3 && !complexWords.some((entry) => entry.word.toLowerCase() === word.toLowerCase())) {
        complexWords.push({ word, meaning: `A contextual meaning for ${word}.`, originalSentenceIndex, quote });
      }
    }
    if (complexWords.length === 3) break;
  }
  return {
    keyPoints: sentences.slice(0, 3).map((text, originalSentenceIndex) => ({ text, originalSentenceIndex, quote: text })),
    complexWords, requiredNames: ["Gatsby"], retainedWords: complexWords.map((entry) => entry.word),
  };
}

describe("Gatsby ingestion", () => {
  it("gives the model explicit source indexes so it can cite a full Chapter without counting sentences", async () => {
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      if (data.number === 1) expect(data.sentences[0]).toEqual({
        originalSentenceIndex: 0,
        text: "In my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since.",
      });
      return JSON.stringify(metadata(data.number));
    } });
    expect(content.policies["gatsby-ch1"].originalEvidence.keyPoints[0].originalSentenceIndex).toBe(0);
  });

  it("extracts full original Chapters 1-4 with stable identities and source-backed metadata", async () => {
    const generateText = async (prompt: string) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      return JSON.stringify(metadata(data.number));
    };
    const first = await ingestGatsby(source, { generateText });
    const second = await ingestGatsby(source, { generateText });
    expect(first).toEqual(second);
    expect(first.book.id).toBe("gatsby");
    expect(first.chapters.map((chapter) => chapter.id)).toEqual(["gatsby-ch1", "gatsby-ch2", "gatsby-ch3", "gatsby-ch4"]);
    expect(first.chapters[0].originalText).toBe(originals[0].originalText);
    expect(first.chapters[0].keyPoints).toHaveLength(3);
    expect(first.chapters[0].keyPoints[0].id).toBe("gatsby-ch1-kp1");
    expect(first.policies["gatsby-ch1"].requiredNames).toEqual(["Gatsby"]);
    expect(first.policies["gatsby-ch1"].retainedWords).toEqual(["younger", "vulnerable", "turning"]);
  });

  it.each([
    ["missing Key Points", { ...metadata(1), keyPoints: [] }],
    ["absent contextual word", { ...metadata(1), complexWords: [{ ...metadata(1).complexWords[0], word: "hallucination" }, ...metadata(1).complexWords.slice(1)] }],
    ["invented quote", { ...metadata(1), keyPoints: [{ ...metadata(1).keyPoints[0], quote: "This never happens." }, ...metadata(1).keyPoints.slice(1)] }],
    ["wrong source index", { ...metadata(1), keyPoints: [{ ...metadata(1).keyPoints[0], originalSentenceIndex: 1 }, ...metadata(1).keyPoints.slice(1)] }],
    ["arbitrary exemption", { ...metadata(1), retainedWords: ["younger", "complicated"] }],
    ["missing vocabulary exemption", { ...metadata(1), retainedWords: [] }],
  ])("rejects %s before producing usable seed data", async (_, value) => {
    await expect(ingestGatsby(source, { generateText: async () => JSON.stringify(value) })).rejects.toThrow();
  });

  it("stores the exact original excerpt when a model normalizes quote typography or capitalization", async () => {
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      const value = metadata(data.number);
      if (data.number === 1) value.keyPoints[1].quote = "The advantages that you've had.";
      return JSON.stringify(value);
    } });
    expect(content.policies["gatsby-ch1"].originalEvidence.keyPoints[1]).toEqual({
      keyPointId: "gatsby-ch1-kp2", originalSentenceIndex: 1, quote: "the advantages that you’ve had",
    });
  });

  it("rejects an empty required-name policy instead of silently exempting no names", async () => {
    await expect(ingestGatsby(source, { generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      return JSON.stringify({ ...metadata(data.number), requiredNames: [] });
    } })).rejects.toThrow("policy");
  });

  it("requires at least three contextual Complex Words", async () => {
    await expect(ingestGatsby(source, { generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      const value = metadata(data.number);
      return JSON.stringify({ ...value, complexWords: value.complexWords.slice(0, 1), retainedWords: value.retainedWords.slice(0, 1) });
    } }).then(() => "seed accepted")).rejects.toThrow("Complex Words");
  });

  it("rejects malformed model JSON", async () => {
    await expect(ingestGatsby(source, { generateText: async () => "not JSON" })).rejects.toThrow();
  });

  it("repairs one rejected metadata reply within the same ingestion budget", async () => {
    let first = true;
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      if (first) { first = false; return "not JSON"; }
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      return JSON.stringify(metadata(data.number));
    } });
    expect(content.chapters).toHaveLength(4);
  });

  it("stops after one repair when metadata remains invalid", async () => {
    let calls = 0;
    await expect(ingestGatsby(source, { generateText: async () => {
      calls++;
      return "not JSON";
    } })).rejects.toThrow(SyntaxError);
    expect(calls).toBe(2);
  });

  it("bounds cancellation even when the text provider ignores its signal", async () => {
    const controller = new AbortController();
    const result = ingestGatsby(source, { generateText: () => new Promise(() => {}), signal: controller.signal });
    controller.abort(new Error("cancelled"));
    await expect(result).rejects.toThrow("cancelled");
  });
});
