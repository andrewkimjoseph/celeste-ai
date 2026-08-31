import {
  deriveChatLastActivityAt,
  deriveChatTitle,
  MAX_CHATS_PER_WALLET,
  type ChatUiState,
  type StoredChat,
} from "@/lib/chat/chats";
import { celesteDb } from "@/lib/tx/transaction-db";
import type { CelesteUIMessage } from "@/lib/chat/chat-message-metadata";
import {
  isCelestialPersonalityId,
  type CelestialPersonalityId,
} from "@/lib/chat/celestial-personalities";

function normalizeAddress(address: string): string {
  return address.toLowerCase();
}

export async function listChats(address: string): Promise<StoredChat[]> {
  const rows = await celesteDb.chats
    .where("address")
    .equals(normalizeAddress(address))
    .toArray();

  return rows.sort(
    (a, b) =>
      deriveChatLastActivityAt(b.messages, b.updatedAt) -
      deriveChatLastActivityAt(a.messages, a.updatedAt),
  );
}

export async function getChat(id: string): Promise<StoredChat | undefined> {
  return celesteDb.chats.get(id);
}

export async function getPersonalityByAddress(
  address: string,
): Promise<CelestialPersonalityId | null> {
  const record = await celesteDb.preferences.get(normalizeAddress(address));
  if (!record || !isCelestialPersonalityId(record.personalityId)) {
    return null;
  }
  return record.personalityId;
}

export async function upsertPersonalityPreference(
  address: string,
  personalityId: CelestialPersonalityId,
): Promise<void> {
  const normalized = normalizeAddress(address);
  const existing = await celesteDb.preferences.get(normalized);
  await celesteDb.preferences.put({
    ...existing,
    address: normalized,
    personalityId,
    updatedAt: Date.now(),
  });
}

export type FxIntensity = "low" | "medium" | "high";

export interface FxPreference {
  enabled: boolean;
  intensity: FxIntensity;
}

export async function getFxPreferenceByAddress(
  address: string,
): Promise<FxPreference> {
  const record = await celesteDb.preferences.get(normalizeAddress(address));
  const intensity: FxIntensity =
    record?.fxIntensity === "low" || record?.fxIntensity === "high"
      ? record.fxIntensity
      : "low";
  return {
    enabled: record?.fxEnabled ?? true,
    intensity,
  };
}

export async function upsertFxPreference(
  address: string,
  preference: FxPreference,
): Promise<void> {
  const normalized = normalizeAddress(address);
  const existing = await celesteDb.preferences.get(normalized);
  await celesteDb.preferences.put({
    ...existing,
    address: normalized,
    fxEnabled: preference.enabled,
    fxIntensity: preference.intensity,
    updatedAt: Date.now(),
  });
}

async function trimChatsForAddress(address: string): Promise<void> {
  const normalized = normalizeAddress(address);
  const rows = await celesteDb.chats
    .where("address")
    .equals(normalized)
    .toArray();

  const sorted = rows.sort(
    (a, b) =>
      deriveChatLastActivityAt(b.messages, b.updatedAt) -
      deriveChatLastActivityAt(a.messages, a.updatedAt),
  );

  if (sorted.length <= MAX_CHATS_PER_WALLET) {
    return;
  }

  const overflow = sorted.slice(MAX_CHATS_PER_WALLET);
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
    updatedAt: deriveChatLastActivityAt(
      input.messages,
      existing?.updatedAt ?? now,
    ),
  };

  await celesteDb.chats.put(record);
  await trimChatsForAddress(normalizedAddress);

  return record;
}
