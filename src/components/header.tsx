"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { CelesteLogoAvatar } from "@/components/celeste-logo";
import { PersonalityPicker } from "@/components/chat/personality-picker";
import { useMounted } from "@/hooks/use-mounted";
import { useChats } from "@/hooks/use-chats";
import { useTransactions } from "@/hooks/use-transactions";
import { trackEvent } from "@/lib/analytics/amplitude-browser";
import {
  getCelestialPersonality,
  type CelestialPersonalityId,
} from "@/lib/celestial-personalities";
import { useEffect, useRef, useState } from "react";

function useDismissOnOutsideClick(
  isOpen: boolean,
  onDismiss: () => void,
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (
        ref.current &&
        target instanceof Node &&
        !ref.current.contains(target)
      ) {
        onDismiss();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDismiss();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onDismiss]);

  return ref;
}

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
        className="size-4 shrink-0 rounded-full object-contain sm:mr-1.5"
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
      className="flex size-9 items-center justify-center rounded-full border border-[var(--surface-2)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] sm:h-auto sm:w-auto sm:rounded-lg sm:px-3 sm:py-1.5"
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
  // const [showFxControls, setShowFxControls] = useState(false);
  const {
    selectedPersonalityId,
    hasSelectedPersonality,
    setSelectedPersonality,
    // fxEnabled,
    // fxIntensity,
    // setFxEnabled,
    // setFxIntensity,
  } = useChats();

  const personalityPickerRef = useDismissOnOutsideClick(
    showPersonalityPicker,
    () => setShowPersonalityPicker(false),
  );
  // const fxControlsRef = useDismissOnOutsideClick(showFxControls, () =>
  //   setShowFxControls(false),
  // );

  return (
    <header className="border-b border-[var(--surface-2)] bg-[var(--surface-0)]/80 px-3 py-2.5 backdrop-blur-md sm:px-4 sm:py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => onNewChat?.()}
            disabled={!onNewChat}
            aria-label="New chat"
            className="shrink-0 cursor-pointer rounded-xl transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:cursor-default disabled:opacity-100 sm:rounded-lg"
          >
            <CelesteLogoAvatar
              size="md"
              shape="squircle"
              className="shadow-sm ring-1 ring-[var(--accent)]/20"
            />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="hidden truncate text-base font-semibold text-[var(--text-primary)] sm:block sm:text-lg">
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
            </div>
            <p className="hidden truncate text-xs text-[var(--text-muted)] sm:block">
              {isConnected
                ? "Navigate Celo like a cosmic atlas"
                : "DeFAI copilot for Celo — send, swap, earn, claim"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/about"
            aria-label="About Celeste AI"
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
                d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
              />
            </svg>
            <span className="hidden text-xs sm:inline">About</span>
          </Link>
          <HistoryButton isConnected={isConnected} />
          <TransactionsButton isConnected={isConnected} />
          {/* FX toggle — hidden for now
          {isConnected ? (
            <div className="relative" ref={fxControlsRef}>
              <button
                type="button"
                onClick={() => {
                  setShowPersonalityPicker(false);
                  setShowFxControls((open) => !open);
                  void setFxEnabled(!fxEnabled);
                }}
                className={`hidden rounded-lg border px-3 py-1.5 text-xs transition-colors sm:inline-flex ${
                  fxEnabled
                    ? "border-[var(--accent)]/60 text-[var(--accent-soft-text)] hover:border-[var(--accent)]"
                    : "border-[var(--surface-2)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                }`}
              >
                FX {fxEnabled ? "On" : "Off"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPersonalityPicker(false);
                  setShowFxControls((open) => !open);
                  void setFxEnabled(!fxEnabled);
                }}
                aria-label="Toggle celestial effects"
                className="flex size-9 items-center justify-center rounded-full border border-[var(--surface-2)] text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] sm:hidden"
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
                    d="m12 3 1.2 2.9L16 7.1l-2.8 1.2L12 11l-1.2-2.7L8 7.1l2.8-1.2L12 3Zm6 9 .8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9ZM6 14l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1 1-2.4Z"
                  />
                </svg>
              </button>
              {showFxControls ? (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[220px] rounded-xl border border-[var(--surface-2)] bg-[var(--surface-0)] p-3 shadow-2xl shadow-black/40">
                  <p className="text-xs font-medium text-[var(--text-primary)]">
                    Celestial FX
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--text-subtle)]">
                    Atmospheric stars and falling streaks.
                  </p>
                  <div className="mt-2 flex gap-1">
                    {(["low", "medium", "high"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => void setFxIntensity(level)}
                        className={`rounded-md border px-2 py-1 text-[10px] uppercase tracking-wide transition-colors ${
                          fxIntensity === level
                            ? "border-[var(--accent)]/70 bg-[var(--accent-soft)] text-[var(--text-primary)]"
                            : "border-[var(--surface-2)] text-[var(--text-subtle)] hover:text-[var(--text-secondary)]"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          */}
          {isConnected ? (
            <div className="relative" ref={personalityPickerRef}>
              <button
                type="button"
                onClick={() => setShowPersonalityPicker((open) => !open)}
                aria-label={
                  hasSelectedPersonality
                    ? "Change personality"
                    : "Choose personality"
                }
                className={`flex size-9 items-center justify-center rounded-full border transition-colors sm:h-auto sm:w-auto sm:rounded-lg sm:px-3 sm:py-1.5 ${
                  hasSelectedPersonality
                    ? "border-[var(--surface-2)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
                    : "border-[var(--accent)]/60 text-[var(--accent-soft-text)] hover:border-[var(--accent)]"
                }`}
              >
                <PersonalityButtonIcon selectedId={selectedPersonalityId} />
                <span className="hidden text-xs sm:inline">
                  {hasSelectedPersonality
                    ? "Personality"
                    : "Choose personality"}
                </span>
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
