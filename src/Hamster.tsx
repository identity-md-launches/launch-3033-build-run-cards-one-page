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
