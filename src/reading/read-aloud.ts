import type { ChapterVersion, ListeningSource, ReadAloudSummary, Token } from "../types";
import { mergeReadAloudSummaries } from "../listening/summary";

/** One Reader's attempt. Uses the ListeningSource interface; finish also waits for Pause cleanup. */
export function createReadingAttempt(version: Pick<ChapterVersion, "id" | "tokens">, source: ListeningSource): ListeningSource & {
  finish(): Promise<ReadAloudSummary | null>;
} {
  type Run = { tokens: Token[]; live: boolean; committed: boolean; stopping?: Promise<ReadAloudSummary> };
  let run: Run | undefined;
  let request = 0;
  const fragments: ReadAloudSummary[] = [];
  const commit = (current: Run, summary: ReadAloudSummary) => {
    if (current.committed) return;
    current.committed = true;
    // Mock stop summaries are sparse; a scored reread must replace its entire token scope.
    const scoped = mergeReadAloudSummaries({ id: version.id, tokens: current.tokens }, [summary]);
    if (scoped) fragments.push(scoped);
  };
  const stopRun = (current: Run) => {
    current.live = false;
    return current.stopping ??= source.stop().then(summary => { commit(current, summary); return summary; });
  };
  const stop = () => {
    request++; // Cancel any Start still waiting for the preceding Stop.
    return run ? stopRun(run) : source.stop();
  };
  return {
    engine: source.engine,
    async start(chunk, onEvent) {
      const ticket = ++request;
      if (run) await stopRun(run);
      if (ticket !== request) return;
      const current: Run = { tokens: chunk.tokens, live: true, committed: false };
      run = current;
      try {
        await source.start(chunk, event => {
          if (run !== current || !current.live) return;
          if (event.type === "chunk-complete") { commit(current, event.summary); current.live = false; }
          onEvent(event);
        });
      } catch (error) {
        await stopRun(current);
        throw error;
      }
    },
    stop,
    async finish() {
      if (!run) return null;
      await stop();
      return mergeReadAloudSummaries(version, fragments);
    },
  };
}
