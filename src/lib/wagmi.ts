"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  valoraWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { celo } from "viem/chains";
import { http } from "wagmi";

export const wagmiConfig = getDefaultConfig({
  appName: "Celeste AI",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "00000000000000000000000000000000",
  chains: [celo],
  transports: {
    [celo.id]: http(
      process.env.NEXT_PUBLIC_CELO_RPC_URL ?? "https://forno.celo.org",
    ),
  },
  wallets: [
    {
      groupName: "Recommended",
      wallets: [injectedWallet, metaMaskWallet, valoraWallet, walletConnectWallet],
    },
  ],
  ssr: true,
});
