import type { Chapter, ChapterVersion, CheckQuestion } from "../types";
import type { ChapterCheckGenerator } from "./chapter-check-generator";
// ".ts" so R3's CLI can import this file with native Node type stripping (comms 0016).
import { askWithDeadline, describeOciError, jsonObjectIn, type Chat } from "./oci-key-point-grader.ts";

/** Only the served sentences: a question must be answerable from the text the Reader read (comms 0016). */
const questionsPrompt = (chapter: Chapter, version: ChapterVersion) =>
  [
    "You write comprehension questions about a book chapter a reader just read. This is the text they read, one sentence per line:",
    ...version.sentences.map((s) => `[${s.index}] ${s.text}`),
    "The chapter's key points:",
    ...chapter.keyPoints.map((kp) => `${kp.id}: ${kp.text}`),
    "For 2 or 3 of the key points, write one concrete question with exactly one right answer that the text above gives.",
    "Don't put the answer in the question. Give the index of the sentence that answers it, and copy the exact words from that sentence that answer it as the quote.",
    'Reply with only this JSON: {"questions": [{"keyPointId": "...", "question": "...", "sentenceIndex": 0, "quote": "..."}]}',
  ].join("\n");

/**
 * The model's Key Point questions, or null unless every one is grounded: 2–3 distinct real Key
 * Points, each pointing at a served sentence that contains its quote, without the quote in the question.
 */
function groundedQuestions(text: string, chapter: Chapter, version: ChapterVersion): CheckQuestion[] | null {
  const questions = jsonObjectIn(text)?.questions;
  if (!Array.isArray(questions) || questions.length < Math.min(2, chapter.keyPoints.length) || questions.length > 3) return null;

  const keyPointIds = new Set(chapter.keyPoints.map((kp) => kp.id));
  const used = new Set<string>();
  const result: CheckQuestion[] = [];
  for (const [i, q] of questions.entries()) {
    const { keyPointId, question, sentenceIndex, quote } = (q ?? {}) as Record<string, unknown>;
    const sentence = version.sentences.find((s) => s.index === sentenceIndex);
    if (typeof keyPointId !== "string" || !keyPointIds.has(keyPointId) || used.has(keyPointId)) return null;
    if (typeof question !== "string" || !question.trim() || typeof quote !== "string" || !quote.trim()) return null;
    if (!sentence || !sentence.text.includes(quote.trim())) return null;
    if (question.toLowerCase().includes(quote.trim().toLowerCase())) return null;
    used.add(keyPointId);
    result.push({ id: `${version.id}-kp-${i}`, kind: "key-point", prompt: question.trim(), keyPointId, answerSentenceIndex: sentence.index });
  }
  return result;
}

/**
 * OCI Generative AI writes the Key Point questions; Complex Word questions stay deterministic
 * (multiple choice from the Chapter's meanings, graded exactly). Anything not grounded in the
 * served text falls back to the deterministic Check, so the Check still opens.
 */
export function createOciChapterCheckGenerator({ chat, fallback, timeoutMs }: { chat: Chat; fallback: ChapterCheckGenerator; timeoutMs: number }): ChapterCheckGenerator {
  return async (chapter, version) => {
    const base = await fallback(chapter, version);
    try {
      const reply = await askWithDeadline(chat, questionsPrompt(chapter, version), { timeoutMs, maxTokens: 800 });
      const keyPointQuestions = groundedQuestions(reply, chapter, version);
      if (keyPointQuestions) return { ...base, questions: [...keyPointQuestions, ...base.questions.filter((q) => q.kind === "complex-word")] };
      console.warn(`OCI Check generation for ${version.id}: reply not grounded in the served text, using the deterministic Check`);
    } catch (err) {
      console.warn(`OCI Check generation failed for ${version.id} (${describeOciError(err)}), using the deterministic Check`);
    }
    return base;
  };
}
