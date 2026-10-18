"use client";

import { useState } from "react";
import type { ChapterCheck as ChapterCheckModel, ChapterCheckAnswers } from "../../types";
import { ResultScreen, type AnswersResult } from "../../reading/ResultScreen";
import { ChapterCheckPanel } from "./ChapterCheckPanel";

const SESSION_STORAGE_KEY = "tolk-reader-session";

/** A per-browser stand-in for a Reader id (sign-in is #05) so one Reader's answers to a shared
 *  Chapter Version's check (Chapter 1's L1, ADR-0008) don't overwrite another Reader's. */
function readerSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return "anonymous"; // private window, blocked storage, etc.
  }
}

async function submitAnswers(checkId: string, answers: ChapterCheckAnswers): Promise<AnswersResult> {
  const res = await fetch(`/api/checks/${checkId}/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Reader-Session": readerSessionId() },
    body: JSON.stringify(answers),
  });
  if (!res.ok) throw new Error("Couldn't save answers");
  return res.json();
}

/** The `chapterCheck` slot ReadingScreen renders at the end of the Chapter (comms request 0005, PR #32).
 *  Once graded, it shows R2's ResultScreen in its place. */
export function ChapterCheck({ check }: { check: ChapterCheckModel }) {
  const [result, setResult] = useState<AnswersResult | null>(null);
  if (result) return <ResultScreen result={result} nextHref={result.nextVersionId && `/read/${result.nextVersionId}`} />;
  return <ChapterCheckPanel check={check} onSubmit={async (answers) => setResult(await submitAnswers(check.id, answers))} />;
}
