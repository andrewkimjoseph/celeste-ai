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
import { TxConfirmCard } from "@/components/tx-confirm-card";

interface ChatMessageListProps {
  messages: UIMessage[];
  status: ChatStatus;
  mounted: boolean;
  isConnected: boolean;
  errorMessage: string | null;
  showTxCard: boolean;
  latestFlow: SerializedPreparedFlow | undefined;
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
    <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
      {mounted && !isConnected && (
        <p className="text-sm text-zinc-400">
          Connect your wallet to start chatting with Celina.
        </p>
      )}

      {showEmptyState && (
        <p className="text-sm text-zinc-500">
          Ask about balances, swaps, or sends on Celo mainnet.
        </p>
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
        <p className="text-sm text-red-400">{errorMessage}</p>
      )}

      <div ref={bottomRef} aria-hidden className="h-px shrink-0" />
    </div>
  );
}
