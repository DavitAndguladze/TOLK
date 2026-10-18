import type { Grading, GradingResult } from "../types";

const HEADLINE: Record<GradingResult, string> = {
  "fully-understood": "You understood it.",
  "partly-understood": "You understood most of it.",
  struggled: "This Chapter was a tough one.",
};

/** Barely Passed reads as Fully understood here; the Level decision's explanation says "just barely". */
export const resultHeadline = (grading: Grading): string => HEADLINE[grading.result];
