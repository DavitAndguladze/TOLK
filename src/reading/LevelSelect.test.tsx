import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { LevelSelect } from "./LevelSelect";

it("lists all five Levels in order, marks the Reader's Level and the selected one, and disables Levels with no text", () => {
  const html = renderToStaticMarkup(createElement(LevelSelect, { value: 3, assigned: 1, available: new Set([1, 3, 5] as const), onChange: () => {} }));
  const options = [...html.matchAll(/<option([^>]*)>([^<]*)<\/option>/g)].map(([, attrs, text]) => ({ text: text.replace(/&#x27;/g, "'"), disabled: attrs.includes("disabled"), selected: attrs.includes("selected") }));
  expect(options.map((o) => o.text)).toEqual([
    "Level 1 — Most simplified (your Level)",
    "Level 2 — Simplified (not ready yet)",
    "Level 3 — Halfway there",
    "Level 4 — Close to the original (not ready yet)",
    "Level 5 — The author's original",
  ]);
  expect(options.map((o) => o.disabled)).toEqual([false, true, false, true, false]);
  expect(options.find((o) => o.selected)?.text).toBe("Level 3 — Halfway there");
  expect(html).toContain(">Reading Level</label>");
});
