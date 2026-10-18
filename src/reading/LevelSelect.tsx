"use client";

import { useId } from "react";
import { LEVELS, type Level } from "../types";
import { LEVEL_SPECS } from "../mocks";

/**
 * The Reader's Level selector under the Level ladder: every Level from L1 to the author's original, the
 * Reader's assigned Level marked, and Levels with no stored Version for this Chapter shown as not ready.
 * A native select, so phones get their own picker and keyboards and screen readers work as usual.
 */
export function LevelSelect({ value, assigned, available, onChange }: {
  value: Level; assigned: Level; available: ReadonlySet<Level>; onChange: (level: Level) => void;
}) {
  const id = useId();
  return (
    <div className="mt-1">
      <label htmlFor={id} className="sr-only">Reading Level</label>
      <div className="relative inline-flex">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(Number(event.target.value) as Level)}
          className="min-h-touch cursor-pointer appearance-none rounded-control border border-hairline bg-white py-2 pr-10 pl-3 font-ui text-sm font-semibold text-ink shadow-card outline-light focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {LEVELS.map((level) => (
            <option key={level} value={level} disabled={!available.has(level)}>
              {`Level ${level} — ${LEVEL_SPECS[level].label}${level === assigned ? " (your Level)" : ""}${available.has(level) ? "" : " (not ready yet)"}`}
            </option>
          ))}
        </select>
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-light" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </div>
    </div>
  );
}
