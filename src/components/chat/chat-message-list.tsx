"use client";

import type { ChatStatus, UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { AssistantLoading } from "@/components/chat/assistant-loading";
import { AssistantColumn, AssistantMessageSlot } from "@/components/chat/assistant-message-slot";
import { ChatTurnRow } from "@/components/chat/chat-turn-row";
import {
  extractRecipientLabel,
  groupMessagesIntoTurns,
  shouldShowAssistantLoading,
} from "@/components/chat/chat-utils";
import type { PreparedFlowWithExtras } from "@/lib/prepared-flow";
import { CelesteLogoMark } from "@/components/celeste-logo";
import { TxConfirmCard } from "@/components/tx-confirm-card";
import { useWalletCapabilities } from "@/hooks/use-wallet-capabilities";
import { trackEvent } from "@/lib/analytics/amplitude-browser";
import type { PromptGroup } from "@/lib/analytics/events";
import { inferFlowCategory } from "@/lib/analytics/flow-category";

const SUGGESTED_PROMPT_GROUPS = [
  {
    label: "Send",
    prompts: [
      "Send 1 USDC to ",
      "Send 0.1 CELO to ",
      "Send 5 USDm to andrewkimjoseph.celo.eth",
    ],
  },
  {
    label: "Swap",
    prompts: [
      "Swap 10 USDm to CELO",
      "Get a quote to swap CELO to USDC",
      "Swap 100 G$ to USDm",
      "What's the best swap rate for 50 USDT to CELO?",
    ],
  },
  {
    label: "FX",
    prompts: [
      "Convert 50 USDm to EURm",
      "What's the Mento rate for USDm to EURm?",
      "Convert 20 EURm to USDC",
    ],
  },
  {
    label: "Earn",
    prompts: [
      "Save 10 USDT to Aave",
      "Withdraw my entire Aave savings",
    ],
  },
  {
    label: "GoodDollar",
    prompts: [
      "Can I claim GoodDollar UBI today?",
      "Check my GoodDollar status",
      "Claim my GoodDollar UBI",
    ],
  },
] as const;

interface ChatMessageListProps {
  messages: UIMessage[];
  status: ChatStatus;
  mounted: boolean;
  isConnected: boolean;
  errorMessage: string | null;
  showTxCard: boolean;
  latestFlow: PreparedFlowWithExtras | undefined;
  txCardFlowKey: string | null;
  onPromptSelect: (prompt: string, promptGroup?: PromptGroup) => void;
  onTxComplete: (hashes: string[]) => void;
  onTxReject: () => void;
}

export function ChatMessageList({
  messages,
  status,
  mounted,
  isConnected,
  errorMessage,
  showTxCard,
  latestFlow,
  txCardFlowKey,
  onPromptSelect,
  onTxComplete,
  onTxReject,
}: ChatMessageListProps) {
  const { blocksCeloSend } = useWalletCapabilities();
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const trackedTxCardKeyRef = useRef<string | null>(null);
  const showLoading = shouldShowAssistantLoading(status, messages);
  const isStreaming = status === "streaming";

  useEffect(() => {
    const container = scrollContainerRef.current;
    const bottom = bottomRef.current;
    if (!container || !bottom) {
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const shouldStickToBottom = distanceFromBottom < 120;

    if (!shouldStickToBottom && !showLoading && !isStreaming) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [messages, status, showTxCard, showLoading, isStreaming]);

  useEffect(() => {
    if (!showTxCard || !latestFlow || !txCardFlowKey) {
      return;
    }

    if (trackedTxCardKeyRef.current === txCardFlowKey) {
      return;
    }

    trackedTxCardKeyRef.current = txCardFlowKey;
    trackEvent("tx_card_shown", {
      step_count: latestFlow.steps.length,
      flow_category: inferFlowCategory(latestFlow.summary),
    });
  }, [latestFlow, showTxCard, txCardFlowKey]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    function scrollMessagesForKeyboard() {
      const container = scrollContainerRef.current;
      const active = document.activeElement;
      if (!container || active?.tagName !== "TEXTAREA") {
        return;
      }

      container.scrollTo({
        top: container.scrollHeight,
        behavior: "auto",
      });
    }

    viewport.addEventListener("resize", scrollMessagesForKeyboard);
    return () => viewport.removeEventListener("resize", scrollMessagesForKeyboard);
  }, []);

  const showEmptyState = mounted && isConnected && messages.length === 0;
  const showConnectPrompt = mounted && !isConnected && messages.length === 0;
  const isLandingView =
    (showEmptyState || showConnectPrompt) && !showLoading && !showTxCard;
  const recipientLabel = extractRecipientLabel(messages);
  const turns = groupMessagesIntoTurns(messages);
  const pendingTurnIndex =
    showLoading && turns.at(-1)?.user && !turns.at(-1)?.assistant
      ? turns.length - 1
      : -1;

  return (
    <div
      ref={scrollContainerRef}
      className={`min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] ${
        isLandingView ? "flex flex-col justify-center" : ""
      }`}
    >
      <div
        className={`w-full py-4 sm:py-5 ${
          isLandingView
            ? "mx-auto max-w-2xl px-3 sm:px-6"
            : "space-y-8 px-4 sm:space-y-10 sm:px-5"
        }`}
      >
      {showConnectPrompt && (
        <div className="rounded-xl border border-[var(--surface-2)] bg-[var(--surface-1)]/60 px-4 py-6 text-center">
          <p className="text-sm text-zinc-300">Connect your wallet to start chatting with Celeste AI.</p>
          <p className="mt-1 text-xs text-zinc-500">
            Your balances will show up once you&apos;re connected.
          </p>
        </div>
      )}

      {showEmptyState && (
        <div className="rounded-xl border border-[var(--surface-2)] bg-[var(--surface-1)]/60 px-4 py-6">
          <h2 className="text-center text-base font-semibold text-white">
            What can Celeste AI do?
          </h2>
          <p className="mt-1 text-center text-sm text-zinc-400">
            Ask in plain English — send, swap, FX, earn on Aave, and claim
            GoodDollar UBI, all on Celo.
          </p>
          <CelesteLogoMark className="my-6 sm:my-8" />
          <div className="space-y-3">
            {SUGGESTED_PROMPT_GROUPS.map((group) => {
              const prompts =
                group.label === "Send" && blocksCeloSend
                  ? group.prompts.filter((prompt) => !/^Send .* CELO to /i.test(prompt))
                  : group.prompts;

              return (
              <div key={group.label}>
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => onPromptSelect(prompt, group.label)}
                      className="rounded-full border border-[var(--surface-2)] bg-[var(--surface-1)] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-[var(--accent)]/40 hover:text-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {turns.map((turn, index) => (
        <ChatTurnRow
          key={turn.id}
          turn={turn}
          hidePrepareToolDone={showTxCard}
          showLoading={index === pendingTurnIndex}
        />
      ))}

      {showLoading && pendingTurnIndex === -1 && (
        <div className="md:w-1/2 md:pr-4 lg:pr-6">
          <AssistantLoading />
        </div>
      )}

      {showTxCard && latestFlow && (
        <AssistantColumn>
          <AssistantMessageSlot showAvatar={false} showLabel={false}>
            <TxConfirmCard
              summary={latestFlow.summary}
              steps={latestFlow.steps}
              recipientLabel={recipientLabel}
              warnings={latestFlow.warnings}
              deepLink={latestFlow.deep_link}
              onComplete={onTxComplete}
              onDismiss={onTxReject}
            />
          </AssistantMessageSlot>
        </AssistantColumn>
      )}

      {errorMessage && (
        <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {errorMessage}
        </p>
      )}

      <div ref={bottomRef} aria-hidden className="h-px shrink-0" />
      </div>
    </div>
  );
}
