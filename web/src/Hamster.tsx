/** The site's pixel hamster, drawn on a 16 by 12 grid. Decorative. */
const ROWS = [
  "....oo....oo....",
  "...oppo..oppo...",
  "...oooooooooo...",
  "..oooooooooooo..",
  "..ooKwooooKwoo..",
  ".ooooooppoooooo.",
  ".occcooooooccco.",
  ".occcccccccccco.",
  "..oooccccccooo..",
  "...oooooooooo...",
  "...cc......cc...",
  "................",
];
const FILL: Record<string, string> = { o: "#e8913a", p: "#f4a3ad", K: "#1b1310", w: "#fff7ec", c: "#f7dfbd" };

export function Hamster({ size = 48, className }: { size?: number; className?: string }) {
  const rects: JSX.Element[] = [];
  ROWS.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (FILL[ch]) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={FILL[ch]} />);
    }),
  );
  return (
    <svg className={className} width={size} height={(size * 12) / 16} viewBox="0 0 16 12" shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {rects}
    </svg>
  );
}

/** The same grid as an SVG string, for the favicon. */
export function hamsterSvg(): string {
  let r = "";
  ROWS.forEach((row, y) => [...row].forEach((ch, x) => { if (FILL[ch]) r += `<rect x="${x}" y="${y + 2}" width="1" height="1" fill="${FILL[ch]}"/>`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">${r}</svg>`;
}

/**
 * The logo and favicon: the pixel hamster on a #101015 disc with a faint dot grid (#24242d dots
 * every 14 units of the 100-unit box), inside a ring whose upper-left half is #f5a83a and whose
 * lower-right half is #5b8cff.
 */
export function logoSvg(): string {
  let dots = "";
  for (let y = 7; y < 100; y += 14) for (let x = 7; x < 100; x += 14) {
    if ((x - 50) ** 2 + (y - 50) ** 2 < 40 ** 2) dots += `<circle cx="${x}" cy="${y}" r="1.6" fill="#24242d"/>`;
  }
  let px = "";
  ROWS.forEach((row, y) => [...row].forEach((ch, x) => {
    if (FILL[ch]) px += `<rect x="${(26 + x * 3).toFixed(1)}" y="${(34 + y * 3).toFixed(1)}" width="3.05" height="3.05" fill="${FILL[ch]}"/>`;
  }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#101015"/>${dots}` +
    `<path d="M18.887 81.113A44 44 0 0 1 81.113 18.887" fill="none" stroke="#f5a83a" stroke-width="8"/>` +
    `<path d="M81.113 18.887A44 44 0 0 1 18.887 81.113" fill="none" stroke="#5b8cff" stroke-width="8"/>` +
    `<g shape-rendering="crispEdges">${px}</g></svg>`;
}

export function Logo({ size = 30 }: { size?: number }) {
  return <img className="logo" src={`data:image/svg+xml;utf8,${encodeURIComponent(logoSvg())}`} width={size} height={size} alt="" />;
}
