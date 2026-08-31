"use client";

import type { CelesteUIMessage } from "@/lib/chat/chat-message-metadata";
import {
  formatMessageTimestamp,
  getMessageCreatedAt,
  MESSAGE_TIMESTAMP_CLASS,
} from "@/lib/chat/chat-message-metadata";
import { CelesteLogoAvatar } from "@/components/celeste-logo";
import { MessagePart } from "@/components/chat/message-part";
import { useChats } from "@/hooks/use-chats";
import { getCelestialPersonality } from "@/lib/chat/celestial-personalities";

interface ChatMessageProps {
  message: CelesteUIMessage;
  hidePrepareToolDone?: boolean;
  align?: "start" | "end";
}

export function ChatMessage({
  message,
  hidePrepareToolDone = false,
  align,
}: ChatMessageProps) {
  const { selectedPersonalityId } = useChats();
  const isUser = message.role === "user";
  const messageAlign = align ?? (isUser ? "end" : "start");
  const createdAt = getMessageCreatedAt(message);
  const timestampLabel =
    createdAt != null ? formatMessageTimestamp(createdAt) : null;
  const selectedPersonality = getCelestialPersonality(selectedPersonalityId);

  return (
    <div
      className={`group flex gap-2.5 sm:gap-3 ${
        messageAlign === "end"
          ? "ml-auto w-fit max-w-full flex-row-reverse"
          : "w-full flex-row"
      }`}
    >
      {isUser ? (
        selectedPersonality ? (
          // eslint-disable-next-line @next/next/no-img-element -- static personality asset in public
          <img
            src={selectedPersonality.imageSrc}
            alt={selectedPersonality.label}
            width={32}
            height={32}
            className="mt-1 size-7 shrink-0 object-contain sm:size-8"
          />
        ) : (
          <span
            className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-[2px] border-2 border-[var(--ink)] bg-[var(--surface)] text-xs text-[var(--ink)] sm:size-8"
            aria-label="Choose personality"
            role="img"
          >
            ✦
          </span>
        )
      ) : (
        <CelesteLogoAvatar
          size="sm"
          className="mt-1"
        />
      )}
      <div
        className={`min-w-0 ${
          messageAlign === "end" ? "w-fit max-w-full" : "min-w-0 flex-1"
        }`}
      >
        {timestampLabel ? (
          isUser ? (
            <p
              className={`mb-1.5 text-right ${MESSAGE_TIMESTAMP_CLASS}`}
            >
              <time dateTime={new Date(createdAt!).toISOString()}>
                {timestampLabel}
              </time>
            </p>
          ) : (
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <p className="text-[11px] font-bold tracking-wide text-[var(--text-muted)]">
                Celeste AI
              </p>
              <time
                dateTime={new Date(createdAt!).toISOString()}
                className={MESSAGE_TIMESTAMP_CLASS}
              >
                {timestampLabel}
              </time>
            </div>
          )
        ) : (
          <p
            className={`mb-1.5 text-[11px] font-medium tracking-wide ${
              isUser ? "sr-only" : "text-[var(--text-muted)]"
            }`}
          >
            {isUser ? "You" : "Celeste AI"}
          </p>
        )}
        <div
          className={`space-y-2 break-words rounded-[2px] border-2 border-[var(--ink)] px-3.5 py-2.5 shadow-[var(--shadow-brutal-sm)] [overflow-wrap:anywhere] sm:px-4 sm:py-3 ${
            isUser
              ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
              : "bg-[var(--surface)] text-[var(--ink)]"
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
