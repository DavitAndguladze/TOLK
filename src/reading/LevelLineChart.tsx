import { LEVELS, ORIGINAL_LEVEL, type GradingResult, type Level, type ProgressView } from "../types";

export const RESULT_LABEL: Record<GradingResult | "reading", string> = {
  "fully-understood": "Fully understood",
  "partly-understood": "Partly understood",
  struggled: "Struggled",
  reading: "Reading now",
};

/** Fill style carries the Grading Result alongside the label, so it never rests on colour alone. */
export function ResultMarker({ result, cx = 7, cy = 7 }: { result: GradingResult | null; cx?: number; cy?: number }) {
  const style = {
    "fully-understood": { fill: "var(--color-light)", stroke: "var(--color-light)" },
    "partly-understood": { fill: "var(--color-mist)", stroke: "var(--color-light)" },
    struggled: { fill: "var(--color-gold)", stroke: "var(--color-gold)" },
    reading: { fill: "var(--color-mist)", stroke: "var(--color-fog)" },
  }[result ?? "reading"];
  return (
    <>
      <circle cx={cx} cy={cy} r={7} fill="var(--color-mist)" />
      <circle cx={cx} cy={cy} r={4.5} strokeWidth={2} {...style} />
    </>
  );
}

const W = 342;
const H = 196;
const LEFT = 62;
const RIGHT = 30;
const TOP = 16;
const ROW = 36;

const levelY = (level: Level) => TOP + (ORIGINAL_LEVEL - level) * ROW;

export function LevelLineChart({ line }: { line: ProgressView["levelLine"] }) {
  const step = (W - LEFT - RIGHT) / Math.max(line.length, 1);
  const points = line.map((p, i) => ({ ...p, x: LEFT + step * (i + 0.5), y: levelY(p.level) }));
  const path = points
    .map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `H${p.x - step / 2} V${p.y} H${p.x}`))
    .join(" ");
  const latest = points.at(-1);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="level-line-desc" className="w-full overflow-visible">
      <desc id="level-line-desc">
        {latest
          ? `Level by Chapter: from Level ${points[0].level} in Chapter ${points[0].chapterNumber} to Level ${latest.level} in Chapter ${latest.chapterNumber}. Level 5 is the author's original.`
          : "No Chapters read yet."}
      </desc>
      {LEVELS.map((level) => (
        <g key={level}>
          <line x1={LEFT - 8} x2={W - RIGHT + 14} y1={levelY(level)} y2={levelY(level)} stroke="var(--color-hairline)" strokeWidth={1} />
          <text x={0} y={levelY(level) + 4} className="fill-fog text-[12px]">
            {level === ORIGINAL_LEVEL ? "Original" : `Level ${level}`}
          </text>
        </g>
      ))}
      <circle cx={W - RIGHT + 14} cy={levelY(ORIGINAL_LEVEL)} r={13} fill="var(--color-glow)" opacity={0.25} />
      <circle cx={W - RIGHT + 14} cy={levelY(ORIGINAL_LEVEL)} r={5} fill="var(--color-glow)" />
      <path d={path} fill="none" stroke="var(--color-light)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p) => (
        <g key={p.chapterNumber}>
          <title>{`Chapter ${p.chapterNumber}: Level ${p.level}, ${RESULT_LABEL[p.result ?? "reading"]}`}</title>
          <circle cx={p.x} cy={p.y} r={18} fill="transparent" />
          <ResultMarker result={p.result} cx={p.x} cy={p.y} />
          <text x={p.x} y={H - 6} textAnchor="middle" className="fill-fog text-[12px]">
            Ch {p.chapterNumber}
          </text>
        </g>
      ))}
      {latest && (
        <text x={latest.x} y={latest.y - 14} textAnchor="middle" className="fill-ink text-[12px] font-semibold">
          {latest.result ? `Level ${latest.level}` : "Now"}
        </text>
      )}
    </svg>
  );
}
