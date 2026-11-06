import { useEffect, useRef, useState } from "react";
import { useConnect, type Connector } from "wagmi";
import { WALLET_ICONS, iconUri } from "./wallet-icons";
import { OPEN_IN, isMobileBrowser } from "./open-in";
import type { WalletApi } from "./useWallet";

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** The one connect control and its sheet: the network's structure, in the site's own type and colors. */
export function ConnectSheet({ w }: { w: WalletApi }) {
  const mobile = isMobileBrowser();
  const { connectors, connect, isPending, variables } = useConnect();
  const ref = useRef<HTMLDialogElement>(null);
  const [note, setNote] = useState<string>();
  const open = () => { setNote(undefined); ref.current?.showModal(); };
  const close = () => ref.current?.close();
  useEffect(() => { if (w.connected) close(); }, [w.connected]);

  // EIP-6963 names each installed extension; wagmi's generic injected row is only for a browser
  // where discovery found nothing, and then it is called "Browser wallet". Extensions first, then Coinbase.
  const named = connectors.some((c) => c.type === "injected" && c.id !== "injected");
  const hasInjected = typeof window !== "undefined" && !!(window as { ethereum?: unknown }).ethereum;
  const listed = [...connectors.filter((c) => c.type === "injected"), ...connectors.filter((c) => c.type !== "injected")]
    .filter((c) => !(c.id === "injected" && (named || !hasInjected)))
    .filter((c) => !mobile || c.type !== "injected");
  const label = (c: Connector) =>
    c.id === "injected" ? "Browser wallet" : c.id === "coinbaseWalletSDK" ? (mobile ? "Coinbase Smart Wallet" : "Coinbase Wallet") : c.name;
  const icon = (c: Connector) => c.icon ?? (WALLET_ICONS[c.id] ? iconUri(WALLET_ICONS[c.id]) : undefined);

  const pick = (c: Connector) => {
    setNote(undefined);
    connect(
      { connector: c },
      {
        onError: (e) =>
          setNote(/reject|denied|cancel|4001/i.test(String((e as Error).message))
            ? `${label(c)}: you cancelled. Pick a wallet to try again.`
            : `${label(c)} did not connect. Open the wallet, unlock it, and try again.`),
      },
    );
  };

  if (w.connected && w.address && !w.onSepolia) {
    return (
      <button className="btn btn-primary" onClick={w.switchChain} disabled={w.switching}>
        {w.switching ? "Switching…" : "Switch to Sepolia"}
      </button>
    );
  }
  if (w.connected && w.address) {
    return (
      <button className="btn" onClick={w.disconnect} aria-label={`${short(w.address)}, disconnect`}>
        <span className="addr">{short(w.address)}</span><span className="wide-only"> · Disconnect</span>
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
          {mobile && OPEN_IN.map((o) => (
            <a key={o.id} className="row" href={o.href(location.href)}>
              <span className="ic" aria-hidden="true"><img width={28} height={28} src={iconUri(WALLET_ICONS[o.id])} alt="" /></span>
              <span>Open in {o.name}</span>
            </a>
          ))}
          {listed.map((c) => {
            const pending = isPending && variables?.connector === c;
            return (
              <button key={c.uid} className="row" onClick={() => pick(c)} disabled={isPending}>
                <span className="ic" aria-hidden="true">{icon(c) ? <img width={28} height={28} src={icon(c)} alt="" /> : null}</span>
                <span>{label(c)}{pending ? " · opening…" : ""}</span>
              </button>
            );
          })}
        </div>
        {!mobile && !named && !hasInjected && (
          <p className="small muted">No browser wallet found. Coinbase Wallet makes a passkey wallet in this browser, or install an extension such as MetaMask or Rabby and reload.</p>
        )}
        {note && <p className="small note" role="status">{note}</p>}
        <p className="small muted">Run Cards never asks for a seed phrase or private key. Your wallet signs.</p>
      </dialog>
    </>
  );
}
