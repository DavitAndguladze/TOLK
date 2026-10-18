import type { Grading, GradingResult } from "../types";

const HEADLINE: Record<GradingResult, string> = {
  "fully-understood": "You understood it.",
  "partly-understood": "You understood most of it.",
  struggled: "This Chapter was a tough one.",
};

/** Barely Passed reads as Fully understood here; the Level decision's explanation says "just barely". */
export const resultHeadline = (grading: Grading): string => HEADLINE[grading.result];

/**
 * One poll of the next Chapter Version (spec: the client polls while it generates). `httpStatus` 0 is a
 * network error. A 404, failed generation, or unusable successful body stops; transient errors wait.
 */
export function nextChapterPoll(httpStatus: number, version: unknown): "ready" | "wait" | "stop" {
  const status = typeof version === "object" && version !== null && "status" in version ? version.status : null;
  if (httpStatus === 404 || status === "failed") return "stop";
  if (status === "ready") return "ready";
  if (status === "generating") return "wait";
  return httpStatus >= 200 && httpStatus < 300 ? "stop" : "wait";
}

/** Parse and classify one next-Version response; malformed successful responses must not wait forever. */
export async function nextChapterPollResponse(response: Response | null): Promise<"ready" | "wait" | "stop"> {
  const version = response?.ok ? await response.json().catch(() => null) : null;
  return nextChapterPoll(response?.status ?? 0, version);
}
