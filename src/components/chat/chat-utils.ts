import { isTextUIPart, isToolUIPart, type ChatStatus, type UIMessage } from "ai";

export type ChatTurn = {
  id: string;
  user?: UIMessage;
  assistant?: UIMessage;
};

export function groupMessagesIntoTurns(messages: UIMessage[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  let pendingUser: UIMessage | undefined;

  for (const message of messages) {
    if (message.role === "user") {
      if (pendingUser) {
        turns.push({ id: pendingUser.id, user: pendingUser });
      }
      pendingUser = message;
      continue;
    }

    if (message.role === "assistant") {
      turns.push({
        id: `${pendingUser?.id ?? message.id}-turn`,
        user: pendingUser,
        assistant: message,
      });
      pendingUser = undefined;
    }
  }

  if (pendingUser) {
    turns.push({ id: pendingUser.id, user: pendingUser });
  }

  return turns;
}

export function formatChatError(message: string): string {
  try {
    const parsed = JSON.parse(message) as { error?: string };
    if (typeof parsed.error === "string") {
      return parsed.error;
    }
  } catch {
    // plain text error
  }
  return message;
}

function messageHasVisibleAssistantContent(message: UIMessage): boolean {
  if (!message.parts?.length) {
    return false;
  }

  return message.parts.some((part) => {
    if (isTextUIPart(part) && part.text.trim().length > 0) {
      return true;
    }
    if (isToolUIPart(part)) {
      return (
        part.state === "input-streaming" ||
        part.state === "input-available" ||
        part.state === "output-available" ||
        part.state === "output-error"
      );
    }
    return false;
  });
}

export function shouldShowAssistantLoading(
  status: ChatStatus,
  messages: UIMessage[],
): boolean {
  if (status === "submitted") {
    return true;
  }

  if (status !== "streaming") {
    return false;
  }

  const lastMessage = messages.at(-1);
  if (!lastMessage || lastMessage.role === "user") {
    return true;
  }

  if (lastMessage.role === "assistant") {
    return !messageHasVisibleAssistantContent(lastMessage);
  }

  return false;
}

const ENS_RECIPIENT =
  /\b([a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.(?:celo\.)?eth)\b/i;

/** Pull the most recent ENS recipient mentioned in chat (matches assistant copy). */
export function extractRecipientLabel(messages: UIMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (!message.parts?.length) {
      continue;
    }

    for (const part of message.parts) {
      if (!isTextUIPart(part)) {
        continue;
      }
      const match = part.text.match(ENS_RECIPIENT);
      if (match?.[1]) {
        return match[1];
      }
    }
  }

  return undefined;
}
