"use client";

import { Fragment, useEffect, useReducer, useRef, useState, type ReactNode } from "react";
import type { Token, WordOutcome } from "../types";
import { createListeningSource } from "../listening/client";
import type { Chunk } from "./chunk";
import { initialReadingState, readingReducer, unreadTokens } from "./session";
import { createReadingAttempt } from "./read-aloud";
import { ChapterReadAloud } from "./ChapterReadAloud";
import motion from "./ReadingMotion.module.css";
import theme from "./ReadingTheme.module.css";
import { Button } from "./ui/Button";
import { ProgressBar } from "./ui/ProgressBar";

const stepButton = "w-13 shrink-0 px-0";
const demoListening = (process.env.NEXT_PUBLIC_LISTENING_ENGINE ?? "mock") === "mock";

const outcomeClass: Record<WordOutcome, string> = {
  pending: "",
  correct: "text-light",
  mispronounced: "underline decoration-gold decoration-wavy decoration-2 underline-offset-[7px]",
  skipped: "text-fog underline decoration-fog/70 decoration-dotted decoration-2 underline-offset-[7px]",
};

function Word({ token, outcome, latest, stuck, flagged, onTap }: { token: Token; outcome: WordOutcome; latest: boolean; stuck: boolean; flagged: boolean; onTap?: () => void }) {
  const missed = outcome === "mispronounced" || outcome === "skipped";
  const className = `-mx-0.5 rounded-md px-0.5 motion-safe:transition-colors motion-safe:duration-200 ${outcomeClass[outcome]} ${latest ? `bg-glow/45 ${motion.readingWordLatest}` : ""} ${stuck ? `bg-gold/15 ring-2 ring-gold/60 ${motion.readingWordAttention}` : ""} ${missed ? `bg-gold/15 ${motion.readingWordAttention}` : ""} ${flagged ? "bg-gold/15 ring-1 ring-gold/60" : ""}`;
  const content = (
    <>
      {token.text}
      {(outcome === "mispronounced" || outcome === "skipped") && <span className="sr-only"> ({outcome})</span>}
      {flagged && <span className="sr-only"> (flagged)</span>}
    </>
  );
  return onTap ? (
    <button type="button" onClick={onTap} className={`${className} cursor-pointer outline-light hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2`}>{content}</button>
  ) : <span className={className}>{content}</span>;
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

interface ReadingScreenProps {
  chapterVersionId: string;
  /** Supplied by the authenticated page. Without it, browser position storage is disabled. */
  readerId?: string;
  chunks: Chunk[];
  chapterCheck?: ReactNode;
  onWordTap?: (token: Token, chapterVersionId: string) => void;
  flaggedTokenIndexes?: ReadonlySet<number>;
}

/** A changed Reader or immutable Version starts a fresh session, including microphone cleanup. */
export function ReadingScreen(props: ReadingScreenProps) {
  return <ChapterReadingScreen key={JSON.stringify([props.readerId ?? null, props.chapterVersionId])} {...props} />;
}

function ChapterReadingScreen({
  chapterVersionId,
  readerId,
  chunks,
  chapterCheck,
  onWordTap,
  flaggedTokenIndexes,
}: ReadingScreenProps) {
  const [state, dispatch] = useReducer(readingReducer, chunks.length, initialReadingState);
  const source = useRef<ReturnType<typeof createReadingAttempt>>(null);
  const [listeningLabel, setListeningLabel] = useState("Connecting…");
  const [positionReady, setPositionReady] = useState(false);
  const [resumedPart, setResumedPart] = useState<number | null>(null);
  const positionKey = readerId ? `tolk-reading-position:${encodeURIComponent(readerId)}:${encodeURIComponent(chapterVersionId)}` : null;
  const chunk = chunks[state.chunkIndex];
  const listening = state.status === "listening";

  useEffect(() => {
    try {
      if (positionKey) {
        const tokenIndex: unknown = JSON.parse(localStorage.getItem(positionKey) ?? "null");
        const index = typeof tokenIndex === "number" && Number.isInteger(tokenIndex)
          ? chunks.findIndex(part => part.tokens.some(token => token.index === tokenIndex)) : -1;
        if (index > 0) {
          dispatch({ type: "restore-position", index });
          setResumedPart(index + 1);
        }
      }
    } catch { /* Unavailable or corrupt browser storage must never prevent reading. */ }
    setPositionReady(true);
    // Reader and Version changes remount this component; only restore once, before interaction.
  }, []);

  useEffect(() => {
    if (!positionReady || !positionKey || !chunk?.tokens.length) return;
    try { localStorage.setItem(positionKey, JSON.stringify(chunk.tokens[0].index)); }
    catch { /* Reading still works when browser storage is full or disabled. */ }
  }, [positionReady, positionKey, chunk]);

  useEffect(() => {
    if (!listening) return;
    setListeningLabel("Connecting…");
    try {
      source.current ??= createReadingAttempt({ id: chapterVersionId, tokens: chunks.flatMap(part => part.tokens) }, createListeningSource());
    } catch {
      dispatch({ type: "listening", event: { type: "error", message: "Listening could not start." } });
      return;
    }
    const active = source.current;
    const unread = unreadTokens(chunk, state);
    const readingTokens = unread.length ? unread : chunk.tokens;
    let live = true;
    let freshEvidence = false;
    active
      .start({ chapterVersionId, tokens: readingTokens }, (event) => {
        if (!live) return;
        if (!freshEvidence && event.type === "word" && event.result.outcome !== "pending") {
          freshEvidence = true;
          // A reread replaces old marks only after it has scored evidence; failed starts preserve them.
          for (const token of readingTokens) dispatch({ type: "listening", event: { type: "word", result: { tokenIndex: token.index, outcome: "pending", hesitationMs: 0 } } });
        }
        dispatch({ type: "listening", event });
      })
      .then(() => { if (live) setListeningLabel(active.engine === "mock" ? "Demo listening" : "Listening"); })
      .catch((e: unknown) => live && dispatch({ type: "listening", event: { type: "error", message: String(e) } }));
    return () => {
      live = false;
      // finish() awaits this same Stop; a failure is surfaced by the save panel at Chapter end.
      void active.stop().catch(() => {});
    };
    // Restart only when listening starts or the Chunk changes, never on each word.
  }, [listening, state.chunkIndex]);

  if (!chunk) return <p role="status" className="px-6 py-8 text-fog">This Chapter has no text ready to read yet.</p>;

  if (state.status === "chapter-done") {
    const tokens = chunks.flatMap((c) => c.tokens);
    const clear = tokens.filter((t) => state.outcomes[t.index] === "correct").length;
    const missed = tokens.filter((t) => state.outcomes[t.index] === "mispronounced" || state.outcomes[t.index] === "skipped");
    const practice = [...new Set(missed.map((t) => t.normalized).filter(Boolean))];
    return (
      <section aria-live="polite" className={`${theme.surface} mx-auto max-w-xl animate-page-in px-6 pt-10 pb-12`}>
        <h2 className="font-book text-[1.75rem] leading-tight">You reached the end of the Chapter.</h2>
        {demoListening && source.current && <p className="mt-3 text-fog">Demo results are simulated. The microphone was not used.</p>}
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
        <ChapterReadAloud attempt={source.current}>{chapterCheck ? (
          // The Chapter Check brings its own side padding.
          <div className="-mx-6 mt-8">{chapterCheck}</div>
        ) : (
          <div className="mt-8 rounded-2xl border border-hairline bg-white/60 p-5">
            <p className="font-semibold">Chapter Check</p>
            <p className="mt-1 text-fog">A few questions about what you just read open here next.</p>
          </div>
        )}</ChapterReadAloud>
      </section>
    );
  }

  const stuckWord = chunk.tokens.find((t) => t.index === state.stuckOn);

  return (
    <div className={theme.surface}>
      <section aria-label="Chapter text" className="px-6 pt-8 pb-72">
        {resumedPart !== null && state.status === "ready" && state.chunkIndex === resumedPart - 1 && (
          <div className="mx-auto mb-6 max-w-xl rounded-2xl border border-hairline bg-white/70 px-4 py-3">
            <p className="text-sm text-ink">Back at part {resumedPart}. Your place was saved on this device.</p>
            <button type="button" onClick={() => { setResumedPart(null); dispatch({ type: "go-to-chunk", index: 0 }); }} className="min-h-11 cursor-pointer text-sm font-semibold text-light underline underline-offset-4 outline-light focus-visible:outline-2 focus-visible:outline-offset-2">Start from the beginning</button>
          </div>
        )}
        <p key={chunk.index} className={`${theme.text} mx-auto max-w-xl animate-page-in text-pretty`}>
          {chunk.tokens.map((token, i) => (
            <Fragment key={token.index}>
              {i > 0 && " "}
              <Word
                token={token}
                outcome={state.outcomes[token.index] ?? "pending"}
                latest={listening && token.index === state.lastRead}
                stuck={token.index === state.stuckOn}
                flagged={flaggedTokenIndexes?.has(token.index) ?? false}
                onTap={!listening && onWordTap ? () => onWordTap(token, chapterVersionId) : undefined}
              />
            </Fragment>
          ))}
        </p>
        {onWordTap && <p className="mx-auto mt-6 max-w-xl text-center text-sm text-fog">{listening ? "Pause to tap a word for help." : "Tap a word for its meaning and pronunciation."}</p>}
        <details className={`${theme.legend} mt-6`}>
          <summary>What do the word marks mean?</summary>
          <p><span className="font-semibold text-light">Blue words</span> {demoListening ? "show simulated clear reading" : "came through clearly"}. A blue background follows your current word.</p>
          <p><span className={outcomeClass.mispronounced}>A wavy underline</span> means a word may need another try. <span className={outcomeClass.skipped}>A dotted underline</span> means it may have been skipped.</p>
          <p>Unmarked words are still waiting. {demoListening ? "Demo marks advance automatically without using the microphone." : "These marks follow your voice."} The Chapter Check also helps decide your Grading Result.</p>
        </details>
      </section>

      <footer className={`${theme.controls} fixed inset-x-0 bottom-0 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]`}>
        <div className="mx-auto max-w-xl">
          {state.listeningError && <p role="alert" className="mb-3 rounded-xl border-l-4 border-gold bg-white/80 px-3 py-2 text-sm text-ink">{state.listeningError}</p>}
          {state.status === "ready" && state.chunkIndex === 0 && <p className="mb-2 text-sm text-fog">Reading aloud is optional. It helps us grade your reading more accurately.</p>}
          {demoListening && !state.silent && <p className="mb-2 text-sm text-ink">Demo playback. Words advance automatically; the microphone is not used.</p>}
          <div className="flex items-center justify-between text-sm text-fog">
            <p aria-live="polite">
              {stuckWord ? (
                <span className="font-semibold text-ink">Take your time with “{stuckWord.normalized || stuckWord.text}”</span>
              ) : state.interrupted ? (
                <span className="font-semibold text-ink">Listening stopped. Tap Resume to try again.</span>
              ) : (
                <>
                  Part {state.chunkIndex + 1} of {chunks.length}
                  {listening && <span className="ml-2 text-light">{listeningLabel}</span>}
                </>
              )}
            </p>
          </div>
          <div className="mt-3"><ProgressBar label="Chapter position" value={state.chunkIndex} max={chunks.length - 1} /></div>
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
            <Button
              type="button"
              variant="secondary"
              aria-label="Previous part"
              disabled={!positionReady || listening || state.chunkIndex === 0}
              onClick={() => dispatch({ type: "go-to-chunk", index: state.chunkIndex - 1 })}
              className={stepButton}
            >
              <Icon d="m15 18-6-6 6-6" />
            </Button>
            {!state.silent && (
              <Button
                type="button"
                onClick={() => dispatch({ type: listening ? "pause" : "read-aloud" })}
                disabled={!positionReady}
                className="min-w-0 flex-1"
              >
                <Icon d={listening ? PAUSE : MIC} />
                {listening ? "Pause" : demoListening ? state.status === "paused" ? "Resume demo" : "Play demo" : state.status === "paused" ? "Resume" : "Read aloud"}
              </Button>
            )}
            {state.chunkIndex === chunks.length - 1 ? (
              <Button type="button" variant="secondary" aria-label="Finish chapter" disabled={!positionReady || listening} onClick={() => dispatch({ type: "finish-chapter" })} className={stepButton}>
                <Icon d="M20 6 9 17l-5-5" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                aria-label="Next part"
                disabled={!positionReady || listening}
                onClick={() => dispatch({ type: "go-to-chunk", index: state.chunkIndex + 1 })}
                className={stepButton}
              >
                <Icon d="m9 18 6-6-6-6" />
              </Button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
