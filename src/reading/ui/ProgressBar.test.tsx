import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ProgressBar } from "./ProgressBar";

it("exposes a labelled completed count to assistive technology", () => {
  const html = renderToStaticMarkup(createElement(ProgressBar, { label: "Chapter Check", value: 2, max: 5 }));
  expect(html).toContain('role="progressbar"');
  expect(html).toContain('aria-label="Chapter Check"');
  expect(html).toContain('aria-valuenow="2"');
  expect(html).toContain('aria-valuemax="5"');
});

it("keeps inaccessible non-finite and out-of-range values out of the rendered progress", () => {
  for (const max of [0, -2, NaN, Infinity]) {
    const html = renderToStaticMarkup(createElement(ProgressBar, { label: "Chapter Check", value: 2, max }));
    expect(html).toContain('aria-valuenow="0"');
    expect(html).not.toMatch(/(?:NaN|Infinity)/);
  }
  for (const [value, expected] of [[-1, 0], [NaN, 0], [Infinity, 0], [9, 5]]) {
    const html = renderToStaticMarkup(createElement(ProgressBar, { label: "Chapter Check", value, max: 5 }));
    expect(html).toContain(`aria-valuenow="${expected}"`);
  }
});

it("can hide the visible caption while keeping the accessible label", () => {
  const html = renderToStaticMarkup(createElement(ProgressBar, { label: "Question 2 of 5", value: 2, max: 5, showLabel: false, showPercent: false }));
  expect(html).toContain('aria-label="Question 2 of 5"');
  expect(html).not.toContain(">Question 2 of 5<");
});
