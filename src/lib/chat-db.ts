import {
  deriveChatTitle,
  MAX_CHATS_PER_WALLET,
  type ChatUiState,
  type StoredChat,
} from "@/lib/chats";
import { celesteDb } from "@/lib/transaction-db";
import type { CelesteUIMessage } from "@/lib/chat-message-metadata";

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export async function listChats(address: string): Promise<StoredChat[]> {
  return celesteDb.chats
    .where("address")
    .equals(normalizeAddress(address))
    .reverse()
    .sortBy("updatedAt");
}

export async function getChat(id: string): Promise<StoredChat | undefined> {
  return celesteDb.chats.get(id);
}

async function trimChatsForAddress(address: string): Promise<void> {
  const normalized = normalizeAddress(address);
  const rows = await celesteDb.chats
    .where("address")
    .equals(normalized)
    .reverse()
    .sortBy("updatedAt");

  if (rows.length <= MAX_CHATS_PER_WALLET) {
    return;
  }

  const overflow = rows.slice(MAX_CHATS_PER_WALLET);
  await celesteDb.chats.bulkDelete(overflow.map((row) => row.id));
}

export async function deleteChat(id: string): Promise<void> {
  await celesteDb.chats.delete(id);
}

export async function upsertChat(input: {
  id: string;
  address: string;
  messages: CelesteUIMessage[];
  uiState: ChatUiState;
  createdAt?: number;
}): Promise<StoredChat | null> {
  if (input.messages.length === 0) {
    await deleteChat(input.id);
    return null;
  }

  const normalizedAddress = normalizeAddress(input.address);
  const now = Date.now();
  const existing = await celesteDb.chats.get(input.id);

  const record: StoredChat = {
    id: input.id,
    address: normalizedAddress,
    title: deriveChatTitle(input.messages),
    messages: input.messages,
    dismissedFlowKey: input.uiState.dismissedFlowKey,
    txCardBlockedUntilUserMessage: input.uiState.txCardBlockedUntilUserMessage,
    confirmedFlowHashes: input.uiState.confirmedFlowHashes,
    confirmedFlowTimestamps: input.uiState.confirmedFlowTimestamps,
    createdAt: existing?.createdAt ?? input.createdAt ?? now,
    updatedAt: now,
  };

  await celesteDb.chats.put(record);
  await trimChatsForAddress(normalizedAddress);

  return record;
}
