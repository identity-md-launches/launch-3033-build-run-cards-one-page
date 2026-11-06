import { AbiCoder, keccak256 } from "ethers";
import { RENDERER, rendererAbi } from "./config";
import { read } from "./rpc";

export const RARITIES = ["Common", "Rare", "Epic", "Legendary"] as const;
export type Rarity = (typeof RARITIES)[number];

export type SampleRow = {
  k: number;
  label: string;
  work: number;
  rounds: number;
  top: number;
  blockFrom: number;
  blockTo: number;
  /** Edition per rarity: Common, Rare, Epic, Legendary. */
  editions: [number, number, number, number];
};

/** Sixteen examples from the brief: four kinds of run, one card of each rarity. Nobody owns them. */
export const SAMPLE_ROWS: SampleRow[] = [
  { k: 1, label: "Slow run, under 7.5 km", work: 7998, rounds: 20, top: 613, blockFrom: 7662, blockTo: 8430, editions: [1, 3, 6, 5] },
  { k: 2, label: "Normal run, 7.5 to 9.5 km", work: 10587, rounds: 24, top: 689, blockFrom: 2028, blockTo: 2994, editions: [2, 1, 3, 46] },
  { k: 3, label: "Good run, 9.5 to 11 km", work: 11182, rounds: 23, top: 694, blockFrom: 1, blockTo: 1047, editions: [1, 5, 2, 12] },
  { k: 4, label: "Great run, 11 km or more", work: 13297, rounds: 27, top: 639, blockFrom: 2995, blockTo: 4135, editions: [10, 1, 3, 4] },
];

const coder = AbiCoder.defaultAbiCoder();

/** seed = keccak256(abi.encode(keccak256(abi.encode("sample run", k - 1)), k, edition)) */
export function sampleSeed(k: number, edition: number): string {
  const inner = keccak256(coder.encode(["string", "uint256"], ["sample run", k - 1]));
  return keccak256(coder.encode(["bytes32", "uint256", "uint256"], [inner, k, edition]));
}

const cache = new Map<string, Promise<string>>();

/** RunCardRenderer.svg(card) as a data URI. Cached per card, so each is drawn once per visit. */
export function sampleSvg(row: SampleRow, edition: number): Promise<string> {
  const key = `${row.k}:${edition}`;
  let p = cache.get(key);
  if (!p) {
    const card = [row.k, row.work, row.rounds, row.top, row.blockFrom, row.blockTo, edition, 100, sampleSeed(row.k, edition)];
    p = read(RENDERER, rendererAbi, "svg", [card]).then((r) => {
      const svg = String(r[0]);
      if (!svg.trimStart().startsWith("<svg")) throw new Error("Not an SVG");
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}
