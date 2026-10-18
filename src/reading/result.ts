import type { ChapterVersion, Grading, GradingResult } from "../types";

const HEADLINE: Record<GradingResult, string> = {
  "fully-understood": "You understood it.",
  "partly-understood": "You understood most of it.",
  struggled: "This Chapter was a tough one.",
};

/** Barely Passed reads as Fully understood here; the Level decision's explanation says "just barely". */
export const resultHeadline = (grading: Grading): string => HEADLINE[grading.result];

/**
 * One poll of the next Chapter Version (spec: the client polls while it generates). `httpStatus` 0 is a
 * network error. A 404 or a failed generation means there is nothing to wait for, so polling stops.
 */
export function nextChapterPoll(httpStatus: number, version: Pick<ChapterVersion, "status"> | null): "ready" | "wait" | "stop" {
  if (httpStatus === 404 || version?.status === "failed") return "stop";
  return version?.status === "ready" ? "ready" : "wait";
}
