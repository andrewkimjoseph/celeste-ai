import { isTextUIPart } from "ai";
import {
  getMessageCreatedAt,
  type CelesteUIMessage,
} from "@/lib/chat/chat-message-metadata";
import { getActivePreparedFlowWithMeta, isPreparedFlowConfirmed } from "@/lib/tx/prepared-flow";

export const MAX_CHATS_PER_WALLET = 50;

export const DEFAULT_CHAT_TITLE = "New chat";

export type ChatUiState = {
  dismissedFlowKey: string | null;
  txCardBlockedUntilUserMessage: boolean;
  confirmedFlowHashes: Record<string, string[]>;
  confirmedFlowTimestamps: Record<string, number>;
};

export type StoredChat = {
  id: string;
  address: string;
  title: string;
  messages: CelesteUIMessage[];
  dismissedFlowKey: string | null;
  txCardBlockedUntilUserMessage: boolean;
  confirmedFlowHashes?: Record<string, string[]>;
  confirmedFlowTimestamps?: Record<string, number>;
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
  messages: CelesteUIMessage[];
  dismissedFlowKey: string | null;
  txCardBlockedUntilUserMessage: boolean;
  confirmedFlowHashes: Record<string, string[]>;
  confirmedFlowTimestamps: Record<string, number>;
};

export function deriveChatTitle(messages: CelesteUIMessage[]): string {
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

export function deriveChatLastActivityAt(
  messages: CelesteUIMessage[],
  fallback: number,
): number {
  let fromMessages: number | undefined;

  for (const message of messages) {
    const createdAt = getMessageCreatedAt(message);
    if (createdAt != null && (fromMessages == null || createdAt > fromMessages)) {
      fromMessages = createdAt;
    }
  }

  return fromMessages ?? fallback;
}

export function toChatListItem(chat: StoredChat): ChatListItem {
  return {
    id: chat.id,
    title: chat.title,
    updatedAt: deriveChatLastActivityAt(chat.messages, chat.updatedAt),
    messageCount: chat.messages.length,
  };
}

/** Restore tx-card UI state; block stale unsigned prepares after reload. */
export function resolveChatUiState(
  messages: CelesteUIMessage[],
  stored?: Partial<
    Pick<
      StoredChat,
      "dismissedFlowKey" | "txCardBlockedUntilUserMessage" | "confirmedFlowHashes" | "confirmedFlowTimestamps"
    >
  >,
): ChatUiState {
  const meta = getActivePreparedFlowWithMeta(messages);
  const flowKey = meta?.flowKey ?? null;

  const dismissedFlowKey = stored?.dismissedFlowKey ?? null;
  let txCardBlockedUntilUserMessage =
    stored?.txCardBlockedUntilUserMessage ?? false;
  const confirmedFlowHashes = stored?.confirmedFlowHashes ?? {};
  const confirmedFlowTimestamps = stored?.confirmedFlowTimestamps ?? {};

  if (
    meta &&
    flowKey !== dismissedFlowKey &&
    !txCardBlockedUntilUserMessage &&
    !isPreparedFlowConfirmed(messages, meta)
  ) {
    txCardBlockedUntilUserMessage = true;
  }

  return {
    dismissedFlowKey,
    txCardBlockedUntilUserMessage,
    confirmedFlowHashes,
    confirmedFlowTimestamps,
  };
}

export function createEmptyActiveChat(id: string): ActiveChatState {
  return {
    id,
    messages: [],
    dismissedFlowKey: null,
    txCardBlockedUntilUserMessage: false,
    confirmedFlowHashes: {},
    confirmedFlowTimestamps: {},
  };
}
