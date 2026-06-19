"use client";

/**
 * Chat shell: wallet address transport, streaming chat, and tx confirmation card.
 */
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { formatChatError } from "@/components/chat/chat-utils";
import { useChats } from "@/hooks/use-chats";
import { trackEvent } from "@/lib/analytics/amplitude-browser";
import {
  analyzeAssistantResponse,
  categorizeChatError,
  charLengthBucket,
  type PromptGroup,
} from "@/lib/analytics/events";
import { inferFlowCategory } from "@/lib/analytics/flow-category";
import {
  buildPreparedFlowClientContext,
  getActivePreparedFlowWithMeta,
} from "@/lib/prepared-flow";
import { formatTxHashes } from "@/lib/format-balance";
import { formatFlowSummary } from "@/lib/wallet-error";
import { useMounted } from "@/hooks/use-mounted";
import { useTransactions } from "@/hooks/use-transactions";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { useWalletCapabilities } from "@/hooks/use-wallet-capabilities";
import { formatWalletBalanceSnapshot } from "@/lib/chat-tools/system-prompt";

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
  const { supportsFeeAbstraction, blocksCeloSend } = useWalletCapabilities();
  const { data: walletBalances } = useWalletBalances(address);
  const {
    activeChatId,
    activeChat,
    isLoading: isChatLoading,
    createChat,
    saveActiveChat,
  } = useChats();
  const [input, setInput] = useState("");
  const [dismissedFlowKey, setDismissedFlowKey] = useState<string | null>(null);
  /** After dismiss, hide confirm cards until the user sends a new message. */
  const [txCardBlockedUntilUserMessage, setTxCardBlockedUntilUserMessage] =
    useState(false);
  const chatSendStartedAtRef = useRef<number | null>(null);
  const lastTrackedErrorRef = useRef<string | null>(null);
  const hydratedChatIdRef = useRef<string | null>(null);
  const uiStateRef = useRef({
    dismissedFlowKey: null as string | null,
    txCardBlockedUntilUserMessage: false,
  });

  useEffect(() => {
    if (!activeChatId || !activeChat) {
      return;
    }

    if (hydratedChatIdRef.current === activeChatId) {
      return;
    }

    hydratedChatIdRef.current = activeChatId;
    setDismissedFlowKey(activeChat.dismissedFlowKey);
    setTxCardBlockedUntilUserMessage(activeChat.txCardBlockedUntilUserMessage);
    setInput("");
  }, [activeChatId, activeChat]);

  useEffect(() => {
    uiStateRef.current = {
      dismissedFlowKey,
      txCardBlockedUntilUserMessage,
    };
  }, [dismissedFlowKey, txCardBlockedUntilUserMessage]);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: activeChatId ?? undefined,
    messages: activeChat?.messages,
    transport,
    onFinish: ({ message, messages: finishedMessages, isError }) => {
      if (isError) {
        return;
      }

      const startedAt = chatSendStartedAtRef.current;
      chatSendStartedAtRef.current = null;
      const responseMeta = analyzeAssistantResponse(message);

      trackEvent("chat_response_finished", {
        duration_ms: startedAt ? Math.max(0, Date.now() - startedAt) : 0,
        had_tool_calls: responseMeta.had_tool_calls,
        had_prepare_flow: responseMeta.had_prepare_flow,
      });

      void saveActiveChat(finishedMessages, uiStateRef.current);
    },
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
    const contextParts: string[] = [];
    const flowContext = buildPreparedFlowClientContext(messages);
    if (flowContext) {
      contextParts.push(flowContext);
    }
    if (showTxCard && flowMeta?.flow.summary) {
      contextParts.push(
        `Pending wallet confirm card visible: "${flowMeta.flow.summary}". User must tap Confirm below.`,
      );
    }

    const balanceSnapshot = formatWalletBalanceSnapshot(walletBalances);
    return {
      address,
      supportsFeeAbstraction,
      blocksCeloSend,
      ...(balanceSnapshot ? { balanceSnapshot } : {}),
      ...(contextParts.length > 0
        ? { clientContext: contextParts.join("\n") }
        : {}),
    };
  }

  function trackChatMessageSent(
    text: string,
    source: "composer" | "suggestion",
    promptGroup?: PromptGroup,
  ) {
    chatSendStartedAtRef.current = Date.now();
    trackEvent("chat_message_sent", {
      source,
      char_length_bucket: charLengthBucket(text.length),
      ...(promptGroup ? { prompt_group: promptGroup } : {}),
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || !canChat || !address) {
      return;
    }

    clearTxCardBlock();
    setInput("");
    trackChatMessageSent(text, "composer");
    await sendMessage({ text }, { body: buildChatRequestBody() });
  }

  async function handlePromptSelect(prompt: string, promptGroup?: PromptGroup) {
    if (!canChat || !address) {
      setInput(prompt);
      return;
    }

    clearTxCardBlock();
    trackChatMessageSent(prompt, "suggestion", promptGroup);
    await sendMessage({ text: prompt }, { body: buildChatRequestBody() });
  }

  const handleNewChat = useCallback(() => {
    void createChat();
  }, [createChat]);

  useEffect(() => {
    onNavStateChange?.(messages.length > 0, handleNewChat);
  }, [messages.length, onNavStateChange, handleNewChat]);

  useEffect(() => {
    if (!error) {
      lastTrackedErrorRef.current = null;
      return;
    }

    const formatted = formatChatError(error.message);
    if (lastTrackedErrorRef.current === formatted) {
      return;
    }

    lastTrackedErrorRef.current = formatted;
    trackEvent("chat_error", {
      error_category: categorizeChatError(formatted),
    });
  }, [error]);

  if (isConnected && (isChatLoading || !activeChatId || !activeChat)) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <span
          className="inline-block size-5 animate-spin rounded-full border-2 border-zinc-600 border-t-[var(--accent-hover)]"
          aria-hidden
        />
        <span className="sr-only">Loading chat</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ChatMessageList
          messages={messages}
          status={status}
          mounted={mounted}
          isConnected={isConnected}
          address={address}
          errorMessage={error ? formatChatError(error.message) : null}
          showTxCard={showTxCard}
          latestFlow={flowMeta?.flow}
          txCardFlowKey={flowKey}
          onPromptSelect={(prompt, promptGroup) =>
            void handlePromptSelect(prompt, promptGroup)
          }
          onTxComplete={(hashes) => {
            if (flowKey) {
              uiStateRef.current = {
                ...uiStateRef.current,
                dismissedFlowKey: flowKey,
              };
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
              { body: buildChatRequestBody() },
            );
          }}
          onTxReject={() => {
            if (flowKey) {
              uiStateRef.current = {
                ...uiStateRef.current,
                dismissedFlowKey: flowKey,
                txCardBlockedUntilUserMessage: true,
              };
              setDismissedFlowKey(flowKey);
            }
            setTxCardBlockedUntilUserMessage(true);

            if (flowMeta?.flow) {
              trackEvent("tx_dismissed", {
                flow_category: inferFlowCategory(flowMeta.flow.summary),
              });
            }

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
              { body: buildChatRequestBody() },
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
