import { beforeAll, describe, expect, test } from "vitest";
import type { ChapterCheck } from "../types";
import { mockChapter, mockChapterVersion } from "../mocks";
import { generateChapterCheck } from "./chapter-check-generator";
import { gradeQuestion, type KeyPointGrader } from "./grade-check";

const version = mockChapterVersion(4); // vulnerable and criticizing appear in the L4 text
let check: ChapterCheck;
beforeAll(async () => {
  check = await generateChapterCheck(mockChapter, version);
});
const question = (kind: "key-point" | "complex-word") => check.questions.find((q) => q.kind === kind)!;
const meaning = (word: string) => mockChapter.complexWords.find((w) => w.word === word)!.meaning;
const unused: KeyPointGrader = async () => { throw new Error("the Key Point grader must not be called"); };

describe("gradeQuestion", () => {
  test("grades a right Complex Word choice 2 without asking the Key Point grader", async () => {
    const q = question("complex-word");

    const result = await gradeQuestion({ question: q, chapter: mockChapter, version, answer: meaning(q.word!) }, { keyPointGrader: unused });

    expect(result).toEqual({ grade: { questionId: q.id, grade: 2, feedback: "Yes.", rereadSentenceIndex: null, rereadSentence: null }, gradedBy: null });
  });

  test("grades a wrong Complex Word choice 0, says what the word means and links the sentence", async () => {
    const q = question("complex-word");
    const wrong = q.choices!.find((c) => c !== meaning(q.word!))!;

    const { grade } = await gradeQuestion({ question: q, chapter: mockChapter, version, answer: wrong }, { keyPointGrader: unused });

    expect(grade).toEqual({
      questionId: q.id,
      grade: 0,
      feedback: `'${q.word}' means ${meaning(q.word!)}.`,
      rereadSentenceIndex: q.answerSentenceIndex,
      rereadSentence: version.sentences.find((s) => s.index === q.answerSentenceIndex)!.text,
    });
  });

  test("grades a Key Point answer with the Key Point grader and reports who graded it", async () => {
    const q = question("key-point");
    const keyPointGrader: KeyPointGrader = async ({ answer }) => ({ grade: 1, feedback: `partly: ${answer}`, gradedBy: "oci-generative-ai" });

    const result = await gradeQuestion({ question: q, chapter: mockChapter, version, answer: "his father gave advice" }, { keyPointGrader });

    const sentence = version.sentences.find((s) => s.index === q.answerSentenceIndex)!;
    expect(result).toEqual({
      grade: { questionId: q.id, grade: 1, feedback: "partly: his father gave advice", rereadSentenceIndex: sentence.index, rereadSentence: sentence.text },
      gradedBy: "oci-generative-ai",
    });
  });
});
