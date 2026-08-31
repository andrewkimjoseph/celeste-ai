"use client";

import type { ChatStatus } from "ai";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AssistantLoading } from "@/components/chat/assistant-loading";
import { AssistantColumn, AssistantMessageSlot } from "@/components/chat/assistant-message-slot";
import { ChatTurnRow } from "@/components/chat/chat-turn-row";
import {
  extractRecipientLabel,
  groupMessagesIntoTurns,
  shouldShowAssistantLoading,
} from "@/components/chat/chat-utils";
import type { CelesteUIMessage } from "@/lib/chat/chat-message-metadata";
import type { PreparedFlowWithExtras } from "@/lib/tx/prepared-flow";
import {
  getPreparedFlowMetasForMessage,
  getSignedPreparedFlowMetas,
} from "@/lib/tx/prepared-flow";
import { TxConfirmCard } from "@/components/tx-confirm-card";
import { TxConfirmCardSnapshot } from "@/components/tx-confirm-card-snapshot";
import { CelesteGlobeMark } from "@/components/celeste-logo";
import { PreConnectLanding } from "@/components/chat/pre-connect-landing";
import { trackEvent } from "@/lib/analytics/amplitude-browser";
import type { PromptGroup } from "@/lib/analytics/events";
import { inferFlowCategory } from "@/lib/analytics/flow-category";
import type { WalletBalancesResponse } from "@/lib/wallet/balances";
import {
  buildLandingPrompts,
  formatLandingBalanceLine,
} from "@/lib/chat/landing-prompts";

interface ChatMessageListProps {
  chatId?: string | null;
  messages: CelesteUIMessage[];
  status: ChatStatus;
  mounted: boolean;
  isConnected: boolean;
  address?: `0x${string}`;
  walletBalances?: WalletBalancesResponse;
  blocksCeloSend?: boolean;
  errorMessage: string | null;
  showTxCard: boolean;
  confirmedFlowHashes: Record<string, string[]>;
  confirmedFlowTimestamps: Record<string, number>;
  pendingFlow: PreparedFlowWithExtras | undefined;
  txCardFlowKey: string | null;
  hasSelectedPersonality: boolean;
  personalityPicker?: ReactNode;
  landingComposer?: ReactNode;
  onPromptSelect: (prompt: string, promptGroup?: PromptGroup) => void;
  onTxComplete: (hashes: string[]) => void;
  onTxReject: () => void;
}

