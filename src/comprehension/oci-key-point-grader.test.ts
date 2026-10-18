import { describe, expect, test } from "vitest";
import { mockChapter, mockChapterVersion } from "../mocks";
import type { KeyPointGrader } from "./grade-check";
import { createOciKeyPointGrader } from "./oci-key-point-grader";

const keyPoint = mockChapter.keyPoints[0]; // "Nick's father told him not to criticize other people."
const sentence = mockChapterVersion(1).sentences[2]; // "He said, “Do not be quick to judge people."
const question = { id: "q1", kind: "key-point" as const, prompt: "What did Nick's father tell him?", keyPointId: keyPoint.id, answerSentenceIndex: 2 };
const answer = "Not to judge people";

const fallback: KeyPointGrader = async () => ({ grade: 1, feedback: "fallback", gradedBy: "stand-in" });
const fellBack = { grade: 1, feedback: "fallback", gradedBy: "stand-in" };

const gradeWith = (chat: (prompt: string) => Promise<string>, timeoutMs = 1000) =>
  createOciKeyPointGrader({ chat, fallback, timeoutMs })({ question, keyPoint, answer, sentence });

describe("createOciKeyPointGrader", () => {
  test("uses the grade and feedback OCI Generative AI returns, and says OCI graded it", async () => {
    const result = await gradeWith(async () => '{"grade": 2, "feedback": "Yes: his father told him not to judge people."}');

    expect(result).toEqual({ grade: 2, feedback: "Yes: his father told him not to judge people.", gradedBy: "oci-generative-ai" });
  });

  test("finds the JSON when the model wraps it in a code fence or a sentence", async () => {
    const result = await gradeWith(async () => 'Here is the grade:\n```json\n{"grade": 1, "feedback": "Partly: he said not to judge."}\n```');

    expect(result).toEqual({ grade: 1, feedback: "Partly: he said not to judge.", gradedBy: "oci-generative-ai" });
  });

  describe("falls back to the stand-in grader", () => {
    test.each([
      ["no JSON at all", "I think the answer is good."],
      ["a grade outside 0–2", '{"grade": 3, "feedback": "Great!"}'],
      ["a grade that isn't a whole number", '{"grade": 1.5, "feedback": "Almost."}'],
      ["a grade as text", '{"grade": "2", "feedback": "Yes."}'],
      ["no feedback", '{"grade": 2}'],
      ["empty feedback", '{"grade": 2, "feedback": "  "}'],
    ])("when the reply has %s", async (_, reply) => {
      expect(await gradeWith(async () => reply)).toEqual(fellBack);
    });

    test("when OCI Generative AI fails", async () => {
      const result = await gradeWith(async () => {
        throw new Error("401 NotAuthenticated");
      });

      expect(result).toEqual(fellBack);
    });

    test("when OCI Generative AI doesn't answer in time", async () => {
      const never = () => new Promise<string>(() => {});

      expect(await gradeWith(never, 20)).toEqual(fellBack);
    });
  });

  test("asks about the Key Point, with the sentence that answers it and the Reader's answer", async () => {
    let prompt = "";
    await gradeWith(async (p) => {
      prompt = p;
      return '{"grade": 2, "feedback": "Yes."}';
    });

    expect(prompt).toContain("Nick's father told him not to criticize other people.");
    expect(prompt).toContain("He said, “Do not be quick to judge people.");
    expect(prompt).toContain("Not to judge people");
    expect(prompt).toContain('{"grade": 0, 1 or 2, "feedback": "one short sentence"}');
  });
});
