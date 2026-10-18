import type { ChapterVersion, ReadAloudSummary, WordResult } from "../types";

export class ReadAloudValidationError extends Error {}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ReadAloudValidationError("Expected a read-aloud object.");
  return value as Record<string, unknown>;
}

function optionalFinite(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) throw new ReadAloudValidationError("Invalid word evidence number.");
  return value;
}

function parseSessionTime(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match) throw new ReadAloudValidationError("Session times need an explicit timezone.");
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const calendar = new Date(0);
  calendar.setUTCFullYear(year, month - 1, day);
  const time = Date.parse(value);
  if (calendar.getUTCFullYear() !== year || calendar.getUTCMonth() !== month - 1 || calendar.getUTCDate() !== day
    || hour > 23 || minute > 59 || second > 59 || !Number.isFinite(time)) {
    throw new ReadAloudValidationError("Invalid read-aloud calendar time.");
  }
  return time;
}

/** R6 supplies the authoritative version and handles Reader authorization before saving this clean result. */
export function validateReadAloudSummary(
  version: Pick<ChapterVersion, "id" | "tokens">,
  input: unknown,
): ReadAloudSummary {
  const value = asRecord(input);
  if (typeof value.chapterVersionId !== "string" || typeof value.startedAt !== "string" || typeof value.endedAt !== "string" || !Array.isArray(value.wordResults)) {
    throw new ReadAloudValidationError("Invalid read-aloud summary fields.");
  }
  const cleaned: ReadAloudSummary = {
    chapterVersionId: value.chapterVersionId, startedAt: value.startedAt, endedAt: value.endedAt, accuracy: 0, misses: [],
    wordResults: value.wordResults.map(inputWord => {
      const word = asRecord(inputWord);
      const outcome = word.outcome;
      if (typeof word.tokenIndex !== "number" || !Number.isInteger(word.tokenIndex)
        || (outcome !== "pending" && outcome !== "correct" && outcome !== "mispronounced" && outcome !== "skipped")
        || typeof word.hesitationMs !== "number" || !Number.isFinite(word.hesitationMs) || word.hesitationMs < 0
        || (word.heard !== undefined && typeof word.heard !== "string")) {
        throw new ReadAloudValidationError("Invalid read-aloud word result.");
      }
      const startMs = optionalFinite(word.startMs), endMs = optionalFinite(word.endMs), confidence = optionalFinite(word.confidence);
      if ((startMs === undefined) !== (endMs === undefined) || (startMs !== undefined && endMs !== undefined && (startMs < 0 || endMs < startMs))) {
        throw new ReadAloudValidationError("Invalid word timing bounds.");
      }
      return {
        tokenIndex: word.tokenIndex, outcome, hesitationMs: word.hesitationMs,
        ...(word.heard === undefined ? {} : { heard: word.heard }),
        ...(startMs === undefined ? {} : { startMs }), ...(endMs === undefined ? {} : { endMs }),
        ...(confidence === undefined ? {} : { confidence }),
      };
    }),
  };
  const summary = mergeReadAloudSummaries(version, [cleaned]);
  if (!summary) throw new ReadAloudValidationError("No scored read-aloud words.");
  return summary;
}

/** Merge committed stop/completion fragments for one attempt in caller-provided order; later outcomes replace earlier ones. */
export function mergeReadAloudSummaries(
  version: Pick<ChapterVersion, "id" | "tokens">,
  parts: readonly ReadAloudSummary[],
): ReadAloudSummary | null {
  const tokenIndexes = new Set(version.tokens.map(token => token.index));
  for (const part of parts) {
    if (part.chapterVersionId !== version.id) throw new ReadAloudValidationError("Wrong Chapter Version.");
    const start = parseSessionTime(part.startedAt), end = parseSessionTime(part.endedAt);
    if (end < start) {
      throw new ReadAloudValidationError("Invalid read-aloud session times.");
    }
    const seen = new Set<number>();
    for (const word of part.wordResults) {
      if (!tokenIndexes.has(word.tokenIndex) || seen.has(word.tokenIndex)) throw new ReadAloudValidationError("Unknown or duplicate token index.");
      seen.add(word.tokenIndex);
    }
  }
  const scored = parts.filter(part => part.wordResults.some(word => word.outcome !== "pending"));
  if (!scored.length) return null;
  const latest = new Map<number, WordResult>();
  for (const part of scored) for (const word of part.wordResults) latest.set(word.tokenIndex, { ...word });
  const wordResults = version.tokens.map(token => latest.get(token.index) ?? { tokenIndex: token.index, outcome: "pending" as const, hesitationMs: 0 });
  const misses = wordResults.flatMap((word, index) => word.outcome === "mispronounced" || word.outcome === "skipped"
    ? [{ word: version.tokens[index].normalized, tokenIndex: word.tokenIndex, kind: word.outcome }] : []);
  return {
    chapterVersionId: version.id, wordResults, misses,
    accuracy: version.tokens.length ? wordResults.filter(word => word.outcome === "correct").length / version.tokens.length : 0,
    startedAt: new Date(Math.min(...scored.map(part => Date.parse(part.startedAt)))).toISOString(),
    endedAt: new Date(Math.max(...scored.map(part => Date.parse(part.endedAt)))).toISOString(),
  };
}
