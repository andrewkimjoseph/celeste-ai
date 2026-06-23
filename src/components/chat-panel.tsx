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
  isPreparedFlowSigned,
} from "@/lib/prepared-flow";
import { formatFlowSummary } from "@/lib/wallet-error";
import { useQueryClient } from "@tanstack/react-query";
import { useMounted } from "@/hooks/use-mounted";
import { useTransactions } from "@/hooks/use-transactions";
import {
  invalidateWalletBalances,
  useWalletBalances,
} from "@/hooks/use-wallet-balances";
import { useWalletCapabilities } from "@/hooks/use-wallet-capabilities";
import { formatWalletBalanceSnapshot } from "@/lib/chat-tools/system-prompt";
import {
  type CelesteUIMessage,
  createMessageMetadata,
  messageMetadataSchema,
} from "@/lib/chat-message-metadata";

interface ChatPanelProps {
  address?: `0x${string}`;
  isConnected?: boolean;
  mounted?: boolean;
  onNavStateChange?: (showNewChat: boolean, onNewChat: () => void) => void;
  onLandingStateChange?: (isLanding: boolean) => void;
}

export function ChatPanel({
  address,
  isConnected: isConnectedProp,
  mounted: mountedProp,
  onNavStateChange,
  onLandingStateChange,
}: ChatPanelProps = {}) {
  const mountedInternal = useMounted();
  const mounted = mountedProp ?? mountedInternal;
  const isConnected = isConnectedProp ?? false;
  const canChat = mounted && isConnected && Boolean(address);
  const queryClient = useQueryClient();
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
  const [confirmedFlowHashes, setConfirmedFlowHashes] = useState<
    Record<string, string[]>
  >({});
  const [confirmedFlowTimestamps, setConfirmedFlowTimestamps] = useState<
    Record<string, number>
  >({});
  const chatSendStartedAtRef = useRef<number | null>(null);
  const lastTrackedErrorRef = useRef<string | null>(null);
  const hydratedChatIdRef = useRef<string | null>(null);
  const uiStateRef = useRef({
    dismissedFlowKey: null as string | null,
    txCardBlockedUntilUserMessage: false,
    confirmedFlowHashes: {} as Record<string, string[]>,
    confirmedFlowTimestamps: {} as Record<string, number>,
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
    setConfirmedFlowHashes(activeChat.confirmedFlowHashes);
    setConfirmedFlowTimestamps(activeChat.confirmedFlowTimestamps);
    setInput("");
  }, [activeChatId, activeChat]);

  useEffect(() => {
    uiStateRef.current = {
      dismissedFlowKey,
      txCardBlockedUntilUserMessage,
      confirmedFlowHashes,
      confirmedFlowTimestamps,
    };
  }, [dismissedFlowKey, txCardBlockedUntilUserMessage, confirmedFlowHashes, confirmedFlowTimestamps]);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, status, error } = useChat<CelesteUIMessage>({
    id: activeChatId ?? undefined,
    messages: activeChat?.messages,
    messageMetadataSchema,
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

  const pendingFlowMeta = getActivePreparedFlowWithMeta(messages);
  const flowKey = pendingFlowMeta?.flowKey ?? null;
  const pendingSigned = Boolean(
    pendingFlowMeta &&
      isPreparedFlowSigned(messages, pendingFlowMeta, confirmedFlowHashes),
  );
  const showTxCard = Boolean(
    pendingFlowMeta &&
      flowKey &&
      flowKey !== dismissedFlowKey &&
      !pendingSigned &&
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
    if (showTxCard && pendingFlowMeta?.flow.summary) {
      contextParts.push(
        `Pending wallet confirm card visible: "${pendingFlowMeta.flow.summary}". User must tap Confirm below.`,
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
    await sendMessage(
      { text, metadata: createMessageMetadata() },
      { body: buildChatRequestBody() },
    );
  }

  async function handlePromptSelect(prompt: string, promptGroup?: PromptGroup) {
    if (!canChat || !address) {
      setInput(prompt);
      return;
    }

    clearTxCardBlock();
    trackChatMessageSent(prompt, "suggestion", promptGroup);
    await sendMessage(
      { text: prompt, metadata: createMessageMetadata() },
      { body: buildChatRequestBody() },
    );
  }

  const handleNewChat = useCallback(() => {
    void createChat();
  }, [createChat]);

  useEffect(() => {
    onNavStateChange?.(messages.length > 0, handleNewChat);
  }, [messages.length, onNavStateChange, handleNewChat]);

  const showLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    const isLandingView =
      mounted &&
      messages.length === 0 &&
      !showLoading &&
      !showTxCard;
    onLandingStateChange?.(isLandingView);
  }, [
    mounted,
    messages.length,
    showLoading,
    showTxCard,
    onLandingStateChange,
  ]);

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
          walletBalances={walletBalances}
          blocksCeloSend={blocksCeloSend}
          errorMessage={error ? formatChatError(error.message) : null}
          showTxCard={showTxCard}
          confirmedFlowHashes={confirmedFlowHashes}
          confirmedFlowTimestamps={confirmedFlowTimestamps}
          pendingFlow={pendingFlowMeta?.flow}
          txCardFlowKey={flowKey}
          onPromptSelect={(prompt, promptGroup) =>
            void handlePromptSelect(prompt, promptGroup)
          }
          onTxComplete={(hashes) => {
            const summary = pendingFlowMeta?.flow.summary ?? "Transaction";

            if (flowKey) {
              const confirmedAt = Date.now();
              const nextConfirmed = {
                ...uiStateRef.current.confirmedFlowHashes,
                [flowKey]: hashes,
              };
              const nextTimestamps = {
                ...uiStateRef.current.confirmedFlowTimestamps,
                [flowKey]: confirmedAt,
              };
              uiStateRef.current = {
                ...uiStateRef.current,
                confirmedFlowHashes: nextConfirmed,
                confirmedFlowTimestamps: nextTimestamps,
              };
              setConfirmedFlowHashes(nextConfirmed);
              setConfirmedFlowTimestamps(nextTimestamps);
            }

            if (address && pendingFlowMeta?.flow) {
              void addTransaction({
                address,
                hashes,
                summary: pendingFlowMeta.flow.summary,
                steps: pendingFlowMeta.flow.steps.map((step) => step.description),
                status: "confirmed",
              });
            }

            if (address) {
              void invalidateWalletBalances(queryClient, address);
            }

            const fullHashLine = hashes.join(", ");
            const requestBody = buildChatRequestBody();
            const confirmContext = [
              requestBody.clientContext,
              "The user signed the prepared wallet transaction successfully.",
              `Action: ${summary}`,
              `Full transaction hash(es): ${fullHashLine}`,
              "Do NOT call get_transaction — confirmation is already complete. Reply with a brief success acknowledgement only — no hash list, no repeating step details.",
            ]
              .filter(Boolean)
              .join("\n");

            void sendMessage(
              {
                text: "Transaction confirmed.",
                metadata: createMessageMetadata(),
              },
              {
                body: {
                  ...requestBody,
                  clientContext: confirmContext,
                },
              },
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

            if (pendingFlowMeta?.flow) {
              trackEvent("tx_dismissed", {
                flow_category: inferFlowCategory(pendingFlowMeta.flow.summary),
              });
            }

            const summary = pendingFlowMeta?.flow.summary;
            const actionLabel = summary
              ? formatFlowSummary(summary)
              : null;
            void sendMessage(
              {
                text: actionLabel
                  ? `Cancelled signing — was: ${actionLabel}`
                  : "Cancelled signing on the confirmation card.",
                metadata: createMessageMetadata(),
              },
              { body: buildChatRequestBody() },
            );
          }}
        />
        <ChatComposer
          input={input}
          canChat={canChat}
          status={status}
          showLandingHint={messages.length === 0 && canChat}
          onInputChange={setInput}
          onSubmit={handleSubmit}
        />
    </div>
  );
}
