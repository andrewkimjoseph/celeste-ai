"use client";

import type { ChatStatus, UIMessage } from "ai";
import { useEffect, useRef } from "react";
import { AssistantLoading } from "@/components/chat/assistant-loading";
import { ChatMessage } from "@/components/chat/chat-message";
import {
  extractRecipientLabel,
  shouldShowAssistantLoading,
} from "@/components/chat/chat-utils";
import type { SerializedPreparedFlow } from "@/lib/prepared-flow";
import { CELINA_SDK_DOCS_URL } from "@/lib/links";
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
  latestFlow: SerializedPreparedFlow | undefined;
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
  const showLoading = shouldShowAssistantLoading(status, messages);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status, showTxCard, showLoading]);

  const showEmptyState = mounted && isConnected && messages.length === 0;
  const recipientLabel = extractRecipientLabel(messages);

  return (
    <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4 sm:space-y-6 sm:px-6 sm:py-5">
      {mounted && !isConnected && (
        <div className="rounded-xl border border-[var(--surface-2)] bg-[var(--surface-1)]/60 px-4 py-6 text-center">
          <p className="text-sm text-zinc-300">Connect your wallet to start chatting with Celina.</p>
          <p className="mt-1 text-xs text-zinc-500">
            Your balances will appear in the panel once connected.{" "}
            <a
              href={CELINA_SDK_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-hover)] underline-offset-2 hover:underline"
            >
              Celina SDK docs
            </a>
          </p>
        </div>
      )}

      {showEmptyState && (
        <div className="rounded-xl border border-[var(--surface-2)] bg-[var(--surface-1)]/60 px-4 py-6">
          <h2 className="text-base font-semibold text-white">What can Celina do?</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Swaps, sends, Aave, balances, and more on Celo mainnet. Tap{" "}
            <span className="text-zinc-300">Balances</span> in the nav to see
            your wallet.
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
          <p className="mt-4 border-t border-[var(--surface-2)] pt-3 text-xs text-zinc-500">
            Built on{" "}
            <a
              href={CELINA_SDK_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent-hover)] underline-offset-2 hover:underline"
            >
              Celina SDK
            </a>
            {" — "}
            guides, wagmi integration, and API reference on GitBook.
          </p>
        </div>
      )}

      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          hidePrepareToolDone={showTxCard}
        />
      ))}

      {showLoading && <AssistantLoading />}

      {showTxCard && latestFlow && (
        <TxConfirmCard
          summary={latestFlow.summary}
          steps={latestFlow.steps}
          recipientLabel={recipientLabel}
          onComplete={onTxComplete}
          onDismiss={onTxReject}
        />
      )}

      {errorMessage && (
        <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {errorMessage}
        </p>
      )}

      <div ref={bottomRef} aria-hidden className="h-px shrink-0" />
    </div>
  );
}
