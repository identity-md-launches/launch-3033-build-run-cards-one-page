import { getAddress } from "ethers";
import { useCallback, useEffect, useRef, useState } from "react";
import { CHAIN_ID } from "./config";
import { discoverWallets, legacyWallet, switchToSepolia, type Wallet } from "./wallet";

const KEY = "runcards.wallet";

export type WalletApi = {
  wallets: Wallet[];
  wallet?: Wallet;
  address?: string;
  chainId?: number;
  pending?: string;
  note?: string;
  connect(w: Wallet): Promise<void>;
  disconnect(): void;
  switchChain(): Promise<void>;
  onSepolia: boolean;
};

export function useWallet(): WalletApi {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [wallet, setWallet] = useState<Wallet>();
  const [address, setAddress] = useState<string>();
  const [chainId, setChainId] = useState<number>();
  const [pending, setPending] = useState<string>();
  const [note, setNote] = useState<string>();
  const tried = useRef(false);

  // EIP-6963 discovery, with window.ethereum as the fallback when nothing announces itself.
  useEffect(() => {
    const stop = discoverWallets(setWallets);
    const t = setTimeout(() => {
      setWallets((cur) => {
        if (cur.length) return cur;
        const legacy = legacyWallet();
        return legacy ? [legacy] : cur;
      });
    }, 400);
    return () => { stop(); clearTimeout(t); };
  }, []);

  const attach = useCallback(async (w: Wallet, ask: boolean) => {
    const method = ask ? "eth_requestAccounts" : "eth_accounts";
    const accounts = (await w.provider.request({ method })) as string[];
    if (!accounts?.length) return false;
    const cid = Number(await w.provider.request({ method: "eth_chainId" }));
    setWallet(w);
    setAddress(getAddress(accounts[0]));
    setChainId(cid);
    localStorage.setItem(KEY, w.info.rdns);
    return true;
  }, []);

  // Reconnect on reload without a prompt, if this site was connected before.
  useEffect(() => {
    if (tried.current || !wallets.length) return;
    const saved = localStorage.getItem(KEY);
    if (!saved) { tried.current = true; return; }
    const w = wallets.find((x) => x.info.rdns === saved);
    if (!w) return;
    tried.current = true;
    attach(w, false).catch(() => undefined);
  }, [wallets, attach]);

  // Follow account and network changes in the wallet.
  useEffect(() => {
    const p = wallet?.provider;
    if (!p?.on) return;
    const onAccounts = (a: string[]) => {
      if (!a?.length) { setAddress(undefined); setWallet(undefined); localStorage.removeItem(KEY); }
      else setAddress(getAddress(a[0]));
    };
    const onChain = (c: string) => setChainId(Number(c));
    p.on("accountsChanged", onAccounts);
    p.on("chainChanged", onChain);
    return () => {
      p.removeListener?.("accountsChanged", onAccounts);
      p.removeListener?.("chainChanged", onChain);
    };
  }, [wallet]);

  const connect = useCallback(async (w: Wallet) => {
    setPending(w.info.uuid);
    setNote(undefined);
    try {
      const ok = await attach(w, true);
      if (!ok) { setNote("No account was shared. Try again."); return; }
      const cid = Number(await w.provider.request({ method: "eth_chainId" }));
      if (cid !== CHAIN_ID) {
        await switchToSepolia(w.provider).catch(() => setNote("Switch your wallet to Sepolia to continue."));
      }
    } catch {
      setNote(`${w.info.name} did not connect. Try again.`);
    } finally {
      setPending(undefined);
    }
  }, [attach]);

  const disconnect = useCallback(() => {
    setWallet(undefined);
    setAddress(undefined);
    setChainId(undefined);
    localStorage.removeItem(KEY);
    wallet?.provider.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] }).catch(() => undefined);
  }, [wallet]);

  const switchChain = useCallback(async () => {
    if (!wallet) return;
    setNote(undefined);
    try {
      await switchToSepolia(wallet.provider);
      setChainId(Number(await wallet.provider.request({ method: "eth_chainId" })));
    } catch {
      setNote("The wallet did not switch. Pick Sepolia in your wallet.");
    }
  }, [wallet]);

  return { wallets, wallet, address, chainId, pending, note, connect, disconnect, switchChain, onSepolia: chainId === CHAIN_ID };
}
