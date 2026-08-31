"use client";

import { HeaderConnectButton } from "@/components/header-connect-button";
import Link from "next/link";
import { CelesteLogoAvatar } from "@/components/celeste-logo";
import { PersonalityPicker } from "@/components/chat/personality-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMounted } from "@/hooks/use-mounted";
import { useChats } from "@/hooks/use-chats";
import { useTransactions } from "@/hooks/use-transactions";
import { trackEvent } from "@/lib/analytics/amplitude-browser";
import {
  getCelestialPersonality,
  type CelestialPersonalityId,
} from "@/lib/chat/celestial-personalities";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const headerChipClassName =
  "flex h-9 items-center justify-center rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-[var(--shadow-brutal-sm)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none";

function PersonalityButtonIcon({
  selectedId,
}: {
  selectedId: CelestialPersonalityId | null;
}) {
  const personality = getCelestialPersonality(selectedId);

  if (personality) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static personality assets in public
      <img
        src={personality.imageSrc}
        alt=""
        width={16}
        height={16}
        className="size-4 shrink-0 object-contain sm:mr-1.5"
        aria-hidden
      />
    );
  }

  return (
    <svg
      className="size-4 shrink-0 sm:mr-1.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
      />
    </svg>
  );
}

function NewChatIcon() {
  return (
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
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}

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
    <button
      type="button"
      onClick={onNewChat}
      aria-label="New chat"
      className={`${headerChipClassName} w-9 sm:w-auto sm:px-3`}
    >
      <NewChatIcon />
      <span className="hidden text-xs sm:inline">New chat</span>
    </button>
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
      className={`${headerChipClassName} w-9 sm:w-auto sm:px-3 lg:hidden`}
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
      <span className="hidden text-xs sm:inline">History</span>
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
      className={`${headerChipClassName} w-9 sm:w-auto sm:px-3`}
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
      <span className="hidden text-xs sm:inline">Transactions</span>
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

  const personalitySheetCloseRef = useRef<HTMLButtonElement>(null);

  const closePersonalityPicker = useCallback(() => {
    setShowPersonalityPicker(false);
  }, []);

  useEffect(() => {
    if (!showPersonalityPicker) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    personalitySheetCloseRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closePersonalityPicker();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPersonalityPicker, closePersonalityPicker]);

  function handleSelectPersonality(id: CelestialPersonalityId) {
    closePersonalityPicker();
    void setSelectedPersonality(id);
  }

  return (
    <header className="z-30 shrink-0 border-b-2 border-[var(--ink)] bg-[var(--surface)] px-3 py-2.5 sm:px-4 sm:py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => onNewChat?.()}
            disabled={!onNewChat}
            aria-label="New chat"
            className="shrink-0 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:cursor-default"
          >
            <CelesteLogoAvatar size="md" />
          </button>
          <div className="min-w-0">
            <h1 className="hidden truncate text-base font-bold tracking-tight text-[var(--ink)] sm:block sm:text-lg">
              Celeste AI
            </h1>
            <p className="hidden truncate text-xs font-medium text-[var(--text-muted)] sm:block">
              {isConnected
                ? "Send, swap, earn, and claim on Celo"
                : "DeFAI copilot for Celo — send, swap, earn, claim"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/about"
            aria-label="About Celeste AI"
            className={`${headerChipClassName} w-9 sm:w-auto sm:px-3`}
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
                d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
              />
            </svg>
            <span className="hidden text-xs sm:inline">About</span>
          </Link>
          <HistoryButton isConnected={isConnected} />
          <TransactionsButton isConnected={isConnected} />
          {isConnected ? (
            <button
              type="button"
              onClick={() => setShowPersonalityPicker((open) => !open)}
              aria-label={
                hasSelectedPersonality
                  ? "Change personality"
                  : "Choose personality"
              }
              aria-expanded={showPersonalityPicker}
              aria-haspopup="dialog"
              className={`${headerChipClassName} w-9 sm:w-auto sm:px-3 ${
                hasSelectedPersonality ? "" : "bg-[var(--accent)] text-[var(--accent-foreground)]"
              }`}
            >
              <PersonalityButtonIcon selectedId={selectedPersonalityId} />
              <span className="hidden text-xs sm:inline">
                {hasSelectedPersonality
                  ? "Personality"
                  : "Choose personality"}
              </span>
            </button>
          ) : null}
          <NewChatButton showNewChat={showNewChat} onNewChat={onNewChat} />
          <ThemeToggle />
          {mounted ? (
            <HeaderConnectButton />
          ) : (
            <div
              className="h-9 w-9 rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface-3)] sm:w-[140px]"
              aria-hidden
            />
          )}
        </div>
      </div>
      {isConnected && showPersonalityPicker && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-50">
              <button
                type="button"
                aria-label="Close personality picker"
                className="absolute inset-0 bg-[var(--overlay-backdrop)]"
                onClick={closePersonalityPicker}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="personality-sheet-title"
                className="personality-panel absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col overflow-hidden border-t-2 border-[var(--ink)] bg-[var(--surface)] lg:inset-x-auto lg:bottom-auto lg:right-0 lg:top-0 lg:h-dvh lg:max-h-none lg:w-full lg:max-w-sm lg:border-l-2 lg:border-t-0"
                style={{
                  paddingBottom:
                    "max(0px, env(safe-area-inset-bottom, 0px))",
                }}
              >
                <div className="flex items-start justify-between gap-3 border-b-2 border-[var(--ink)] px-4 py-4">
                  <div>
                    <h2
                      id="personality-sheet-title"
                      className="text-base font-bold tracking-tight text-[var(--ink)]"
                    >
                      Your personality
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      Change how you appear in chat.
                    </p>
                  </div>
                  <button
                    ref={personalitySheetCloseRef}
                    type="button"
                    onClick={closePersonalityPicker}
                    aria-label="Close"
                    className={`${headerChipClassName} size-9 shrink-0`}
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
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
                  <PersonalityPicker
                    selectedId={selectedPersonalityId}
                    onSelect={handleSelectPersonality}
                    showHeading={false}
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
