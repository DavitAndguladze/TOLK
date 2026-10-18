import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { mockChapterCheck, mockDecision, mockGrading, mockSession } from "../../mocks";
import { ChapterCheck } from "./ChapterCheck";

it("shows a Reader's saved completion instead of a fresh Check after a refresh (0076)", () => {
  const completed = { session: { ...mockSession, grading: mockGrading }, decision: mockDecision, wordBank: { bank: [], graduatedThisChapter: [], wordsLearnedTotal: 0 }, nextVersionId: "gatsby-ch2-L1" };
  const html = renderToStaticMarkup(createElement(ChapterCheck, { check: mockChapterCheck, readerId: "reader-a", completed }));
  expect(html).toContain("Chapter complete");
  expect(html).not.toContain("Check answer");
});
