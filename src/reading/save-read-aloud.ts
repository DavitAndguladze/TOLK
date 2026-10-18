import type { ReadAloudSummary } from "../types";

/** Same temporary per-browser identity as ChapterCheck and WordSheet, until R6 sign-in. */
function readerSessionId(): string {
  try {
    const key = "tolk-reader-session";
    let id = localStorage.getItem(key);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
    return id;
  } catch { return "anonymous"; }
}

export async function saveReadAloudSummary(summary: ReadAloudSummary): Promise<void> {
  const response = await fetch(`/api/chapter-versions/${encodeURIComponent(summary.chapterVersionId)}/read-aloud`, {
    method: "POST", credentials: "same-origin",
    headers: { "Content-Type": "application/json", "X-Reader-Session": readerSessionId() },
    body: JSON.stringify(summary), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok || (await response.json()).ok !== true) throw new Error("Read-aloud save was not confirmed.");
}
