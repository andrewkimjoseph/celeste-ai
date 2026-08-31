"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { useEffect, useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { AmplitudeProvider } from "@/components/analytics/amplitude-provider";
import { MiniPayAutoConnect } from "@/components/minipay-auto-connect";
import { VisualViewportSync } from "@/components/visual-viewport-sync";
import { wagmiConfig } from "@/lib/wallet/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const lightRkTheme = lightTheme({
  accentColor: "#000000",
  accentColorForeground: "#FCFF52",
  borderRadius: "small",
});

const darkRkTheme = darkTheme({
  accentColor: "#e4dc46",
  accentColorForeground: "#2b2b2b",
  borderRadius: "small",
});

function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}

export function Providers({ children }: { children: ReactNode }) {
  const isDark = useIsDark();

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={isDark ? darkRkTheme : lightRkTheme}
          modalSize="compact"
        >
          <AmplitudeProvider>
            <VisualViewportSync />
            <MiniPayAutoConnect />
            {children}
          </AmplitudeProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
