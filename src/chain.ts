import { BrowserProvider, formatUnits, getAddress, type TransactionRequest } from "ethers";
import {
  CARDIO, CORE, GAS, RUNCARDS, RUNCARDS_DEPLOY_BLOCK, STAKE, coreAbi, erc20Abi, runCardsAbi,
} from "./config";
import { errorName } from "./errors";
import { blockNumber, getLogs, read, simulate } from "./rpc";
import type { Eip1193 } from "./wallet";

export type RunInfo = {
  n: number;
  startRound: bigint;
  lastActiveRound: bigint;
  activeRounds: number;
  work: bigint;
  closed: boolean;
  startedEarly: boolean;
  minted: number;
  revealed: boolean;
  revealRound: bigint;
  joiners: number;
};

export type ChainState = {
  runCount: number;
  openRun: number;
  running: boolean;
  settledRound: bigint;
  blockHeight: bigint;
  runs: RunInfo[]; // newest first, at most RECENT
  actionRuns: RunInfo[]; // all undelivered or unrevealed runs, regardless of age
  revealRounds: Record<number, bigint>;
};

const RECENT = 8;

export async function getRun(n: number): Promise<RunInfo> {
  const r = await read(RUNCARDS, runCardsAbi, "runInfo", [n]);
  const run = r[0];
  return {
    n,
    startRound: run.startRound,
    lastActiveRound: run.lastActiveRound,
    activeRounds: Number(run.activeRounds),
    work: run.work,
    closed: run.closed,
    startedEarly: run.startedEarly,
    minted: Number(run.minted),
    revealed: run.revealed,
    revealRound: run.revealRound,
    joiners: Number(r[1]),
  };
}

export async function loadChain(): Promise<ChainState> {
  const [rc, or, rn, st] = await Promise.all([
    read(RUNCARDS, runCardsAbi, "runCount"),
    read(RUNCARDS, runCardsAbi, "openRun"),
    read(RUNCARDS, runCardsAbi, "running"),
    read(CORE, coreAbi, "state"),
  ]);
  const runCount = Number(rc[0]);
  // The history table is short, but actions never expire. Read every run in
  // bounded batches so older deposits and unrevealed cards remain reachable.
  const allRuns: RunInfo[] = [];
  for (let end = runCount; end >= 1; end -= RECENT) {
    const nums = Array.from({ length: Math.min(RECENT, end) }, (_, i) => end - i);
    allRuns.push(...await Promise.all(nums.map(getRun)));
  }
  const actionRuns = allRuns.filter((r) => !r.startedEarly && (r.minted === 0 || !r.revealed));
  const revealRounds: Record<number, bigint> = {};
  await Promise.all(
    actionRuns.filter((r) => r.minted > 0 && !r.revealed).map(async (r) => {
      const res = await read(RUNCARDS, runCardsAbi, "revealOf", [r.n]);
      revealRounds[r.n] = res[0];
    }),
  );
  return {
    runCount,
    openRun: Number(or[0]),
    running: rn[0],
    settledRound: st[0].settledThroughRound,
    blockHeight: st[0].blockHeight,
    runs: allRuns.slice(0, RECENT),
    actionRuns,
    revealRounds,
  };
}

/** What the connected wallet may do now, each decided by a free eth_call simulation. */
export type JoinState = "ready" | "approve" | "sync" | { blocked: string };
export type DeliverOption = { n: number; needsSync: boolean };
export type AccountState = {
  balance: bigint;
  allowance: bigint;
  canApprove: boolean;
  join: JoinState;
  leave: number[];
  joinedRuns: number[];
  deliver: DeliverOption[];
  reveal: number[];
};

