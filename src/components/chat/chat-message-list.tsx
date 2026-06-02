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
import { TxConfirmCard } from "@/components/tx-confirm-card";

const SUGGESTED_PROMPT_GROUPS = [
  {
    label: "Swaps & sends",
    prompts: [
      "Swap 10 USDm to CELO",
      "Get a quote to swap CELO to USDC",
      "Send 1 USDC to ",
      "Send 0.1 CELO to ",
    ],
  },
  {
    label: "DeFi",
    prompts: [
      "Supply 0.05 USDT to Aave",
      "Withdraw my USDC from Aave",
      "Place a limit buy for CELO with USDT",
      "What's the gas price?",
    ],
  },
  {
    label: "Explore",
    prompts: [
      "Check my GoodDollar status",
      "Show my staking balances",
      "Show recent governance proposals",
      "Resolve vitalik.eth on Celo",
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
  onPromptSelect: (prompt: string) => void;
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
  onPromptSelect,
  onTxComplete,
  onTxReject,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

    bottom.scrollIntoView({
      behavior: isStreaming ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, status, showTxCard, showLoading, isStreaming]);

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
      className={`flex-1 overflow-y-auto overscroll-contain ${
        isLandingView ? "flex min-h-0 flex-col justify-center" : ""
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
          <h2 className="text-base font-semibold text-white">What can Celeste AI do?</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Ask in plain English — swap tokens, send money, check balances, and
            more on Celo.
          </p>
          <div className="mt-4 space-y-3">
            {SUGGESTED_PROMPT_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                  {group.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {group.prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => onPromptSelect(prompt)}
                      className="rounded-full border border-[var(--surface-2)] bg-[var(--surface-1)] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-[var(--accent)]/40 hover:text-white"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
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
              carbonDetails={latestFlow.carbonDetails}
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
