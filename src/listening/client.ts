"use client";

import type { ListeningEngine, ListeningEvent, ListeningSource, ReadAloudSummary, Token } from "../types";
import { createMockListeningSource } from "../mocks/listening";
import { alignWords } from "./alignment";
import { openBrowserSpeech } from "./web-speech";
import { openOciSpeech } from "./oci";
import type { OpenRecognition } from "./recognition";

/** Browser entry point; the pure server-side summary helpers remain in ./index. */
export function createListeningSource(options: { engine?: ListeningEngine } = {}): ListeningSource {
  const engine = options.engine ?? process.env.NEXT_PUBLIC_LISTENING_ENGINE ?? "mock";
  if (engine === "mock") return createMockListeningSource();
  if (engine !== "web-speech" && engine !== "oci-realtime") throw new Error("Unknown listening engine. Choose mock, oci-realtime or web-speech.");
  return createAlignedSource(engine, engine === "oci-realtime" ? openOciSpeech : openBrowserSpeech);
}

function createAlignedSource(engine: ListeningEngine, open: OpenRecognition): ListeningSource {
  let session: {
    controller: AbortController;
    chunk: { chapterVersionId: string; tokens: Token[] };
    result: ReturnType<typeof alignWords>;
    startedAt: string;
    endedAt?: string;
  } | undefined;
  const summary = (): ReadAloudSummary => ({
    chapterVersionId: session?.chunk.chapterVersionId ?? "",
    ...(session?.result ?? { wordResults: [], misses: [], accuracy: 0 }),
    startedAt: session?.startedAt ?? new Date().toISOString(),
    endedAt: session?.endedAt ?? new Date().toISOString(),
  });
  const stop = async () => {
    if (session && !session.controller.signal.aborted) {
      session.endedAt = new Date().toISOString();
      session.controller.abort();
    }
    return summary();
  };
  return {
    engine,
    async start(chunk, onEvent) {
      void stop();
      if (!chunk.tokens.length) throw new Error("Cannot listen to an empty Chunk.");
      const run = {
        controller: new AbortController(), chunk,
        result: alignWords(chunk.tokens, [], { complete: false }),
        startedAt: new Date().toISOString(),
      };
      session = run;
      const emit = (event: ListeningEvent) => onEvent(event);
      await open(run.controller.signal, snapshot => {
        if (session !== run || run.controller.signal.aborted) return;
        const previous = run.result;
        run.result = alignWords(chunk.tokens, snapshot.words, { complete: false });
        for (const [index, result] of run.result.wordResults.entries()) {
          if (session !== run || run.controller.signal.aborted) return;
          if (JSON.stringify(result) !== JSON.stringify(previous.wordResults[index])) emit({ type: "word", result });
        }
        if (session !== run || run.controller.signal.aborted) return;
        if (snapshot.final && run.result.wordResults.at(-1)?.outcome === "correct") {
          void stop();
          emit({ type: "chunk-complete", summary: summary() });
        }
      }, message => {
        if (session !== run || run.controller.signal.aborted) return;
        void stop();
        emit({ type: "error", message });
      }).catch(error => {
        if (run.controller.signal.aborted) return;
        void stop();
        throw error;
      });
    },
    stop,
  };
}
