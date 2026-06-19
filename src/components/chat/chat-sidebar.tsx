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
    <aside className="hidden h-full min-h-0 w-72 shrink-0 flex-col border-r border-[var(--surface-2)] bg-[var(--surface-1)]/50 lg:flex">
      <div className="flex shrink-0 flex-col gap-2 border-b border-[var(--surface-2)] p-3">
        <button
          type="button"
          onClick={() => void createChat()}
          disabled={!isConnected}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--surface-2)] bg-[var(--surface-1)] px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
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
          <p className="px-2 py-3 text-xs text-zinc-500">
            Connect your wallet to save chat history.
          </p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <span
              className="inline-block size-4 animate-spin rounded-full border-2 border-zinc-600 border-t-[var(--accent-hover)]"
              aria-hidden
            />
          </div>
        ) : chats.length === 0 ? (
          <p className="px-2 py-3 text-xs text-zinc-500">
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

      <div className="shrink-0 border-t border-[var(--surface-2)] p-3">
        <WalletBalanceSection address={address} isConnected={isConnected} />
      </div>
    </aside>
  );
}
