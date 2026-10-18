import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseGatsby } from "./gatsby.ts";
import { splitOriginalSentences } from "./content.ts";
import { ingestGatsby } from "./ingestion.ts";

const source = readFileSync(new URL("../data/gatsby/pg64317.txt", import.meta.url), "utf8");
const consciousSource = source.replace("In my younger and more vulnerable years", "I was conscious. In my younger and more vulnerable years");
const originals = parseGatsby(source).slice(0, 4);
function promptData(prompt: string): { number: number; sentences: { originalSentenceIndex: number; text: string }[] } {
  return JSON.parse(prompt.split("DATA:\n")[1]);
}
function metadata(number: number, suppliedSentences = splitOriginalSentences(originals[number - 1].originalText)) {
  const sentences = suppliedSentences;
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
    complexWords,
    requiredNames: ["Gatsby", "Tom", "Carraway", "George", "Daisy", "Myrtle"]
      .filter((name) => sentences.join(" ").includes(name)).slice(0, 1),
    retainedWords: complexWords.map((entry) => entry.word),
  };
}

describe("Gatsby ingestion", () => {
  it("gives the model explicit source indexes so it can cite an excerpt without counting sentences", async () => {
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = promptData(prompt);
      if (data.number === 1) expect(data.sentences[0]).toEqual({
        originalSentenceIndex: 0,
        text: "In my younger and more vulnerable years my father gave me some advice that I’ve been turning over in my mind ever since.",
      });
      return JSON.stringify(metadata(data.number, data.sentences.map((row) => row.text)));
    } });
    expect(content.policies["gatsby-excerpts-ch1"].originalEvidence.keyPoints[0].originalSentenceIndex).toBe(0);
  });

  it("extracts opening excerpts 1-4 with stable identities and source-backed metadata", async () => {
    const generateText = async (prompt: string) => {
      const data = promptData(prompt);
      return JSON.stringify(metadata(data.number, data.sentences.map((row) => row.text)));
    };
    const first = await ingestGatsby(source, { generateText });
    const second = await ingestGatsby(source, { generateText });
    expect(first).toEqual(second);
    expect(first.book.id).toBe("gatsby-excerpts");
    expect(first.chapters.map((chapter) => chapter.id)).toEqual(["gatsby-excerpts-ch1", "gatsby-excerpts-ch2", "gatsby-excerpts-ch3", "gatsby-excerpts-ch4"]);
    expect(first.chapters[0].originalText).toBe(originals[0].originalText);
    expect(first.chapters[0].keyPoints).toHaveLength(3);
    expect(first.chapters[0].keyPoints[0].id).toBe("gatsby-excerpts-ch1-kp1");
    expect(first.policies["gatsby-excerpts-ch1"].requiredNames).toEqual(["Gatsby"]);
    expect(first.policies["gatsby-excerpts-ch1"].retainedWords).toEqual(["younger", "vulnerable", "turning"]);
  });

  it("retains individually documented source words beyond Check vocabulary without losing their rationale", async () => {
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = promptData(prompt);
      const value = metadata(data.number, data.sentences.map((row) => row.text));
      return JSON.stringify(data.number === 1 ? { ...value, retainedWords: [...value.retainedWords, "advice"],
        retainedWordEvidence: [{ word: "advice", originalSentenceIndex: 0, quote: "my father gave me some advice",
          reason: "Preserves that the father's words were guidance for Nick." }],
      } : value);
    } });
    expect(content.policies["gatsby-excerpts-ch1"].retainedWords).toEqual(["younger", "vulnerable", "turning", "advice"]);
    expect(content.policies["gatsby-excerpts-ch1"].retainedWordEvidence).toEqual([{
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
      const data = promptData(prompt);
      const value = metadata(data.number, data.sentences.map((row) => row.text));
      if (data.number === 1) value.keyPoints[1].quote = "The advantages that you've had.";
      return JSON.stringify(value);
    } });
    expect(content.policies["gatsby-excerpts-ch1"].originalEvidence.keyPoints[1]).toEqual({
      keyPointId: "gatsby-excerpts-ch1-kp2", originalSentenceIndex: 1, quote: "the advantages that you’ve had",
    });
  });

  it("rejects an invented multiword name even when one generic word occurs in the source", async () => {
    await expect(ingestGatsby(source, { generateText: async (prompt) => {
      const data = promptData(prompt);
      return JSON.stringify({ ...metadata(data.number, data.sentences.map((row) => row.text)), requiredNames: ["New Amsterdam"] });
    } }).then(() => "seed accepted")).rejects.toThrow("Names not present verbatim");
  });

  it("does not substitute a similar-looking word while preserving an unrelated definition", async () => {
    await expect(ingestGatsby(consciousSource, { generateText: async (prompt) => {
      const data = promptData(prompt);
      const value = metadata(data.number, data.sentences.map((row) => row.text));
      if (data.number !== 1) return JSON.stringify(value);
      const index = data.sentences.findIndex((sentence) => /\bconscious\b/.test(sentence.text));
      return JSON.stringify({ ...value, complexWords: [{ word: "conscience", meaning: "The inner sense of moral right and wrong.",
        originalSentenceIndex: index, quote: data.sentences[index].text }, ...value.complexWords.slice(1)],
        retainedWords: value.complexWords.slice(1).map((entry) => entry.word) });
    } }).then(() => "seed accepted")).rejects.toThrow("is absent from its quote");
  });

  it("rejects a retained-word exception that names a different similar-looking source word", async () => {
    await expect(ingestGatsby(consciousSource, { generateText: async (prompt) => {
      const data = promptData(prompt);
      const value = metadata(data.number, data.sentences.map((row) => row.text));
      if (data.number !== 1) return JSON.stringify(value);
      const index = data.sentences.findIndex((sentence) => /\bconscious\b/.test(sentence.text));
      return JSON.stringify({ ...value, retainedWords: [...value.retainedWords, "conscience"],
        retainedWordEvidence: [{ word: "conscience", originalSentenceIndex: index, quote: data.sentences[index].text,
          reason: "Preserves the inner sense of moral right and wrong." }] });
    } }).then(() => "seed accepted")).rejects.toThrow("conscience");
  });

  it("requests corrected exact names instead of inventing a shorter name policy", async () => {
    let chapterOneReplies = 0;
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = promptData(prompt);
      const value = metadata(data.number, data.sentences.map((row) => row.text));
      if (data.number !== 1) return JSON.stringify(value);
      return JSON.stringify({ ...value, requiredNames: chapterOneReplies++ === 0 ? ["Nick Carraway"] : ["Gatsby"] });
    } });
    expect(content.policies["gatsby-excerpts-ch1"].requiredNames).toEqual(["Gatsby"]);
  });

  it("repairs retainedWords when the model drops Complex Words it already extracted", async () => {
    // Real observed model behavior: it extracts 3 Complex Words but echoes only some of them
    // back into retainedWords, even though the prompt asks it to retain every one.
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = promptData(prompt);
      const value = metadata(data.number, data.sentences.map((row) => row.text));
      return JSON.stringify(data.number === 1 ? { ...value, retainedWords: value.retainedWords.slice(0, 1) } : value);
    } });
    expect(content.policies["gatsby-excerpts-ch1"].retainedWords).toEqual(expect.arrayContaining(["younger", "vulnerable", "turning"]));
    expect(content.chapters[0].complexWords.map((entry) => entry.word)).toEqual(["younger", "vulnerable", "turning"]);
  });

  it("recovers through a corrected source word, contextual meaning and retained-word echo", async () => {
    const index = splitOriginalSentences(originals[0].originalText).findIndex((sentence) => sentence.includes("frequently"));
    expect(index).toBeGreaterThanOrEqual(0);
    let chapterOneReplies = 0;
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = promptData(prompt);
      const value = metadata(data.number, data.sentences.map((row) => row.text));
      if (data.number !== 1) return JSON.stringify(value);
      const corrected = chapterOneReplies++ > 0;
      const complexWords = [{ word: corrected ? "frequently" : "frequent",
        meaning: corrected ? "Happening often." : "Happening often.",
        originalSentenceIndex: index, quote: splitOriginalSentences(originals[0].originalText)[index] }, ...value.complexWords.slice(1)];
      return JSON.stringify({ ...value, complexWords, retainedWords: complexWords.map((entry) => entry.word) });
    } });
    expect(content.chapters[0].complexWords[0]).toEqual({ word: "frequently", meaning: "Happening often." });
    expect(content.policies["gatsby-excerpts-ch1"].retainedWords).toContain("frequently");
    expect(content.policies["gatsby-excerpts-ch1"].retainedWords).not.toContain("frequent");
  });

  it("recovers retained-word evidence only after the model supplies the exact source word", async () => {
    const index = splitOriginalSentences(originals[0].originalText).findIndex((sentence) => sentence.includes("frequently"));
    let chapterOneReplies = 0;
    const content = await ingestGatsby(source, { generateText: async (prompt) => {
      const data = promptData(prompt);
      const value = metadata(data.number, data.sentences.map((row) => row.text));
      if (data.number !== 1) return JSON.stringify(value);
      const word = chapterOneReplies++ === 0 ? "frequent" : "frequently";
      return JSON.stringify({ ...value, retainedWords: [...value.retainedWords, word],
        retainedWordEvidence: [{ word, originalSentenceIndex: index, quote: splitOriginalSentences(originals[0].originalText)[index],
          reason: "Shows Daisy's commanding tone." }] });
    } });
    expect(content.policies["gatsby-excerpts-ch1"].retainedWords).toContain("frequently");
    expect(content.policies["gatsby-excerpts-ch1"].retainedWords).not.toContain("frequent");
    expect(content.policies["gatsby-excerpts-ch1"].retainedWordEvidence?.[0].word).toBe("frequently");
  });

  it("still rejects a Complex Word whose quote shares nothing with it", async () => {
    await expect(ingestGatsby(source, { generateText: async (prompt) => {
      const data = promptData(prompt);
      const value = metadata(data.number, data.sentences.map((row) => row.text));
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
      const data = promptData(prompt);
      const value = metadata(data.number, data.sentences.map((row) => row.text));
      return JSON.stringify(data.number === 1 ? { ...value, retainedWords: [...value.retainedWords, "West Egg"] } : value);
    } });
    expect(content.policies["gatsby-excerpts-ch1"].retainedWords).not.toContain("West Egg");
    expect(content.policies["gatsby-excerpts-ch1"].retainedWords).toEqual(expect.arrayContaining(["younger", "vulnerable", "turning"]));
  });

  it("still rejects a name with no word present anywhere in the Chapter", async () => {
    await expect(ingestGatsby(source, { generateText: async (prompt) => {
      const data = promptData(prompt);
      const value = metadata(data.number, data.sentences.map((row) => row.text));
      return JSON.stringify(data.number === 1 ? { ...value, requiredNames: [...value.requiredNames, "Zzyzx Qorvane"] } : value);
    } })).rejects.toThrow("Names not present verbatim");
  });

  it("rejects an empty required-name policy instead of silently exempting no names", async () => {
    await expect(ingestGatsby(source, { generateText: async (prompt) => {
      const data = promptData(prompt);
      return JSON.stringify({ ...metadata(data.number, data.sentences.map((row) => row.text)), requiredNames: [] });
    } })).rejects.toThrow("policy");
  });

  it("requires at least three contextual Complex Words", async () => {
    await expect(ingestGatsby(source, { generateText: async (prompt) => {
      const data = promptData(prompt);
      const value = metadata(data.number, data.sentences.map((row) => row.text));
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
      const data = promptData(prompt);
      return JSON.stringify(metadata(data.number, data.sentences.map((row) => row.text)));
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
