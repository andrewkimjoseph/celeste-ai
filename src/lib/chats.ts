import { isTextUIPart, type UIMessage } from "ai";
import { getActivePreparedFlowWithMeta, isPreparedFlowConfirmed } from "@/lib/prepared-flow";

export const MAX_CHATS_PER_WALLET = 50;

export const DEFAULT_CHAT_TITLE = "New chat";

export type ChatUiState = {
  dismissedFlowKey: string | null;
  txCardBlockedUntilUserMessage: boolean;
  confirmedFlowHashes: Record<string, string[]>;
};

export type StoredChat = {
  id: string;
  address: string;
  title: string;
  messages: UIMessage[];
  dismissedFlowKey: string | null;
  txCardBlockedUntilUserMessage: boolean;
  confirmedFlowHashes?: Record<string, string[]>;
  createdAt: number;
  updatedAt: number;
};

export type ChatListItem = {
  id: string;
  title: string;
  updatedAt: number;
  messageCount: number;
};

export type ActiveChatState = {
  id: string;
  messages: UIMessage[];
  dismissedFlowKey: string | null;
  txCardBlockedUntilUserMessage: boolean;
  confirmedFlowHashes: Record<string, string[]>;
};

export function deriveChatTitle(messages: UIMessage[]): string {
  for (const message of messages) {
    if (message.role !== "user") {
      continue;
    }

    const text =
      message.parts
        ?.filter(isTextUIPart)
        .map((part) => part.text)
        .join("\n")
        .trim() ?? "";

    if (text.length > 0) {
      return text.length > 48 ? `${text.slice(0, 48)}…` : text;
    }
  }

  return DEFAULT_CHAT_TITLE;
}

export function toChatListItem(chat: StoredChat): ChatListItem {
  return {
    id: chat.id,
    title: chat.title,
    updatedAt: chat.updatedAt,
    messageCount: chat.messages.length,
  };
}

/** Restore tx-card UI state; block stale unsigned prepares after reload. */
export function resolveChatUiState(
  messages: UIMessage[],
  stored?: Partial<
    Pick<
      StoredChat,
      "dismissedFlowKey" | "txCardBlockedUntilUserMessage" | "confirmedFlowHashes"
    >
  >,
): ChatUiState {
  const meta = getActivePreparedFlowWithMeta(messages);
  const flowKey = meta?.flowKey ?? null;

  const dismissedFlowKey = stored?.dismissedFlowKey ?? null;
  let txCardBlockedUntilUserMessage =
    stored?.txCardBlockedUntilUserMessage ?? false;
  const confirmedFlowHashes = stored?.confirmedFlowHashes ?? {};

  if (
    meta &&
    flowKey !== dismissedFlowKey &&
    !txCardBlockedUntilUserMessage &&
    !isPreparedFlowConfirmed(messages, meta)
  ) {
    txCardBlockedUntilUserMessage = true;
  }

  return { dismissedFlowKey, txCardBlockedUntilUserMessage, confirmedFlowHashes };
}

export function createEmptyActiveChat(id: string): ActiveChatState {
  return {
    id,
    messages: [],
    dismissedFlowKey: null,
    txCardBlockedUntilUserMessage: false,
    confirmedFlowHashes: {},
  };
}
