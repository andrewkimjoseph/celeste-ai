"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { CelesteLogoAvatar } from "@/components/celeste-logo";
import { PersonalityPicker } from "@/components/chat/personality-picker";
import { useMounted } from "@/hooks/use-mounted";
import { useChats } from "@/hooks/use-chats";
import { useTransactions } from "@/hooks/use-transactions";
import { trackEvent } from "@/lib/analytics/amplitude-browser";
import { CELESTE_VERSION } from "@/lib/app-version";
import { useState } from "react";

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
        className="flex size-9 items-center justify-center rounded-full border border-[var(--surface-2)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] sm:hidden"
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
        className="hidden rounded-lg border border-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] sm:inline-flex"
      >
        New chat
      </button>
    </>
  );
}

function HistoryButton({
  isConnected,
}: {
  isConnected: boolean;
}) {
  const { openHistory } = useChats();

  if (!isConnected) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={openHistory}
      aria-label="View chat history"
      className="flex size-9 items-center justify-center rounded-full border border-[var(--surface-2)] text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] sm:h-auto sm:w-auto sm:rounded-lg sm:px-3 sm:py-1.5 lg:hidden"
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
          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
        />
      </svg>
      <span className="hidden sm:inline text-xs">History</span>
    </button>
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

  function handleOpenDrawer() {
    trackEvent("transactions_drawer_opened", {
      transaction_count: transactions.length,
    });
    openDrawer();
  }

  return (
    <button
      type="button"
      onClick={handleOpenDrawer}
      aria-label="View transactions"
      className="flex size-9 items-center justify-center rounded-full border border-[var(--surface-2)] text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] sm:h-auto sm:w-auto sm:rounded-lg sm:px-3 sm:py-1.5"
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
    </button>
  );
}

export function Header({
  showNewChat = false,
  onNewChat,
  isConnected = false,
}: HeaderProps) {
  const mounted = useMounted();
  const [showPersonalityPicker, setShowPersonalityPicker] = useState(false);
  const {
    selectedPersonalityId,
    hasSelectedPersonality,
    setSelectedPersonality,
  } = useChats();

  return (
    <header className="border-b border-[var(--surface-2)] bg-[var(--surface-0)]/80 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <CelesteLogoAvatar
            size="md"
            shape="squircle"
            className="shadow-sm ring-1 ring-[var(--accent)]/20"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="truncate text-base font-semibold text-[var(--text-primary)] sm:text-lg">
                Celeste AI
              </h1>
              {/* Celo mainnet logo — hidden for now
              <img
                src="/celo_symbol.svg"
                alt="Celo mainnet"
                width={14}
                height={14}
                className="size-3.5 shrink-0 object-contain"
                title="Celo mainnet"
              />
              */}
              <span className="rounded-full border border-[var(--surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                {CELESTE_VERSION}
              </span>
            </div>
            <p className="hidden truncate text-xs text-[var(--text-muted)] sm:block">
              {isConnected
                ? "Navigate Celo like a cosmic atlas"
                : "Connect your wallet to begin your first mission"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/about"
            className="hidden rounded-lg border border-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] sm:inline-flex"
          >
            About
          </Link>
          <HistoryButton isConnected={isConnected} />
          <TransactionsButton isConnected={isConnected} />
          {isConnected ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPersonalityPicker((open) => !open)}
                className={`hidden rounded-lg border px-3 py-1.5 text-xs transition-colors sm:inline-flex ${
                  hasSelectedPersonality
                    ? "border-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                    : "border-[var(--accent)]/60 text-[var(--accent-soft-text)] hover:border-[var(--accent)]"
                }`}
              >
                {hasSelectedPersonality ? "Personality" : "Choose personality"}
              </button>
              <button
                type="button"
                onClick={() => setShowPersonalityPicker((open) => !open)}
                aria-label={
                  hasSelectedPersonality
                    ? "Change personality"
                    : "Choose personality"
                }
                className="flex size-9 items-center justify-center rounded-full border border-[var(--surface-2)] text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] sm:hidden"
              >
                ✦
              </button>
              {showPersonalityPicker ? (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[300px] rounded-xl border border-[var(--surface-2)] bg-[var(--surface-0)] p-3 shadow-2xl shadow-black/40 sm:w-[340px]">
                  <PersonalityPicker
                    compact
                    selectedId={selectedPersonalityId}
                    onSelect={(id) => {
                      setShowPersonalityPicker(false);
                      void setSelectedPersonality(id);
                    }}
                    title="Your personality"
                    description="Change how you appear in chat."
                  />
                </div>
              ) : null}
            </div>
          ) : null}
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
            <div className="size-9 rounded-full bg-[var(--surface-2)] sm:h-10 sm:w-[140px] sm:rounded-full" aria-hidden />
          )}
        </div>
      </div>
    </header>
  );
}
