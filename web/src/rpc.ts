import { Interface, type Result } from "ethers";
import { LOG_WINDOW, RPCS, RPC_TIMEOUT_MS } from "./config";

/** A JSON-RPC error that carries revert data, so callers can decode custom errors. */
export class RpcError extends Error {
  constructor(message: string, public code?: number, public data?: string) {
    super(message);
  }
}

let rpcId = 0;

async function post(url: string, method: string, params: unknown[]): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), RPC_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { result?: unknown; error?: { code: number; message: string; data?: unknown } };
    if (body.error) {
      const data = typeof body.error.data === "string" ? body.error.data : undefined;
      throw new RpcError(body.error.message, body.error.code, data);
    }
    return body.result;
  } finally {
    clearTimeout(timer);
  }
}

/** A revert is the chain's answer, not a broken RPC: asking the next RPC would only repeat it. */
const isRevert = (e: unknown) =>
  e instanceof RpcError && (e.code === 3 || !!e.data || /revert/i.test(e.message));

/** Try each public RPC in order; move on after a transport error, an RPC error or a 15 s timeout. */
export async function rpc<T = unknown>(method: string, params: unknown[]): Promise<T> {
  let last: unknown;
  for (const url of RPCS) {
    try {
      return (await post(url, method, params)) as T;
    } catch (e) {
      if (isRevert(e)) throw e;
      last = e;
    }
  }
  throw last ?? new Error("No RPC answered");
}

/** eth_call a function and decode the result. `from` makes it a free simulation from that wallet. */
export async function read(to: string, iface: Interface, fn: string, args: unknown[] = [], from?: string): Promise<Result> {
  const data = iface.encodeFunctionData(fn, args);
  const raw = await rpc<string>("eth_call", [{ to, data, ...(from ? { from } : {}) }, "latest"]);
  return iface.decodeFunctionResult(fn, raw);
}

/** Simulate a call from a wallet. Resolves to null on success, or the RunCards error name / message. */
export async function simulate(to: string, iface: Interface, fn: string, args: unknown[], from: string, gas?: bigint): Promise<{ ok: true; result: Result } | { ok: false; error: unknown }> {
  try {
    const data = iface.encodeFunctionData(fn, args);
    const tx: Record<string, string> = { to, data, from };
    if (gas) tx.gas = "0x" + gas.toString(16);
    const raw = await rpc<string>("eth_call", [tx, "latest"]);
    return { ok: true, result: iface.decodeFunctionResult(fn, raw) };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function blockNumber(): Promise<number> {
  return Number(await rpc<string>("eth_blockNumber", []));
}

export type RawLog = { data: string; topics: string[]; blockNumber: string; transactionHash: string };

/** eth_getLogs over [from, to] in windows of at most 10,000 blocks. topic0 may list several events (OR). */
export async function getLogs(address: string, topic0: string | string[], from: number, to: number): Promise<RawLog[]> {
  const out: RawLog[] = [];
  for (let start = from; start <= to; start += LOG_WINDOW) {
    const end = Math.min(to, start + LOG_WINDOW - 1);
    const logs = await rpc<RawLog[]>("eth_getLogs", [
      { address, topics: [topic0], fromBlock: "0x" + start.toString(16), toBlock: "0x" + end.toString(16) },
    ]);
    out.push(...logs);
  }
  return out;
}
