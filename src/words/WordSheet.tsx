"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Token } from "../types";
import { flagWord, isFlagged, lookupWordMeaning, unflagWord, useFlaggedWords } from "./flagged-words";
import { canHear, hear, hearInBrowser } from "./hear";
import type { WordMeaning } from "./meaning";

const button =
  "flex min-h-13 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 text-base font-semibold transition outline-light focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const SPEAKER = "M11 5 6 9H2v6h4l5 4V5ZM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14";
const FLAG = "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7";
const CLOSE = "M18 6 6 18M6 6l12 12";

/** The word as printed, without the quotes and punctuation around it. */
function displayWord(token: Token): string {
  return token.text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

/**
 * Opens when the Reader taps a word. Tapping a word flags it (CONTEXT.md: Flagged Word), so the
 * sheet flags it on open, shows its in-context meaning, plays it aloud, and lets the Reader unflag it.
 */
export function WordSheet({ chapterVersionId, token, onClose }: { chapterVersionId: string; token: Token; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const flagged = useFlaggedWords(chapterVersionId).has(token.index);
  const [meaning, setMeaning] = useState<WordMeaning | null>(null);
  const [meaningFailed, setMeaningFailed] = useState(false);
  const [meaningAttempt, setMeaningAttempt] = useState(0);
  const [flagFailed, setFlagFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [speech, setSpeech] = useState<"idle" | "loading" | "playing" | "failed">("idle");
  const [browserVoice, setBrowserVoice] = useState(false);
  const playback = useRef<AbortController | null>(null);
  const word = displayWord(token);

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
    return () => playback.current?.abort();
  }, []);

  useEffect(() => {
    if (isFlagged(chapterVersionId, token.index)) return;
    let live = true;
    setSaving(true);
    flagWord(chapterVersionId, token).then(
      () => live && setFlagFailed(false),
      () => live && setFlagFailed(true),
    ).finally(() => live && setSaving(false));
    return () => {
      live = false;
    };
    // Keyed on the index, not the Token object, so a re-render never re-flags a word the Reader just unflagged.
  }, [chapterVersionId, token.index]);

  useEffect(() => {
    const request = new AbortController();
    setMeaning(null);
    setMeaningFailed(false);
    lookupWordMeaning(chapterVersionId, token.index, request.signal).then(
      (value) => !request.signal.aborted && setMeaning(value),
      () => !request.signal.aborted && setMeaningFailed(true),
    );
    return () => request.abort();
  }, [chapterVersionId, token.index, meaningAttempt]);

  async function toggleFlag() {
    setFlagFailed(false);
    setSaving(true);
    try {
      if (flagged) await unflagWord(chapterVersionId, token);
      else await flagWord(chapterVersionId, token);
    } catch { setFlagFailed(true); }
    finally { setSaving(false); }
  }

  async function play(browser = false) {
    playback.current?.abort();
    const request = new AbortController();
    playback.current = request;
    setBrowserVoice(browser);
    setSpeech(browser ? "playing" : "loading");
    try {
      if (browser) await hearInBrowser(word, request.signal);
      else await hear(word, request.signal, () => !request.signal.aborted && setSpeech("playing"));
      if (!request.signal.aborted) setSpeech("idle");
    } catch {
      if (!request.signal.aborted) setSpeech("failed");
    }
  }

  function stopPlayback() {
    playback.current?.abort();
    setSpeech("idle");
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
      className="fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none animate-page-in rounded-t-3xl border-t border-hairline bg-mist p-0 text-ink shadow-[0_-12px_40px_rgb(20_32_27/0.18)] backdrop:bg-ink/35"
    >
      <div className="mx-auto max-w-xl px-6 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="pt-1 font-book text-[2rem] leading-tight break-words">
            {word}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={() => dialog.current?.close()}
            className="-mr-3 grid size-12 shrink-0 cursor-pointer place-items-center rounded-full text-fog transition outline-light hover:bg-white/70 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-95"
          >
            <Icon d={CLOSE} />
          </button>
        </div>
        <p aria-live="polite" className="mt-2 min-h-14 text-lg leading-snug text-pretty">
          {meaning?.meaning ?? (meaningFailed ? "The meaning couldn’t load. You can keep reading and try again." : <span className="text-fog">Looking it up…</span>)}
        </p>
        {meaning?.source === "chapter" && <p className="mt-1 text-sm text-fog">Prepared Chapter meaning. Live lookup is unavailable.</p>}
        {(meaningFailed || meaning?.source === "unavailable" || meaning?.source === "chapter") && <button type="button" onClick={() => setMeaningAttempt((n) => n + 1)} className="min-h-11 cursor-pointer text-sm font-semibold text-light underline outline-light focus-visible:outline-2">Retry meaning</button>}
        {flagFailed && (
          <p role="alert" className="mt-1 border-l-4 border-gold pl-3 font-semibold text-ink">
            Your flag change couldn’t be confirmed. Check your connection and try again.
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={speech === "playing" ? stopPlayback : () => void play()} disabled={speech === "loading"} className={`${button} bg-light text-white hover:bg-[#125f3f]`}>
            <Icon d={SPEAKER} />
            {speech === "loading" ? "Loading voice…" : speech === "playing" ? "Stop voice" : speech === "failed" ? "Retry voice" : "Hear it"}
          </button>
          <button type="button" onClick={toggleFlag} disabled={saving} className={`${button} border border-hairline bg-white/60 text-ink hover:bg-white`}>
            <Icon d={FLAG} />
            {saving ? "Saving…" : flagged ? "Unflag" : "Flag"}
          </button>
        </div>
        {speech === "failed" && <p role="alert" className="mt-3 text-sm text-ink">
          {browserVoice ? "Browser voice couldn’t play." : "OCI pronunciation couldn’t play."}
          {canHear() && <button type="button" onClick={() => void play(true)} className="ml-2 min-h-11 cursor-pointer font-semibold text-light underline outline-light focus-visible:outline-2">Try browser voice</button>}
        </p>}
        {speech === "playing" && <p role="status" className="mt-3 text-sm text-fog">{browserVoice ? "Browser voice fallback" : "OCI Speech pronunciation"}</p>}
        <p aria-live="polite" className="mt-3 text-sm text-fog">
          {saving ? "Saving your word…" : flagged ? "Flagged. It goes to your Word Bank, and you'll meet it again." : "Not flagged. It stays out of your Word Bank."}
        </p>
      </div>
    </dialog>
  );
}
