import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { LEVEL_SPECS } from "../mocks";
import { LevelSelect, levelDescription } from "./LevelSelect";

it("lists all five Levels in order, marks the Reader's Level and the selected one, and disables Levels with no text", () => {
  const html = renderToStaticMarkup(createElement(LevelSelect, { value: 3, assigned: 1, available: new Set([1, 3, 5] as const), onChange: () => {} }));
  const options = [...html.matchAll(/<li ([^>]*)role="option"([^>]*)>(.*?)<\/li>/g)].map(([, before, after, inner]) => ({
    attrs: before + after,
    text: inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
  }));
  expect(options.map((o) => o.text.split(" ")[0])).toEqual(["1", "2", "3", "4", "5"]);
  expect(options.map((o) => o.attrs.includes('aria-disabled="true"'))).toEqual([false, true, false, true, false]);
  expect(options.map((o) => o.attrs.includes('aria-selected="true"'))).toEqual([false, false, true, false, false]);
  expect(options[0].text).toContain("Your Level");
  expect(options[1].text).toContain("Not ready yet");
  expect(html).toContain('aria-label="Reading Level: Level 3, Halfway there"');
  expect(html).toContain('aria-haspopup="listbox"');
});

it("describes each Level from its spec", () => {
  expect(levelDescription(LEVEL_SPECS[1])).toBe("Sentences up to 10 words · 1,000 most common words · no figurative language");
  expect(levelDescription(LEVEL_SPECS[5])).toBe("The author's own words, exactly as written.");
});
