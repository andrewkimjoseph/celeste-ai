"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMounted } from "@/hooks/use-mounted";

interface HeaderProps {
  showNewChat?: boolean;
  onNewChat?: () => void;
}

export function Header({ showNewChat = false, onNewChat }: HeaderProps) {
  const mounted = useMounted();

  return (
    <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
      <div>
        <h1 className="text-lg font-semibold text-white">Celina Agent</h1>
        <p className="text-xs text-zinc-400">Chat with your Celo wallet</p>
      </div>
      <div className="flex items-center gap-2">
        {showNewChat && onNewChat && (
          <button
            type="button"
            onClick={onNewChat}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
          >
            New chat
          </button>
        )}
        {mounted ? (
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="address"
          />
        ) : (
          <div className="h-10 w-[140px] rounded-full bg-zinc-800" aria-hidden />
        )}
      </div>
    </header>
  );
}
