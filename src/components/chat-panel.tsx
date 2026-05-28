"use client";

/**
 * Chat shell: wallet address transport, streaming chat, and tx confirmation card.
 */
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAccount } from "wagmi";
import { useMemo, useState } from "react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { formatChatError } from "@/components/chat/chat-utils";
import { Header } from "@/components/header";
import { getLatestPreparedFlowWithMeta } from "@/lib/prepared-flow";
import { useMounted } from "@/hooks/use-mounted";

export function ChatPanel() {
  const mounted = useMounted();
  const { address, isConnected } = useAccount();
  const canChat = mounted && isConnected;
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

  function handleNewChat() {
    setMessages([]);
    setDismissedFlowKey(null);
    setInput("");
  }

  return (
    <>
      <Header
        showNewChat={messages.length > 0}
        onNewChat={handleNewChat}
      />
      <div className="flex min-h-0 flex-1 flex-col">
        <ChatMessageList
          messages={messages}
          status={status}
          mounted={mounted}
          isConnected={isConnected}
          errorMessage={error ? formatChatError(error.message) : null}
          showTxCard={showTxCard}
          latestFlow={flowMeta?.flow}
          onTxComplete={(hashes) => {
            if (flowKey) {
              setDismissedFlowKey(flowKey);
            }
            void sendMessage(
              {
                text: `Transaction confirmed. Hashes: ${hashes.join(", ")}`,
              },
              { body: { address } },
            );
          }}
          onTxReject={() => {
            if (flowKey) {
              setDismissedFlowKey(flowKey);
            }
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
    </>
  );
}
