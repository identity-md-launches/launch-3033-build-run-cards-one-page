import { useCallback, useEffect, useRef, useState } from "react";
import {
  BACKOFF_MS, CARDIO, GAS, LINKS, MAX_RUNNERS, POLL_MS, RUNCARDS, STAKE, STATUS_URL, erc20Abi, runCardsAbi,
} from "./config";
import {
  fmtCardio, fmtInt, loadAccount, loadCards, loadChain, send,
  type AccountState, type Card, type ChainState, type RunInfo,
} from "./chain";
import { ERROR_TEXT, errorName, plainError } from "./errors";
import { Hamster } from "./Hamster";
import { simulate } from "./rpc";
import { useWallet, type WalletApi } from "./useWallet";
import { OPEN_IN, isMobileBrowser, short, type Wallet } from "./wallet";

/* ---------- polling: only while the tab is visible, 5 minutes after an error ---------- */

function usePoll(fn: (isActive: () => boolean) => Promise<void>, key: unknown) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let busy = false;
    let nextAt = 0;
    const schedule = (ms: number) => {
      clearTimeout(timer);
      nextAt = Date.now() + ms;
      if (!document.hidden && !stopped) timer = setTimeout(tick, ms);
    };
    const tick = async () => {
      if (document.hidden || busy || stopped) return;
      busy = true;
      let ms = POLL_MS;
      try { await ref.current(() => !stopped); } catch { ms = BACKOFF_MS; }
      busy = false;
      schedule(ms);
    };
    const onVis = () => {
      clearTimeout(timer);
      if (!document.hidden) timer = setTimeout(tick, Math.max(0, nextAt - Date.now()));
    };
    tick();
    document.addEventListener("visibilitychange", onVis);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVis); };
  }, [key]);
}

type LiveStatus = { running: boolean; kmh: number; observedAt?: string; stale: boolean };

/* ---------- connect control and wallet sheet ---------- */

function ConnectControl({ w }: { w: WalletApi }) {
  const ref = useRef<HTMLDialogElement>(null);
  const mobile = isMobileBrowser();
  const open = () => ref.current?.showModal();
  const close = () => ref.current?.close();
  useEffect(() => { if (w.address) close(); }, [w.address]);

  if (w.address && !w.onSepolia) {
    return <button className="btn btn-primary" onClick={w.switchChain}>Switch to Sepolia</button>;
  }
  if (w.address) {
    return (
      <button className="btn" onClick={w.disconnect} aria-label={`${short(w.address)}, disconnect`}>
        <span className="num">{short(w.address)}</span><span className="wide-only"> · Disconnect</span>
      </button>
    );
  }
  return (
    <>
      <button className="btn btn-primary" onClick={open}>Connect</button>
      <dialog ref={ref} className="sheet" aria-labelledby="sheet-title" onClick={(e) => { if (e.target === ref.current) close(); }}>
        <div className="sheet-head">
          <h2 id="sheet-title">Connect a wallet</h2>
          <button className="x" aria-label="Close" onClick={close}>×</button>
        </div>
        <div className="sheet-rows">
          {mobile && !w.wallets.length && OPEN_IN.map((o) => (
            <a key={o.id} className="row" href={o.href(location.href)}>
              <span className="ic" aria-hidden="true"><Hamster size={24} /></span>
              <span>Open in {o.name}</span>
            </a>
          ))}
          {w.wallets.map((x: Wallet) => (
            <button key={x.info.uuid} className="row" disabled={!!w.pending} onClick={() => w.connect(x)}>
              <span className="ic" aria-hidden="true">{x.info.icon ? <img src={x.info.icon} width={28} height={28} alt="" /> : <Hamster size={24} />}</span>
              <span>{x.info.name}{w.pending === x.info.uuid ? " · opening…" : ""}</span>
            </button>
          ))}
          {!mobile && !w.wallets.length && (
            <p className="muted">No browser wallet found. Install a wallet extension such as MetaMask or Rabby, then reload this page.</p>
          )}
        </div>
        {w.note && <p className="note" role="status">{w.note}</p>}
        <p className="muted small">Run Cards never asks for a seed phrase or private key. Your wallet signs.</p>
      </dialog>
    </>
  );
}

/* ---------- small pieces ---------- */

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function deliveredText(r: RunInfo): string {
  if (r.startedEarly) return "Not joinable";
  if (r.minted > 0) return `Yes, ${r.minted} cards`;
  if (r.closed && r.joiners === 0) return "No runners";
  return "Not yet";
}

