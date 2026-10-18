// The Library's opening: a shelf of book spines drawn in CSS from the palette. Decorative only.
const spines: { w: number; h: number; color: string; band?: boolean; lean?: boolean; gap?: boolean }[] = [
  { w: 14, h: 78, color: "bg-harbor", band: true },
  { w: 18, h: 88, color: "bg-sand" },
  { w: 12, h: 70, color: "bg-dusk" },
  { w: 16, h: 92, color: "bg-gold/85", band: true },
  { w: 13, h: 80, color: "bg-sky" },
  { w: 19, h: 86, color: "bg-ink/85" },
  { w: 12, h: 74, color: "bg-sand", band: true },
  { w: 15, h: 90, color: "bg-harbor" },
  { w: 14, h: 68, color: "bg-dusk", lean: true },
  { w: 17, h: 84, color: "bg-sky", band: true, gap: true },
  { w: 13, h: 92, color: "bg-gold/85" },
  { w: 16, h: 76, color: "bg-harbor", band: true },
  { w: 12, h: 88, color: "bg-sand" },
  { w: 18, h: 82, color: "bg-dusk", band: true },
  { w: 13, h: 72, color: "bg-ink/85" },
  { w: 15, h: 86, color: "bg-sky" },
];

export function Shelf() {
  return (
    <div aria-hidden="true" className="relative mx-auto mt-4 mb-2 w-full max-w-sm">
      <div className="flex h-24 items-end justify-center gap-[3px] overflow-hidden px-3">
        {spines.map((s, i) => (
          <span
            key={i}
            className={`relative shrink-0 rounded-t-[3px] rounded-b-[1px] shadow-[inset_-3px_0_0_rgb(0_0_0/0.12)] motion-safe:animate-spine-in ${s.color} ${s.lean ? "origin-bottom-left -rotate-[8deg]" : ""} ${s.gap ? "ml-3" : ""}`}
            style={{ width: s.w, height: s.h, animationDelay: `${i * 30}ms` }}
          >
            {s.band && (
              <>
                <span className="absolute inset-x-0 top-[18%] h-[3px] bg-paper/45" />
                <span className="absolute inset-x-0 bottom-[16%] h-[3px] bg-paper/45" />
              </>
            )}
          </span>
        ))}
      </div>
      <div className="h-2.5 rounded-sm bg-shelf shadow-[0_10px_18px_-6px_rgb(90_60_30/0.45)]" />
    </div>
  );
}
