import { formatUnits } from "ethers";
import { CURVE, CURVE_LAUNCH_BLOCK, MILES_SUPPLY, curveAbi } from "./config";
import { blockNumber, getLogs, read } from "./rpc";

export type Trade = { block: number; buy: boolean; price: number; quote: number; coin: number };
export type MilesState = {
  price: number; // ETH per coin
  reserve: number; // ETH in the curve
  grad: number; // ETH needed to graduate
  graduated: boolean;
  trades: Trade[];
  readAt: Date;
};

const bought = curveAbi.getEvent("Bought")!.topicHash;
const sold = curveAbi.getEvent("Sold")!.topicHash;
const cache: { scannedTo: number; trades: Trade[] } = { scannedTo: CURVE_LAUNCH_BLOCK - 1, trades: [] };

const eth = (v: bigint) => Number(formatUnits(v, 18));

/** Every Bought and Sold since launch, scanned once and then only the new blocks. Trade price = quote / coin. */
async function trades(): Promise<Trade[]> {
  const head = await blockNumber();
  if (head > cache.scannedTo) {
    const raw = await getLogs(CURVE, [bought, sold], cache.scannedTo + 1, head);
    for (const l of raw) {
      const ev = curveAbi.parseLog({ topics: l.topics, data: l.data });
      if (!ev) continue;
      const buy = ev.name === "Bought";
      const quote = eth(buy ? ev.args[1] : ev.args[2]);
      const coin = eth(buy ? ev.args[2] : ev.args[1]);
      if (coin > 0) cache.trades.push({ block: Number(l.blockNumber), buy, price: quote / coin, quote, coin });
    }
    cache.scannedTo = head;
  }
  return cache.trades;
}

export async function loadMiles(): Promise<MilesState> {
  const [p, r, g, d] = await Promise.all([
    read(CURVE, curveAbi, "priceX18"),
    read(CURVE, curveAbi, "rReserve"),
    read(CURVE, curveAbi, "rGrad"),
    read(CURVE, curveAbi, "graduated"),
  ]);
  const t = await trades();
  return { price: eth(p[0]), reserve: eth(r[0]), grad: eth(g[0]), graduated: d[0], trades: [...t], readAt: new Date() };
}

export const marketCap = (price: number) => price * MILES_SUPPLY;

/** A small ETH amount in plain digits, never in exponent form. */
export function fmtEth(v: number): string {
  if (!isFinite(v)) return "…";
  if (v === 0) return "0";
  if (v >= 1) return v.toLocaleString("en-US", { maximumFractionDigits: 3 });
  if (v >= 0.001) return v.toLocaleString("en-US", { maximumFractionDigits: 5 });
  return v.toLocaleString("en-US", { maximumSignificantDigits: 3, maximumFractionDigits: 18 });
}
