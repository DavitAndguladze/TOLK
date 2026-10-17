// Mock ListeningSource: "reads" the Page at a steady pace so Reading UI,
// Voice, and the Level engine can be built before real listening lands.
import type { ListeningEvent, ListeningSource, Level, PageReadSummary, PageToken, WordResult } from "../types";

export interface MockListeningOptions {
  /** ms between words. */
  wordIntervalMs?: number;
  /** Token indexes to mark as substituted (e.g. a stumble on "vulnerable"). */
  stumbleOn?: number[];
  /** Token index where the mock pauses long enough to fire a hesitation. */
  hesitateOn?: number;
  hesitationMs?: number;
}

export function createMockListeningSource(opts: MockListeningOptions = {}): ListeningSource {
  const { wordIntervalMs = 350, stumbleOn = [], hesitateOn, hesitationMs = 3200 } = opts;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let results: WordResult[] = [];
  let current: { pageId: string; level: Level; tokens: PageToken[] } | undefined;
  let startedAt = "";

  const summary = (): PageReadSummary => {
    const correct = results.filter((r) => r.outcome === "correct").length;
    return {
      pageId: current?.pageId ?? "",
      level: current?.level ?? 4,
      accuracy: current && current.tokens.length ? correct / current.tokens.length : 0,
      wordResults: results,
      startedAt,
      endedAt: new Date().toISOString(),
    };
  };

  return {
    engine: "mock",
    async start(page, onEvent: (e: ListeningEvent) => void) {
      current = page;
      results = [];
      startedAt = new Date().toISOString();
      let i = 0;
      let clock = 0;
      const next = () => {
        if (i >= page.tokens.length) {
          onEvent({ type: "page-complete", summary: summary() });
          return;
        }
        const token = page.tokens[i];
        const pause = token.index === hesitateOn ? hesitationMs : 0;
        if (pause) onEvent({ type: "hesitation", tokenIndex: token.index, ms: pause });
        timer = setTimeout(() => {
          clock += wordIntervalMs + pause;
          const stumbled = stumbleOn.includes(token.index);
          const result: WordResult = {
            tokenIndex: token.index,
            outcome: stumbled ? "substituted" : "correct",
            heard: stumbled ? token.normalized.slice(0, 3) + "able" : undefined,
            startMs: clock - wordIntervalMs,
            endMs: clock,
            confidence: stumbled ? 0.42 : 0.94,
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
