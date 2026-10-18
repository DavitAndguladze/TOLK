"use client";

import { Fragment, useEffect, useReducer, useRef, type ReactNode } from "react";
import type { ListeningSource, Token, WordOutcome } from "../types";
import { createMockListeningSource } from "../mocks";
import type { Chunk } from "./chunk";
import { initialReadingState, readingReducer, unreadTokens } from "./session";

// R1's engine factory replaces this (#10). The scripted misses and pause show every word state on stage.
const createListeningSource = () =>
  createMockListeningSource({ wordIntervalMs: 380, mispronounce: [8], skip: [27], hesitateOn: 21 });

const button =
  "min-h-13 cursor-pointer rounded-2xl text-base font-semibold transition outline-light focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100";
const stepButton = `${button} grid w-13 place-items-center border border-hairline bg-white/60 text-ink hover:bg-white disabled:bg-transparent disabled:text-fog/50`;

const outcomeClass: Record<WordOutcome, string> = {
  pending: "",
  correct: "text-light",
  mispronounced: "underline decoration-gold decoration-wavy decoration-2 underline-offset-[7px]",
  skipped: "text-fog underline decoration-fog/70 decoration-dotted decoration-2 underline-offset-[7px]",
};

function Word({ token, outcome, latest, stuck }: { token: Token; outcome: WordOutcome; latest: boolean; stuck: boolean }) {
  return (
    <span
      className={`-mx-0.5 rounded-md px-0.5 transition-colors duration-200 ${outcomeClass[outcome]} ${
        latest ? "bg-glow/45" : ""
      } ${stuck ? "animate-pulse bg-gold/15 ring-2 ring-gold/60" : ""}`}
    >
      {token.text}
      {(outcome === "mispronounced" || outcome === "skipped") && <span className="sr-only"> ({outcome})</span>}
    </span>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const MIC = "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM19 11a7 7 0 0 1-14 0M12 18v3";
const PAUSE = "M9 5v14M15 5v14";

/** `chapterCheck` replaces the placeholder card when the Chapter ends (R4's Chapter Check, #11). */
export function ReadingScreen({
  chapterVersionId,
  chunks,
  chapterCheck,
}: {
  chapterVersionId: string;
  chunks: Chunk[];
  chapterCheck?: ReactNode;
}) {
  const [state, dispatch] = useReducer(readingReducer, chunks.length, initialReadingState);
  const source = useRef<ListeningSource>(null);
  const chunk = chunks[state.chunkIndex];
  const listening = state.status === "listening";

  useEffect(() => {
    if (!listening) return;
    source.current ??= createListeningSource();
    const active = source.current;
    const unread = unreadTokens(chunk, state);
    let live = true;
    active
      .start({ chapterVersionId, tokens: unread.length ? unread : chunk.tokens }, (event) => live && dispatch({ type: "listening", event }))
      .catch((e: unknown) => live && dispatch({ type: "listening", event: { type: "error", message: String(e) } }));
    return () => {
      live = false;
      void active.stop();
    };
    // Restart only when listening starts or the Chunk changes, never on each word.
  }, [listening, state.chunkIndex]);

  if (state.status === "chapter-done") {
    const tokens = chunks.flatMap((c) => c.tokens);
    const clear = tokens.filter((t) => state.outcomes[t.index] === "correct").length;
    const missed = tokens.filter((t) => state.outcomes[t.index] === "mispronounced" || state.outcomes[t.index] === "skipped");
    const practice = [...new Set(missed.map((t) => t.normalized).filter(Boolean))];
    return (
      <section aria-live="polite" className="mx-auto max-w-xl animate-page-in px-6 pt-10 pb-12">
        <h2 className="font-book text-[1.75rem] leading-tight">You reached the end of the Chapter.</h2>
        <p className="mt-3 text-lg text-fog">
          {tokens.some((t) => state.outcomes[t.index])
            ? `${clear} of ${tokens.length} words came through clearly.`
            : "You read this Chapter without reading it aloud."}
        </p>
        {practice.length > 0 && (
          <>
            <p className="mt-6 font-semibold">Words to practice</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {practice.map((w) => (
                <li key={w} className="rounded-full border border-gold/50 bg-white/60 px-3 py-1 font-book text-lg">
                  {w}
                </li>
              ))}
            </ul>
          </>
        )}
        {chapterCheck ? (
          // The Chapter Check brings its own side padding.
          <div className="-mx-6 mt-8">{chapterCheck}</div>
        ) : (
          <div className="mt-8 rounded-2xl border border-hairline bg-white/60 p-5">
            <p className="font-semibold">Chapter Check</p>
            <p className="mt-1 text-fog">A few questions about what you just read open here next.</p>
          </div>
        )}
      </section>
    );
  }

  const stuckWord = chunk.tokens.find((t) => t.index === state.stuckOn);

  return (
    <>
      <section aria-label="Chapter text" className="px-6 pt-8 pb-52">
        <p key={chunk.index} className="mx-auto max-w-xl animate-page-in font-book text-[1.5625rem] leading-[1.7] text-pretty">
          {chunk.tokens.map((token, i) => (
            <Fragment key={token.index}>
              {i > 0 && " "}
              <Word
                token={token}
                outcome={state.outcomes[token.index] ?? "pending"}
                latest={listening && token.index === state.lastRead}
                stuck={token.index === state.stuckOn}
              />
            </Fragment>
          ))}
        </p>
      </section>

      <footer className="fixed inset-x-0 bottom-0 border-t border-hairline bg-mist/95 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between text-sm text-fog">
            <p aria-live="polite">
              {stuckWord ? (
                <span className="font-semibold text-ink">Take your time with “{stuckWord.normalized || stuckWord.text}”</span>
              ) : state.interrupted ? (
                <span className="font-semibold text-ink">Listening stopped. Tap Resume to try again.</span>
              ) : (
                <>
                  Part {state.chunkIndex + 1} of {chunks.length}
                  {listening && <span className="ml-2 text-light">Listening</span>}
                </>
              )}
            </p>
            <ol aria-hidden className="flex gap-1.5">
              {chunks.map((c) => (
                <li key={c.index} className={`h-1 w-5 rounded-full ${c.index <= state.chunkIndex ? "bg-light" : "bg-hairline"}`} />
              ))}
            </ol>
          </div>
          {state.status === "ready" && state.chunkIndex === 0 && (
            <button
              type="button"
              role="switch"
              aria-checked={state.silent}
              onClick={() => dispatch({ type: "toggle-silent" })}
              className="mt-2 flex items-center gap-2 text-sm text-fog"
            >
              <span aria-hidden className={`relative h-5 w-9 rounded-full transition-colors ${state.silent ? "bg-light" : "bg-hairline"}`}>
                <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform ${state.silent ? "translate-x-4" : ""}`} />
              </span>
              Read silently
            </button>
          )}
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              aria-label="Previous part"
              disabled={listening || state.chunkIndex === 0}
              onClick={() => dispatch({ type: "go-to-chunk", index: state.chunkIndex - 1 })}
              className={stepButton}
            >
              <Icon d="m15 18-6-6 6-6" />
            </button>
            {!state.silent && (
              <button
                type="button"
                onClick={() => dispatch({ type: listening ? "pause" : "read-aloud" })}
                className={`${button} flex flex-1 items-center justify-center gap-2 bg-light text-white hover:bg-[#125f3f]`}
              >
                <Icon d={listening ? PAUSE : MIC} />
                {listening ? "Pause" : state.status === "paused" ? "Resume" : "Read aloud"}
              </button>
            )}
            {state.chunkIndex === chunks.length - 1 ? (
              <button type="button" aria-label="Finish chapter" disabled={listening} onClick={() => dispatch({ type: "finish-chapter" })} className={stepButton}>
                <Icon d="M20 6 9 17l-5-5" />
              </button>
            ) : (
              <button
                type="button"
                aria-label="Next part"
                disabled={listening}
                onClick={() => dispatch({ type: "go-to-chunk", index: state.chunkIndex + 1 })}
                className={stepButton}
              >
                <Icon d="m9 18 6-6-6-6" />
              </button>
            )}
          </div>
        </div>
      </footer>
    </>
  );
}
