"use client";

import { isMiniPayWallet, type WalletCapabilities } from "@/lib/wallet-capabilities";
import { useSyncExternalStore } from "react";

export function useWalletCapabilities(): WalletCapabilities {
  const isMiniPay = useSyncExternalStore(
    () => () => {},
    () => isMiniPayWallet(),
    () => false,
  );

  return {
    supportsFeeAbstraction: isMiniPay,
    blocksCeloSend: isMiniPay,
  };
}
