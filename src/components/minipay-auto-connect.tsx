"use client";

import { isMiniPayWallet } from "@/lib/wallet/wallet-capabilities";
import { useEffect, useRef } from "react";
import { injected, useAccount, useConnect, useConnectors } from "wagmi";

/** Auto-connect MiniPay's injected provider when the app opens inside MiniPay. */
export function MiniPayAutoConnect() {
  const { isConnected } = useAccount();
  const { connect, status } = useConnect();
  const connectors = useConnectors();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!isMiniPayWallet() || isConnected || status === "pending" || attemptedRef.current) {
      return;
    }

    const connector =
      connectors.find((item) => item.id === "injected") ??
      connectors.find((item) => item.id === "metaMask") ??
      injected({ target: "metaMask" });

    attemptedRef.current = true;
    connect({ connector });
  }, [connect, connectors, isConnected, status]);

  return null;
}
