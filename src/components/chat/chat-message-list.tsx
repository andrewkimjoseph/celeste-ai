"use client";

import type { ChatStatus } from "ai";
import { useEffect, useRef } from "react";
import { AssistantLoading } from "@/components/chat/assistant-loading";
import { AssistantColumn, AssistantMessageSlot } from "@/components/chat/assistant-message-slot";
import { ChatTurnRow } from "@/components/chat/chat-turn-row";
import {
  extractRecipientLabel,
  groupMessagesIntoTurns,
  shouldShowAssistantLoading,
} from "@/components/chat/chat-utils";
import type { CelesteUIMessage } from "@/lib/chat-message-metadata";
import type { PreparedFlowWithExtras } from "@/lib/prepared-flow";
import {
  getPreparedFlowMetasForMessage,
  getSignedPreparedFlowMetas,
} from "@/lib/prepared-flow";
import { CelesteLogoMark } from "@/components/celeste-logo";
import { TxConfirmCard } from "@/components/tx-confirm-card";
import { TxConfirmCardSnapshot } from "@/components/tx-confirm-card-snapshot";
import { useWalletCapabilities } from "@/hooks/use-wallet-capabilities";
import { trackEvent } from "@/lib/analytics/amplitude-browser";
import type { PromptGroup } from "@/lib/analytics/events";
import { inferFlowCategory } from "@/lib/analytics/flow-category";
import { formatAddressShort } from "@/lib/format-balance";

const SUGGESTED_PROMPT_GROUPS = [
  {
    label: "Send",
    prompts: [
      "Send 1 USDC to ",
      "Send 5 USDm to andrewkimjoseph.celo.eth",
    ],
  },
  {
    label: "Swap",
    prompts: [
      "Swap 10 USDm to CELO",
      "Get a quote to swap CELO to USDC",
    ],
  },
  {
    label: "FX",
    prompts: [
      "Convert 50 USDm to EURm",
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
      "Claim my GoodDollar UBI",
      "Check my GoodDollar status",
    ],
  },
] as const;

interface ChatMessageListProps {
  messages: CelesteUIMessage[];
  status: ChatStatus;
  mounted: boolean;
  isConnected: boolean;
  address?: `0x${string}`;
  errorMessage: string | null;
  showTxCard: boolean;
  confirmedFlowHashes: Record<string, string[]>;
  confirmedFlowTimestamps: Record<string, number>;
  pendingFlow: PreparedFlowWithExtras | undefined;
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
  address,
  errorMessage,
  showTxCard,
  confirmedFlowHashes,
  confirmedFlowTimestamps,
  pendingFlow,
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
  const signedFlowMetas = getSignedPreparedFlowMetas(messages, confirmedFlowHashes);
  const recipientLabel = extractRecipientLabel(messages);

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
    if (!showTxCard || !pendingFlow || !txCardFlowKey) {
      return;
    }

    if (trackedTxCardKeyRef.current === txCardFlowKey) {
      return;
    }

    trackedTxCardKeyRef.current = txCardFlowKey;
    trackEvent("tx_card_shown", {
      step_count: pendingFlow.steps.length,
      flow_category: inferFlowCategory(pendingFlow.summary),
    });
  }, [pendingFlow, showTxCard, txCardFlowKey]);

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
          {address ? (
            <p className="mt-2 text-center text-xs text-zinc-500">
              Connected as{" "}
              <span className="font-mono text-zinc-400">
                {formatAddressShort(address)}
              </span>
            </p>
          ) : null}
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

      {turns.map((turn, index) => {
        const archivedFlows = turn.assistant
          ? getPreparedFlowMetasForMessage(turn.assistant.id, signedFlowMetas)
          : [];

        return (
          <div key={turn.id} className="flex flex-col gap-4 sm:gap-5">
            <ChatTurnRow
              turn={turn}
              hidePrepareToolDone={showTxCard}
              showLoading={index === pendingTurnIndex}
            />
            {archivedFlows.map((meta) => (
              <AssistantColumn key={`${meta.flowKey}-snapshot`}>
                <AssistantMessageSlot showAvatar={false} showLabel={false}>
                  <TxConfirmCardSnapshot
                    summary={meta.flow.summary}
                    steps={meta.flow.steps}
                    recipientLabel={recipientLabel}
                    hashes={confirmedFlowHashes[meta.flowKey] ?? []}
                    confirmedAt={confirmedFlowTimestamps[meta.flowKey]}
                  />
                </AssistantMessageSlot>
              </AssistantColumn>
            ))}
          </div>
        );
      })}

      {showLoading && pendingTurnIndex === -1 && (
        <div className="md:w-1/2 md:pr-4 lg:pr-6">
          <AssistantLoading />
        </div>
      )}

      {showTxCard && pendingFlow && (
        <AssistantColumn>
          <AssistantMessageSlot showAvatar={false} showLabel={false}>
            <TxConfirmCard
              key={txCardFlowKey ?? undefined}
              summary={pendingFlow.summary}
              steps={pendingFlow.steps}
              recipientLabel={recipientLabel}
              warnings={pendingFlow.warnings}
              deepLink={pendingFlow.deep_link}
              confirmedAt={
                txCardFlowKey
                  ? confirmedFlowTimestamps[txCardFlowKey]
                  : undefined
              }
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
