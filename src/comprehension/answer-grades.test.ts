import { beforeAll, describe, expect, test, vi } from "vitest";
import type { ChapterCheck } from "../types";
import { mockChapter, mockChapterVersion } from "../mocks";
import { createInMemoryAnswerGradeStore, rememberingKeyPointGrader } from "./answer-grades";
import { generateChapterCheck } from "./chapter-check-generator";
import { gradeChapterCheck, gradeQuestion, type KeyPointGrader } from "./grade-check";

const version = mockChapterVersion(4);
let check: ChapterCheck;
beforeAll(async () => {
  check = await generateChapterCheck(mockChapter, version);
});
const keyPointQuestion = () => check.questions.find((q) => q.kind === "key-point")!;
const ocis = () => vi.fn<KeyPointGrader>(async ({ answer }) => ({ grade: 1, feedback: `graded: ${answer}`, gradedBy: "oci-generative-ai" }));
const scope = (readerId = "ana") => ({ readerId, checkId: check.id });
const gradeOne = (grader: KeyPointGrader, answer: string) =>
  gradeQuestion({ question: keyPointQuestion(), chapter: mockChapter, version, answer }, { keyPointGrader: grader });

describe("rememberingKeyPointGrader", () => {
  test("grades an answer once: checking the same answer again reuses the stored grade", async () => {
    const inner = ocis();
    const grader = rememberingKeyPointGrader(inner, createInMemoryAnswerGradeStore(), scope());

    const first = await gradeOne(grader, "his father gave advice");
    const again = await gradeOne(grader, "his father gave advice");

    expect(inner).toHaveBeenCalledTimes(1);
    expect(again).toEqual(first);
  });

  test("regrades when the Reader changes the answer", async () => {
    const inner = ocis();
    const grader = rememberingKeyPointGrader(inner, createInMemoryAnswerGradeStore(), scope());

    await gradeOne(grader, "his father gave advice");
    const changed = await gradeOne(grader, "not to judge people");

    expect(inner).toHaveBeenCalledTimes(2);
    expect(changed.grade.feedback).toBe("graded: not to judge people");
  });

  test("never shares a stored grade between Readers", async () => {
    const inner = ocis();
    const store = createInMemoryAnswerGradeStore();

    await gradeOne(rememberingKeyPointGrader(inner, store, scope("ana")), "his father gave advice");
    await gradeOne(rememberingKeyPointGrader(inner, store, scope("ben")), "his father gave advice");

    expect(inner).toHaveBeenCalledTimes(2);
  });

  test("submitting the whole Check reuses the grades the Reader saw on Check, so each answer is graded once", async () => {
    const inner = ocis();
    const store = createInMemoryAnswerGradeStore();
    const answers = {
      answers: check.questions.map((q) => ({ questionId: q.id, via: "typed" as const, answer: q.kind === "key-point" ? `answer ${q.id}` : q.choices![0] })),
    };
    // On Check: each Key Point answer is graded as the Reader goes.
    for (const q of check.questions.filter((q) => q.kind === "key-point")) {
      await gradeQuestion({ question: q, chapter: mockChapter, version, answer: `answer ${q.id}` }, { keyPointGrader: rememberingKeyPointGrader(inner, store, scope()) });
    }
    const checked = inner.mock.calls.length;

    const session = await gradeChapterCheck(
      { check, chapter: mockChapter, version, answers, readAloud: null, flaggedWords: [], readerId: "ana" },
      { keyPointGrader: rememberingKeyPointGrader(inner, store, scope()), now: () => new Date("2026-10-18T09:00:00Z") },
    );

    expect(inner).toHaveBeenCalledTimes(checked);
    expect(session.grading.questionGrades.filter((g) => g.feedback.startsWith("graded: answer"))).toHaveLength(checked);
  });
});
