import type { KeyPointGrader } from "./grade-check";

/** One prompt in, the model's text out. createOciChat implements it with OCI Generative AI. */
export type Chat = (prompt: string) => Promise<string>;

const gradingPrompt: (input: Parameters<KeyPointGrader>[0]) => string = ({ question, keyPoint, answer, sentence }) =>
  [
    "You grade a reader's answer to a question about a book chapter they just read.",
    `Question: ${question.prompt}`,
    `What the chapter says: ${keyPoint.text}`,
    `The sentence in the text that answers it: ${sentence.text}`,
    `The reader's answer: ${JSON.stringify(answer)}`,
    "Grade 2 if the answer gets what the chapter says, 1 if it is partly right, 0 if it misses it. Spelling, grammar and wording don't matter.",
    "Feedback is one short, kind sentence to the reader. Below 2, say what the chapter says.",
    'Reply with only this JSON: {"grade": 0, 1 or 2, "feedback": "one short sentence"}',
  ].join("\n");

/** The model's reply as a grade, or null when it isn't one we can trust. */
function parseReply(text: string): Awaited<ReturnType<KeyPointGrader>> | null {
  // Models often wrap the JSON in a code fence or a sentence: take the outermost {...}.
  let reply: { grade?: unknown; feedback?: unknown };
  try {
    reply = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  } catch {
    return null;
  }
  const { grade, feedback } = reply;
  if ((grade !== 0 && grade !== 1 && grade !== 2) || typeof feedback !== "string" || !feedback.trim()) return null;
  return { grade, feedback: feedback.trim() };
}

/**
 * The AI half of grading (spec: "OCI Generative AI grades each answer 0–2 with a one-line feedback").
 * Any reply it can't trust falls back to `fallback`, so a Reader always gets a result.
 */
export function createOciKeyPointGrader({ chat, fallback, timeoutMs }: { chat: Chat; fallback: KeyPointGrader; timeoutMs: number }): KeyPointGrader {
  return async (input) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`no reply within ${timeoutMs} ms`)), timeoutMs);
    });
    try {
      const graded = parseReply(await Promise.race([chat(gradingPrompt(input)), timeout]));
      if (graded) return graded;
      console.warn(`OCI grading: unusable reply for question ${input.question.id}, using the stand-in`);
    } catch (err) {
      console.warn(`OCI grading failed for question ${input.question.id}, using the stand-in:`, err);
    } finally {
      clearTimeout(timer);
    }
    return fallback(input);
  };
}
