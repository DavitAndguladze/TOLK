"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { LEVELS, type Level, type LevelSpec } from "../types";
import { LEVEL_SPECS } from "../mocks";

const FIGURATIVE: Record<LevelSpec["figurativeLanguage"], string> = {
  none: "no figurative language",
  light: "a little figurative language",
  some: "some figurative language",
  most: "most of the author's imagery",
  original: "the author's imagery",
};

/** What reading at a Level means, in words a Reader gets at a glance (from the Level's own spec). */
export function levelDescription(spec: LevelSpec): string {
  if (spec.maxSentenceWords === null || spec.maxWordRank === null) return "The author's own words, exactly as written.";
  return `Sentences up to ${spec.maxSentenceWords} words · ${spec.maxWordRank.toLocaleString("en-US")} most common words · ${FIGURATIVE[spec.figurativeLanguage]}`;
}

const CHEVRON = "m6 9 6 6 6-6";
const CHECK = "M5 12.5 10 17.5 19 7";
const Icon = ({ d, className }: { d: string; className: string }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

/**
 * The Reader's Level dropdown under the Level ladder: a pill showing the Level being read, opening a list of
 * all five Levels (WAI-ARIA listbox: arrows, Home/End, Enter/Space, Escape). Levels with no stored Version for
 * this Chapter are listed but can't be chosen.
 */
export function LevelSelect({ value, assigned, available, onChange }: {
  value: Level; assigned: Level; available: ReadonlySet<Level>; onChange: (level: Level) => void;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Level>(value);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const choices = LEVELS.filter((level) => available.has(level));

  useEffect(() => {
    if (!open) return;
    list.current?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  const show = () => { setActive(value); setOpen(true); };
  const close = () => { setOpen(false); button.current?.focus(); };
  const choose = (level: Level) => { if (!available.has(level)) return; onChange(level); close(); };
  const step = (by: number) => setActive(choices[Math.min(choices.length - 1, Math.max(0, choices.indexOf(active) + by))] ?? active);

  const onListKey = (event: KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => step(1), ArrowUp: () => step(-1),
      Home: () => setActive(choices[0]), End: () => setActive(choices[choices.length - 1]),
      Enter: () => choose(active), " ": () => choose(active), Escape: close, Tab: () => setOpen(false),
    };
    if (!keys[event.key]) return;
    if (event.key !== "Tab") event.preventDefault();
    keys[event.key]();
  };

  return (
    <div ref={root} className="relative mt-1 inline-block">
      <button ref={button} type="button" aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`}
        aria-label={`Reading Level: Level ${value}, ${LEVEL_SPECS[value].label}`}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(event) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); show(); } }}
        className="inline-flex min-h-touch cursor-pointer items-center gap-2.5 rounded-full border border-hairline bg-white py-1.5 pr-4 pl-1.5 font-ui text-sm font-semibold text-ink shadow-card outline-light transition hover:border-light focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]">
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-light font-bold text-white">{value}</span>
        <span>{LEVEL_SPECS[value].label}</span>
        <Icon d={CHEVRON} className={`size-4 text-light motion-safe:transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <ul ref={list} id={`${id}-list`} role="listbox" tabIndex={-1} hidden={!open} aria-label="Reading Level"
        aria-activedescendant={`${id}-level-${active}`} onKeyDown={onListKey}
        className="absolute top-full left-0 z-20 mt-2 w-[min(21rem,calc(100vw-3rem))] rounded-card border border-hairline bg-white p-1.5 shadow-card outline-none motion-safe:animate-page-in">
        {LEVELS.map((level) => {
          const ready = available.has(level);
          const selected = level === value;
          return (
            <li key={level} id={`${id}-level-${level}`} role="option" aria-selected={selected} aria-disabled={!ready}
              onClick={() => choose(level)} onPointerMove={() => ready && setActive(level)}
              className={`flex items-start gap-3 rounded-control px-3 py-2.5 font-ui ${ready ? "cursor-pointer" : "cursor-not-allowed opacity-50"} ${level === active && ready ? "bg-glow/40" : ""}`}>
              <span aria-hidden="true" className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${selected ? "bg-light text-white" : "bg-glow/60 text-ink"}`}>{level}</span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-ink">
                  {LEVEL_SPECS[level].label}
                  {level === assigned && <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-semibold text-light ring-1 ring-hairline">Your Level</span>}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-fog">{ready ? levelDescription(LEVEL_SPECS[level]) : "Not ready yet for this Chapter."}</span>
              </span>
              {selected && <Icon d={CHECK} className="mt-1 size-4 shrink-0 text-light" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
