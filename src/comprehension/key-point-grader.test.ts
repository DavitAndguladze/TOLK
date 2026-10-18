import { describe, expect, test } from "vitest";
import { mockChapter, mockChapterVersion } from "../mocks";
import { mockKeyPointGrader } from "./key-point-grader";

// "Nick's father told him not to criticize other people." Its words that carry meaning:
// nick, father, told, criticize, people.
const keyPoint = mockChapter.keyPoints[0];
const sentence = mockChapterVersion(1).sentences[2];
const question = { id: "q1", kind: "key-point" as const, prompt: "What did Nick's father tell him?", keyPointId: keyPoint.id, answerSentenceIndex: 2 };

const gradeAnswer = (answer: string) => mockKeyPointGrader({ question, keyPoint, answer, sentence });

describe("mockKeyPointGrader", () => {
  test("gives 2 when the answer covers at least half of the Key Point's words", async () => {
    // father, told, criticizing ~ criticize, people: 4 of 5.
    expect(await gradeAnswer("His father told him to stop criticizing people")).toEqual({ grade: 2, feedback: "Yes, that's it.", gradedBy: "stand-in" });
  });

  test("gives 1 when the answer touches the Key Point", async () => {
    // told, people: 2 of 5.
    expect(await gradeAnswer("He told him to be nice to people")).toEqual({
      grade: 1,
      gradedBy: "stand-in",
      feedback: "Partly. The chapter says: Nick's father told him not to criticize other people.",
    });
  });

  test("gives 0 when the answer misses the Key Point", async () => {
    expect(await gradeAnswer("I don't know")).toEqual({
      grade: 0,
      gradedBy: "stand-in",
      feedback: "Not quite. The chapter says: Nick's father told him not to criticize other people.",
    });
  });
});
