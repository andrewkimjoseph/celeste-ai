"use client";

/**
 * Chat shell: wallet address transport, streaming chat, and tx confirmation card.
 */
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { formatChatError } from "@/components/chat/chat-utils";
import { getLatestPreparedFlowWithMeta } from "@/lib/prepared-flow";
import { formatTxHashes } from "@/lib/format-balance";
import { useMounted } from "@/hooks/use-mounted";
import { useTransactions } from "@/hooks/use-transactions";

interface ChatPanelProps {
  address?: `0x${string}`;
  isConnected?: boolean;
  mounted?: boolean;
  onNavStateChange?: (showNewChat: boolean, onNewChat: () => void) => void;
}

export function ChatPanel({
  address,
  isConnected: isConnectedProp,
  mounted: mountedProp,
  onNavStateChange,
}: ChatPanelProps = {}) {
  const mountedInternal = useMounted();
  const mounted = mountedProp ?? mountedInternal;
  const isConnected = isConnectedProp ?? false;
  const canChat = mounted && isConnected && Boolean(address);
  const { addTransaction } = useTransactions();
  const [input, setInput] = useState("");
  const [dismissedFlowKey, setDismissedFlowKey] = useState<string | null>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
  });

  const flowMeta = getLatestPreparedFlowWithMeta(messages);
  const flowKey = flowMeta?.flowKey ?? null;
  const showTxCard = Boolean(flowMeta && flowKey !== dismissedFlowKey);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || !canChat || !address) {
      return;
    }

    setInput("");
    await sendMessage({ text }, { body: { address } });
  }

  async function handlePromptSelect(prompt: string) {
    if (!canChat || !address) {
      setInput(prompt);
      return;
    }

    await sendMessage({ text: prompt }, { body: { address } });
  }

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setDismissedFlowKey(null);
    setInput("");
  }, [setMessages]);

  useEffect(() => {
    onNavStateChange?.(messages.length > 0, handleNewChat);
  }, [messages.length, onNavStateChange, handleNewChat]);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatMessageList
          messages={messages}
          status={status}
          mounted={mounted}
          isConnected={isConnected}
          errorMessage={error ? formatChatError(error.message) : null}
          showTxCard={showTxCard}
          latestFlow={flowMeta?.flow}
          onPromptSelect={(prompt) => void handlePromptSelect(prompt)}
          onTxComplete={(hashes) => {
            if (flowKey) {
              setDismissedFlowKey(flowKey);
            }

            if (address && flowMeta?.flow) {
              void addTransaction({
                address,
                hashes,
                summary: flowMeta.flow.summary,
                steps: flowMeta.flow.steps.map((step) => step.description),
                status: "confirmed",
              });
            }

            void sendMessage(
              {
                text: `Transaction confirmed. Hash${hashes.length > 1 ? "es" : ""}: ${formatTxHashes(hashes)}`,
              },
              { body: { address } },
            );
          }}
          onTxReject={() => {
            if (flowKey) {
              setDismissedFlowKey(flowKey);
            }
            const summary = flowMeta?.flow.summary;
            void sendMessage(
              {
                text: summary
                  ? `I dismissed the transaction confirmation card without signing. Prepared action: ${summary}`
                  : "I dismissed the transaction confirmation card without signing.",
              },
              { body: { address } },
            );
          }}
        />
        <ChatComposer
          input={input}
          canChat={canChat}
          status={status}
          onInputChange={setInput}
          onSubmit={handleSubmit}
        />
    </div>
  );
}
