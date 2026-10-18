import { describe, expect, test } from "vitest";
import { createInMemoryAnswersStore } from "./answers-store";

describe("createInMemoryAnswersStore", () => {
  test("round-trips answers saved against a check id", async () => {
    const store = createInMemoryAnswersStore();
    const answers = { answers: [{ questionId: "q1", answer: "yes", via: "typed" as const }] };

    await store.save("check-1", answers);

    expect(await store.get("check-1")).toEqual(answers);
  });

  test("returns null for a check id that was never saved", async () => {
    const store = createInMemoryAnswersStore();

    expect(await store.get("unknown")).toBeNull();
  });

  test("a resubmission overwrites rather than accumulates", async () => {
    const store = createInMemoryAnswersStore();
    await store.save("check-1", { answers: [{ questionId: "q1", answer: "first", via: "typed" as const }] });
    await store.save("check-1", { answers: [{ questionId: "q1", answer: "second", via: "typed" as const }] });

    expect(await store.get("check-1")).toEqual({ answers: [{ questionId: "q1", answer: "second", via: "typed" }] });
  });
});
