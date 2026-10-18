// Mock ListeningSource: "reads" a Chapter Version chunk at a steady pace so the
// Reading UI and grading can be built before real listening lands.
import type { ListeningEvent, ListeningSource, ReadAloudMiss, ReadAloudSummary, Token, WordResult } from "../types";

export interface MockListeningOptions {
  /** ms between words. */
  wordIntervalMs?: number;
  /** Token indexes to mark as mispronounced. */
  mispronounce?: number[];
  /** Token indexes to mark as skipped. */
  skip?: number[];
  /** Token index where the mock pauses long enough to fire a hesitation. */
  hesitateOn?: number;
  hesitationMs?: number;
}

export function createMockListeningSource(opts: MockListeningOptions = {}): ListeningSource {
  // 650ms a word is about 90 words a minute: a calm read-aloud pace the eye can follow (350ms flashed past).
  const { wordIntervalMs = 650, mispronounce = [], skip = [], hesitateOn, hesitationMs = 3200 } = opts;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let results: WordResult[] = [];
  let tokens: Token[] = [];
  let versionId = "";
  let startedAt = "";

  const summary = (): ReadAloudSummary => {
    const misses: ReadAloudMiss[] = results
      .filter((r) => r.outcome === "mispronounced" || r.outcome === "skipped")
      .map((r) => ({ word: tokens.find((t) => t.index === r.tokenIndex)!.normalized, tokenIndex: r.tokenIndex, kind: r.outcome as ReadAloudMiss["kind"] }));
    const correct = results.filter((r) => r.outcome === "correct").length;
    return {
      chapterVersionId: versionId,
      accuracy: tokens.length ? correct / tokens.length : 0,
      wordResults: results,
      misses,
      startedAt,
      endedAt: new Date().toISOString(),
    };
  };

  return {
    engine: "mock",
    async start(chunk, onEvent: (e: ListeningEvent) => void) {
      ({ tokens } = chunk);
      versionId = chunk.chapterVersionId;
      results = [];
      startedAt = new Date().toISOString();
      let i = 0;
      let clock = 0;
      const next = () => {
        if (i >= tokens.length) {
          onEvent({ type: "chunk-complete", summary: summary() });
          return;
        }
        const token = tokens[i];
        const pause = token.index === hesitateOn ? hesitationMs : 0;
        if (pause) onEvent({ type: "hesitation", tokenIndex: token.index, ms: pause });
        timer = setTimeout(() => {
          clock += wordIntervalMs + pause;
          const outcome = skip.includes(token.index) ? "skipped" : mispronounce.includes(token.index) ? "mispronounced" : "correct";
          const result: WordResult = {
            tokenIndex: token.index,
            outcome,
            heard: outcome === "mispronounced" ? token.normalized.slice(0, 3) : undefined,
            startMs: clock - wordIntervalMs,
            endMs: clock,
            confidence: outcome === "correct" ? 0.94 : 0.4,
            hesitationMs: pause,
          };
          results.push(result);
          onEvent({ type: "word", result });
          i += 1;
          next();
        }, wordIntervalMs + pause);
      };
      next();
    },
    async stop() {
      if (timer) clearTimeout(timer);
      return summary();
    },
  };
}
