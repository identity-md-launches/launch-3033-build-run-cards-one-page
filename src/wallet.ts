import { CHAIN_HEX, CHAIN_NAME, EXPLORER, RPCS } from "./config";

export type Eip1193 = {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on?(event: string, fn: (...a: any[]) => void): void;
  removeListener?(event: string, fn: (...a: any[]) => void): void;
};
export type WalletInfo = { uuid: string; name: string; icon: string; rdns: string };
export type Wallet = { info: WalletInfo; provider: Eip1193 };

/** EIP-6963: every installed extension announces itself with its own name and icon. */
export function discoverWallets(onChange: (list: Wallet[]) => void): () => void {
  const found = new Map<string, Wallet>();
  const onAnnounce = (ev: Event) => {
    const d = (ev as CustomEvent<Wallet>).detail;
    if (!d?.info?.uuid || !d.provider) return;
    found.set(d.info.uuid, d);
    onChange([...found.values()]);
  };
  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
  return () => window.removeEventListener("eip6963:announceProvider", onAnnounce);
}

/** The pre-EIP-6963 fallback: whatever the browser put on window.ethereum. */
export function legacyWallet(): Wallet | undefined {
  const eth = (window as unknown as { ethereum?: Eip1193 }).ethereum;
  if (!eth) return undefined;
  return { info: { uuid: "legacy", name: "Browser wallet", icon: "", rdns: "legacy" }, provider: eth };
}

/** Switch the wallet to Sepolia, adding the network when the wallet does not know it. */
export async function switchToSepolia(p: Eip1193) {
  try {
    await p.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch (e) {
    const code = (e as { code?: number; data?: { originalError?: { code?: number } } }).code ??
      (e as { data?: { originalError?: { code?: number } } }).data?.originalError?.code;
    if (code !== 4902) throw e;
    await p.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: CHAIN_HEX,
        chainName: CHAIN_NAME,
        nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: RPCS,
        blockExplorerUrls: [EXPLORER],
      }],
    });
  }
}

/**
 * Phones have no extension: offer to open this page inside a wallet's own browser,
 * where the wallet is injected. Each link is the one its vendor documents; no relay, no project ID.
 */
export const OPEN_IN: ReadonlyArray<{ id: string; name: string; href: (url: string) => string }> = [
  { id: "metamask", name: "MetaMask", href: (url) => `https://link.metamask.io/dapp/${url.replace(/^https?:\/\//, "")}` },
  { id: "coinbase", name: "Coinbase Wallet", href: (url) => `https://go.cb-w.com/dapp?cb_url=${encodeURIComponent(url)}` },
  { id: "phantom", name: "Phantom", href: (url) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}?ref=${encodeURIComponent(new URL(url).origin)}` },
];

export const isMobileBrowser = () =>
  /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