/* ---------- the page ---------- */

export function App() {
  const w = useWallet();
  const walletKey = `${w.address ?? ""}:${w.chainId ?? ""}`;
  const currentWallet = useRef(walletKey);
  currentWallet.current = walletKey;
  const refreshGeneration = useRef(0);
  const [live, setLive] = useState<LiveStatus>();
  const [liveErr, setLiveErr] = useState(false);
  const [chain, setChain] = useState<ChainState>();
  const [chainErr, setChainErr] = useState(false);
  const [accountResult, setAccountResult] = useState<{ key: string; value: AccountState }>();
  const [cardsResult, setCardsResult] = useState<{ key: string; value: Card[] }>();
  const [cardsErrorKey, setCardsErrorKey] = useState<string>();
  // Hide the previous wallet's data in the very render that changes identity,
  // before effects or a replacement request have had a chance to run.
  const acct = accountResult?.key === walletKey ? accountResult.value : undefined;
  const cards = cardsResult?.key === walletKey ? cardsResult.value : undefined;
  const cardsErr = cardsErrorKey === walletKey;
  const [busy, setBusy] = useState<string>();
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "info"; text: string }>();
  const [tick, setTick] = useState(0);
  const liveRef = useRef<LiveStatus>();
  liveRef.current = live;

  usePoll(async () => {
    try {
      const res = await fetch(STATUS_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const j = await res.json();
      const m = j?.measurement ?? {};
      setLive({
        running: m.coreStatus === "RUNNING",
        kmh: (Number(m.speedMmPerSecond) || 0) * 0.0036,
        observedAt: m.observedAt,
        stale: m.freshness && m.freshness !== "online",
      });
      setLiveErr(false);
    } catch (e) {
      setLiveErr(true);
      throw e;
    }
  }, "live");

  const refreshChain = useCallback(async (isActive: () => boolean) => {
    const generation = ++refreshGeneration.current;
    const isCurrent = () => isActive() && generation === refreshGeneration.current && currentWallet.current === walletKey;
    let c: ChainState;
    try {
      c = await loadChain();
    } catch (e) {
      if (!isCurrent()) return;
      setChainErr(true);
      setAccountResult(undefined);
      throw e;
    }
    if (!isCurrent()) return;
    setChain(c);
    setChainErr(false);
    if (!w.address) return;

    const [account, collection] = await Promise.allSettled([
      loadAccount(w.address, c, liveRef.current?.running ?? false),
      loadCards(w.address, c.runs),
    ]);
    if (!isCurrent()) return;
    if (account.status === "fulfilled") {
      setAccountResult({ key: walletKey, value: account.value });
    } else {
      setAccountResult(undefined);
      setChainErr(true);
    }
    if (collection.status === "fulfilled") {
      setCardsResult({ key: walletKey, value: collection.value });
      setCardsErrorKey(undefined);
    } else {
      setCardsErrorKey(walletKey);
    }
    // Keep the specific card error visible, and let the poller apply its full
    // five-minute backoff even when account reads succeeded.
    if (account.status === "rejected") throw account.reason;
    if (collection.status === "rejected") throw collection.reason;
  }, [w.address, walletKey]);

  usePoll(refreshChain, `${walletKey}:${tick}`);
  useEffect(() => { setAccountResult(undefined); setCardsResult(undefined); setCardsErrorKey(undefined); }, [walletKey]);

  /* ----- transactions ----- */

  const ready = !!w.address && w.onSepolia && !!w.wallet && !busy && !chainErr;

  async function run(label: string, steps: () => Promise<string | void>) {
    if (!w.wallet || !w.address) return;
    setBusy(label);
    setMsg({ kind: "info", text: `${label}: confirm in your wallet, then wait for Sepolia.` });
    try {
      const done = await steps();
      setMsg({ kind: "ok", text: done || `${label}: done.` });
    } catch (e) {
      setMsg({ kind: "err", text: plainError(e) });
    } finally {
      setBusy(undefined);
      setTick((t) => t + 1);
    }
  }

  const sendTx = (to: string, data: string, gasLimit?: bigint) => send(w.wallet!.provider, { to, data, ...(gasLimit ? { gasLimit } : {}) });
  const approveTx = () => sendTx(CARDIO, erc20Abi.encodeFunctionData("approve", [RUNCARDS, STAKE]));
  const syncTx = () => sendTx(RUNCARDS, runCardsAbi.encodeFunctionData("sync"), GAS.sync);

  /** Sync until RunCards says it caught up. Returns when the last sync reported true. */
  async function syncUntilCaughtUp(me: string, label: string) {
    for (let i = 1; i <= 20; i++) {
      const s = await simulate(RUNCARDS, runCardsAbi, "sync", [], me, GAS.sync);
      if (!s.ok) throw s.error;
      const caughtUp = s.result[0] as boolean;
      setMsg({ kind: "info", text: `${label}: catching up with Squeekchain (sync ${i}). Confirm in your wallet.` });
      await syncTx();
      if (caughtUp) return;
    }
    throw new Error("Still catching up after 20 syncs. Press the button again to continue.");
  }

  const onApprove = () => run("Approve 30,000 $CARDIO", async () => {
    await approveTx();
    return "Approved. You can join now.";
  });

  const onJoin = () => run("Join", async () => {
    const me = w.address!;
    for (let i = 0; i < 25; i++) {
      const sim = await simulate(RUNCARDS, runCardsAbi, "join", [], me, GAS.join);
      if (sim.ok) {
        setMsg({ kind: "info", text: "Join: confirm in your wallet." });
        await sendTx(RUNCARDS, runCardsAbi.encodeFunctionData("join"), GAS.join);
        return "You joined this run. Your 30,000 $CARDIO is locked until delivery or until you leave.";
      }
      const name = errorName(sim.error);
      if (name === "NotApproved") {
        setMsg({ kind: "info", text: "Join: first approve exactly 30,000 $CARDIO in your wallet." });
        await approveTx();
      } else if (name === "NotCaughtUp") {
        await syncUntilCaughtUp(me, "Join");
      } else throw sim.error;
    }
    throw new Error("Join did not go through. Try again.");
  });

  const onLeave = (n: number) => run(`Leave run ${n}`, async () => {
    await sendTx(RUNCARDS, runCardsAbi.encodeFunctionData("leave", [n]), GAS.leave);
    return `You left run ${n}. Your 30,000 $CARDIO is back in your wallet.`;
  });

  const onDeliver = (n: number, needsSync: boolean) => run(`Deliver run ${n}`, async () => {
    const me = w.address!;
    if (needsSync) {
      await syncUntilCaughtUp(me, `Deliver run ${n}`);
      const again = await simulate(RUNCARDS, runCardsAbi, "deliver", [n], me, GAS.deliver);
      if (!again.ok) throw again.error;
    }
    setMsg({ kind: "info", text: `Deliver run ${n}: confirm in your wallet.` });
    await sendTx(RUNCARDS, runCardsAbi.encodeFunctionData("deliver", [n]), GAS.deliver);
    return `Run ${n} delivered: every runner got a card and their 30,000 $CARDIO back.`;
  });

  const onReveal = (n: number) => run(`Reveal run ${n}`, async () => {
    await sendTx(RUNCARDS, runCardsAbi.encodeFunctionData("reveal", [n]), GAS.reveal);
    return `Run ${n} revealed. Rarity now shows on its cards.`;
  });

  /* ----- derived ----- */

  const openInfo = chain && chain.openRun > 0 ? chain.runs.find((r) => r.n === chain.openRun) : undefined;
  const onlyEarly = chain && (chain.runCount === 0 || chain.runs.every((r) => r.startedEarly));
  const joiningOpen = !!(chain && openInfo && chain.running && !openInfo.closed && openInfo.joiners < MAX_RUNNERS);
  const hasStake = acct ? acct.balance >= STAKE : undefined;
  const joinBlocked = acct && typeof acct.join === "object" ? acct.join.blocked : undefined;
  const joinEnabled = ready && !!acct && !joinBlocked;
  const meInOpen = !!(acct && chain && acct.joinedRuns.includes(chain.openRun));
  const waiting = chain?.actionRuns.filter((r) => r.minted === 0 && r.joiners > 0 && r.n !== (joiningOpen ? chain.openRun : -1)) ?? [];
  const revealable = chain?.actionRuns.filter((r) => r.minted > 0 && !r.revealed &&
    (chain.revealRounds[r.n] ?? 0n) > 0n && chain.revealRounds[r.n] <= chain.settledRound) ?? [];

  let joinHint = "";
  if (!w.address) joinHint = "Connect a wallet to join.";
  else if (!w.onSepolia) joinHint = "Switch your wallet to Sepolia to join.";
  else if (chainErr) joinHint = "Wallet checks unavailable. Retrying in 5 minutes.";
  else if (!acct) joinHint = "Checking what this wallet can do…";
  else if (joinBlocked) joinHint = ERROR_TEXT[joinBlocked] ?? "Joining is not possible right now.";
  else if (acct.join === "approve") joinHint = "Join asks you to approve exactly 30,000 $CARDIO first.";
  else if (acct.join === "sync") joinHint = "Join first syncs Run Cards with Squeekchain, then joins.";
  else joinHint = "Locks 30,000 $CARDIO until delivery. You can leave any time before.";

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="top wrap">
        <div className="top-row">
          <div className="brand">
            <Hamster size={32} className="brand-mark" />
            <h1>Run Cards</h1>
          </div>
          <ConnectControl w={w} />
        </div>
        <p className="lede">Lock test $CARDIO while Squeektoshi the hamster runs. Get a pixel card and your coins back.</p>
        <p className="small muted">Unofficial, on Sepolia testnet. Test coins only.</p>
      </header>

      <main id="main" className="wrap grid">
        {/* Live wheel */}
        <section className="card live" aria-labelledby="live-h">
          <h2 id="live-h" className="sr-only">Live wheel</h2>
          <div className="live-row">
            <span className={`dot ${live?.running && !liveErr && !live.stale ? "on" : ""}`} aria-hidden="true" />
            <p className="live-state">
              {live ? `${liveErr || live.stale ? "Last known: " : ""}${live.running ? (liveErr || live.stale ? "running" : "Running now") : "Resting"}` : liveErr ? "Wheel status unavailable" : "Checking the wheel…"}
              {live && <span className="num"> · {live.kmh.toFixed(1)} km/h</span>}
            </p>
          </div>
          <p className="small muted">
            {chain ? <>{chainErr ? "Last known: settled round " : "Settled round "}<span className="num">{fmtInt(chain.settledRound)}</span> · Squeekchain block <span className="num">{fmtInt(chain.blockHeight)}</span></> : chainErr ? "Settled round unavailable." : "Reading Sepolia…"}
            {live?.stale ? " · wheel reading is stale" : ""}
          </p>
          <p className="small note" role="status" hidden={!liveErr}>{liveErr ? `${live ? "Wheel status unavailable. " : ""}Retrying in 5 minutes.` : ""}</p>
          <p className="small note" role="status" hidden={!chainErr}>{chainErr ? `Sepolia unavailable.${chain ? " Showing the last reading." : ""} Retrying in 5 minutes.` : ""}</p>
        </section>

        {/* This run */}
        <section className="card run" aria-labelledby="run-h">
          <h2 id="run-h">{openInfo ? `Run ${openInfo.n}` : "This run"}</h2>
          {!chain && <p className="muted">{chainErr ? "Run status unavailable." : "Reading the run from Sepolia…"}</p>}
          {chain && !openInfo && (
            <p>
              {onlyEarly
                ? "No run has started since the contract was deployed. Joining opens when his next run starts."
                : "No run is open. Joining opens when his next run starts."}
            </p>
          )}
          {chain && openInfo && (
            <dl className="stats">
              <Stat label="Started round" value={fmtInt(openInfo.startRound)} />
              <Stat label="Rounds with work" value={fmtInt(openInfo.activeRounds)} />
              <Stat label="Work so far" value={fmtInt(openInfo.work)} />
              <Stat label="Runners" value={`${openInfo.joiners} of ${MAX_RUNNERS}`} />
              <Stat label="Joining" value={chainErr ? "Unknown" : joiningOpen ? "Open" : "Closed"} />
            </dl>
          )}
          <div className="actions">
            {meInOpen ? (
              <p className="ok-line">You are in run {chain!.openRun}.</p>
            ) : (
              <button className="btn btn-primary btn-wide" disabled={!joinEnabled} onClick={onJoin}>
                {busy === "Join" ? "Joining…" : "Join with 30,000 $CARDIO"}
              </button>
            )}
            {acct?.leave.map((n) => (
              <button key={n} className="btn btn-wide" disabled={!ready} onClick={() => onLeave(n)}>
                {busy === `Leave run ${n}` ? "Leaving…" : `Leave run ${n} and get 30,000 $CARDIO back`}
              </button>
            ))}
          </div>
          {!meInOpen && <p className="small muted hint">{joinHint}</p>}
        </section>

        {/* Wallet */}
        <section className="card wallet" aria-labelledby="wallet-h">
          <h2 id="wallet-h">Your wallet</h2>
          {!w.address && <p className="muted">No wallet connected.</p>}
          {w.address && !w.onSepolia && (
            <p>Your wallet is on another network. <button className="btn" onClick={w.switchChain}>Switch to Sepolia</button></p>
          )}
          {w.note && <p className="note">{w.note}</p>}
          {w.address && (
            <dl className="stats">
              <Stat label="Address" value={<span className="mono">{short(w.address)}</span>} />
              <Stat label="$CARDIO" value={acct ? fmtCardio(acct.balance) : "…"} />
              <Stat label="Has 30,000" value={hasStake === undefined ? "…" : hasStake ? "Yes" : "No"} />
              <Stat label="Approved" value={acct ? (acct.allowance >= STAKE ? "Yes, 30,000" : fmtCardio(acct.allowance)) : "…"} />
            </dl>
          )}
          {w.address && acct && acct.allowance < STAKE && (
            <div className="actions">
              <button className="btn" disabled={!ready || !acct.canApprove} onClick={onApprove}>
                {busy === "Approve 30,000 $CARDIO" ? "Approving…" : "Approve 30,000 $CARDIO"}
              </button>
            </div>
          )}
          {w.address && acct && hasStake === false && (
            <p className="small muted">Get test $CARDIO on <a href={LINKS.wheelpad} target="_blank" rel="noopener noreferrer">Wheelpad</a>.</p>
          )}
        </section>

        {/* Status line for transactions */}
        <div className={`msg ${msg?.kind ?? ""}`} role="status" aria-live="polite">{msg ? msg.text : null}</div>

        {/* Deliver and reveal */}
        <section className="card ended" aria-labelledby="ended-h">
          <h2 id="ended-h">Deliver and reveal</h2>
          <p className="muted">Deliver an ended run. Reveal its cards after the next run settles.</p>
          {w.address && acct && (acct.deliver.length > 0 || acct.reveal.length > 0) ? (
            <div className="actions">
              {acct.deliver.map((d) => (
                <button key={`d${d.n}`} className="btn" disabled={!ready} onClick={() => onDeliver(d.n, d.needsSync)}>
                  {busy === `Deliver run ${d.n}` ? "Delivering…" : d.needsSync ? `Sync and deliver run ${d.n}` : `Deliver run ${d.n}`}
                </button>
              ))}
              {acct.reveal.map((n) => (
                <button key={`r${n}`} className="btn" disabled={!ready} onClick={() => onReveal(n)}>
                  {busy === `Reveal run ${n}` ? "Revealing…" : `Reveal run ${n}`}
                </button>
              ))}
            </div>
          ) : (
            <div className="small">
              {!chain ? <p>{chainErr ? "Delivery and reveal status unavailable. Retrying in 5 minutes." : "Reading delivery and reveal status…"}</p>
                : chainErr ? <p>Wallet checks unavailable. Retrying in 5 minutes.</p>
                : w.address && !acct ? <p>Checking what this wallet can do…</p>
                : <>
                  {waiting.length > 0 && <p>Waiting for delivery: {waiting.map((r) => `run ${r.n}`).join(", ")}. {w.address ? "Deliver unlocks when the run has ended." : "Connect a wallet to deliver."}</p>}
                  {revealable.map((r) => <p key={r.n}>{w.address ? `Reveal run ${r.n} is not available for this wallet right now.` : `Connect a wallet to reveal run ${r.n}.`}</p>)}
                  {!waiting.length && !revealable.length && <p>Nothing to deliver or reveal.</p>}
                </>}
            </div>
          )}
        </section>

        {/* My cards */}
        <section className="card cards" aria-labelledby="cards-h">
          <h2 id="cards-h">My cards</h2>
          {!w.address && <p className="muted">Connect a wallet to see the cards it holds.</p>}
          <p className="small note" role="status" hidden={!w.address || !cardsErr}>{w.address && cardsErr ? `Could not read your cards.${cards?.length ? " Showing the last reading." : ""} Retrying in 5 minutes.` : ""}</p>
          {w.address && !cards && !cardsErr && <p className="muted">Looking for your cards…</p>}
          {w.address && cards && !cardsErr && cards.length === 0 && (
            <p className="muted">No cards yet. Join a run while he is running: you get a card when the run is delivered.</p>
          )}
          {cards && cards.length > 0 && (
            <ul className="card-grid">
              {cards.map((c) => (
                <li key={c.tokenId.toString()} className="nft">
                  {c.image ? <img src={c.image} alt={`${c.name}, pixel hamster card`} width={240} height={240} /> : <div className="nft-blank"><Hamster size={96} /></div>}
                  <h3>{c.name}</h3>
                  <p className="small muted">Run {c.run} · token <span className="num">{c.tokenId.toString()}</span></p>
                  {!c.revealed && <p className="small badge">Not revealed yet: rarity shows after his next run settles.</p>}
                  {c.attributes.length > 0 && (
                    <dl className="attrs">
                      {c.attributes.map((a, i) => (
                        <div key={i}><dt>{a.trait_type ?? "Trait"}</dt><dd>{String(a.value ?? "")}</dd></div>
                      ))}
                    </dl>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Past runs */}
        <section className="card past" aria-labelledby="past-h">
          <h2 id="past-h">Past runs</h2>
          {!chain ? <p className="muted">Reading runs…</p> : chain.runs.length === 0 ? <p className="muted">No runs yet.</p> : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th scope="col">Run</th><th scope="col">Work</th><th scope="col">Runners</th><th scope="col">Delivered</th><th scope="col">Revealed</th></tr>
                </thead>
                <tbody>
                  {chain.runs.map((r) => (
                    <tr key={r.n}>
                      <td data-label="Run" className="num">{r.n}{r.n === chain.openRun ? " (now)" : ""}</td>
                      <td data-label="Work" className="num">{fmtInt(r.work)}</td>
                      <td data-label="Runners" className="num">{Math.max(r.joiners, r.minted)}</td>
                      <td data-label="Delivered">{deliveredText(r)}</td>
                      <td data-label="Revealed">{r.minted > 0 ? (r.revealed ? "Yes" : "Not yet") : "No cards"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="card how" aria-labelledby="how-h">
          <h2 id="how-h">How it works</h2>
          <ol className="steps">
            <li><strong>He runs.</strong> Squeektoshi is a real hamster on a wheel. Squeekchain settles his work on-chain in 10-minute rounds. A run is one session; it ends after 4 hours (24 rounds) with no work.</li>
            <li><strong>You join.</strong> While he is running, approve exactly 30,000 $CARDIO for Run Cards, then join to lock it. Each join uses the approval up. Up to 100 runners per run.</li>
            <li><strong>Anyone delivers.</strong> When the run has ended, anyone presses Deliver. Every runner gets one pixel-hamster card, drawn fully on-chain, and their 30,000 $CARDIO back, in one transaction.</li>
            <li><strong>Cards reveal.</strong> Cards say “not revealed yet” until his next run settles. Then rarity shows: Common, Rare, Epic or Legendary. Longer runs give better odds.</li>
          </ol>
        </section>

        <section className="card faq" aria-labelledby="faq-h">
          <h2 id="faq-h">Questions</h2>
          <details>
            <summary>Can I leave a run?</summary>
            <p>Yes, any time before delivery. Your 30,000 $CARDIO comes back at once, and you get no card.</p>
          </details>
          <details>
            <summary>When does joining close?</summary>
            <p>Once a settled round with no work follows his last one, or when 100 runners are in.</p>
          </details>
          <details>
            <summary>Why can’t I join run 1?</summary>
            <p>Run 1 was already under way when Run Cards was deployed, so nobody can join it. The first joinable run is the next one.</p>
          </details>
          <details>
            <summary>Do the coins or cards have value?</summary>
            <p>No. $CARDIO here is a test coin on Sepolia and the cards are test NFTs. Neither has any value.</p>
          </details>
          <details>
            <summary>Are there fees or an owner?</summary>
            <p>No fees and no owner. You only pay Sepolia test gas.</p>
          </details>
          <details>
            <summary>Why did a button stay disabled?</summary>
            <p>Each button checks with a free simulation from your wallet first and turns on only when the call would work.</p>
          </details>
        </section>
      </main>

      <footer className="wrap foot">
        <ul className="links">
          <li><a href={LINKS.runCards} target="_blank" rel="noopener noreferrer">RunCards contract on Etherscan</a></li>
          <li><a href={LINKS.cardio} target="_blank" rel="noopener noreferrer">$CARDIO on Etherscan</a></li>
          <li><a href={LINKS.wheelpad} target="_blank" rel="noopener noreferrer">$CARDIO on Wheelpad</a></li>
          <li><a href={LINKS.squeekchain} target="_blank" rel="noopener noreferrer">Squeekchain</a></li>
        </ul>
        <p className="small muted">An unofficial fan build. Sepolia testnet only: test coins and cards have no value.</p>
      </footer>
    </>
  );
}
