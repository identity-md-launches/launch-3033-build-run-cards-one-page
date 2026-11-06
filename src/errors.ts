import { runCardsAbi } from "./config";

/** Every RunCards error as one plain sentence. */
export const ERROR_TEXT: Record<string, string> = {
  NotApproved: "Approve 30,000 $CARDIO for Run Cards first.",
  NotEnoughCardio: "This wallet needs 30,000 $CARDIO to join.",
  NotRunning: "He is resting: joining opens again when he runs.",
  NoOpenRun: "No run is open: joining opens when his next run starts.",
  AlreadyJoined: "You are already in this run.",
  RunFull: "This run is full: it already has 100 runners.",
  NotJoined: "This wallet is not in that run.",
  RunNotEnded: "This run has not ended yet: it ends after 4 hours (24 rounds) with no work.",
  AlreadyDelivered: "Cards for this run were already delivered.",
  NothingToDeliver: "This run has no runners, so there is nothing to deliver.",
  NothingToReveal: "There is nothing to reveal for this run.",
  RevealRoundNotSettled: "Cards reveal once his next run settles. Check back later.",
  NoSuchRun: "That run does not exist.",
  NotCaughtUp: "Run Cards must catch up with Squeekchain first: press the button again to sync.",
};

/** Find revert data in the many shapes wallets and RPCs return it. */
function findRevertData(e: unknown, depth = 0): string | undefined {
  if (!e || typeof e !== "object" || depth > 5) return undefined;
  const o = e as Record<string, unknown>;
  for (const k of ["data", "revert"]) {
    const v = o[k];
    if (typeof v === "string" && /^0x[0-9a-fA-F]{8}/.test(v)) return v;
  }
  for (const k of ["error", "info", "data", "cause"]) {
    const found = findRevertData(o[k], depth + 1);
    if (found) return found;
  }
  return undefined;
}

/** The RunCards error name for a failed call, if it is one of ours. */
export function errorName(e: unknown): string | undefined {
  const data = findRevertData(e);
  if (!data) return undefined;
  try {
    return runCardsAbi.parseError(data)?.name;
  } catch {
    return undefined;
  }
}

export function plainError(e: unknown): string {
  const name = errorName(e);
  if (name && ERROR_TEXT[name]) return ERROR_TEXT[name];
  const o = (e ?? {}) as { code?: unknown; message?: string; shortMessage?: string; info?: { error?: { code?: number } } };
  if (o.code === 4001 || o.code === "ACTION_REJECTED" || o.info?.error?.code === 4001) return "You cancelled in your wallet.";
  const msg = o.shortMessage || o.message || "";
  if (/insufficient funds/i.test(msg)) return "This wallet needs a little Sepolia ETH to pay for gas.";
  if (/gas limit/i.test(msg)) return "The wallet refused the gas limit. Try again, or try another wallet.";
  if (msg) return `The transaction failed: ${msg.slice(0, 140)}`;
  return "Something failed. Check your connection and try again.";
}
