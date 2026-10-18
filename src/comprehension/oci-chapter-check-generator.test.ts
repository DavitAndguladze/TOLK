import { describe, expect, test, vi } from "vitest";
import { mockChapter, mockChapterVersion } from "../mocks";
import { generateChapterCheck } from "./chapter-check-generator";
import { createOciChapterCheckGenerator } from "./oci-chapter-check-generator";
import type { Chat } from "./oci-key-point-grader";

// L4's served sentences:
// [0] "In my younger, more vulnerable years, my father gave me advice I've kept thinking about ever since."
// [1] "“Whenever you feel like criticizing anyone,” he told me, “just remember this."
// [2] "Not everyone in this world has had the advantages you've had.”"
const version = mockChapterVersion(4);

const generateWith = (chat: Chat, timeoutMs = 1000) =>
  createOciChapterCheckGenerator({ chat, fallback: generateChapterCheck, timeoutMs })(mockChapter, version);

const reply = (questions: object[]) => async () => JSON.stringify({ questions });

const grounded = [
  { keyPointId: "kp1", question: "What did Nick's father tell him to do when he felt like judging someone?", sentenceIndex: 1, quote: "just remember this" },
  { keyPointId: "kp2", question: "Why shouldn't Nick judge other people?", sentenceIndex: 2, quote: "Not everyone in this world has had the advantages you've had" },
  { keyPointId: "kp3", question: "How long has Nick been thinking about his father's advice?", sentenceIndex: 0, quote: "kept thinking about ever since" },
];

describe("createOciChapterCheckGenerator", () => {
  test("asks OCI's grounded Key Point questions, then the Complex Word questions", async () => {
    const check = await generateWith(reply(grounded));

    const fallback = await generateChapterCheck(mockChapter, version);
    expect(check.id).toBe(fallback.id);
    expect(check.questions.filter((q) => q.kind === "key-point")).toEqual([
      { id: "gatsby-ch1-L4-kp-0", kind: "key-point", prompt: grounded[0].question, keyPointId: "kp1", answerSentenceIndex: 1 },
      { id: "gatsby-ch1-L4-kp-1", kind: "key-point", prompt: grounded[1].question, keyPointId: "kp2", answerSentenceIndex: 2 },
      { id: "gatsby-ch1-L4-kp-2", kind: "key-point", prompt: grounded[2].question, keyPointId: "kp3", answerSentenceIndex: 0 },
    ]);
    expect(check.questions.filter((q) => q.kind === "complex-word")).toEqual(fallback.questions.filter((q) => q.kind === "complex-word"));
  });

  test("reads the JSON when the model wraps it in a code fence", async () => {
    const check = await generateWith(async () => "```json\n" + JSON.stringify({ questions: grounded }) + "\n```");

    expect(check.questions[0].prompt).toBe(grounded[0].question);
  });

  describe("falls back to the deterministic Check", () => {
    const [kp1, kp2, kp3] = grounded;
    test.each<[string, Chat]>([
      ["no JSON at all", async () => "Here are some questions!"],
      ["fewer than 2 questions", reply([kp1])],
      ["more than 3 questions", reply([kp1, kp2, kp3, { ...kp1, keyPointId: "kp4" }])],
      ["a Key Point that doesn't exist", reply([kp1, { ...kp2, keyPointId: "kp9" }])],
      ["the same Key Point twice", reply([kp1, { ...kp2, keyPointId: "kp1" }])],
      ["a sentence index that isn't served", reply([kp1, { ...kp2, sentenceIndex: 7 }])],
      ["a quote that isn't in its sentence", reply([kp1, { ...kp2, quote: "kept thinking about ever since" }])],
      ["a question that gives away its quote", reply([kp1, { ...kp2, question: "Why? Not everyone in this world has had the advantages you've had." }])],
      ["an empty question", reply([kp1, { ...kp2, question: "  " }])],
    ])("when OCI returns %s", async (_, chat) => {
      expect(await generateWith(chat)).toEqual(await generateChapterCheck(mockChapter, version));
    });

    test("when OCI Generative AI fails", async () => {
      const failing: Chat = async () => {
        throw new Error("429 TooManyRequests");
      };

      expect(await generateWith(failing)).toEqual(await generateChapterCheck(mockChapter, version));
    });

    test("and logs only the error's kind and status, never its message (it can carry request details)", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const failing: Chat = async () => {
        throw Object.assign(new Error("POST https://inference... Authorization: Signature keyId=ocid1.tenancy.secret"), {
          statusCode: 429,
          serviceCode: "TooManyRequests",
        });
      };

      await generateWith(failing);

      const logged = warn.mock.calls.flat().map(String).join(" ");
      warn.mockRestore();
      expect(logged).toContain("429 TooManyRequests");
      expect(logged).not.toContain("Signature");
    });

    test("when OCI Generative AI doesn't answer in time, and tells the call to stop", async () => {
      let signal: AbortSignal | undefined;
      const never: Chat = (_, options) => {
        signal = options?.signal;
        return new Promise<string>(() => {});
      };

      expect(await generateWith(never, 20)).toEqual(await generateChapterCheck(mockChapter, version));
      expect(signal?.aborted).toBe(true);
    });
  });

  test("gives OCI the served sentences by index and the Key Points by id, never the author's original", async () => {
    let prompt = "";
    await generateWith(async (p) => {
      prompt = p;
      return JSON.stringify({ questions: grounded });
    });

    expect(prompt).toContain("[1] “Whenever you feel like criticizing anyone,” he told me, “just remember this.");
    expect(prompt).toContain("kp2: The reason: other people haven't had the same advantages Nick had.");
    expect(prompt).not.toContain("In my younger and more vulnerable years"); // the original sentence 0
    expect(prompt).toContain('{"questions": [{"keyPointId": "...", "question": "...", "sentenceIndex": 0, "quote": "..."}]}');
  });
});
