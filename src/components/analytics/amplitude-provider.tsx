"use client";

import {
  initAmplitudeBrowser,
  resetAnalytics,
  setAnalyticsUser,
  trackAppOpened,
  trackEvent,
} from "@/lib/analytics/amplitude-browser";
import { isMiniPayWallet } from "@/lib/wallet-capabilities";
import { useEffect, useRef } from "react";
import { useAccount } from "wagmi";

export function AmplitudeProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected, connector } = useAccount();
  const prevConnectedRef = useRef(false);
  const appOpenedRef = useRef(false);

  useEffect(() => {
    if (appOpenedRef.current) {
      return;
    }

    appOpenedRef.current = true;
    initAmplitudeBrowser();
    trackAppOpened();
  }, []);

  useEffect(() => {
    const wasConnected = prevConnectedRef.current;

    if (isConnected && address && !wasConnected) {
      void setAnalyticsUser(address, {
        connector: connector?.id ?? "unknown",
        isMinipay: isMiniPayWallet(),
      }).then(() => {
        trackEvent("wallet_connected", {
          connector: connector?.id ?? "unknown",
          is_minipay: isMiniPayWallet(),
        });
      });
    } else if (!isConnected && wasConnected) {
      trackEvent("wallet_disconnected", {});
      resetAnalytics();
    }

    prevConnectedRef.current = isConnected;
  }, [address, connector?.id, isConnected]);

  return children;
}
