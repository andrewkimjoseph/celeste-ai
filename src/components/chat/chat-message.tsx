"use client";

import type { UIMessage } from "ai";
import { CelesteLogoAvatar } from "@/components/celeste-logo";
import { MessagePart } from "@/components/chat/message-part";

interface ChatMessageProps {
  message: UIMessage;
  hidePrepareToolDone?: boolean;
  align?: "start" | "end";
}

export function ChatMessage({
  message,
  hidePrepareToolDone = false,
  align,
}: ChatMessageProps) {
  const isUser = message.role === "user";
  const messageAlign = align ?? (isUser ? "end" : "start");

  return (
    <div
      className={`group flex gap-2.5 sm:gap-3 ${
        messageAlign === "end"
          ? "ml-auto w-fit max-w-full flex-row-reverse"
          : "w-full flex-row"
      }`}
    >
      {isUser ? (
        <span
          className="mt-1 flex size-7 shrink-0 items-center justify-center text-lg sm:size-8 sm:text-xl"
          aria-label="You"
          role="img"
        >
          🙂
        </span>
      ) : (
        <CelesteLogoAvatar
          size="sm"
          className="mt-1 shadow-sm ring-2 ring-[var(--accent)]/15"
        />
      )}
      <div
        className={`min-w-0 ${
          messageAlign === "end" ? "w-fit max-w-full" : "min-w-0 flex-1"
        }`}
      >
        <p
          className={`mb-1.5 text-[11px] font-medium tracking-wide ${
            isUser ? "sr-only" : "text-zinc-500"
          }`}
        >
          {isUser ? "You" : "Celeste AI"}
        </p>
        <div
          className={`space-y-2 break-words rounded-2xl px-3.5 py-2.5 shadow-sm [overflow-wrap:anywhere] sm:px-4 sm:py-3 ${
            isUser
              ? "bg-gradient-to-br from-[var(--accent)] to-[var(--accent-strong)] text-white shadow-black/20"
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
                messageParts={message.parts}
                partIndex={index}
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