export function ChatMessageList({
  chatId,
  messages,
  status,
  mounted,
  isConnected,
  address,
  walletBalances,
  blocksCeloSend = false,
  errorMessage,
  showTxCard,
  confirmedFlowHashes,
  confirmedFlowTimestamps,
  pendingFlow,
  txCardFlowKey,
  hasSelectedPersonality,
  personalityPicker,
  landingComposer,
  onPromptSelect,
  onTxComplete,
  onTxReject,
}: ChatMessageListProps) {
  const [showMoreSuggestions, setShowMoreSuggestions] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const trackedTxCardKeyRef = useRef<string | null>(null);
  const activeChatIdRef = useRef<string | null>(null);
  const pendingInitialScrollRef = useRef(false);
  const showLoading = shouldShowAssistantLoading(status, messages);
  const isStreaming = status === "streaming";
  const signedFlowMetas = getSignedPreparedFlowMetas(messages, confirmedFlowHashes);
  const recipientLabel = extractRecipientLabel(messages);
  const landingPrompts = useMemo(
    () => buildLandingPrompts(walletBalances, { blocksCeloSend }),
    [walletBalances, blocksCeloSend],
  );
  const balanceLine = formatLandingBalanceLine(walletBalances);
  const addressLabel = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  useEffect(() => {
    if (chatId !== activeChatIdRef.current) {
      activeChatIdRef.current = chatId ?? null;
      pendingInitialScrollRef.current = true;
    }
  }, [chatId]);

  useEffect(() => {
    const bottom = bottomRef.current;
    const container = scrollContainerRef.current;
    if (!bottom || !container) {
      return;
    }

    const scrollToBottom = (behavior: ScrollBehavior) => {
      bottom.scrollIntoView({ behavior, block: "end" });
    };

    if (pendingInitialScrollRef.current) {
      pendingInitialScrollRef.current = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollToBottom("smooth");
        });
      });
      return;
    }

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const shouldStickToBottom = distanceFromBottom < 120;

    if (!shouldStickToBottom && !showLoading && !isStreaming) {
      return;
    }

    scrollToBottom(isStreaming ? "auto" : "smooth");
  }, [messages, status, showTxCard, showLoading, isStreaming, chatId]);

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
        isLandingView ? "flex min-h-full flex-col items-center justify-center" : ""
      }`}
    >
      <div
        className={`w-full ${
          isLandingView
            ? "mx-auto max-w-2xl px-3 py-4 sm:px-6 sm:py-5"
            : "space-y-8 px-4 py-4 sm:space-y-10 sm:px-5 sm:py-5"
        }`}
      >
      {showConnectPrompt && <PreConnectLanding />}

      {showEmptyState && (
        <div>
          <CelesteGlobeMark className="mb-4 sm:mb-5" />
          <h2 className="mb-4 text-center text-2xl font-bold tracking-tight text-[var(--ink)] sm:mb-5 sm:text-3xl">
            {addressLabel
              ? `Welcome back, ${addressLabel}. What next?`
              : "Welcome back. What next?"}
          </h2>
          <div className="card-brutal px-3 py-4 sm:px-4 sm:py-6">
          {!hasSelectedPersonality && personalityPicker ? (
            <div className="card-brutal mx-auto mb-4 max-w-xl bg-[var(--canvas)] p-3 sm:p-4">
              {personalityPicker}
            </div>
          ) : null}
          <h2 className="text-center text-base font-bold tracking-tight text-[var(--ink)]">
            What should we do next?
          </h2>
          <p className="mt-1 text-center text-sm text-[var(--text-secondary)]">
            Send, swap, earn, and claim on Celo.
          </p>
          {balanceLine ? (
            <p className="mt-2 text-center text-xs font-bold text-[var(--text-muted)]">{balanceLine}</p>
          ) : null}
          {landingComposer ? (
            <div className="mt-4">{landingComposer}</div>
          ) : !hasSelectedPersonality ? (
            <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
              Choose a personality to start chatting.
            </p>
          ) : null}
          <div className="mt-4 space-y-3">
            {landingComposer ? (
              <div className="flex items-center gap-3">
                <div className="h-0.5 flex-1 bg-[var(--ink)]" aria-hidden />
                <p className="shrink-0 text-xs font-bold uppercase tracking-wide text-[var(--text-muted)]">Or try a suggestion</p>
                <div className="h-0.5 flex-1 bg-[var(--ink)]" aria-hidden />
              </div>
            ) : null}
            <div className="flex flex-wrap justify-center gap-2">
              {landingPrompts.primary.map((prompt, index) => (
                <button
                  key={prompt.text}
                  type="button"
                  onClick={() => onPromptSelect(prompt.text, prompt.group)}
                  className={`rounded-[2px] border-2 border-[var(--ink)] px-3 py-1.5 text-xs font-semibold shadow-[var(--shadow-brutal-sm)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
                    index === landingPrompts.primary.length - 1
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                      : "bg-[var(--surface)] text-[var(--ink)]"
                  }`}
                >
                  {prompt.text}
                </button>
              ))}
            </div>
            {landingPrompts.more.length > 0 && (
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setShowMoreSuggestions((open) => !open)}
                  className="btn-brutal btn-primary px-3 py-1.5 text-xs"
                  aria-expanded={showMoreSuggestions}
                >
                  {showMoreSuggestions ? "Show fewer suggestions" : "Show more suggestions"}
                </button>
                {showMoreSuggestions && (
                  <div className="mt-3 w-full space-y-3">
                    {landingPrompts.more.map((group) => (
                      <div key={group.label}>
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">
                          {group.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.prompts.map((prompt) => (
                            <button
                              key={prompt.text}
                              type="button"
                              onClick={() =>
                                onPromptSelect(prompt.text, prompt.group)
                              }
                              className="rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] shadow-[var(--shadow-brutal-sm)] transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            >
                              {prompt.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
        <p className="rounded-[2px] border-2 border-[var(--ink)] bg-[var(--warn)] px-3 py-2 text-sm font-semibold text-white shadow-[var(--shadow-brutal-sm)]">
          {errorMessage}
        </p>
      )}

      <div ref={bottomRef} aria-hidden className="h-px shrink-0" />
      </div>
    </div>
  );
}
