import type { ReadAloudSummary, Token, WordResult } from "../types";

export interface RecognizedWord {
  text: string;
  startMs?: number;
  endMs?: number;
  confidence?: number;
  /** Supply only when the adapter has established a shared timestamp origin. */
  clockId?: string;
}

type Cell = { cost: number; matches: number; step: "extra" | "skip" | "pair" };
const better = (left: Cell, right: Cell) => left.cost < right.cost || (left.cost === right.cost && left.matches > right.matches);
const normalize = (text: string) => text.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z0-9']/g, "").replace(/^'+|'+$/g, "");
const validTiming = (word: RecognizedWord): word is RecognizedWord & { startMs: number; endMs: number } =>
  typeof word.startMs === "number" && typeof word.endMs === "number" && Number.isFinite(word.startMs)
  && Number.isFinite(word.endMs) && word.startMs >= 0 && word.endMs >= word.startMs;

/**
 * Align one Chunk against the full current recognition hypothesis; replace, do not append, partials.
 * `complete` means the Reader finished the Chunk, not that OCI finalized one utterance.
 * O(tokens × recognized words) space/time: callers supply a Chunk, not an entire Book.
 */
export function alignWords(
  tokens: readonly Token[],
  recognized: readonly RecognizedWord[],
  options: { complete: boolean },
): Pick<ReadAloudSummary, "wordResults" | "misses" | "accuracy"> {
  // Display text retains apostrophes which the shared fixture tokenizer can drop.
  const expected = tokens.map(token => normalize(token.text));
  const spoken = recognized.map(word => normalize(word.text));
  const matrix: Cell[][] = Array.from({ length: spoken.length + 1 }, () => []);
  matrix[0][0] = { cost: 0, matches: 0, step: "pair" };
  for (let j = 1; j <= expected.length; j++) matrix[0][j] = { cost: j, matches: 0, step: "skip" };
  for (let i = 1; i <= spoken.length; i++) {
    matrix[i][0] = { cost: i, matches: 0, step: "extra" };
    for (let j = 1; j <= expected.length; j++) {
      const up = matrix[i - 1][j], left = matrix[i][j - 1], diagonal = matrix[i - 1][j - 1];
      const match = spoken[i - 1] === expected[j - 1];
      const choices: Cell[] = [
        { cost: up.cost + 1, matches: up.matches, step: "extra" },
        { cost: left.cost + 1, matches: left.matches, step: "skip" },
        { cost: diagonal.cost + (match ? 0 : 1), matches: diagonal.matches + Number(match), step: "pair" },
      ];
      matrix[i][j] = choices.reduce((best, next) => better(next, best) ? next : best);
    }
  }
  const wordResults: WordResult[] = tokens.map(token => ({ tokenIndex: token.index, outcome: "pending", hesitationMs: 0 }));
  const paired = new Map<number, number>();
  let i = spoken.length, j = expected.length;
  if (!options.complete) {
    j = 0;
    // Prefer a shorter prefix on a tie: unanchored trailing speech is not a miss.
    for (let end = 1; end <= expected.length; end++) if (better(matrix[i][end], matrix[i][j])) j = end;
  }
  while (i || j) {
    const step = matrix[i][j].step;
    if (step === "extra") { i--; continue; }
    if (step === "skip") { wordResults[--j].outcome = "skipped"; continue; }
    i--; j--;
    paired.set(j, i);
    wordResults[j] = {
      tokenIndex: tokens[j].index,
      outcome: spoken[i] === expected[j] ? "correct" : "mispronounced",
      heard: recognized[i].text, hesitationMs: 0,
    };
  }
  for (let index = 0; index < wordResults.length; index++) {
    const spokenIndex = paired.get(index);
    if (spokenIndex === undefined) continue;
    const word = recognized[spokenIndex];
    const previous = recognized[spokenIndex - 1];
    const result = wordResults[index];
    if (validTiming(word)) {
      result.startMs = word.startMs;
      result.endMs = word.endMs;
      if (word.clockId && word.clockId === previous?.clockId && validTiming(previous)) {
        result.hesitationMs = Math.max(0, word.startMs - previous.endMs);
      }
    }
    if (typeof word.confidence === "number" && Number.isFinite(word.confidence)) result.confidence = word.confidence;
  }
  const misses = wordResults.flatMap((word, index) => word.outcome === "mispronounced" || word.outcome === "skipped"
    ? [{ word: tokens[index].normalized, tokenIndex: word.tokenIndex, kind: word.outcome }] : []);
  return { wordResults, misses, accuracy: tokens.length ? wordResults.filter(word => word.outcome === "correct").length / tokens.length : 0 };
}
