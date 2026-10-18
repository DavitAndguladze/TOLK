"use client";

import { useEffect, useState } from "react";
import type { Api, ChapterCheck as ChapterCheckModel, ChapterCheckAnswers } from "../../types";
import { ChapterCheckPanel } from "./ChapterCheckPanel";

/**
 * Today this is only `{ stored: true }` (ticket #11's scope stops at "answers stored") - it
 * becomes the full graded response once #12 (grading) and #13 (Level rules/Word Bank) land.
 * `onGraded` is typed for both so R2 can narrow before swapping in ResultScreen.
 */
export type ChapterCheckResult = Api["POST /api/checks/[checkId]/answers"]["res"] | { stored: true };

/** The seam Role 2 asked for (comms request 0005): pass a Chapter Version id, get the graded result back. */
export function ChapterCheck({ chapterVersionId, onGraded }: { chapterVersionId: string; onGraded: (result: ChapterCheckResult) => void }) {
  const [check, setCheck] = useState<ChapterCheckModel | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/chapter-versions/${chapterVersionId}/check`)
      .then((res) => res.json())
      .then((data: ChapterCheckModel) => live && setCheck(data));
    return () => {
      live = false;
    };
  }, [chapterVersionId]);

  if (!check) return null; // no spinner - renders the moment the (already-generated) check arrives
  const ready = check; // narrowed for the closure below

  async function handleSubmit(answers: ChapterCheckAnswers) {
    const res = await fetch(`/api/checks/${ready.id}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    });
    if (!res.ok) throw new Error("Couldn't save answers");
    onGraded((await res.json()) as ChapterCheckResult);
  }

  return <ChapterCheckPanel check={ready} onSubmit={handleSubmit} />;
}
