"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { AmplitudeProvider } from "@/components/analytics/amplitude-provider";
import { MiniPayAutoConnect } from "@/components/minipay-auto-connect";
import { VisualViewportSync } from "@/components/visual-viewport-sync";
import { wagmiConfig } from "@/lib/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#5e4180",
            accentColorForeground: "#f7f4fb",
            borderRadius: "medium",
          })}
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
