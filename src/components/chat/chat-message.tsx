"use client";

import type { UIMessage } from "ai";
import { MessagePart } from "@/components/chat/message-part";

interface ChatMessageProps {
  message: UIMessage;
  hidePrepareToolDone?: boolean;
}

function UserAvatar() {
  return (
    <svg
      className="size-4 text-white"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0"
      />
    </svg>
  );
}

export function ChatMessage({
  message,
  hidePrepareToolDone = false,
}: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`group flex gap-2.5 sm:gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`mt-1 flex size-7 shrink-0 items-center justify-center rounded-full shadow-sm sm:size-8 ${
          isUser
            ? "bg-gradient-to-br from-emerald-500 to-emerald-700 ring-2 ring-emerald-400/20"
            : "bg-gradient-to-br from-zinc-800 to-zinc-900 text-[11px] font-semibold text-emerald-300 ring-2 ring-emerald-500/15"
        }`}
        aria-label={isUser ? "You" : "Celina"}
      >
        {isUser ? <UserAvatar /> : "C"}
      </div>
      <div className={`min-w-0 flex-1 ${isUser ? "max-w-[88%] sm:max-w-[82%]" : "max-w-[94%]"}`}>
        <p
          className={`mb-1.5 text-[11px] font-medium tracking-wide ${
            isUser ? "sr-only" : "text-zinc-500"
          }`}
        >
          {isUser ? "You" : "Celina"}
        </p>
        <div
          className={`space-y-2 break-words rounded-2xl px-3.5 py-2.5 shadow-sm [overflow-wrap:anywhere] sm:px-4 sm:py-3 ${
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