export async function loadAccount(me: string, chain: ChainState, wheelRunning: boolean): Promise<AccountState> {
  const [bal, alw] = await Promise.all([
    read(CARDIO, erc20Abi, "balanceOf", [me]),
    read(CARDIO, erc20Abi, "allowance", [me, RUNCARDS]),
  ]);
  const balance: bigint = bal[0];
  const allowance: bigint = alw[0];

  const approveSim = allowance < STAKE ? await simulate(CARDIO, erc20Abi, "approve", [RUNCARDS, STAKE], me) : null;

  const joinSim = await simulate(RUNCARDS, runCardsAbi, "join", [], me, GAS.join);
  let join: JoinState;
  if (joinSim.ok) join = "ready";
  else {
    const name = errorName(joinSim.error);
    if (name === "NotApproved") join = "approve";
    else if (name === "NotCaughtUp") join = "sync";
    else join = { blocked: name ?? "unknown" };
  }

  // Runs not yet delivered, where leaving or delivering may apply.
  const open = chain.actionRuns.filter((r) => r.minted === 0);
  const joinedFlags = await Promise.all(open.map((r) => read(RUNCARDS, runCardsAbi, "joined", [r.n, me]).then((x) => x[0] as boolean)));
  const joinedRuns = open.filter((_, i) => joinedFlags[i]).map((r) => r.n);
  const leaveSims = await Promise.all(joinedRuns.map((n) => simulate(RUNCARDS, runCardsAbi, "leave", [n], me, GAS.leave)));
  const leave = joinedRuns.filter((_, i) => leaveSims[i].ok);

  const deliver: DeliverOption[] = [];
  for (const r of open.filter((r) => r.joiners > 0)) {
    const sim = await simulate(RUNCARDS, runCardsAbi, "deliver", [r.n], me, GAS.deliver);
    if (sim.ok) deliver.push({ n: r.n, needsSync: false });
    else if (
      errorName(sim.error) === "RunNotEnded" &&
      chain.settledRound - r.lastActiveRound >= 24n &&
      !(r.n === chain.openRun && wheelRunning)
    ) {
      // The run looks over by the settled rounds, but RunCards has not caught up: sync, then deliver.
      const syncSim = await simulate(RUNCARDS, runCardsAbi, "sync", [], me, GAS.sync);
      if (syncSim.ok) deliver.push({ n: r.n, needsSync: true });
    }
  }

  const reveal: number[] = [];
  for (const r of chain.actionRuns.filter((r) => r.minted > 0 && !r.revealed)) {
    const round = chain.revealRounds[r.n] ?? 0n;
    if (round === 0n || round > chain.settledRound) continue;
    const sim = await simulate(RUNCARDS, runCardsAbi, "reveal", [r.n], me, GAS.reveal);
    if (sim.ok) reveal.push(r.n);
  }

  return {
    balance,
    allowance,
    canApprove: !!approveSim?.ok,
    join,
    leave,
    joinedRuns,
    deliver,
    reveal,
  };
}

/* ---------- My cards ---------- */

export type Card = {
  tokenId: bigint;
  run: number;
  name: string;
  image: string;
  attributes: { trait_type?: string; value?: string | number }[];
  revealed: boolean;
};

type DeliveredLog = { run: number; runner: string; tokenId: bigint };
const deliveredTopic = runCardsAbi.getEvent("Delivered")!.topicHash;
const logCache: { scannedTo: number; logs: DeliveredLog[] } = { scannedTo: RUNCARDS_DEPLOY_BLOCK - 1, logs: [] };

/** Delivered events from the deploy block on, scanned once and then only the new blocks. */
async function deliveredLogs(): Promise<DeliveredLog[]> {
  const head = await blockNumber();
  if (head > logCache.scannedTo) {
    const raw = await getLogs(RUNCARDS, deliveredTopic, logCache.scannedTo + 1, head);
    for (const l of raw) {
      const ev = runCardsAbi.parseLog({ topics: l.topics, data: l.data });
      if (ev) logCache.logs.push({ run: Number(ev.args[0]), runner: getAddress(ev.args[1]), tokenId: ev.args[2] });
    }
    logCache.scannedTo = head;
  }
  return logCache.logs;
}

function decodeDataUri(uri: string): string {
  const comma = uri.indexOf(",");
  const head = uri.slice(0, comma);
  const body = uri.slice(comma + 1);
  if (head.endsWith(";base64")) {
    const bin = atob(body);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return decodeURIComponent(body);
}

/** Only an SVG data URI is shown: never a remote URL. */
function safeImage(image: unknown): string {
  if (typeof image !== "string") return "";
  return image.startsWith("data:image/svg+xml") ? image : "";
}

export async function loadCards(me: string, known: RunInfo[]): Promise<Card[]> {
  const mine = (await deliveredLogs()).filter((l) => l.runner === getAddress(me));
  const runs = new Map(known.map((r) => [r.n, r]));
  const cards: Card[] = [];
  for (const l of mine) {
    const owner = (await read(RUNCARDS, runCardsAbi, "ownerOf", [l.tokenId]))[0] as string;
    if (getAddress(owner) !== getAddress(me)) continue;
    const uri = (await read(RUNCARDS, runCardsAbi, "tokenURI", [l.tokenId]))[0] as string;
    let meta: { name?: string; image?: unknown; attributes?: Card["attributes"] } = {};
    try {
      meta = JSON.parse(decodeDataUri(uri));
    } catch {
      /* show the card with what we have */
    }
    if (!runs.has(l.run)) runs.set(l.run, await getRun(l.run));
    cards.push({
      tokenId: l.tokenId,
      run: l.run,
      name: meta.name ?? `Run Card #${l.tokenId}`,
      image: safeImage(meta.image),
      attributes: Array.isArray(meta.attributes) ? meta.attributes : [],
      revealed: runs.get(l.run)!.revealed,
    });
  }
  return cards.reverse();
}

/* ---------- Sending ---------- */

export async function send(provider: Eip1193, tx: TransactionRequest): Promise<void> {
  const bp = new BrowserProvider(provider);
  const signer = await bp.getSigner();
  const sent = await signer.sendTransaction(tx);
  const receipt = await sent.wait();
  if (!receipt || receipt.status !== 1) throw new Error("The transaction reverted on-chain.");
}

export const fmtCardio = (v: bigint) =>
  Number(formatUnits(v, 18)).toLocaleString("en-US", { maximumFractionDigits: 2 });
export const fmtInt = (v: bigint | number) => Number(v).toLocaleString("en-US");
