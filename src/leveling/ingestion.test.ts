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
    expect(content.policies["gatsby-full-ch1"].originalEvidence.keyPoints[0].originalSentenceIndex).toBe(0);
  });

  it("extracts full original Chapters 1-4 with stable identities and source-backed metadata", async () => {
    const generateText = async (prompt: string) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      return JSON.stringify(metadata(data.number));
    };
    const first = await ingestGatsby(source, { generateText });
    const second = await ingestGatsby(source, { generateText });
    expect(first).toEqual(second);
    expect(first.book.id).toBe("gatsby-full");
    expect(first.chapters.map((chapter) => chapter.id)).toEqual(["gatsby-full-ch1", "gatsby-full-ch2", "gatsby-full-ch3", "gatsby-full-ch4"]);
    expect(first.chapters[0].originalText).toBe(originals[0].originalText);
    expect(first.chapters[0].keyPoints).toHaveLength(3);
    expect(first.chapters[0].keyPoints[0].id).toBe("gatsby-full-ch1-kp1");
    expect(first.policies["gatsby-full-ch1"].requiredNames).toEqual(["Gatsby"]);
    expect(first.policies["gatsby-full-ch1"].retainedWords).toEqual(["younger", "vulnerable", "turning"]);
  });

  it("retains individually documented source words beyond Check vocabulary without losing their rationale", async () => {
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      const value = metadata(data.number);
      return JSON.stringify(data.number === 1 ? { ...value, retainedWords: [...value.retainedWords, "advice"],
        retainedWordEvidence: [{ word: "advice", originalSentenceIndex: 0, quote: "my father gave me some advice",
          reason: "Preserves that the father's words were guidance for Nick." }],
      } : value);
    } });
    expect(content.policies["gatsby-full-ch1"].retainedWords).toEqual(["younger", "vulnerable", "turning", "advice"]);
    expect(content.policies["gatsby-full-ch1"].retainedWordEvidence).toEqual([{
      word: "advice", originalSentenceIndex: 0, quote: "my father gave me some advice",
      reason: "Preserves that the father's words were guidance for Nick.",
    }]);
    expect(content.chapters[0].complexWords.map((entry) => entry.word)).not.toContain("advice");
  });

  it.each([
    ["missing Key Points", { ...metadata(1), keyPoints: [] }],
    ["absent contextual word", { ...metadata(1), complexWords: [{ ...metadata(1).complexWords[0], word: "hallucination" }, ...metadata(1).complexWords.slice(1)] }],
    ["invented quote", { ...metadata(1), keyPoints: [{ ...metadata(1).keyPoints[0], quote: "This never happens." }, ...metadata(1).keyPoints.slice(1)] }],
    ["wrong source index", { ...metadata(1), keyPoints: [{ ...metadata(1).keyPoints[0], originalSentenceIndex: 1 }, ...metadata(1).keyPoints.slice(1)] }],
    ["arbitrary exemption", { ...metadata(1), retainedWords: ["younger", "complicated"] }],
    ["missing vocabulary exemption", { ...metadata(1), retainedWords: [] }],
    ["invented exception quote", { ...metadata(1), retainedWords: [...metadata(1).retainedWords, "advice"], retainedWordEvidence: [
      { word: "advice", originalSentenceIndex: 0, quote: "He gave good advice.", reason: "Preserves the father's guidance." },
    ] }],
    ["exception without rationale", { ...metadata(1), retainedWords: [...metadata(1).retainedWords, "advice"], retainedWordEvidence: [
      { word: "advice", originalSentenceIndex: 0, quote: "my father gave me some advice", reason: " " },
    ] }],
    ["unlisted exception", { ...metadata(1), retainedWordEvidence: [
      { word: "advice", originalSentenceIndex: 0, quote: "my father gave me some advice", reason: "Preserves the father's guidance." },
    ] }],
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
    expect(content.policies["gatsby-full-ch1"].originalEvidence.keyPoints[1]).toEqual({
      keyPointId: "gatsby-full-ch1-kp2", originalSentenceIndex: 1, quote: "the advantages that you’ve had",
    });
  });

  it("repairs a model-hallucinated full name to whichever word(s) the Chapter actually uses verbatim", async () => {
    // Nick's surname is never followed by his first name anywhere in the real Gutenberg text -
    // the model keeps reaching for the famous book's canonical "Nick Carraway" from its training
    // data instead of what Chapter 1 actually says.
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      const value = metadata(data.number);
      return JSON.stringify(data.number === 1 ? { ...value, requiredNames: [...value.requiredNames, "Nick Carraway"] } : value);
    } });
    expect(content.policies["gatsby-full-ch1"].requiredNames).toEqual(["Gatsby", "Nick", "Carraway"]);
  });

  it("repairs retainedWords when the model drops Complex Words it already extracted", async () => {
    // Real observed model behavior: it extracts 3 Complex Words but echoes only some of them
    // back into retainedWords, even though the prompt asks it to retain every one.
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      const value = metadata(data.number);
      return JSON.stringify(data.number === 1 ? { ...value, retainedWords: value.retainedWords.slice(0, 1) } : value);
    } });
    expect(content.policies["gatsby-full-ch1"].retainedWords).toEqual(expect.arrayContaining(["younger", "vulnerable", "turning"]));
    expect(content.chapters[0].complexWords.map((entry) => entry.word)).toEqual(["younger", "vulnerable", "turning"]);
  });

  it("repairs a Complex Word's dictionary form to the quote's actual inflected form", async () => {
    // Real observed, repeated model behavior: it names "peremptory" (the lemma) for a quote that
    // actually reads "peremptorily" at that exact source index.
    const peremptorilyIndex = splitOriginalSentences(originals[0].originalText)
      .findIndex((sentence) => sentence.includes("peremptorily"));
    expect(peremptorilyIndex).toBeGreaterThanOrEqual(0);
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      const value = metadata(data.number);
      if (data.number !== 1) return JSON.stringify(value);
      const sentence = splitOriginalSentences(originals[0].originalText)[peremptorilyIndex];
      const complexWords = [{ word: "peremptory", meaning: "commanding, allowing no refusal",
        originalSentenceIndex: peremptorilyIndex, quote: sentence }, ...value.complexWords.slice(1)];
      // Omit the lemma from retainedWords too - the separate retainedWords-repair fix adds the
      // final (repaired) word back in, so this only needs to avoid a stale unevidenced leftover.
      return JSON.stringify({ ...value, complexWords, retainedWords: complexWords.slice(1).map((entry) => entry.word) });
    } });
    expect(content.chapters[0].complexWords[0].word).toBe("peremptorily");
  });

  it("repairs a retained-word exception's dictionary form the same way, and keeps retainedWords consistent", async () => {
    // Real observed model behavior: it names "peremptory" in a retainedWordEvidence citation
    // whose own quote only contains "peremptorily" at that index.
    const peremptorilyIndex = splitOriginalSentences(originals[0].originalText)
      .findIndex((sentence) => sentence.includes("peremptorily"));
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      const value = metadata(data.number);
      if (data.number !== 1) return JSON.stringify(value);
      const sentence = splitOriginalSentences(originals[0].originalText)[peremptorilyIndex];
      return JSON.stringify({ ...value, retainedWords: [...value.retainedWords, "peremptory"],
        retainedWordEvidence: [{ word: "peremptory", originalSentenceIndex: peremptorilyIndex, quote: sentence,
          reason: "Shows Daisy's commanding tone." }] });
    } });
    expect(content.policies["gatsby-full-ch1"].retainedWords).toEqual(expect.arrayContaining(["peremptorily"]));
    expect(content.policies["gatsby-full-ch1"].retainedWords).not.toContain("peremptory");
    expect(content.policies["gatsby-full-ch1"].retainedWordEvidence).toEqual([{
      word: "peremptorily", originalSentenceIndex: peremptorilyIndex,
      quote: splitOriginalSentences(originals[0].originalText)[peremptorilyIndex],
      reason: "Shows Daisy's commanding tone.",
    }]);
  });

  it("still rejects a Complex Word whose quote shares nothing with it", async () => {
    await expect(ingestGatsby(source, { generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      const value = metadata(data.number);
      return JSON.stringify(data.number === 1
        ? { ...value, complexWords: [{ ...value.complexWords[0], word: "unrelatedword" }, ...value.complexWords.slice(1)] }
        : value);
    } })).rejects.toThrow("is absent from its quote");
  });

  it("drops a multi-word phrase the model put straight into retainedWords instead of crashing", async () => {
    // Real observed model behavior: putting a whole phrase like "West Egg" directly into
    // retainedWords (not via retainedWordEvidence), which validateRetainedWordPolicy's own
    // single-word check rejects with no chapter context - drop it instead, it is an optional
    // extra allowance, not required content.
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      const value = metadata(data.number);
      return JSON.stringify(data.number === 1 ? { ...value, retainedWords: [...value.retainedWords, "West Egg"] } : value);
    } });
    expect(content.policies["gatsby-full-ch1"].retainedWords).not.toContain("West Egg");
    expect(content.policies["gatsby-full-ch1"].retainedWords).toEqual(expect.arrayContaining(["younger", "vulnerable", "turning"]));
  });

  it("still rejects a name with no word present anywhere in the Chapter", async () => {
    await expect(ingestGatsby(source, { generateText: async (prompt) => {
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      const value = metadata(data.number);
      return JSON.stringify(data.number === 1 ? { ...value, requiredNames: [...value.requiredNames, "Zzyzx Qorvane"] } : value);
    } })).rejects.toThrow("Names not present verbatim");
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

  it("repairs rejected metadata replies within the same ingestion budget", async () => {
    let failuresLeft = 3;
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      if (failuresLeft > 0) { failuresLeft--; return "not JSON"; }
      const data = JSON.parse(prompt.split("DATA:\n")[1]);
      return JSON.stringify(metadata(data.number));
    } });
    expect(content.chapters).toHaveLength(4);
  });

  it("stops after four attempts when metadata remains invalid", async () => {
    let calls = 0;
    await expect(ingestGatsby(source, { generateText: async () => {
      calls++;
      return "not JSON";
    } })).rejects.toThrow(SyntaxError);
    expect(calls).toBe(4);
  });

  it("bounds cancellation even when the text provider ignores its signal", async () => {
    const controller = new AbortController();
    const result = ingestGatsby(source, { generateText: () => new Promise(() => {}), signal: controller.signal });
    controller.abort(new Error("cancelled"));
    await expect(result).rejects.toThrow("cancelled");
  });
});
