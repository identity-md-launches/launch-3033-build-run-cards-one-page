import { useCallback, useEffect, useRef, useState } from "react";
import {
  GAS, JOIN_RETRY_MS, LINKS, MAX_RUNNERS, MILES, RUNCARDS, STAKE, STATUS_URL, erc20Abi, runCardsAbi,
} from "./config";
import {
  fmtMiles, fmtInt, loadAccount, loadCards, loadChain, send,
  type AccountState, type Card, type ChainState, type RunInfo,
} from "./chain";
import { ConnectSheet, short } from "./ConnectSheet";
import { DotTitle } from "./DotTitle";
import { ERROR_TEXT, errorName, plainError } from "./errors";
import { Hamster, Logo } from "./Hamster";
import { MilesBox } from "./Miles";
import { usePoll } from "./poll";
import { simulate } from "./rpc";
import { ODDS, SampleRows } from "./Samples";
import { Box, Stat } from "./ui";
import { useWallet } from "./useWallet";

type LiveStatus = { running: boolean; kmh: number; observedAt?: string; stale: boolean };

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
    if (account.status === "rejected") throw account.reason;
    if (collection.status === "rejected") throw collection.reason;
  }, [w.address, walletKey]);

  usePoll(refreshChain, `${walletKey}:${tick}`);
  useEffect(() => { setAccountResult(undefined); setCardsResult(undefined); setCardsErrorKey(undefined); }, [walletKey]);

  // Join retry. While the page is healthy its own 30 s refresh re-simulates Join. After an error that
  // refresh backs off for 5 minutes, so while Join cannot go through this simulates it again every
  // 30 s (tab visible only) and refreshes the page as soon as the answer changes or Sepolia answers
  // again: Join turns on soon after he starts running.
  const joinBlockedNow = acct && typeof acct.join === "object" ? acct.join.blocked : undefined;
  const joinWatch = !!(w.address && w.onSepolia && ((joinBlockedNow && cardsErr) || chainErr));
  usePoll(async (isActive) => {
    if (!joinWatch || !w.address) return;
    const sim = await simulate(RUNCARDS, runCardsAbi, "join", [], w.address, GAS.join);
    if (!isActive() || currentWallet.current !== walletKey) return;
    const name = sim.ok ? "ready" : errorName(sim.error);
    if (!name) throw sim.ok ? new Error("unreachable") : sim.error; // Sepolia still down: again in 30 s
    if (chainErr || name !== joinBlockedNow) setTick((t) => t + 1);
  }, `join:${walletKey}:${joinWatch}:${chainErr}:${joinBlockedNow ?? ""}`, JOIN_RETRY_MS, JOIN_RETRY_MS);

  /* ----- transactions ----- */

  const ready = w.connected && w.onSepolia && !busy && !chainErr;

  async function run(label: string, steps: () => Promise<string | void>) {
    if (!w.address) return;
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

  const sendTx = (to: string, data: string, gas?: bigint) => send({ to, data, gas }, () => setMsg({ kind: "info", text: "Sent. Waiting for Sepolia to include it…" }));
  const approveTx = () => sendTx(MILES, erc20Abi.encodeFunctionData("approve", [RUNCARDS, STAKE]));
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

  const onApprove = () => run("Approve 30,000 $MILES", async () => {
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
        return "You joined this run. Your 30,000 $MILES is locked until delivery or until you leave.";
      }
      const name = errorName(sim.error);
      if (name === "NotApproved") {
        setMsg({ kind: "info", text: "Join: first approve exactly 30,000 $MILES in your wallet." });
        await approveTx();
      } else if (name === "NotCaughtUp") {
        await syncUntilCaughtUp(me, "Join");
      } else throw sim.error;
    }
    throw new Error("Join did not go through. Try again.");
  });

  const onLeave = (n: number) => run(`Leave run ${n}`, async () => {
    await sendTx(RUNCARDS, runCardsAbi.encodeFunctionData("leave", [n]), GAS.leave);
    return `You left run ${n}. Your 30,000 $MILES is back in your wallet.`;
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
    return `Run ${n} delivered: every runner got a card and their 30,000 $MILES back.`;
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
  else if (chainErr) joinHint = "Wallet checks unavailable. Checking Join again every 30 seconds.";
  else if (!acct) joinHint = "Checking what this wallet can do…";
  else if (joinBlocked) joinHint = `${ERROR_TEXT[joinBlocked] ?? "Joining is not possible right now."} Checking again every 30 seconds.`;
  else if (acct.join === "approve") joinHint = "Join asks you to approve exactly 30,000 $MILES first, then joins.";
  else if (acct.join === "sync") joinHint = "Join first syncs Run Cards with Squeekchain, then joins.";
  else joinHint = "Locks 30,000 $MILES until delivery. You can leave any time before.";

  const wheelOn = !!(live?.running && !liveErr && !live.stale);
  const joinLabel = busy === "Join" ? "Joining…" : !w.connected ? "Join with 30,000 $MILES" : acct?.join === "approve" ? "Approve and join" : "Join with 30,000 $MILES";

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="wrap">
        <header className="box top">
          <div className="brand">
            <Logo size={30} />
            <span className="brand-line">WHEEL MILES · RUN CARDS · SEPOLIA</span>
          </div>
          <ConnectSheet w={w} />
        </header>

        <main id="main" className="page">
          <section className="box hero" aria-label="Run Cards">
            <DotTitle />
            <p className="tagline">Hold $MILES. Join the run.<br /><span className="blue">Get a card when it ends.</span></p>
            <p className="lede">Whenever Squeektoshi is on the wheel, holders of 30,000 $MILES can join while he runs. When he has rested for 4 hours, the run ends and each runner gets their own on-chain card, drawn from that run’s real numbers.</p>
          </section>

          <div className="row row-3">
            <Box id="wheel" title="The wheel" color="var(--green)" note={live && !liveErr ? (live.stale ? "stale" : "live") : liveErr ? "offline" : "…"}>
              <div className="live-row">
                <span className={`dot ${wheelOn ? "on" : ""}`} aria-hidden="true" />
                <p className="live-state">
                  {live ? `${liveErr || live.stale ? "Last known: " : ""}${live.running ? (liveErr || live.stale ? "running" : "Running now") : "Resting"}` : liveErr ? "Wheel status unavailable" : "Checking the wheel…"}
                </p>
              </div>
              <dl className="stats stats-2">
                <Stat label="Speed" value={live ? `${live.kmh.toFixed(1)} km/h` : "…"} />
                <Stat label="Settled round" value={chain ? fmtInt(chain.settledRound) : "…"} />
              </dl>
              <p className="small muted">{chain ? <>Squeekchain block {fmtInt(chain.blockHeight)}</> : chainErr ? "Settled round unavailable." : "Reading Sepolia…"}</p>
              <p className="small note" role="status" hidden={!liveErr}>{liveErr ? `${live ? "Wheel status unavailable. " : ""}Retrying in 5 minutes.` : ""}</p>
              <p className="small note" role="status" hidden={!chainErr}>{chainErr ? `Sepolia unavailable.${chain ? " Showing the last reading." : ""} Retrying in 5 minutes.` : ""}</p>
            </Box>

            <Box id="run" title={openInfo ? `Run ${openInfo.n}` : "The run"} color="var(--orange)" note={chain ? (chainErr ? "unknown" : joiningOpen ? "joining open" : "joining closed") : "…"}>
              {!chain && <p className="muted">{chainErr ? "Run status unavailable." : "Reading the run from Sepolia…"}</p>}
              {chain && !openInfo && (
                <p>
                  {onlyEarly
                    ? "Run 1 was under way when Run Cards was deployed, so nobody can join it. Joining opens when run 2 starts."
                    : "No run is open. Joining opens when his next run starts."}
                </p>
              )}
              {chain && openInfo && (
                <dl className="stats stats-2">
                  <Stat label="Rounds with work" value={fmtInt(openInfo.activeRounds)} />
                  <Stat label="Work so far" value={fmtInt(openInfo.work)} />
                  <Stat label="Runners" value={`${openInfo.joiners} / ${MAX_RUNNERS}`} />
                  <Stat label="Started round" value={fmtInt(openInfo.startRound)} />
                </dl>
              )}
              <div className="actions">
                {meInOpen ? (
                  <p className="ok-line">You are in run {chain!.openRun}.</p>
                ) : (
                  <button className="btn btn-primary btn-wide" disabled={!joinEnabled} onClick={onJoin} aria-describedby="join-hint">
                    {joinLabel}
                  </button>
                )}
                {acct?.leave.map((n) => (
                  <button key={n} className="btn btn-wide" disabled={!ready} onClick={() => onLeave(n)}>
                    {busy === `Leave run ${n}` ? "Leaving…" : `Leave run ${n}, get 30,000 back`}
                  </button>
                ))}
              </div>
              {!meInOpen && <p id="join-hint" className="small muted">{joinHint}</p>}
            </Box>

            <Box id="wallet" title="Your wallet" color="var(--blue)" note={w.connected ? (w.onSepolia ? "Sepolia" : "wrong network") : "not connected"}>
              {!w.address && <p className="muted">No wallet connected. Connect at the top right to join.</p>}
              {w.address && !w.onSepolia && (
                <p>Your wallet is on another network. <button className="btn" onClick={w.switchChain} disabled={w.switching}>{w.switching ? "Switching…" : "Switch to Sepolia"}</button></p>
              )}
              {w.note && <p className="small note" role="status">{w.note}</p>}
              {w.address && (
                <dl className="stats stats-2">
                  <Stat label="Address" value={short(w.address)} />
                  <Stat label="$MILES" value={acct ? fmtMiles(acct.balance) : "…"} />
                  <Stat label="Has 30,000" value={hasStake === undefined ? "…" : hasStake ? "Yes" : "No"} />
                  <Stat label="Approved" value={acct ? (acct.allowance >= STAKE ? "30,000" : fmtMiles(acct.allowance)) : "…"} />
                </dl>
              )}
              {w.address && acct && acct.allowance < STAKE && (
                <div className="actions">
                  <button className="btn" disabled={!ready || !acct.canApprove} onClick={onApprove}>
                    {busy === "Approve 30,000 $MILES" ? "Approving…" : "Approve 30,000 $MILES"}
                  </button>
                </div>
              )}
              {w.address && acct && hasStake === false && (
                <p className="small muted">You need 30,000 $MILES to join. Buy them on <a href={LINKS.wheelpad} target="_blank" rel="noopener noreferrer">Wheelpad</a>.</p>
              )}
            </Box>
          </div>

          <MilesBox />

          <div className={`msg ${msg?.kind ?? ""}`} role="status" aria-live="polite">{msg ? msg.text : null}</div>

          <div className="row row-2-1">
            <Box id="cards" title="My cards" color="var(--purple)" note={cards ? `${cards.length} held` : undefined}>
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
                      <div className="art">
                        {c.image ? <img src={c.image} alt={`${c.name}, on-chain run card`} /> : <Hamster size={96} />}
                      </div>
                      <h3 className="card-name">{c.name}</h3>
                      <p className="small muted">Run {c.run} · token {c.tokenId.toString()}</p>
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
            </Box>

            <Box id="ended" title="Deliver and reveal" color="var(--green)" note="anyone can">
              <p className="muted small">Deliver an ended run. Reveal its cards after the next run settles.</p>
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
            </Box>
          </div>

          <Box id="samples" title="Sample cards" color="var(--blue)" note="examples, not cards anyone owns">
            <SampleRows />
          </Box>

          <Box id="odds" title="Rarity odds" color="var(--purple)" note="per card">
            <div className="table-wrap">
              <table className="odds">
                <thead>
                  <tr><th scope="col">Run</th><th scope="col">Common</th><th scope="col" className="c-rare">Rare</th><th scope="col" className="c-epic">Epic</th><th scope="col" className="c-legendary">Legendary</th></tr>
                </thead>
                <tbody>
                  {ODDS.map((o) => (
                    <tr key={o.label}>
                      <th scope="row">{o.label}</th>
                      <td data-label="Common">{o.odds[0]}%</td>
                      <td data-label="Rare" className="c-rare">{o.odds[1]}%</td>
                      <td data-label="Epic" className="c-epic">{o.odds[2]}%</td>
                      <td data-label="Legendary" className="c-legendary">{o.odds[3]}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted">A great run with 100 runners gives about 20 Legendaries; a slow one about 2. Every runner gets a card, and even a slow run can roll a Legendary.</p>
          </Box>

          <Box id="past" title="Past runs" color="var(--orange)" note={chain ? `${chain.runCount} so far` : undefined}>
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
          </Box>

          <div className="row row-2-1">
            <Box id="how" title="How it works" color="var(--green)">
              <ol className="steps">
                <li><strong>He runs.</strong> Squeektoshi is a real hamster on a wheel. Squeekchain settles his work on-chain in 10-minute rounds. A run is one session; it ends after 4 hours (24 rounds) with no work.</li>
                <li><strong>You join.</strong> While he is running, approve exactly 30,000 $MILES for Run Cards, then join to lock it. Each join uses the approval up. Up to 100 runners per run.</li>
                <li><strong>Anyone delivers.</strong> When the run has ended, anyone presses Deliver. Every runner gets one card, drawn fully on-chain from that run’s numbers, and their 30,000 $MILES back, in one transaction.</li>
                <li><strong>Cards reveal.</strong> Cards say “not revealed yet” until his next run settles. Then rarity shows: Common, Rare, Epic or Legendary. Longer runs give better odds.</li>
              </ol>
            </Box>

            <Box id="faq" title="Questions" color="var(--blue)">
              <details>
                <summary>Can I leave a run?</summary>
                <p>Yes, any time before delivery. Your 30,000 $MILES comes back at once, and you get no card.</p>
              </details>
              <details>
                <summary>When does joining close?</summary>
                <p>Once a settled round with no work follows his last one, or when 100 runners are in.</p>
              </details>
              <details>
                <summary>Why can’t I join run 1?</summary>
                <p>Run 1 was already under way when Run Cards was deployed, so nobody can join it. The first joinable run is run 2.</p>
              </details>
              <details>
                <summary>Where do I get $MILES?</summary>
                <p>On the $MILES Wheelpad curve, for Sepolia ETH. Joining needs 30,000.</p>
              </details>
              <details>
                <summary>Do the coins or cards have value?</summary>
                <p>No. $MILES here is a test coin on Sepolia and the cards are test NFTs. Neither has any value.</p>
              </details>
              <details>
                <summary>Are there fees or an owner?</summary>
                <p>Run Cards takes no fee and has no owner. You only pay Sepolia test gas.</p>
              </details>
              <details>
                <summary>Why did a button stay disabled?</summary>
                <p>Each button checks with a free simulation from your wallet first and turns on only when the call would work. Join checks again every 30 seconds.</p>
              </details>
            </Box>
          </div>
        </main>

        <footer className="foot">
          <ul className="links">
            <li><a href={LINKS.runCards} target="_blank" rel="noopener noreferrer">RunCards on Etherscan</a></li>
            <li><a href={LINKS.miles} target="_blank" rel="noopener noreferrer">$MILES on Etherscan</a></li>
            <li><a href={LINKS.wheelpad} target="_blank" rel="noopener noreferrer">$MILES on Wheelpad</a></li>
            <li><a href={LINKS.squeekchain} target="_blank" rel="noopener noreferrer">Squeekchain</a></li>
          </ul>
          <p className="small muted">Unofficial, Sepolia testnet only: test coins and cards have no value.</p>
        </footer>
      </div>
    </>
  );
}
