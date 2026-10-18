import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { mockChapterVersion } from "../mocks";
import { chunkChapterVersion } from "./chunk";
import { ReadingScreen } from "./ReadingScreen";

const props = { chapterVersionId: "gatsby-ch1-L1", readerId: "reader-a", chunks: chunkChapterVersion(mockChapterVersion(1)) };

it("reopens a finished Chapter on its end screen, without the text or the fade (0076)", () => {
  const html = renderToStaticMarkup(createElement(ReadingScreen, { ...props, completed: true }));
  expect(html).toContain('aria-label="End of Chapter"');
  expect(html).not.toContain('aria-label="Chapter text"');
  expect(html).not.toContain("You reached the end of the Chapter.");
});

it("starts an unfinished Chapter on its text", () => {
  const html = renderToStaticMarkup(createElement(ReadingScreen, props));
  expect(html).toContain('aria-label="Chapter text"');
  expect(html).not.toContain('aria-label="End of Chapter"');
});
