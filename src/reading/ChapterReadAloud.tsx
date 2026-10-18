"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { createReadingAttempt } from "./read-aloud";
import { saveReadAloudSummary } from "./save-read-aloud";

const ConfirmedReadAloudStartedAt = createContext<string | null>(null);

/** The acknowledged summary for this completion only; R4 includes it in the Chapter Check submission. */
export function useConfirmedReadAloudStartedAt(): string | null {
  return useContext(ConfirmedReadAloudStartedAt);
}

/** Confirm a summary save before showing the Chapter Check; silent reading needs no summary. */
export function ChapterReadAloud({ attempt, children }: { attempt: ReturnType<typeof createReadingAttempt> | null; children: ReactNode }) {
  const [status, setStatus] = useState<"preparing" | "saving" | "saved" | "not-needed" | "failed" | "continue">("preparing");
  const [retry, setRetry] = useState(0);
  const [confirmedStartedAt, setConfirmedStartedAt] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setStatus("preparing");
    setConfirmedStartedAt(null);
    void (async () => {
      const summary = await attempt?.finish();
      if (!live) return;
      if (!summary) { setStatus("not-needed"); return; }
      setStatus("saving");
      await saveReadAloudSummary(summary);
      if (live) { setConfirmedStartedAt(summary.startedAt); setStatus("saved"); }
    })().catch(() => { if (live) setStatus("failed"); });
    return () => { live = false; };
  }, [attempt, retry]);

  if (status === "preparing" || status === "saving") return <p role="status" className="mt-6 text-fog">{status === "saving" ? "Saving your read-aloud results…" : "Preparing your Chapter Check…"}</p>;
  if (status === "failed") return (
    <div className="mt-6 border-l-4 border-gold pl-4">
      <p role="alert" className="text-lg text-ink">We couldn't confirm your read-aloud results were saved.</p>
      <p className="mt-2 text-fog">Try again, or continue to the Chapter Check.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => setRetry(value => value + 1)} className="min-h-13 cursor-pointer rounded-2xl bg-light px-5 font-semibold text-white outline-light focus-visible:outline-2 focus-visible:outline-offset-2">Retry saving</button>
        <button type="button" onClick={() => setStatus("continue")} className="min-h-13 cursor-pointer rounded-2xl border border-hairline px-5 font-semibold text-ink outline-light focus-visible:outline-2 focus-visible:outline-offset-2">Continue to Chapter Check</button>
      </div>
    </div>
  );
  return <ConfirmedReadAloudStartedAt.Provider value={status === "saved" ? confirmedStartedAt : null}>{status === "saved" && <p role="status" className="mt-6 text-fog">Read-aloud results saved.</p>}{children}</ConfirmedReadAloudStartedAt.Provider>;
}
