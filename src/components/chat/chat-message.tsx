"use client";

import type { UIMessage } from "ai";
import { MessagePart } from "@/components/chat/message-part";

interface ChatMessageProps {
  message: UIMessage;
  hidePrepareToolDone?: boolean;
}

export function ChatMessage({
  message,
  hidePrepareToolDone = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
          isUser ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-100"
        }`}
      >
        {message.parts?.map((part, index) => {
          const partKey =
            "toolCallId" in part && typeof part.toolCallId === "string"
              ? part.toolCallId
              : `${message.id}-${part.type}-${index}`;

          return (
            <MessagePart
              key={partKey}
              part={part}
              hidePrepareToolDone={hidePrepareToolDone}
            />
          );
        })}
      </div>
    </div>
  );
}
