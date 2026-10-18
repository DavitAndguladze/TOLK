import Link from "next/link";
import { LEVELS, ORIGINAL_LEVEL, type Level } from "../types";
import { LEVEL_SPECS } from "../mocks";

function dotClass(level: Level, current: Level) {
  if (level === ORIGINAL_LEVEL) {
    return level === current
      ? "size-5 bg-light shadow-[0_0_0_6px_rgb(127_224_174/0.45),0_0_22px_6px_rgb(127_224_174/0.8)]"
      : "size-3.5 bg-glow shadow-[0_0_0_5px_rgb(127_224_174/0.25),0_0_16px_4px_rgb(127_224_174/0.6)]";
  }
  if (level === current) return "size-4 bg-light ring-4 ring-light/15";
  return level < current ? "size-2.5 bg-light/70" : "size-2.5 border border-fog/60 bg-mist";
}

/** Where a Chapter Version sits between L1 and the author's original. With `hrefs`, the dots are the temporary Level switch (#3).
 *  `showLabel={false}` drops the "Level N  label" line for callers that show a Level selector instead. */
export function LevelLadder({ current, hrefs, showLabel = true }: { current: Level; hrefs?: Record<Level, string>; showLabel?: boolean }) {
  const climbed = ((current - 1) / (LEVELS.length - 1)) * 100;
  const label = `Level ${current}, ${LEVEL_SPECS[current].label}`;
  const Wrapper = hrefs ? "nav" : "div";
  return (
    <Wrapper aria-label={hrefs ? "Level" : label} role={hrefs ? undefined : "img"} className="mt-5">
      <ol className="relative flex justify-between">
        <li aria-hidden className="absolute inset-x-[22px] top-1/2 h-px -translate-y-1/2 bg-hairline">
          <span className="block h-full bg-light/70 motion-safe:transition-[width] motion-safe:duration-700 motion-safe:ease-out" style={{ width: `${climbed}%` }} />
        </li>
        {LEVELS.map((level) => (
          <li key={level} className="relative">
            {hrefs ? (
              <Link
                href={hrefs[level]}
                aria-label={`Level ${level}, ${LEVEL_SPECS[level].label}`}
                aria-current={level === current ? "page" : undefined}
                className="grid size-11 place-items-center rounded-full outline-light focus-visible:outline-2"
              >
                <span className={`block rounded-full motion-safe:transition-all motion-safe:duration-500 ${dotClass(level, current)}`} />
              </Link>
            ) : (
              <span className="grid size-11 place-items-center">
                <span className={`block rounded-full motion-safe:transition-all motion-safe:duration-500 ${dotClass(level, current)}`} />
              </span>
            )}
          </li>
        ))}
      </ol>
      {showLabel && <p className="flex items-baseline gap-2 px-1 text-sm">
        <span className="font-semibold">Level {current}</span>
        <span className="text-fog">{LEVEL_SPECS[current].label}</span>
      </p>}
    </Wrapper>
  );
}
