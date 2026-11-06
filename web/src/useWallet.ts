import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { getAddress } from "ethers";
import { useState } from "react";
import { CHAIN_ID, RPCS, EXPLORER } from "./config";

export type WalletApi = {
  address?: string;
  chainId?: number;
  onSepolia: boolean;
  connected: boolean;
  switching: boolean;
  note?: string;
  switchChain: () => void;
  disconnect: () => void;
};

/** The connected wallet as the page uses it: address, chain, switch to Sepolia, disconnect. */
export function useWallet(): WalletApi {
  const { address, chainId, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending } = useSwitchChain();
  const [note, setNote] = useState<string>();
  return {
    address: address ? getAddress(address) : undefined,
    chainId,
    connected: isConnected && !!address,
    onSepolia: chainId === CHAIN_ID,
    switching: isPending,
    note,
    // wallet_switchEthereumChain, then wallet_addEthereumChain with Sepolia's public parameters
    // when the wallet does not know the chain (wagmi does the fallback on error 4902).
    switchChain: () => {
      setNote(undefined);
      switchChain(
        {
          chainId: CHAIN_ID,
          addEthereumChainParameter: {
            chainName: "Sepolia",
            nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: RPCS,
            blockExplorerUrls: [EXPLORER],
          },
        },
        {
          onError: (e) => setNote(/reject|denied|4001/i.test(String((e as Error).message)) ? "You cancelled the network switch." : "Your wallet did not switch. Switch to Sepolia in the wallet itself."),
        },
      );
    },
    disconnect: () => disconnect(),
  };
}
