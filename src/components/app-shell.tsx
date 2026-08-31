"use client";

import { ChatProvider } from "@/components/chat/chat-context";
import { ChatHistoryDrawer } from "@/components/chat/chat-history-drawer";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatPanel } from "@/components/chat-panel";
import { Header } from "@/components/header";
import { TransactionDrawer } from "@/components/transactions/transaction-drawer";
import { TransactionProvider } from "@/components/transactions/transaction-context";
import { WalletBalancePanel } from "@/components/wallet-balance-panel";
import { useChats } from "@/hooks/use-chats";
import { useMounted } from "@/hooks/use-mounted";
import { useAccount } from "wagmi";
import { useCallback, useState } from "react";

function AppShellContent() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const { activeChatId } = useChats();
  const [navShowNewChat, setNavShowNewChat] = useState(false);
  const [navOnNewChat, setNavOnNewChat] = useState<(() => void) | undefined>();
  const [isLanding, setIsLanding] = useState(false);

  const handleNavStateChange = useCallback(
    (showNewChat: boolean, onNewChat: () => void) => {
      setNavShowNewChat(showNewChat);
      setNavOnNewChat(() => onNewChat);
    },
    [],
  );

  const handleLandingStateChange = useCallback((landing: boolean) => {
    setIsLanding(landing);
  }, []);

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col bg-[var(--canvas)]">
      <Header
        showNewChat={navShowNewChat}
        onNewChat={navOnNewChat}
        isConnected={isConnected}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ChatSidebar
          address={address}
          isConnected={isConnected}
          mounted={mounted}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <WalletBalancePanel
            address={address}
            isConnected={isConnected}
            mounted={mounted}
            variant="mobile-collapsible"
            hiddenOnLanding={isLanding}
          />
          <ChatPanel
            key={activeChatId ?? "loading"}
            address={address}
            isConnected={isConnected}
            mounted={mounted}
            onNavStateChange={handleNavStateChange}
            onLandingStateChange={handleLandingStateChange}
          />
        </div>
      </div>
      <TransactionDrawer />
      <ChatHistoryDrawer />
    </div>
  );
}

export function AppShell() {
  const { address } = useAccount();

  return (
    <TransactionProvider address={address}>
      <ChatProvider address={address} key={address ?? "disconnected"}>
        <AppShellContent />
      </ChatProvider>
    </TransactionProvider>
  );
}
