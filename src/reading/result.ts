import type { ChapterCheck, ChapterCheckAnswers, Grading, GradingResult, SessionResult } from "../types";

const HEADLINE: Record<GradingResult, string> = {
  "fully-understood": "You understood it.",
  "partly-understood": "You understood most of it.",
  struggled: "This Chapter was a tough one.",
};

/** Barely Passed reads as Fully understood here; the Level decision's explanation says "just barely". */
export const resultHeadline = (grading: Grading): string => HEADLINE[grading.result];

/** Join only the actual saved grades and supplied Check/answers; never infer a Reader's answer. */
export function chapterCheckReview(session: SessionResult, check?: ChapterCheck, answers?: ChapterCheckAnswers) {
  const grades = session.grading.questionGrades;
  const { checkScore, checkMax } = session.grading.basis;
  return {
    scorePercent: checkMax > 0 ? Math.round(checkScore / checkMax * 100) : null,
    fullyCorrect: grades.filter(question => question.grade === 2).length,
    partlyCorrect: grades.filter(question => question.grade === 1).length,
    total: grades.length,
    questions: grades.map(grade => {
      const question = check?.chapterVersionId === session.chapterVersionId
        ? check.questions.find(question => question.id === grade.questionId) : undefined;
      return {
        ...grade,
        rereadSentenceIndex: grade.rereadSentenceIndex ?? question?.answerSentenceIndex ?? null,
        prompt: question?.prompt ?? null,
        answer: question ? answers?.answers.find(answer => answer.questionId === grade.questionId)?.answer ?? null : null,
      };
    }),
  };
}

/**
 * One poll of the next Chapter Version (spec: the client polls while it generates). `httpStatus` 0 is a
 * network error. Non-retryable 4xx, failed generation, or unusable successful bodies stop; transient
 * errors and rate limits wait.
 */
export function nextChapterPoll(httpStatus: number, version: unknown): "ready" | "wait" | "stop" {
  const status = typeof version === "object" && version !== null && "status" in version ? version.status : null;
  if ((httpStatus >= 400 && httpStatus < 500 && httpStatus !== 429) || status === "failed") return "stop";
  if (status === "ready") return "ready";
  if (status === "generating") return "wait";
  return httpStatus >= 200 && httpStatus < 300 ? "stop" : "wait";
}

/** Parse and classify one next-Version response; malformed successful responses must not wait forever. */
export async function nextChapterPollResponse(response: Response | null): Promise<"ready" | "wait" | "stop"> {
  const version = response?.ok ? await response.json().catch(() => null) : null;
  return nextChapterPoll(response?.status ?? 0, version);
}
