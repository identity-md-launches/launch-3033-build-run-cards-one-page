import { useEffect, useRef, useState } from "react";
import { RARITIES, SAMPLE_ROWS, sampleSvg, type SampleRow } from "./samples";

/** One sample card, drawn by RunCardRenderer.svg() when it scrolls near the screen. */
function SampleCard({ row, rarity, edition }: { row: SampleRow; rarity: string; edition: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const [src, setSrc] = useState<string>();
  const [failed, setFailed] = useState(false);
  const [near, setNear] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) { setNear(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setNear(true); io.disconnect(); } }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!near) return;
    let live = true;
    setFailed(false);
    sampleSvg(row, edition).then((s) => live && setSrc(s), () => live && setFailed(true));
    return () => { live = false; };
  }, [near, row, edition, attempt]);
  const name = `${row.label}, ${rarity}, edition ${edition} of 100`;
  return (
    <li ref={ref} className="sample">
      <div className="art">
        {src ? <img src={src} alt={`Sample card: ${name}`} loading="lazy" decoding="async" />
          : failed ? <button className="btn btn-small" onClick={() => setAttempt((a) => a + 1)}>Draw again</button>
          : <span className="muted small">Drawing…</span>}
      </div>
      <p className={`small rarity r-${rarity.toLowerCase()}`}>{rarity} <span className="muted">· #{edition}</span></p>
    </li>
  );
}

export function SampleRows() {
  return (
    <div className="sample-rows">
      {SAMPLE_ROWS.map((row) => (
        <div key={row.k} className="sample-row">
          <h3 className="row-title">{row.label}</h3>
          <p className="small muted">Work {row.work.toLocaleString("en-US")} · {row.rounds} rounds · top {row.top} · blocks {row.blockFrom.toLocaleString("en-US")} to {row.blockTo.toLocaleString("en-US")}</p>
          <ul className="card-grid">
            {RARITIES.map((r, i) => <SampleCard key={r} row={row} rarity={r} edition={row.editions[i]} />)}
          </ul>
        </div>
      ))}
    </div>
  );
}

export const ODDS: { label: string; odds: [number, number, number, number] }[] = [
  { label: "Slow, under 7.5 km", odds: [60, 28, 10, 2] },
  { label: "Normal, 7.5 to 9.5 km", odds: [40, 35, 18, 7] },
  { label: "Good, 9.5 to 11 km", odds: [25, 35, 28, 12] },
  { label: "Great, 11 km or more", odds: [15, 30, 35, 20] },
];
