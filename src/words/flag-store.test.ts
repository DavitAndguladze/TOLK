import { describe, expect, it } from "vitest";
import { mockChapterVersion } from "../mocks";
import { createFlagStore } from "./flag-store";

// L1 tokens: 0 "When", 1 "I", 2 "was", 3 "young,", 4 "my", 5 "father", 6 "gave", 7 "me", 8 "advice."
const L1 = mockChapterVersion(1);

describe("Flagged Words", () => {
  it("flagging a word puts it in the Reader's Flagged Words for that Chapter Version", () => {
    const flags = createFlagStore();
    flags.flag("ana", L1, 8);
    expect(flags.flaggedWords("ana", L1.id)).toEqual(["advice"]);
  });

  it("unflagging a word tapped by mistake takes it back out", () => {
    const flags = createFlagStore();
    flags.flag("ana", L1, 8);
    flags.flag("ana", L1, 5);
    flags.unflag("ana", L1.id, 8);
    expect(flags.flaggedWords("ana", L1.id)).toEqual(["father"]);
  });

  it("keeps each Reader's flags apart, and each Chapter Version's", () => {
    const flags = createFlagStore();
    const L2 = mockChapterVersion(2);
    flags.flag("ana", L1, 8);
    flags.flag("ben", L1, 5);
    flags.flag("ana", L2, 0);
    expect(flags.flaggedWords("ana", L1.id)).toEqual(["advice"]);
    expect(flags.flaggedWords("ben", L1.id)).toEqual(["father"]);
    expect(flags.flaggedWords("ana", L2.id)).toEqual(["when"]);
    expect(flags.flaggedWords("ben", L2.id)).toEqual([]);
  });

  it("lists a word once, however many times or places the Reader tapped it", () => {
    const flags = createFlagStore();
    flags.flag("ana", L1, 8);
    flags.flag("ana", L1, 8);
    flags.flag("ana", L1, 26); // "had"
    flags.flag("ana", L1, 32); // "had.”"
    expect(flags.flaggedWords("ana", L1.id)).toEqual(["advice", "had"]);
    flags.unflag("ana", L1.id, 26);
    expect(flags.flaggedWords("ana", L1.id)).toEqual(["advice", "had"]);
  });

  it("refuses a word that isn't in the Chapter Version", () => {
    const flags = createFlagStore();
    expect(flags.flag("ana", L1, 99)).toBeNull();
    expect(flags.flaggedWords("ana", L1.id)).toEqual([]);
  });
});
