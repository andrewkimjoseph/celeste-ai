import { describe, expect, it } from "vitest";
import type { CelesteUIMessage } from "@/lib/chat/chat-message-metadata";
import {
  deriveChatLastActivityAt,
  toChatListItem,
  type StoredChat,
} from "@/lib/chat/chats";

function userMessage(createdAt: number, text = "Hello"): CelesteUIMessage {
  return {
    id: `user-${createdAt}`,
    role: "user",
    parts: [{ type: "text", text }],
    metadata: { createdAt },
  };
}

function assistantMessage(createdAt: number, text = "Hi"): CelesteUIMessage {
  return {
    id: `assistant-${createdAt}`,
    role: "assistant",
    parts: [{ type: "text", text }],
    metadata: { createdAt },
  };
}

describe("deriveChatLastActivityAt", () => {
  it("returns the latest message createdAt", () => {
    const fallback = 1_000;
    const messages = [
      userMessage(1_000_000),
      assistantMessage(2_000_000),
      userMessage(1_500_000),
    ];

    expect(deriveChatLastActivityAt(messages, fallback)).toBe(2_000_000);
  });

  it("falls back when messages lack metadata", () => {
    const fallback = 9_999;
    const messages: CelesteUIMessage[] = [
      {
        id: "legacy",
        role: "user",
        parts: [{ type: "text", text: "No timestamp" }],
      },
    ];

    expect(deriveChatLastActivityAt(messages, fallback)).toBe(fallback);
  });

  it("does not advance activity when re-saving the same messages", () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const bumpedWriteTime = Date.now();
    const messages = [
      userMessage(twoHoursAgo),
      assistantMessage(twoHoursAgo + 60_000),
    ];

    expect(deriveChatLastActivityAt(messages, bumpedWriteTime)).toBe(
      twoHoursAgo + 60_000,
    );
  });
});

describe("toChatListItem", () => {
  it("uses derived message activity instead of stale updatedAt", () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const chat: StoredChat = {
      id: "chat-1",
      address: "0x1",
      title: "Test",
      messages: [userMessage(twoHoursAgo), assistantMessage(twoHoursAgo + 60_000)],
      dismissedFlowKey: null,
      txCardBlockedUntilUserMessage: false,
      createdAt: twoHoursAgo - 60_000,
      updatedAt: Date.now(),
    };

    expect(toChatListItem(chat).updatedAt).toBe(twoHoursAgo + 60_000);
  });
});
