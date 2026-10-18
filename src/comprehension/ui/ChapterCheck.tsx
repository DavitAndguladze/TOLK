"use client";

import type { ChapterCheck as ChapterCheckModel, ChapterCheckAnswers } from "../../types";
import { ChapterCheckPanel } from "./ChapterCheckPanel";

async function submitAnswers(checkId: string, answers: ChapterCheckAnswers) {
  const res = await fetch(`/api/checks/${checkId}/answers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(answers),
  });
  if (!res.ok) throw new Error("Couldn't save answers");
}

/** The `chapterCheck` slot ReadingScreen renders at the end of the Chapter (comms request 0005, PR #32). */
export function ChapterCheck({ check }: { check: ChapterCheckModel }) {
  return <ChapterCheckPanel check={check} onSubmit={(answers) => submitAnswers(check.id, answers)} />;
}
