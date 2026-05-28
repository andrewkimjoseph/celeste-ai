"use client";

import { ChatPanel } from "@/components/chat-panel";
import { Header } from "@/components/header";
import { TransactionDrawer } from "@/components/transactions/transaction-drawer";
import { TransactionProvider } from "@/components/transactions/transaction-context";
import { WalletBalancePanel } from "@/components/wallet-balance-panel";
import { useMounted } from "@/hooks/use-mounted";
import { useAccount } from "wagmi";
import { useCallback, useState } from "react";

export function AppShell() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const [navShowNewChat, setNavShowNewChat] = useState(false);
  const [navOnNewChat, setNavOnNewChat] = useState<(() => void) | undefined>();

  const handleNavStateChange = useCallback(
    (showNewChat: boolean, onNewChat: () => void) => {
      setNavShowNewChat(showNewChat);
      setNavOnNewChat(() => onNewChat);
    },
    [],
  );

  return (
    <TransactionProvider address={address}>
      <div className="flex h-dvh w-full">
        <WalletBalancePanel
          address={address}
          isConnected={isConnected}
          mounted={mounted}
          variant="sidebar"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30 shrink-0 border-b border-[var(--surface-2)] bg-[var(--surface-0)]/90 backdrop-blur-md lg:border-b-0">
            <Header
              showNewChat={navShowNewChat}
              onNewChat={navOnNewChat}
              isConnected={isConnected}
            />
            <WalletBalancePanel
              address={address}
              isConnected={isConnected}
              mounted={mounted}
              variant="mobile-collapsible"
            />
          </div>
          <ChatPanel
            address={address}
            isConnected={isConnected}
            mounted={mounted}
            onNavStateChange={handleNavStateChange}
          />
        </div>
      </div>
      <TransactionDrawer />
    </TransactionProvider>
  );
}
