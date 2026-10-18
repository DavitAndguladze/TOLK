// Faint paper grain behind the Library: one static SVG noise tile, no canvas or WebGL (0066).
const grain = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .55 0 0 0 0 .45 0 0 0 0 .25 0 0 0 .09 0"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg>`,
)}")`;

export function PaperBackground() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10" style={{ backgroundImage: grain }} />;
}
