"use client";

import { isMiniPayWallet, type WalletCapabilities } from "@/lib/wallet-capabilities";
import { useSyncExternalStore } from "react";

export function useWalletCapabilities(): WalletCapabilities {
  const supportsFeeAbstraction = useSyncExternalStore(
    () => () => {},
    () => isMiniPayWallet(),
    () => false,
  );

  return { supportsFeeAbstraction };
}
