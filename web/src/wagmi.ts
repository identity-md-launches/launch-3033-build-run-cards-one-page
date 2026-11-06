import { createConfig, http, fallback } from "wagmi";
import { sepolia } from "wagmi/chains";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { RPCS, SITE_NAME } from "./config";

/**
 * The network's wallet stack (wallet-connectors): EIP-6963 browser wallets through injected() with
 * multi-injected discovery, Coinbase Smart Wallet through coinbaseWallet(), phones through the
 * "Open in" links in open-in.ts. No relay and no project ID, so no WalletConnect row.
 */
export const wagmiConfig = createConfig({
  chains: [sepolia],
  multiInjectedProviderDiscovery: true,
  connectors: [
    injected(),
    coinbaseWallet({ appName: SITE_NAME, preference: "all" }),
  ],
  // Public Sepolia RPCs, the same list the site reads through.
  transports: { [sepolia.id]: fallback(RPCS.map((u) => http(u))) },
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
