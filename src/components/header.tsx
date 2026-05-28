"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { CELINA_SDK_DOCS_URL } from "@/lib/links";
import { useMounted } from "@/hooks/use-mounted";
import { useTransactions } from "@/hooks/use-transactions";

interface HeaderProps {
  showNewChat?: boolean;
  onNewChat?: () => void;
  isConnected?: boolean;
}

function NewChatButton({
  showNewChat,
  onNewChat,
}: {
  showNewChat: boolean;
  onNewChat?: () => void;
}) {
  if (!showNewChat || !onNewChat) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={onNewChat}
        aria-label="New chat"
        className="flex size-9 items-center justify-center rounded-full border border-[var(--surface-2)] text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white sm:hidden"
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
      </button>
      <button
        type="button"
        onClick={onNewChat}
        className="hidden rounded-lg border border-[var(--surface-2)] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white sm:inline-flex"
      >
        New chat
      </button>
    </>
  );
}

function TransactionsButton({
  isConnected,
}: {
  isConnected: boolean;
}) {
  const { transactions, openDrawer } = useTransactions();

  if (!isConnected) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label="View transactions"
      className="relative flex size-9 items-center justify-center rounded-full border border-[var(--surface-2)] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white sm:h-auto sm:w-auto sm:rounded-lg sm:px-3 sm:py-1.5"
    >
      <svg
        className="size-4 sm:mr-1.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
      <span className="hidden sm:inline text-xs">Transactions</span>
      {transactions.length > 0 && (
        <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-semibold text-black sm:static sm:ml-1.5 sm:size-auto sm:rounded-full sm:px-1.5 sm:py-0.5">
          {transactions.length > 9 ? "9+" : transactions.length}
        </span>
      )}
    </button>
  );
}

export function Header({
  showNewChat = false,
  onNewChat,
  isConnected = false,
}: HeaderProps) {
  const mounted = useMounted();

  return (
    <header className="border-b border-[var(--surface-2)] bg-[var(--surface-0)]/80 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)]/20 to-emerald-900/20 text-sm font-bold text-[var(--accent-hover)] ring-1 ring-emerald-500/20 sm:size-9 sm:rounded-lg"
            aria-hidden
          >
            C
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="truncate text-base font-semibold text-white sm:text-lg">
                Celina Agent
              </h1>
              <span className="hidden rounded-full border border-[var(--surface-2)] px-2 py-0.5 text-[10px] font-medium text-zinc-400 sm:inline-flex">
                Celo mainnet
              </span>
            </div>
            <p className="hidden truncate text-xs text-zinc-400 sm:block">
              {isConnected
                ? "Your Celo wallet assistant"
                : "Connect your wallet to get started"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <a
            href={CELINA_SDK_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-9 items-center justify-center rounded-full border border-[var(--surface-2)] text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white sm:h-auto sm:w-auto sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs"
            aria-label="Celina SDK documentation"
          >
            <svg
              className="size-4 sm:hidden"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
              />
            </svg>
            <span className="hidden sm:inline">SDK docs</span>
          </a>
          <TransactionsButton isConnected={isConnected} />
          <NewChatButton showNewChat={showNewChat} onNewChat={onNewChat} />
          {mounted ? (
            <>
              <div className="sm:hidden">
                <ConnectButton
                  showBalance={false}
                  chainStatus="none"
                  accountStatus="avatar"
                />
              </div>
              <div className="hidden sm:block">
                <ConnectButton
                  showBalance={false}
                  chainStatus="icon"
                  accountStatus="address"
                />
              </div>
            </>
          ) : (
            <div className="size-9 rounded-full bg-zinc-800 sm:h-10 sm:w-[140px] sm:rounded-full" aria-hidden />
          )}
        </div>
      </div>
    </header>
  );
}
