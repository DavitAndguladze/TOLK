import { beforeAll, describe, expect, test } from "vitest";
import type { AnswerGrade, ChapterCheck, ChapterCheckAnswers, ReadAloudSummary } from "../types";
import { mockChapter, mockChapterVersion } from "../mocks";
import { generateChapterCheck } from "./chapter-check-generator";
import { gradeChapterCheck, type KeyPointGrader } from "./grade-check";

const version = mockChapterVersion(4);
const now = () => new Date("2026-10-17T21:00:00Z");
const meaning = (word: string) => mockChapter.complexWords.find((w) => w.word === word)!.meaning;

let check: ChapterCheck;
beforeAll(async () => {
  // The L4 check: three Key Point questions, then 'vulnerable' and 'criticizing' (both in the L4 text).
  check = await generateChapterCheck(mockChapter, version);
});

/** A Key Point grader that gives every answer the same grade. */
const gradesAll = (grade: AnswerGrade): KeyPointGrader => async () => ({ grade, feedback: `graded ${grade}`, gradedBy: "stand-in" });

/** Every Key Point answered with `keyPoint`, every Complex Word with its choice for that word. */
const answer = ({ keyPoint = "an answer", complexWord = (word: string) => meaning(word) } = {}): ChapterCheckAnswers => ({
  answers: check.questions.map((q) => ({
    questionId: q.id,
    answer: q.kind === "key-point" ? keyPoint : complexWord(q.word!),
    via: "typed" as const,
  })),
});

const grade = (answers: ChapterCheckAnswers, keyPointGrader: KeyPointGrader = gradesAll(2)) =>
  gradeChapterCheck(
    { check, chapter: mockChapter, version, answers, readAloud: null, flaggedWords: [], readerId: "reader-1" },
    { keyPointGrader, now },
  );

describe("gradeChapterCheck", () => {
  test("turns a fully correct Chapter Check into a Fully understood Session Result", async () => {
    const session = await grade(answer());

    expect(session).toMatchObject({
      readerId: "reader-1",
      chapterVersionId: "gatsby-ch1-L4",
      chapterNumber: 1,
      level: 4,
      readAloudMisses: [],
      completedAt: "2026-10-17T21:00:00.000Z",
      // 10 of 10 → 90, no flags → 10.
      grading: { score: 100, result: "fully-understood", barelyPassed: false },
    });
  });

  test("keeps the Read-aloud Misses and weighs read-aloud accuracy and Flagged Words in", async () => {
    const readAloud: ReadAloudSummary = {
      chapterVersionId: version.id,
      accuracy: 0.5,
      wordResults: [],
      misses: [{ word: "advice", tokenIndex: 8, kind: "mispronounced" }],
      startedAt: "2026-10-17T20:50:00Z",
      endedAt: "2026-10-17T20:55:00Z",
    };

    const session = await gradeChapterCheck(
      { check, chapter: mockChapter, version, answers: answer(), readAloud, flaggedWords: ["quick"], readerId: "reader-1" },
      { keyPointGrader: gradesAll(2), now },
    );

    expect(session.readAloudMisses).toEqual(readAloud.misses);
    expect(session.grading.missedWords).toEqual([
      { word: "advice", source: "read-aloud" },
      { word: "quick", source: "flagged" },
    ]);
    // 10 of 10 → 70, accuracy 0.5 → 10, one flag → 8.
    expect(session.grading.score).toBe(88);
  });

  describe("Key Point questions", () => {
    test("are graded by the Key Point grader, given the Key Point and the sentence that answers it", async () => {
      const seen: string[] = [];
      const keyPointGrader: KeyPointGrader = async ({ keyPoint, answer, sentence }) => {
        seen.push(`${keyPoint.id} | ${answer} | ${sentence.text}`);
        return { grade: 1, feedback: "Close.", gradedBy: "stand-in" };
      };

      const session = await grade(answer({ keyPoint: "his dad gave advice" }), keyPointGrader);

      const first = check.questions[0];
      expect(seen[0]).toBe(`kp1 | his dad gave advice | ${version.sentences[first.answerSentenceIndex].text}`);
      expect(session.grading.questionGrades[0]).toEqual({
        questionId: first.id,
        grade: 1,
        feedback: "Close.",
        rereadSentenceIndex: first.answerSentenceIndex,
        rereadSentence: version.sentences[first.answerSentenceIndex].text,
      });
      // 3 of 6 Key Point points + 4 of 4 Complex Word points → 7 of 10 → 63, no flags → 10.
      expect(session.grading.score).toBe(73);
    });

    test("need no sentence to reread when the answer got it", async () => {
      const session = await grade(answer());

      expect(session.grading.questionGrades.map((g) => g.rereadSentenceIndex)).toEqual([null, null, null, null, null]);
      expect(session.grading.questionGrades.map((g) => g.rereadSentence)).toEqual([null, null, null, null, null]);
    });
  });

  describe("Complex Word questions", () => {
    test("score a wrong choice 0, say what the word means, and point back to its sentence", async () => {
      const wrongChoice = (word: string) => check.questions.find((q) => q.word === word)!.choices!.find((c) => c !== meaning(word))!;

      const session = await grade(answer({ complexWord: wrongChoice }));

      const vulnerable = check.questions.find((q) => q.word === "vulnerable")!;
      expect(session.grading.questionGrades.find((g) => g.questionId === vulnerable.id)).toEqual({
        questionId: vulnerable.id,
        grade: 0,
        feedback: "'vulnerable' means easily hurt or affected.",
        rereadSentenceIndex: vulnerable.answerSentenceIndex,
        rereadSentence: version.sentences[vulnerable.answerSentenceIndex].text,
      });
      expect(session.grading.missedWords).toEqual([
        { word: "vulnerable", source: "chapter-check" },
        { word: "criticizing", source: "chapter-check" },
      ]);
      // 6 of 10 → 54, no flags → 10.
      expect(session.grading).toMatchObject({ score: 64, result: "partly-understood" });
    });
  });

  describe("who graded", () => {
    test("is OCI Generative AI when it graded every Key Point answer", async () => {
      const oci: KeyPointGrader = async () => ({ grade: 2, feedback: "Yes.", gradedBy: "oci-generative-ai" });

      const session = await grade(answer(), oci);

      expect(session.grading.basis.gradedBy).toBe("oci-generative-ai");
    });

    test("is the stand-in when it graded even one Key Point answer", async () => {
      const ociExceptKp2: KeyPointGrader = async ({ keyPoint }) =>
        ({ grade: 2, feedback: "Yes.", gradedBy: keyPoint.id === "kp2" ? "stand-in" : "oci-generative-ai" });

      const session = await grade(answer(), ociExceptKp2);

      expect(session.grading.basis.gradedBy).toBe("stand-in");
    });
  });
});
