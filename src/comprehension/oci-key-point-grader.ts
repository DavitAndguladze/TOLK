import type { KeyPointGrader } from "./grade-check";

/**
 * One prompt in, the model's text out. createOciChat implements it with OCI Generative AI.
 * `signal` aborts the wait (comms 0016: R3's generator has one overall deadline).
 */
export type Chat = (prompt: string, options?: { maxTokens?: number; signal?: AbortSignal }) => Promise<string>;

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

/** The JSON object in a model's reply, or null. Models often wrap it in a code fence or a sentence: take the outermost {...}. */
export function jsonObjectIn(text: string): Record<string, unknown> | null {
  try {
    const value: unknown = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The model's reply as a grade, or null when it isn't one we can trust. */
function parseReply(text: string): Awaited<ReturnType<KeyPointGrader>> | null {
  const reply = jsonObjectIn(text);
  if (!reply) return null;
  const { grade, feedback } = reply;
  if ((grade !== 0 && grade !== 1 && grade !== 2) || typeof feedback !== "string" || !feedback.trim()) return null;
  return { grade, feedback: feedback.trim(), gradedBy: "oci-generative-ai" };
}

/** Asks `chat`, rejecting (and aborting its signal) when no reply comes within `timeoutMs`. */
export async function askWithDeadline(chat: Chat, prompt: string, { timeoutMs, maxTokens }: { timeoutMs: number; maxTokens?: number }): Promise<string> {
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(new Error(`no reply within ${timeoutMs} ms`)), timeoutMs);
  const timedOut = new Promise<never>((_, reject) => deadline.signal.addEventListener("abort", () => reject(deadline.signal.reason)));
  try {
    return await Promise.race([chat(prompt, { maxTokens, signal: deadline.signal }), timedOut]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The AI half of grading (spec: "OCI Generative AI grades each answer 0–2 with a one-line feedback").
 * Any reply it can't trust falls back to `fallback`, so a Reader always gets a result.
 */
export function createOciKeyPointGrader({ chat, fallback, timeoutMs }: { chat: Chat; fallback: KeyPointGrader; timeoutMs: number }): KeyPointGrader {
  return async (input) => {
    try {
      const graded = parseReply(await askWithDeadline(chat, gradingPrompt(input), { timeoutMs }));
      if (graded) return graded;
      console.warn(`OCI grading: unusable reply for question ${input.question.id}, using the stand-in`);
    } catch (err) {
      console.warn(`OCI grading failed for question ${input.question.id}, using the stand-in:`, err);
    }
    return fallback(input);
  };
}
