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
    <div
      className={`group flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white ring-2 ring-emerald-400/20"
            : "bg-gradient-to-br from-zinc-800 to-zinc-900 text-emerald-300 ring-2 ring-emerald-500/15"
        }`}
        aria-hidden
      >
        {isUser ? "You" : "C"}
      </div>
      <div className={`min-w-0 ${isUser ? "max-w-[82%]" : "max-w-[94%]"}`}>
        <p
          className={`mb-1.5 text-[11px] font-medium tracking-wide ${
            isUser ? "text-right text-emerald-400/80" : "text-zinc-500"
          }`}
        >
          {isUser ? "You" : "Celina"}
        </p>
        <div
          className={`space-y-2 rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white shadow-emerald-950/20"
              : "border border-white/[0.06] bg-gradient-to-b from-[var(--surface-1)] to-zinc-900/80 text-zinc-100 shadow-black/20"
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
                variant={isUser ? "user" : "assistant"}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
