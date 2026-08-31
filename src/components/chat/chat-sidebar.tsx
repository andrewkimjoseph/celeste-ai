"use client";

import { ChatThreadRow } from "@/components/chat/chat-thread-row";
import { WalletBalanceSection } from "@/components/wallet-balance-panel";
import { useChats } from "@/hooks/use-chats";

interface ChatSidebarProps {
  address?: `0x${string}`;
  isConnected: boolean;
  mounted: boolean;
}

export function ChatSidebar({
  address,
  isConnected,
  mounted,
}: ChatSidebarProps) {
  const {
    chats,
    activeChatId,
    isLoading,
    createChat,
    selectChat,
    deleteChat,
  } = useChats();

  if (!mounted) {
    return null;
  }

  return (
    <aside className="hidden h-full min-h-0 w-80 shrink-0 flex-col border-r-2 border-[var(--ink)] bg-[var(--surface)] lg:flex">
      <div className="flex shrink-0 flex-col gap-2 p-3">
        <button
          type="button"
          onClick={() => void createChat()}
          disabled={!isConnected}
          className="btn-brutal btn-primary w-full px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg
            className="size-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New chat
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {!isConnected ? (
          <div className="space-y-3 px-2 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
              Example prompts
            </p>
            <ul className="space-y-1.5">
              {(
                [
                  { label: "Send", example: "Send 5 USDm to a Celo ENS" },
                  { label: "Swap", example: "Quote CELO to USDC" },
                  { label: "Earn", example: "Scan Aave balances" },
                  { label: "GoodDollar", example: "Claim daily UBI" },
                ] as const
              ).map((mission, index) => (
                <li
                  key={mission.label}
                  className="relative rounded-[2px] border-2 border-[var(--ink)] bg-[var(--canvas)] px-2.5 py-2 shadow-[var(--shadow-brutal-sm)]"
                >
                  {index === 3 ? (
                    <span className="absolute -right-1 -top-1.5 rounded-[2px] border-2 border-[var(--ink)] bg-[var(--accent)] px-1 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--accent-foreground)]">
                      G$
                    </span>
                  ) : null}
                  <p className="text-[11px] font-semibold text-[var(--ink)]">
                    {mission.label}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-4 text-[var(--text-muted)]">
                    {mission.example}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-[10px] leading-4 text-[var(--text-muted)]">
              Connect your wallet to save chat history.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span
              className="inline-block size-4 animate-spin rounded-full border-2 border-[var(--ink)] border-t-[var(--accent)]"
              aria-hidden
            />
          </div>
        ) : chats.length === 0 ? (
          <p className="px-2 py-3 text-xs text-[var(--text-muted)]">
            No saved chats yet. Start a conversation to create one.
          </p>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <ChatThreadRow
                key={chat.id}
                id={chat.id}
                title={chat.title}
                updatedAt={chat.updatedAt}
                isActive={chat.id === activeChatId}
                onSelect={(id) => void selectChat(id)}
                onDelete={(id) => void deleteChat(id)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t-2 border-[var(--ink)] p-3">
        <WalletBalanceSection address={address} isConnected={isConnected} />
      </div>
    </aside>
  );
}
