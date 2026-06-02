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
import {
  buildPreparedFlowClientContext,
  getActivePreparedFlowWithMeta,
} from "@/lib/prepared-flow";
import { formatTxHashes } from "@/lib/format-balance";
import { formatFlowSummary } from "@/lib/wallet-error";
import { useMounted } from "@/hooks/use-mounted";
import { useTransactions } from "@/hooks/use-transactions";
import { useWalletCapabilities } from "@/hooks/use-wallet-capabilities";

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
  const { supportsFeeAbstraction } = useWalletCapabilities();
  const [input, setInput] = useState("");
  const [dismissedFlowKey, setDismissedFlowKey] = useState<string | null>(null);
  /** After dismiss, hide confirm cards until the user sends a new message. */
  const [txCardBlockedUntilUserMessage, setTxCardBlockedUntilUserMessage] =
    useState(false);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, setMessages, status, error } = useChat({
    transport,
  });

  const flowMeta = getActivePreparedFlowWithMeta(messages);
  const flowKey = flowMeta?.flowKey ?? null;
  const showTxCard = Boolean(
    flowMeta &&
      flowKey !== dismissedFlowKey &&
      !txCardBlockedUntilUserMessage,
  );

  function clearTxCardBlock() {
    setTxCardBlockedUntilUserMessage(false);
  }

  function buildChatRequestBody() {
    const clientContext = buildPreparedFlowClientContext(messages);
    const base = { address, supportsFeeAbstraction };
    return clientContext ? { ...base, clientContext } : base;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || !canChat || !address) {
      return;
    }

    clearTxCardBlock();
    setInput("");
    await sendMessage({ text }, { body: buildChatRequestBody() });
  }

  async function handlePromptSelect(prompt: string) {
    if (!canChat || !address) {
      setInput(prompt);
      return;
    }

    clearTxCardBlock();
    await sendMessage({ text: prompt }, { body: buildChatRequestBody() });
  }

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setDismissedFlowKey(null);
    setTxCardBlockedUntilUserMessage(false);
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
              { body: { address, supportsFeeAbstraction } },
            );
          }}
          onTxReject={() => {
            if (flowKey) {
              setDismissedFlowKey(flowKey);
            }
            setTxCardBlockedUntilUserMessage(true);

            const summary = flowMeta?.flow.summary;
            const actionLabel = summary
              ? formatFlowSummary(summary)
              : null;
            void sendMessage(
              {
                text: actionLabel
                  ? `Cancelled signing — was: ${actionLabel}`
                  : "Cancelled signing on the confirmation card.",
              },
              { body: { address, supportsFeeAbstraction } },
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
