import { useState } from "react";
import { LINKS, MILES_POLL_MS, STAKE } from "./config";
import { fmtEth, loadMiles, marketCap, type MilesState, type Trade } from "./miles";
import { usePoll } from "./poll";
import { Box, Stat } from "./ui";

const hhmm = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

/** Every trade as a line, buys as green dots and sells as red. 170px tall, scales to its box. */
function Chart({ trades }: { trades: Trade[] }) {
  if (trades.length === 0) return <div className="chart chart-empty"><p className="muted small">No trades yet. The chart starts with the first buy.</p></div>;
  const W = 600, H = 170, P = 10;
  const prices = trades.map((t) => t.price);
  let lo = Math.min(...prices), hi = Math.max(...prices);
  if (hi === lo) { hi *= 1.05; lo *= 0.95; }
  const x = (i: number) => (trades.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (trades.length - 1));
  const y = (p: number) => H - P - ((p - lo) * (H - 2 * P)) / (hi - lo);
  const line = trades.map((t, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(t.price).toFixed(1)}`).join(" ");
  const buys = trades.filter((t) => t.buy).length;
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
        aria-label={`Price chart of ${trades.length} trades: ${buys} buys and ${trades.length - buys} sells, from ${fmtEth(prices[0])} to ${fmtEth(prices[prices.length - 1])} ETH per coin.`}>
        <path d={line} fill="none" stroke="#5b8cff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* Dots in HTML so they stay round while the line stretches with the box. */}
      {trades.map((t, i) => (
        <span key={i} className={`chart-dot ${t.buy ? "buy" : "sell"}`}
          style={{ left: `${(x(i) / W) * 100}%`, top: `${(y(t.price) / H) * 100}%` }} aria-hidden="true" />
      ))}
    </figure>
  );
}

export function MilesBox() {
  const [m, setM] = useState<MilesState>();
  const [err, setErr] = useState(false);
  usePoll(async () => {
    try {
      setM(await loadMiles());
      setErr(false);
    } catch (e) {
      setErr(true);
      throw e;
    }
  }, "miles", MILES_POLL_MS, MILES_POLL_MS);

  const stakeCost = m ? m.price * Number(STAKE / 10n ** 18n) : NaN;
  const first = m?.trades[0]?.price;
  const change = m && first ? ((m.price - first) / first) * 100 : undefined;
  const pct = m && m.grad > 0 ? Math.min(100, (m.reserve / m.grad) * 100) : 0;
  const note = m ? (m.graduated ? "Uniswap v4" : `Wheelpad curve · ${hhmm(m.readAt)}`) : err ? "Wheelpad curve · unavailable" : "Wheelpad curve";

  return (
    <Box id="miles" title="$MILES" color="var(--orange)" note={note} className="miles">
      <dl className="stats stats-4">
        <Stat label="30,000 costs" value={m ? `${fmtEth(stakeCost)} ETH` : "…"} />
        <Stat label="Market cap" value={m ? `${fmtEth(marketCap(m.price))} ETH` : "…"} />
        <Stat label="Trades" value={m ? m.trades.length.toLocaleString("en-US") : "…"} />
        <Stat label="Since first" value={change === undefined ? (m ? "No trades" : "…") :
          <span className={change >= 0 ? "up" : "down"}>{change >= 0 ? "+" : "−"}{Math.abs(change).toFixed(1)}%</span>} />
      </dl>
      {m ? <Chart trades={m.trades} /> : <div className="chart chart-empty"><p className="muted small">{err ? "Price unavailable. Retrying in 90 seconds." : "Reading the curve…"}</p></div>}
      {m && !m.graduated && (
        <div className="grad">
          <p className="small">Graduation to Uniswap · {fmtEth(m.reserve)} of {fmtEth(m.grad)} ETH ({pct.toFixed(1)}%)</p>
          <div className="bar" role="progressbar" aria-label="Graduation to Uniswap" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}
      {m?.graduated && <p className="small">Graduated: $MILES now trades on Uniswap v4.</p>}
      {err && m && <p className="small note" role="status">Could not refresh. Showing the reading from {hhmm(m.readAt)}.</p>}
      <div className="actions">
        <a className="btn btn-primary" href={LINKS.wheelpad} target="_blank" rel="noopener noreferrer">Buy $MILES on Wheelpad</a>
      </div>
    </Box>
  );
}
