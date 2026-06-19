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

  const handleNavStateChange = useCallback(
    (showNewChat: boolean, onNewChat: () => void) => {
      setNavShowNewChat(showNewChat);
      setNavOnNewChat(() => onNewChat);
    },
    [],
  );

  return (
    <>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <ChatSidebar
          address={address}
          isConnected={isConnected}
          mounted={mounted}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
            key={activeChatId ?? "loading"}
            address={address}
            isConnected={isConnected}
            mounted={mounted}
            onNavStateChange={handleNavStateChange}
          />
        </div>
      </div>
      <TransactionDrawer />
      <ChatHistoryDrawer />
    </>
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
