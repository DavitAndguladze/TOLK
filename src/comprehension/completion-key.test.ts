import { describe, expect, test } from "vitest";
import { completionKey } from "./completion-key";

const answers = [
  { questionId: "q1", answer: "not to judge people", via: "typed" },
  { questionId: "q2", answer: "easily hurt or affected", via: "typed" },
];

describe("completionKey", () => {
  test("is the same for a retried submission, however the reading's instant is written", () => {
    expect(completionKey({ answers, readAloudStartedAt: "2026-10-17T22:50:00Z" })).toBe(
      completionKey({ answers, readAloudStartedAt: "2026-10-17T22:50:00.000Z" }),
    );
  });

  test("doesn't depend on the order the answers arrive in", () => {
    expect(completionKey({ answers: [...answers].reverse(), readAloudStartedAt: null })).toBe(completionKey({ answers, readAloudStartedAt: null }));
  });

  test("differs when the completion names a different reading, or none (a silent reread is a new completion)", () => {
    const aloud = completionKey({ answers, readAloudStartedAt: "2026-10-17T22:50:00Z" });

    expect(completionKey({ answers, readAloudStartedAt: null })).not.toBe(aloud);
    expect(completionKey({ answers, readAloudStartedAt: "2026-10-17T23:30:00Z" })).not.toBe(aloud);
  });

  test("differs when an answer changes", () => {
    const changed = [answers[0], { ...answers[1], answer: "to sing loudly" }];

    expect(completionKey({ answers: changed, readAloudStartedAt: null })).not.toBe(completionKey({ answers, readAloudStartedAt: null }));
  });

  test("treats a missing or unreadable reading the same as none", () => {
    const silent = completionKey({ answers, readAloudStartedAt: null });

    expect(completionKey({ answers })).toBe(silent);
    expect(completionKey({ answers, readAloudStartedAt: "not a date" })).toBe(silent);
  });
});
