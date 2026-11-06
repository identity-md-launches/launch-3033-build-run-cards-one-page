/** "RUN CARDS" in a 5x7 pixel font, each pixel drawn as 3x3 round dots. RUN in oranges, CARDS in blues. */
const FONT: Record<string, string[]> = {
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  " ": ["000", "000", "000", "000", "000", "000", "000"],
};
const ORANGES = ["#f5a83a", "#ffc46b", "#e88b1f"];
const BLUES = ["#5b8cff", "#8fb0ff", "#3f6fe0"];

export function DotTitle() {
  const word = "RUN CARDS";
  const dots: JSX.Element[] = [];
  let col = 0;
  let li = 0;
  for (const ch of word) {
    const g = FONT[ch];
    const w = g[0].length;
    const palette = li < 3 ? ORANGES : BLUES;
    g.forEach((row, y) => [...row].forEach((on, x) => {
      if (on !== "1") return;
      for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) {
        const cx = (col + x) * 3 + dx;
        const cy = y * 3 + dy;
        // A fixed pattern across the three shades, so the title looks hand-set and never flickers.
        const shade = palette[(cx * 7 + cy * 13 + li) % 3];
        dots.push(<circle key={`${cx}-${cy}`} cx={cx + 0.5} cy={cy + 0.5} r={0.42} fill={shade} />);
      }
    }));
    col += w + 1;
    if (ch !== " ") li++;
  }
  const width = (col - 1) * 3;
  return (
    <h1 className="dot-title">
      <svg viewBox={`0 0 ${width} 21`} width="100%" role="img" aria-label="Run Cards" preserveAspectRatio="xMinYMid meet">
        {dots}
      </svg>
    </h1>
  );
}
